import { type Decimal } from '@prisma/client/runtime/library';
import { differenceInHours } from 'date-fns';
import PaymentService from '../payment/payment.service';
import { type CreateOrderDto } from './order.dto';
import { OrderStatus } from './types';
import prisma from '@/lib/prisma';

export default class OrderService {
  private readonly paymentService = new PaymentService();

  public createOrder = async (dto: CreateOrderDto) => {
    try {
      const totalAmount = await this.calculateTotalAmount(
        dto.vehicleId,
        dto.rentalStartDate,
        dto.rentalEndDate
      );

      const order = await this.createOrderInDb({
        ...dto,
        totalAmount,
        orderStatus: 'PENDING', // Assuming you want to set an initial status
      });

      const payment = await this.paymentService.createRegistrationPayment({
        userId: dto.userId,
        amount: totalAmount,
        orderId: order.id,
      });

      return { order, payment };
    } catch (error) {
      console.error(error);
      throw new Error('Order creation failed');
    }
  };

  public rejectOrder = async (orderId: string, reason: string) => {
    const order = await prisma.order.findUnique({ where: { id: orderId } });

    if (!order) throw new Error('Order not found');

    const rejectionData = { orderId, reason };

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

  public cancelOrder = async (orderId: string) => {
    const order = await prisma.order.findUnique({ where: { id: orderId } });

    if (!order) throw new Error('Order not found');

    const now = new Date();
    const rentalStartDate = new Date(order.rentalStartDate); // Assuming order.rentalStartDate is stored as string

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

  private readonly createOrderInDb = async (orderData: any) => {
    try {
      const createdOrder = await prisma.order.create({
        data: orderData,
      });

      return createdOrder;
    } catch (error) {
      console.error(error);
      throw new Error('Error creating order in the database');
    }
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
}
