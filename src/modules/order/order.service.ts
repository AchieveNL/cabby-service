import { type Decimal } from '@prisma/client/runtime/library';
import { differenceInHours } from 'date-fns';
// eslint-disable-next-line
import fetch, { Headers } from 'node-fetch';
import PaymentService from '../payment/payment.service';
import { VehicleStatus } from '../vehicle/types';
import AdminMailService from '../notifications/admin-mails.service';
import UserMailService from '../notifications/user-mails.service';
import { NotificationService } from '../notifications/notification.service';
import { OrderStatus } from './types';
import prisma from '@/lib/prisma';

export default class OrderService {
  private readonly paymentService = new PaymentService();
  private readonly adminMailService = new AdminMailService();
  private readonly userMailService = new UserMailService();
  private readonly notificationService = new NotificationService();

  public createOrder = async (dto) => {
    const activeOrPendingOrdersCount = await prisma.order.count({
      where: {
        userId: dto.userId,
        OR: [
          { status: OrderStatus.CONFIRMED },
          { status: OrderStatus.PENDING },
        ],
      },
    });

    if (activeOrPendingOrdersCount >= 2) {
      return { error: 'You can have only 2 active or pending orders at max.' };
    }

    const totalAmount = await this.calculateTotalAmount(
      dto.vehicleId,
      dto.rentalStartDate,
      dto.rentalEndDate
    );

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
      include: { vehicle: true },
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
      if (hours > 0) return `${hours} uren (uur)`;
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
    if (currentDate < order.rentalStartDate) {
      throw new Error('Rental period has not started yet.');
    }

    const teslaToken = await prisma.teslaToken.findFirst();

    if (!teslaToken) {
      console.log('Tesla API token not found.');
      throw new Error('Tesla API token not found.');
    }

    if (!order.vehicle.vin) {
      throw new Error('Vehicle VIN not found.');
    }

    const result = await this.unlockTeslaVehicle(
      order.vehicle.vin,
      teslaToken?.token
    );

    if (!result) {
      throw new Error('Error unlocking Tesla vehicle.');
    }

    if (result?.response?.result) {
      await this.notificationService.sendNotificationToUser(
        userId,
        'Je Tesla is ontgrendeld.',
        'Gefeliciteerd! Je Tesla is ontgrendeld en klaar om te gebruiken. 🚗',
        JSON.stringify({ type: 'event' })
      );
      // Update the database indicating the vehicle is unlocked
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

    if (!order.isVehicleUnlocked) {
      throw new Error('Vehicle is already locked.');
    }

    const teslaToken = await prisma.teslaToken.findFirst();

    if (!teslaToken) {
      console.log('Tesla API token not found.');
      throw new Error('Tesla API token not found.');
    }

    if (!order.vehicle.vin) {
      throw new Error('Vehicle VIN not found.');
    }

    // const teslaApiToken = await getTeslaApiToken(orderId);

    const result = await this.lockTeslaVehicle(
      order.vehicle.vin,
      teslaToken?.token
    );

    if (result.response.result) {
      await this.notificationService.sendNotificationToUser(
        userId,
        'Heel goed!',
        'Je Tesla is nu vergrendeld. 🔐',
        JSON.stringify({ type: 'event' })
      );
    }

    // Update the database indicating the vehicle is locked
    const data = await prisma.order.update({
      where: { id: orderId },
      data: { isVehicleUnlocked: false },
    });

    return data;
  };

  private readonly unlockTeslaVehicle = async (
    vehicleVin: string,
    teslaApiToken: string
  ): Promise<any> => {
    const url = `https://fleet-api.prd.eu.vn.cloud.tesla.com/api/1/vehicles/${vehicleVin}/command/door_unlock`;

    console.log('Unlocking Tesla vehicle:', vehicleVin, url, teslaApiToken);

    try {
      const myHeaders = new Headers();
      myHeaders.append('Content-Type', 'application/json');
      myHeaders.append('Authorization', `Bearer ${teslaApiToken}`);

      const requestOptions = {
        method: 'POST',
        headers: myHeaders,
        body: '',
      };

      const result = await fetch(url, requestOptions).then(
        async (response) => await response.json()
      );

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
    teslaApiToken: string
  ): Promise<any> => {
    const url = `https://fleet-api.prd.eu.vn.cloud.tesla.com/api/1/vehicles/${vehicleVin}/command/door_lock`;
    console.log('Locking Tesla vehicle:', vehicleVin, url, teslaApiToken);
    try {
      const myHeaders = new Headers();
      myHeaders.append('Content-Type', 'application/json');
      myHeaders.append('Authorization', `Bearer ${teslaApiToken}`);

      const requestOptions = {
        method: 'POST',
        headers: myHeaders,
        body: '',
      };

      const result = await fetch(url, requestOptions).then(
        async (response) => await response.json()
      );
      return result;
    } catch (error) {
      console.error('Error locking Tesla vehicle:', error);
      throw new Error('Failed to lock Tesla vehicle.');
    }
  };

  async completeOrder(orderId: string, userId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
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

    const completedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: 'COMPLETED' },
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

    await this.adminMailService.rentCompletedMailSender(
      user?.email!,
      user?.profile?.fullName!,
      order.vehicleId
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

  public cancelOrder = async (orderId: string) => {
    const order = await prisma.order.findUnique({ where: { id: orderId } });

    if (!order) throw new Error('Order not found');

    const now = new Date();
    const rentalStartDate = new Date(order.rentalStartDate);

    if (differenceInHours(rentalStartDate, now) <= 24) {
      throw new Error(
        'Cannot cancel order less than 24 hours before rental start date'
      );
    }

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
    const order = await prisma.order.findUnique({ where: { id: orderId } });

    if (!order) throw new Error('Order not found');

    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'CONFIRMED' },
    });
  };

  public getOrdersByStatus = async (status) => {
    const orders = await prisma.order.findMany({
      where: { status },
      include: {
        user: {
          select: {
            profile: true,
          },
        },
        vehicle: true,
      },
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
    const startDate = new Date(rentalStartDate);
    const endDate = new Date(rentalEndDate);
    const durationInDays =
      (endDate.getTime() - startDate.getTime()) / (1000 * 3600 * 24);

    return Number(pricePerDay) * durationInDays;
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
    const rejection = await prisma.orderRejection.create({
      data: {
        orderId,
        reason,
      },
    });
    return rejection;
  }

  public getVehicleBookedPeriodsForNext30Days = async (vehicleId: string) => {
    const today = new Date();
    const thirtyDaysLater = new Date(today);
    thirtyDaysLater.setDate(today.getDate() + 30);

    const orders = await prisma.order.findMany({
      where: {
        vehicleId,
        rentalStartDate: {
          gte: today,
          lte: thirtyDaysLater,
        },
        status: {
          not: OrderStatus.CANCELED,
        },
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
    rentStarts: string,
    rentEnds: string
  ) => {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
    });
    if (!vehicle) throw new Error('Vehicle not found.');

    const total = await this.calculateTotalAmount(
      vehicleId,
      rentStarts,
      rentEnds
    );

    return total;
  };

  public isVehicleAvailableForTimeslot = async (
    vehicleId: string,
    rentStarts: Date,
    rentEnds: Date
  ) => {
    const overlappingOrders = await prisma.order.count({
      where: {
        vehicleId,
        rentalStartDate: {
          lte: rentEnds,
        },
        rentalEndDate: {
          gte: rentStarts,
        },
        status: {
          not: OrderStatus.CANCELED,
        },
      },
    });

    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
    });
    if (!vehicle || vehicle.status !== VehicleStatus.ACTIVE) return false;

    return overlappingOrders === 0;
  };
}
