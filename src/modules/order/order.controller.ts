import { type Request, type Response, type NextFunction } from 'express';
import { HttpStatusCode } from 'axios';
import OrderService from './order.service';
import {
  type RejectOrderDto,
  type CreateOrderDto,
  type CancelOrderDto,
  type RejectConfirmOrderDto,
} from './order.dto';
import { OrderStatus } from './types';
import Api from '@/lib/api';

export default class OrderController extends Api {
  readonly orderService = new OrderService();

  public createOrder = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const dto = req.body;
      const order = await this.orderService.createOrder({
        ...dto,
        userId: req.user?.id,
      } satisfies CreateOrderDto);
      return this.send(
        res,
        order,
        HttpStatusCode.Created,
        'Order created successfully'
      );
    } catch (error) {
      next();
    }
  };

  public rejectOrder = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { orderId } = req.body as RejectOrderDto;
      await this.orderService.rejectOrder(orderId);
      return this.send(res, null, 200, 'Order rejected successfully');
    } catch (error) {
      next(error);
    }
  };

  public cancelOrder = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { orderId } = req.body as CancelOrderDto;
      await this.orderService.cancelOrder(orderId);
      return this.send(res, null, 204, 'Order cancelled successfully');
    } catch (error) {
      next(error);
    }
  };

  public confirmOrder = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { orderId } = req.body as RejectConfirmOrderDto;
      await this.orderService.confirmOrder(orderId);
      return this.send(res, null, 200, 'Order confirmed successfully');
    } catch (error) {
      next(error);
    }
  };

  public getOrdersByStatus = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { status } = req.params;
      if (!Object.values(OrderStatus).includes(status as OrderStatus)) {
        return this.send(res, null, 400, 'Invalid status');
      }
      const orders = await this.orderService.getOrdersByStatus(
        status as OrderStatus
      );
      return this.send(res, orders);
    } catch (error) {
      next(error);
    }
  };

  public getOrderDetails = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { orderId } = req.params;
      const orderDetails = await this.orderService.getOrderDetails(orderId);
      if (!orderDetails) {
        return this.send(res, null, 404, 'Order not found');
      }
      return this.send(res, orderDetails);
    } catch (error) {
      next(error);
    }
  };

  public createOrderRejection = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const { orderId } = req.params;
    const { reason } = req.body;

    try {
      const rejection = await this.orderService.createRejection({
        orderId,
        reason,
      });
      return this.send(res, rejection, 201, 'Rejection created successfully');
    } catch (error) {
      next(error);
    }
  };

  public getVehicleAvailability = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { vehicleId } = req.params;
      const orders =
        await this.orderService.getVehicleOrdersForNext30Days(vehicleId);

      // Calculate the available timeslots based on the returned orders
      const availability = this.calculateAvailability(orders);

      return this.send(res, availability);
    } catch (error) {
      next(error);
    }
  };

  private readonly calculateAvailability = (orders: any[]) => {
    const timeSlots = [
      '00:00-06:00',
      '06:00-12:00',
      '12:00-18:00',
      '18:00-24:00',
    ];
    const availability: any = {};
    const currentDate = new Date();
    const oneDayMilliseconds = 24 * 60 * 60 * 1000;

    // Initialize the availability for the next 30 days
    for (let i = 0; i < 30; i++) {
      const day = new Date(currentDate.getTime() + i * oneDayMilliseconds);
      const dayStr = day.toISOString().split('T')[0]; // Format as 'YYYY-MM-DD'
      availability[dayStr] = { ...timeSlots.map((slot) => ({ [slot]: true })) };
    }

    // Go through each order and mark slots as unavailable
    for (const order of orders) {
      const startDay = new Date(order.startsAt).toISOString().split('T')[0];
      const endDay = new Date(order.endsAt).toISOString().split('T')[0];

      for (
        let currentDay = new Date(startDay);
        currentDay <= new Date(endDay);
        currentDay = new Date(currentDay.getTime() + oneDayMilliseconds)
      ) {
        const dayStr = currentDay.toISOString().split('T')[0];
        timeSlots.forEach((slot) => {
          // Here you can add more precise logic to check if the order overlaps with the timeslot
          availability[dayStr][slot] = false;
        });
      }
    }

    return availability;
  };

  public checkVehicleAvailabilityForTimeslot = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { vehicleId } = req.params;
      const { rentStarts, rentEnds } = req.query;

      const isAvailable = await this.orderService.isVehicleAvailableForTimeslot(
        vehicleId,
        new Date(rentStarts as string),
        new Date(rentEnds as string)
      );

      return this.send(res, { isAvailable });
    } catch (error) {
      next(error);
    }
  };
}
