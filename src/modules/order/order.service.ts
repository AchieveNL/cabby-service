import { type Decimal } from '@prisma/client/runtime/library';
import { differenceInHours } from 'date-fns';
import PaymentService from '../payment/payment.service';
import { VehicleStatus } from '../vehicle/types';
import { OrderStatus } from './types';
import prisma from '@/lib/prisma';

export default class OrderService {
  private readonly paymentService = new PaymentService();

  public createOrder = async (dto) => {
    const totalAmount = await this.calculateTotalAmount(
      dto.vehicleId,
      dto.rentalStartDate,
      dto.rentalEndDate
    );

    const order = await prisma.order.create({
      data: {
        ...dto,
        totalAmount,
        status: OrderStatus.PENDING,
      },
    });

    const payment = await this.paymentService.createRegistrationPayment({
      userId: dto.userId,
      amount: totalAmount,
      orderId: order.id,
    });

    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentId: payment.payment,
      },
    });

    return { order, payment };
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
  };

  public confirmOrder = async (orderId: string) => {
    const order = await prisma.order.findUnique({ where: { id: orderId } });

    if (!order) throw new Error('Order not found');

    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'CONFIRMED' },
    });
  };

  public getOrdersByStatus = async (status: OrderStatus) => {
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
      where: { id: vehicleId }, // Assume the vehicle model has a pricePerDay field
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

  public getVehicleOrdersForNext30Days = async (vehicleId: string) => {
    const today = new Date();
    const thirtyDaysLater = new Date(today);
    thirtyDaysLater.setDate(today.getDate() + 30);

    return await prisma.order.findMany({
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
    });
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
