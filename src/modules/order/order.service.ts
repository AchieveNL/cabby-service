import {
  type Prisma,
  type user,
  type order,
  PaymentStatus,
  UserRole,
} from '@prisma/client';
import { type Decimal } from '@prisma/client/runtime/library';
import fetch, { Headers } from 'node-fetch';
import { HttpStatusCode } from 'axios';
import * as XLSX from 'xlsx';
import * as Sentry from '@sentry/node';
import PaymentService from '../payment/payment.service';
import { VehicleStatus } from '../vehicle/types';
import AdminMailService from '../notifications/admin-mails.service';
import UserMailService from '../notifications/user-mails.service';
import { NotificationService } from '../notifications/notification.service';
import { orderConfirmedNotification } from '../notifications/notifications.functions';
import OrderMailService from './order-mails.service';
import { OrderStatus } from './types';
import { calculateOrderPrice } from './functions';
import { type CreateOrderAdminDto } from './order.dto';
import prisma from '@/lib/prisma';
import { refreshTeslaApiToken } from '@/tesla-auth';
import { ApiError } from '@/lib/errors';
import { dateTimeFormat, formatDuration } from '@/utils/date';

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
    console.log(amount);
    const totalAmount = amount * 1.21;
    console.log('totalAmount:', totalAmount);

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

  public createOrderAdmin = async (dto: CreateOrderAdminDto) => {
    const { rentalEndDate, rentalStartDate, userId, vehicleId } = dto;

    const vehicle = await prisma.vehicle.findUnique({
      where: { id: vehicleId },
    });

    if (!vehicle) throw new Error('No vehicle found!');

    const totalAmount = 0.01;

    const order = await prisma.order.create({
      data: {
        rentalEndDate,
        rentalStartDate,
        userId,
        vehicleId,
        totalAmount,
        status: OrderStatus.CONFIRMED,
      },
    });

    const paymentResponse = await this.paymentService.createOrderPayment({
      userId,
      amount: totalAmount,
      orderId: order.id,
      status: PaymentStatus.PAID,
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

  private async validateOrderAndRental(orderId: string, userId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { vehicle: true, user: true },
    });

    if (!order) {
      throw new Error('Order not found.');
    }

    if (order.status !== 'CONFIRMED') {
      throw new Error('Order is not confirmed.');
    }

    if (order.user.id !== userId) {
      throw new Error('User not authorized for this order.');
    }

    const rentalEndDate = new Date(order.rentalEndDate);

    const currentDate = new Date();
    const rentalStartDate = new Date(order.rentalStartDate);

    if (currentDate < rentalStartDate || currentDate > rentalEndDate) {
      throw new Error(
        `Action not allowed outside rental period. Current date: ${currentDate.toISOString()}, Rental start date: ${rentalStartDate.toISOString()}, Rental end date: ${rentalEndDate.toISOString()}`
      );
    }

    if (!order.vehicle.vin) {
      throw new Error('Vehicle VIN not found.');
    }

    return order;
  }

  // Get the Tesla API tokens from the database (token and refresh token)
  private async getTeslaToken() {
    const teslaToken = await prisma.teslaToken.findFirst({
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!teslaToken?.refreshToken) {
      throw new Error('Tesla API token or refresh token not found.');
    }

    return teslaToken;
  }

  private async updateOrderLockStatus(orderId: string, isUnlocked: boolean) {
    return await prisma.order.update({
      where: { id: orderId },
      data: { isVehicleUnlocked: isUnlocked },
    });
  }

  private async wakeUpVehicle(
    vin: string,
    token: string,
    maxAttempts = 5,
    delayMs = 2000
  ) {
    const wakeUpUrl = `https://fleet-api.prd.eu.vn.cloud.tesla.com/api/1/vehicles/${vin}/wake_up`;

    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      console.log(`Attempt ${attempt} of ${maxAttempts}`);

      const wakeUpResponse = await fetch(wakeUpUrl, {
        method: 'POST',
        headers: headers,
      });

      if (wakeUpResponse.status !== 200) {
        // console.log(
        //   'Error waking up vehicle.',
        //   wakeUpResponse.status,
        //   await wakeUpResponse.text()
        // );
        throw new Error(
          `Error waking up vehicle: ${
            wakeUpResponse.status
          } ${await wakeUpResponse.text()}`
        );
      }

      const wakeUpData = await wakeUpResponse.json();

      if (wakeUpData?.response?.state === 'online') {
        return wakeUpData;
      }

      if (attempt < maxAttempts) {
        console.log(
          `Vehicle not yet online. Waiting ${delayMs}ms before next attempt...`
        );
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    throw new Error('Vehicle failed to come online after maximum attempts.');
  }

  public unlockVehicleService = async (orderId: string, userId: string) => {
    const order = await this.validateOrderAndRental(orderId, userId);
    const teslaToken = await this.getTeslaToken();

    if (process.env.NODE_ENV === 'production') {
      if (!order.vehicle.vin) {
        throw new Error('Vehicle VIN not found.');
      }
      if (!teslaToken.refreshToken) {
        throw new Error('Refresh token not found.');
      }

      await this.wakeUpVehicle(order.vehicle.vin, teslaToken.token);
      const result = await this.unlockTeslaVehicle(
        order.vehicle.vin,
        teslaToken.token,
        teslaToken.refreshToken
      );

      if (!result?.response?.result) {
        throw new Error('Error unlocking Tesla vehicle.');
      }

      // await this.notificationService.sendNotificationToUser(
      //   userId,
      //   'Je Tesla is ontgrendeld.',
      //   'Gefeliciteerd! Je Tesla is ontgrendeld en klaar om te gebruiken. 🚗',
      //   JSON.stringify({ type: 'event' })
      // );
    }

    return await this.updateOrderLockStatus(orderId, true);
  };

  public lockVehicleService = async (orderId: string, userId: string) => {
    const order = await this.validateOrderAndRental(orderId, userId);
    const teslaToken = await this.getTeslaToken();

    if (process.env.NODE_ENV === 'production') {
      if (!order.vehicle.vin) {
        throw new Error('Vehicle VIN not found.');
      }
      if (!teslaToken.refreshToken) {
        throw new Error('Refresh token not found.');
      }

      await this.wakeUpVehicle(order.vehicle.vin, teslaToken.token);
      const result = await this.lockTeslaVehicle(
        order.vehicle.vin,
        teslaToken.token,
        teslaToken.refreshToken
      );

      if (!result?.response?.result) {
        throw new Error('Error locking Tesla vehicle.');
      }

      // await this.notificationService.sendNotificationToUser(
      //   userId,
      //   'Heel goed!',
      //   'Je Tesla is nu vergrendeld. 🔐',
      //   JSON.stringify({ type: 'event' })
      // );
    }

    return await this.updateOrderLockStatus(orderId, false);
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

    if (result?.response?.result) {
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
    vin: string,
    teslaApiToken: string,
    teslaApiRefreshToken: string
  ): Promise<any> => {
    console.log('Unlocking Tesla vehicle:', vin);
    const url = `https://fleet-api.prd.eu.vn.cloud.tesla.com/api/1/vehicles/${vin}/command/door_unlock`;

    try {
      let currentToken = teslaApiToken;

      for (let attempts = 0; attempts < 2; attempts++) {
        try {
          const response = await this.httpCallVehicleCommand(url, currentToken);
          const responseData = await response.json();
          console.log(
            'Unlocking Tesla vehicle response:',
            response.status,
            responseData
          );

          if (response.status === 200) {
            console.log('Tesla vehicle unlocked successfully.');
            return responseData;
          }

          if (response.status === 401 && attempts === 0) {
            console.log('Tesla API token expired. Refreshing token...');
            const newAccessToken =
              await refreshTeslaApiToken(teslaApiRefreshToken);
            currentToken = newAccessToken;
            continue;
          }

          throw new Error(`Unexpected response status: ${response.status}`);
        } catch (error) {
          if (attempts === 1) throw error;
          console.error('Error in unlock attempt, will retry:', error);
        }
      }
      throw new Error('Failed to unlock Tesla vehicle after retries');
    } catch (error) {
      console.error('Error unlocking Tesla vehicle:', error);
      throw new Error('Failed to unlock Tesla vehicle.');
    }
  };

  // Function to lock a Tesla vehicle
  private readonly lockTeslaVehicle = async (
    vin: string,
    teslaApiToken: string,
    teslaApiRefreshToken: string
  ): Promise<any> => {
    const url = `https://fleet-api.prd.eu.vn.cloud.tesla.com/api/1/vehicles/${vin}/command/door_lock`;

    try {
      let currentToken = teslaApiToken;

      for (let attempts = 0; attempts < 2; attempts++) {
        try {
          const response = await this.httpCallVehicleCommand(url, currentToken);
          const responseData = await response.json();

          console.log(
            'Locking Tesla vehicle response: (httpCallVehicleCommand)',
            response.status,
            responseData
          );

          if (response.status === 200) {
            console.log('Tesla vehicle locked successfully.');
            return responseData;
          }

          if (response.status === 401 && attempts === 0) {
            console.log('Tesla API token expired. Refreshing token...');
            const newAccessToken =
              await refreshTeslaApiToken(teslaApiRefreshToken);
            currentToken = newAccessToken;
            continue;
          }

          throw new Error(`Unexpected response status: ${response.status}`);
        } catch (error) {
          if (attempts === 1) throw error;
          Sentry.captureException(error);
          console.error('Error in lock attempt, will retry:', error);
        }
      }

      throw new Error('Failed to lock Tesla vehicle after retries');
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
        const newAccessToken = await refreshTeslaApiToken(teslaApiRefreshToken);
        console.log('Token refreshed. Retrying...');
        response = await this.httpCallVehicleCommand(url, newAccessToken);
      }
      const result = await response.json();

      return result;
    } catch (error) {
      console.error('Error starting Tesla vehicle:', error);
      // Sentry.captureException(new Error('Failed to start Tesla vehicle.'));
      throw new Error('Failed to start Tesla vehicle.');
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

    const now = new Date();
    const status =
      order.rentalEndDate < now ? undefined : OrderStatus.COMPLETED;

    const updateData: Prisma.orderUpdateInput = {
      stopRentDate: now,
      status,
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

    // await this.adminMailService.rentCompletedMailSender(
    //   user?.email!,
    //   user?.profile?.fullName!,
    //   order.vehicle.licensePlate ?? '',
    //   order.vehicle.model ?? ''
    // );

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
      data: { status: OrderStatus.COMPLETED, stopRentDate: new Date() },
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

    if (!isAdmin && order.rentalStartDate < new Date()) {
      throw new ApiError(
        HttpStatusCode.BadRequest,
        'You cannot cancel a rental that has already started'
      );
    }

    if (order.userId !== userSender.id && !isAdmin)
      throw new ApiError(HttpStatusCode.Unauthorized, 'Unauthorized');

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
        vehicle: {
          select: {
            papers: true,
            companyName: true,
            model: true,
            insuranceCertificates: true,
            registrationCertificates: true,
          },
        },
      },
    });

    if (!order) throw new Error('Order not found');

    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'CONFIRMED' },
    });

    const companyName = order.vehicle.companyName ?? '';
    const model = order.vehicle.model ?? '';

    await this.orderMailService.orderConfirmedMailSender(
      order.user.email,
      order.user.profile?.fullName,
      order.vehicle.insuranceCertificates.concat(
        order.vehicle.registrationCertificates
      )
    );

    await orderConfirmedNotification({
      companyName,
      model,
      orderId: order.id,
      userId: order.userId,
    });
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
      payment: true,
    };
    const orderBy: Prisma.orderOrderByWithRelationInput = { createdAt: 'desc' };

    const where: Prisma.orderWhereInput =
      status === 'UNPAID'
        ? {
            rentalEndDate: { lt: new Date() },
            status: 'CONFIRMED',
          }
        : { status };

    //     if (status === 'UNPAID') {
    //       where = {
    //         rentalEndDate: { lt: new Date() },
    //         status: 'CONFIRMED',
    //       };

    //       console.log((await prisma.order.findMany({ where })).length);
    //       const query = Prisma.sql`SELECT
    //   *
    // FROM
    //   "order"
    // WHERE
    //   (
    //     "stopRentDate" > "rentalEndDate"
    //     OR "rentalEndDate" < now()
    //   )
    //   AND status = 'CONFIRMED'`;
    //       const ordersIds = await prisma.$queryRaw<order[]>(query);

    //       // console.log(ordersIds);

    //       orders = await prisma.order.findMany({
    //         where: { id: { in: ordersIds.map((el) => el.id) } },
    //         include,
    //         orderBy,
    //       });

    //       return orders;
    //     }

    orders = await prisma.order.findMany({
      where,
      include,
      orderBy,
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

  public getRangeOrdersInvoices = async (startDate: Date, endDate: Date) => {
    const data = await prisma.payment.findMany({
      select: { invoiceUrl: true },
      where: {
        order: { rentalStartDate: { gte: startDate, lte: endDate } },
        invoiceUrl: { not: null },
      },
    });

    const formatedData = data.map((el) => el.invoiceUrl);

    return formatedData;
  };

  public getRangeOrdersExcel = async (startDate: Date, endDate: Date) => {
    const data = await prisma.order.findMany({
      where: {
        rentalStartDate: { gte: startDate, lte: endDate },
      },
      include: {
        payment: true,
        vehicle: true,
        user: { include: { profile: true } },
      },
    });

    const formatedData = data.map((el) => {
      const Bestuurders = el.user.profile?.fullName;
      const Auto = [el.vehicle.model, el.vehicle.companyName].join(' ');
      const Begin = dateTimeFormat(el.rentalStartDate);
      const Einde = dateTimeFormat(el.rentalEndDate);
      const Duur = formatDuration(el.rentalStartDate, el.rentalEndDate);
      const Prijs =
        '€ ' + el.totalAmount.toFixed(2) + ` ${el.payment?.status ?? ''}`;

      return { Bestuurders, Auto, Begin, Einde, Duur, Prijs };
    });

    const worksheet = XLSX.utils.json_to_sheet(formatedData);

    // Set a uniform column width for all columns
    const uniformWidth = 20; // Adjust this value as needed
    const cols = Object.keys(formatedData[0]).map(() => ({
      wch: uniformWidth,
    }));
    worksheet['!cols'] = cols;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');

    // Generate buffer
    const buffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'buffer' });

    return buffer;
  };

  public getVehicleOrders = async (vehicleId: string) => {
    const data = await prisma.order.findMany({
      select: { id: true, rentalEndDate: true, rentalStartDate: true },
      where: {
        vehicleId,
      },
    });

    return data;
  };
}
