import { Prisma, UserRole, type user, type order } from '@prisma/client';
import { type Decimal } from '@prisma/client/runtime/library';
// eslint-disable-next-line
import fetch, { Headers } from 'node-fetch';
import { HttpStatusCode } from 'axios';
import PaymentService from '../payment/payment.service';
import { VehicleStatus } from '../vehicle/types';
import AdminMailService from '../notifications/admin-mails.service';
import UserMailService from '../notifications/user-mails.service';
import { NotificationService } from '../notifications/notification.service';
import OrderMailService from './order-mails.service';
import { OrderStatus } from './types';
import { calculateOrderPrice } from './functions';
import prisma from '@/lib/prisma';
import { refreshTeslaApiToken } from '@/tesla-auth';
import { ApiError } from '@/lib/errors';

const weakTheVehicleUp = async (vehicleTag: string, token: string) => {
  const myHeaders = new Headers();
  myHeaders.append('Content-Type', 'application/json');
  myHeaders.append('Authorization', `Bearer ${token}`);

  const requestOptions = {
    method: 'POST',
    headers: myHeaders,
  };

  try {
    await fetch(
      `https://fleet-api.prd.eu.vn.cloud.tesla.com/api/1/vehicles/${vehicleTag}/wake_up`,
      requestOptions
    );
    console.log('Vehicle woken up successfully.');
  } catch (error) {
    console.log('Error waking up vehicle:', error);
    throw new Error('Error waking up vehicle' + JSON.stringify(error));
  }
};

export default class OrderService {
  private readonly paymentService = new PaymentService();
  private readonly adminMailService = new AdminMailService();
  private readonly userMailService = new UserMailService();
  private readonly orderMailService = new OrderMailService();
  private readonly notificationService = new NotificationService();

  public createOrder = async (dto) => {
    const activeOrPendingOrdersCount = await prisma.order.count({
      where: {
        userId: dto.userId,
        OR: [
          { status: OrderStatus.CONFIRMED },
          { status: OrderStatus.PENDING },
          // { stopRentDate: null },
        ],
      },
    });

    if (activeOrPendingOrdersCount >= 2) {
      throw new ApiError(
        400,
        'You can have only 2 active or pending orders at max.'
      );
    }

    const vehicle = await prisma.vehicle.findUnique({
      where: { id: dto.vehicleId },
    });

    if (!vehicle) throw new Error('No vehicle found!');
    const rentalStartDate = dto.rentalStartDate;
    const rentalEndDate = dto.rentalEndDate;
    const timeframes = vehicle.timeframes as number[][];

    const amount = calculateOrderPrice(
      rentalStartDate,
      rentalEndDate,
      timeframes
    );

    const totalAmount = amount * 1.21;

    const order = await prisma.order.create({
      data: {
        ...dto,
        totalAmount,
        status: OrderStatus.UNPAID,
      },
    });

    const paymentResponse = await this.paymentService.createOrderPayment({
      userId: dto.userId,
      amount: totalAmount,
      orderId: order.id,
    });

    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentId: paymentResponse.payment,
      },
    });

    return { order, checkoutUrl: paymentResponse.checkoutUrl };
  };

  public getOrderDetailsWithStatus = async (orderId: string) => {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { vehicle: true, payment: true },
    });

    if (!order) {
      throw new Error('Order not found.');
    }

    const currentDate = new Date();
    const startCountdown =
      order.rentalStartDate.getTime() - currentDate.getTime(); // in milliseconds
    const endCountdown = order.rentalEndDate.getTime() - currentDate.getTime(); // in milliseconds

    let statusMessage = 'Processing...';
    switch (order.status) {
      case 'UNPAID':
        statusMessage = 'Voltooi de betaling alstublieft.';
        break;
      case 'PENDING':
        statusMessage = 'De reservering wacht op goedkeuring.';
        break;
      case 'CONFIRMED':
        statusMessage = 'Reservering is bevestigd, bereid je reis voor!';
        break;
      case 'REJECTED':
        statusMessage =
          'Reservering is afgewezen. Neem contact op voor ondersteuning.';
        break;
      case 'COMPLETED':
        statusMessage =
          'Je reservering is beëindigd. Bedankt voor het huren bij Cabby!';
        break;
      case 'CANCELED':
        statusMessage = 'De reservering is geannuleerd.';
        break;
    }

    const toDurationString = (ms: number) => {
      const totalSeconds = ms / 1000;
      const days = Math.floor(totalSeconds / (3600 * 24));
      const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);

      if (days > 0) return `${days} dag(en)`;
      if (hours > 0) return `${hours} uur`;
      return `${minutes} minuten (minuut)`;
    };

    let orderMessage = '';
    let readyToUse = false;

    if (
      startCountdown > 0 &&
      order.status !== 'CANCELED' &&
      order.status !== 'COMPLETED'
    ) {
      orderMessage = `Je reservering begint over ${toDurationString(
        startCountdown
      )}. Bereid je voor! 🚀`;
    } else if (
      startCountdown <= 0 &&
      endCountdown > 0 &&
      order.status !== 'CANCELED' &&
      order.status !== 'COMPLETED'
    ) {
      orderMessage = `Je reservering is gestart. Voertuig is klaar voor gebruik voor de komende ${toDurationString(
        endCountdown
      )}.`;
      readyToUse = true;
    } else if (
      endCountdown <= 0 &&
      order.status !== 'CANCELED' &&
      order.status !== 'COMPLETED'
    ) {
      orderMessage =
        'Je reservering is beëindigd. Bedankt voor het huren bij Cabby.';
    }

    return {
      order,
      vehicle: order.vehicle,
      startCountdown: startCountdown / 1000,
      endCountdown: endCountdown / 1000,
      statusMessage,
      orderMessage,
      readyToUse,
      isVehicleUnlocked: order.isVehicleUnlocked,
    };
  };

  public unlockVehicle = async (orderId: string, userId: string) => {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { vehicle: true },
    });

    if (!order) {
      throw new Error('Order not found.');
    }

    const currentDate = new Date();
    console.log('currentDate:', currentDate);
    console.log('order.rentalStartDate:', order.rentalStartDate);
    console.log('start date :', new Date(order.rentalStartDate));
    if (currentDate < order.rentalStartDate) {
      throw new Error('Rental period has not started yet.');
    }

    const teslaToken = await prisma.teslaToken.findFirst();

    if (!teslaToken) {
      console.log('Tesla API token not found.');
      throw new Error('Tesla API token not found.');
    }

    if (!teslaToken.refreshToken) {
      console.log('Tesla API refresh token not found.');
      throw new Error('Tesla API refresh token not found.');
    }

    if (!order.vehicle.vin) {
      throw new Error('Vehicle VIN not found.');
    }

    if (process.env.NODE_ENV === 'production') {
      await weakTheVehicleUp(order.vehicle.vin, teslaToken.token);

      const result = await this.unlockTeslaVehicle(
        order.vehicle.vin,
        teslaToken?.token,
        teslaToken?.refreshToken
      );

      if (!result) {
        throw new Error('Error unlocking Tesla vehicle.');
      }

      if (result?.response?.result) {
        // await this.notificationService.sendNotificationToUser(
        //   userId,
        //   'Je Tesla is ontgrendeld.',
        //   'Gefeliciteerd! Je Tesla is ontgrendeld en klaar om te gebruiken. 🚗',
        //   JSON.stringify({ type: 'event' })
        // );
        // Update the database indicating the vehicle is unlocked
        const data = await prisma.order.update({
          where: { id: orderId },
          data: { isVehicleUnlocked: true },
        });
        return data;
      }
    } else {
      const data = await prisma.order.update({
        where: { id: orderId },
        data: { isVehicleUnlocked: true },
      });
      return data;
    }
  };

  public lockVehicle = async (orderId: string, userId: string) => {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { vehicle: true },
    });

    if (!order) {
      throw new Error('Order not found.');
    }

    const currentDate = new Date();
    if (currentDate < order.rentalStartDate) {
      throw new Error('Rental period has not started yet.');
    }

    const teslaToken = await prisma.teslaToken.findFirst();

    if (!teslaToken) {
      console.log('Tesla API token not found.');
      throw new Error('Tesla API token not found.');
    }
    if (!teslaToken.refreshToken) {
      console.log('Tesla API refresh token not found.');
      throw new Error('Tesla API refresh token not found.');
    }

    if (!order.vehicle.vin) {
      throw new Error('Vehicle VIN not found.');
    }

    // const teslaApiToken = await getTeslaApiToken(orderId);
    if (process.env.NODE_ENV === 'production') {
      const result = await this.lockTeslaVehicle(
        order.vehicle.vin,
        teslaToken?.token,
        teslaToken?.refreshToken
      );

      if (result.response.result) {
        // await this.notificationService.sendNotificationToUser(
        //   userId,
        //   'Heel goed!',
        //   'Je Tesla is nu vergrendeld. 🔐',
        //   JSON.stringify({ type: 'event' })
        // );
      }
    }

    // Update the database indicating the vehicle is locked
    const data = await prisma.order.update({
      where: { id: orderId },
      data: { isVehicleUnlocked: false },
    });

    return data;
  };

  public startVehicle = async (orderId: string, userId: string) => {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { vehicle: true },
    });

    if (!order) {
      throw new ApiError(HttpStatusCode.BadRequest, 'Order not found.');
    }

    const currentDate = new Date();
    if (currentDate < order.rentalStartDate) {
      throw new Error('Rental period has not started yet.');
    }
    console.log('currentDate:', currentDate);
    console.log('order.rentalStartDate:', order.rentalStartDate);
    console.log('start date :', new Date(order.rentalStartDate));

    const teslaToken = await prisma.teslaToken.findFirst();

    if (!teslaToken) {
      console.log('Tesla API token not found.');
      throw new Error('Tesla API token not found.');
    }
    if (!teslaToken.refreshToken) {
      console.log('Tesla API refresh token not found.');
      throw new Error('Tesla API refresh token not found.');
    }

    if (!order.vehicle.vin) {
      throw new Error('Vehicle VIN not found.');
    }

    // const teslaApiToken = await getTeslaApiToken(orderId);

    const result = await this.startTeslaVehicle(
      order.vehicle.vin,
      teslaToken?.token,
      teslaToken?.refreshToken
    );

    if (result.response.result) {
      // await this.notificationService.sendNotificationToUser(
      //   userId,
      //   'Heel goed!',
      //   'Je Tesla is nu vergrendeld. 🔐',
      //   JSON.stringify({ type: 'event' })
      // );
    }

    // Update the database indicating the vehicle is locked
    const data = await prisma.order.update({
      where: { id: orderId },
      data: { isVehicleUnlocked: true },
    });

    return data;
  };

  private readonly httpCallVehicleCommand = async (
    url: string,
    teslaApiToken: string
  ) => {
    const myHeaders = new Headers();
    myHeaders.append('Content-Type', 'application/json');
    myHeaders.append('Authorization', `Bearer ${teslaApiToken}`);

    const requestOptions = {
      method: 'POST',
      headers: myHeaders,
      body: '',
    };

    const response = await fetch(url, requestOptions);
    return response;
  };

  private readonly unlockTeslaVehicle = async (
    vehicleVin: string,
    teslaApiToken: string,
    teslaApiRefreshToken: string
  ): Promise<any> => {
    const url = `https://fleet-api.prd.eu.vn.cloud.tesla.com/api/1/vehicles/${vehicleVin}/command/door_unlock`;

    console.log('Unlocking Tesla vehicle:', vehicleVin);

    try {
      let response = await this.httpCallVehicleCommand(url, teslaApiToken);
      if (response.status === 401) {
        console.log('Tesla API token expired. Refreshing token...');
        const newToken = await refreshTeslaApiToken(
          teslaApiToken,
          teslaApiRefreshToken
        );
        console.log('Token refreshed. Retrying...');
        response = await this.httpCallVehicleCommand(url, newToken);
      }
      const result = await response.json();

      console.log('unLocking Tesla vehicle result:', result);

      return result;
    } catch (error) {
      console.error('Error unlocking Tesla vehicle:', error);
      throw new Error(
        `Failed to unlock Tesla vehicle, error: ${JSON.stringify(error)}`
      );
    }
  };

  // Function to lock a Tesla vehicle
  private readonly lockTeslaVehicle = async (
    vehicleVin: string,
    teslaApiToken: string,
    teslaApiRefreshToken: string
  ): Promise<any> => {
    const url = `https://fleet-api.prd.eu.vn.cloud.tesla.com/api/1/vehicles/${vehicleVin}/command/door_lock`;
    console.log('Locking Tesla vehicle:', vehicleVin);
    try {
      let response = await this.httpCallVehicleCommand(url, teslaApiToken);
      if (response.status === 401) {
        console.log('Tesla API token expired. Refreshing token...');
        const newToken = await refreshTeslaApiToken(
          teslaApiToken,
          teslaApiRefreshToken
        );
        console.log('Token refreshed. Retrying...');
        response = await this.httpCallVehicleCommand(url, newToken);
      }
      const result = await response.json();

      console.log('Locking Tesla vehicle result:', result);

      return result;
    } catch (error) {
      console.error('Error locking Tesla vehicle:', error);
      throw new Error('Failed to lock Tesla vehicle.');
    }
  };

  private readonly startTeslaVehicle = async (
    vehicleVin: string,
    teslaApiToken: string,
    teslaApiRefreshToken: string
  ): Promise<any> => {
    const url = `https://fleet-api.prd.eu.vn.cloud.tesla.com/api/1/vehicles/${vehicleVin}/command/remote_start_drive`;
    console.log('Locking Tesla vehicle:', vehicleVin);
    try {
      let response = await this.httpCallVehicleCommand(url, teslaApiToken);
      if (response.status === 401) {
        console.log('Tesla API token expired. Refreshing token...');
        const newToken = await refreshTeslaApiToken(
          teslaApiToken,
          teslaApiRefreshToken
        );
        console.log('Token refreshed. Retrying...');
        response = await this.httpCallVehicleCommand(url, newToken);
      }
      const result = await response.json();

      console.log('Locking Tesla vehicle result:', result);

      return result;
    } catch (error) {
      console.error('Error locking Tesla vehicle:', error);
      throw new Error('Failed to lock Tesla vehicle.');
    }
  };

  async completeOrder(orderId: string, userId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { vehicle: true },
    });

    if (!order) {
      throw new Error('Order not found.');
    }

    if (order.status !== 'CONFIRMED') {
      throw new Error('Order is not in CONFIRMED status.');
    }

    if (order.userId !== userId) {
      throw new Error('Not authorized to complete this order.');
    }

    console.log('Completing order:', orderId);

    const now = new Date();
    // const isOverdue = order.rentalEndDate < now

    const updateData: Prisma.orderUpdateInput = {
      stopRentDate: now,
      status: OrderStatus.COMPLETED,
    };

    const completedOrder = await prisma.order.update({
      where: { id: orderId },
      data: updateData,
    });

    console.log("Order completed. Updating vehicle's status to AVAILABLE.");

    const user = await prisma.user.findUnique({
      where: { id: order.userId },
      include: {
        profile: {
          select: {
            fullName: true,
          },
        },
      },
    });

    await this.adminMailService.rentCompletedMailSender(
      user?.email!,
      user?.profile?.fullName!,
      order.vehicle.licensePlate ?? '',
      order.vehicle.model ?? ''
    );

    await this.userMailService.rentCompletedMailSender(
      user?.email!,
      user?.profile?.fullName!
    );

    return completedOrder;
  }

  public getUserOrdersByStatus = async (
    userId: string,
    status?: OrderStatus
  ) => {
    if (status) {
      return await prisma.order.findMany({
        where: { userId, status },
        include: { vehicle: true, payment: true },
        orderBy: { createdAt: 'desc' },
      });
    } else {
      return await prisma.order.findMany({
        where: { userId },
        include: { vehicle: true, payment: true },
        orderBy: { createdAt: 'desc' },
      });
    }
  };

  public rejectionReasonOrder = async (orderId: string, reason: string) => {
    const order = await prisma.order.findUnique({ where: { id: orderId } });

    if (!order) throw new Error('Order not found');

    const rejectionData = { orderId, reason };

    await prisma.orderRejection.create({
      data: rejectionData,
    });

    await prisma.$transaction([
      prisma.order.update({
        where: { id: orderId },
        data: { status: 'REJECTED' },
      }),
      prisma.orderRejection.create({
        data: rejectionData,
      }),
    ]);
  };

  public rejectOrder = async (orderId: string) => {
    const order = await prisma.order.findUnique({ where: { id: orderId } });

    if (!order) throw new Error('Order not found');

    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'REJECTED' },
    });
  };

  public completeOrderAdmin = async (orderId: string) => {
    const order = await prisma.order.findUnique({ where: { id: orderId } });

    if (!order) {
      throw new Error('Order not found.');
    }

    await prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.COMPLETED },
    });
  };

  public stopOrder = async (orderId: string) => {
    const order = await prisma.order.findUnique({ where: { id: orderId } });

    if (!order) {
      throw new Error('Order not found.');
    }

    const rentalEndDate = order.rentalEndDate;
    const now = new Date();
    const isOverdue = rentalEndDate < now;

    const updateData: Prisma.orderUpdateInput = { stopRentDate: now };
    if (!isOverdue) {
      updateData.status = OrderStatus.COMPLETED;
    }

    await prisma.order.update({
      where: { id: orderId },
      data: updateData,
    });
  };

  public cancelOrder = async (orderId: string, userSender: user) => {
    const order = await prisma.order.findUnique({ where: { id: orderId } });

    if (!order) throw new Error('Order not found');
    const isAdmin = userSender.role === UserRole.ADMIN;

    if (!isAdmin && userSender.id !== order.userId)
      throw new ApiError(HttpStatusCode.Unauthorized, 'User not authorized');

    await prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.CANCELED }, // Make sure to handle enum/string correctly
    });
    const user = await prisma.user.findUnique({
      where: { id: order.userId },
      include: {
        profile: {
          select: {
            fullName: true,
          },
        },
      },
    });
    await this.adminMailService.rentCanceledMailSender(
      user?.email!,
      user?.profile?.fullName!,
      order.vehicleId
    );
    await this.userMailService.rentCanceledMailSender(
      user?.email!,
      user?.profile?.fullName!
    );
  };

  public confirmOrder = async (orderId: string) => {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: { include: { profile: true } },
        vehicle: { select: { papers: true } },
      },
    });

    if (!order) throw new Error('Order not found');

    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'CONFIRMED' },
    });

    await this.orderMailService.orderConfirmedMailSender(
      order.user.email,
      order.user.profile?.fullName,
      order.vehicle.papers
    );
  };

  public deleteOrder = async (orderId: string) => {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) throw new Error('Order not found');

    await prisma.order.delete({
      where: { id: orderId },
    });
  };

  public changeOrderStatus = async (orderId: string, status: OrderStatus) => {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) throw new Error('Order not found');

    await prisma.order.update({
      where: { id: orderId },
      data: { status },
    });
  };

  public getOrdersByStatus = async (status) => {
    let orders: order[] = [];
    const include: Prisma.orderInclude = {
      user: {
        select: {
          profile: true,
        },
      },
      vehicle: true,
    };

    if (status === 'UNPAID') {
      const query = Prisma.sql`SELECT
                                  *
                                FROM
                                  "order"
                                WHERE ("stopRentDate" > "rentalEndDate"
                                  OR "rentalEndDate" < now())
                                AND status = 'CONFIRMED';
                                      `;
      const ordersIds = await prisma.$queryRaw<order[]>(query);

      console.log(ordersIds);

      orders = await prisma.order.findMany({
        where: { id: { in: ordersIds.map((el) => el.id) } },
        include,
      });

      return orders;
    }
    orders = await prisma.order.findMany({
      where: { status },
      include,
    });
    return orders;
  };

  public getOrderDetails = async (orderId: string) => {
    return await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: {
            profile: {
              include: {
                driverLicense: true,
                permitDetails: true,
              },
            },
          },
        },
        rejection: true,
        vehicle: true,
      },
    });
  };

  private readonly calculateTotalAmount = async (
    vehicleId: string,
    rentalStartDate: string,
    rentalEndDate: string
  ) => {
    const pricePerDay = await this.retrieveVehiclePricePerDay(vehicleId);
    const pricePerHour = Number(pricePerDay) / 24; // Calculate the hourly price based on the daily price

    const startDate = new Date(rentalStartDate);
    const endDate = new Date(rentalEndDate);

    // Calculate the total duration in milliseconds
    const totalDurationInMs = endDate.getTime() - startDate.getTime();

    // Calculate the duration in full days
    const durationInDays = Math.floor(totalDurationInMs / (1000 * 3600 * 24));

    // Calculate the remaining hours after subtracting full days
    const remainingHours =
      (totalDurationInMs % (1000 * 3600 * 24)) / (1000 * 3600);

    // Calculate total amount by days and remaining hours
    const totalAmount =
      durationInDays * Number(pricePerDay) + remainingHours * pricePerHour;

    return totalAmount;
  };

  private readonly retrieveVehiclePricePerDay = async (vehicleId: string) => {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
    });

    if (!vehicle) {
      throw new Error('Vehicle not found');
    }

    return vehicle.pricePerDay as Decimal;
  };

  public async createRejection(data: { orderId: string; reason: string }) {
    const { orderId, reason } = data;
    const rejection = await prisma.orderRejection.upsert({
      where: { orderId },
      create: {
        orderId,
        reason,
      },
      update: { reason },
    });
    return rejection;
  }

  public getVehicleBookedPeriodsIncludingOngoing = async (
    vehicleId: string
  ) => {
    const today = new Date();

    const orders = await prisma.order.findMany({
      where: {
        vehicleId,
        OR: [
          {
            rentalStartDate: {
              gte: today, // Future bookings
            },
          },
          {
            rentalEndDate: {
              gte: today, // Ongoing bookings that end in the future
            },
          },
        ],
        status: OrderStatus.CONFIRMED,
      },
      orderBy: {
        rentalStartDate: 'asc',
      },
      select: {
        rentalStartDate: true,
        rentalEndDate: true,
      },
    });

    const bookedPeriods = orders.map((order) => ({
      from: order.rentalStartDate,
      to: order.rentalEndDate,
    }));

    return { booked: bookedPeriods };
  };

  public calculateTotalRentPrice = async (
    vehicleId: string,
    rentStarts: Date,
    rentEnds: Date
  ) => {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
    });
    if (!vehicle) throw new Error('Vehicle not found.');

    const timeframes = (vehicle?.timeframes ?? []) as number[][];

    const total = calculateOrderPrice(rentStarts, rentEnds, timeframes);

    return total;
  };

  public isVehicleAvailableForTimeslot = async (
    vehicleId: string,
    rentStarts: Date,
    rentEnds: Date
  ) => {
    // Adjust rentStarts and rentEnds to include a 15-minute buffer
    const adjustedRentStarts = new Date(rentStarts.getTime() - 15 * 60000); // Subtract 15 minutes
    const adjustedRentEnds = new Date(rentEnds.getTime() + 15 * 60000); // Add 15 minutes

    const overlappingOrders = await prisma.order.count({
      where: {
        vehicleId,
        OR: [
          {
            rentalStartDate: {
              lt: adjustedRentEnds,
            },
            rentalEndDate: {
              gt: adjustedRentStarts,
            },
          },
        ],
        status: OrderStatus.CONFIRMED,
      },
    });

    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
    });
    if (!vehicle || vehicle.status !== VehicleStatus.ACTIVE) return false;

    return overlappingOrders === 0;
  };
}
