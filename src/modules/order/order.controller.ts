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
      const response = await this.orderService.createOrder({
        ...dto,
        userId: req.user?.id,
      } satisfies CreateOrderDto);
      return this.send(
        res,
        response,
        HttpStatusCode.Created,
        'Order created successfully'
      );
    } catch (error) {
      console.log(error);
      next();
    }
  };

  public getOrderDetailsWithStatus = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { orderId } = req.params;
      const details =
        await this.orderService.getOrderDetailsWithStatus(orderId);
      return this.send(
        res,
        details,
        HttpStatusCode.Ok,
        'Order details fetched successfully'
      );
    } catch (error) {
      console.log(error);
      next();
    }
  };

  public unlockVehicle = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { orderId } = req.params;
      const unlockResult = await this.orderService.unlockVehicle(
        orderId,
        req.user?.id
      );
      return this.send(
        res,
        unlockResult,
        HttpStatusCode.Ok,
        'Vehicle unlocked successfully'
      );
    } catch (error) {
      console.log(error);
      next();
    }
  };

  public lockVehicle = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { orderId } = req.params;
      const unlockResult = await this.orderService.lockVehicle(
        orderId,
        req.user?.id
      );
      return this.send(
        res,
        unlockResult,
        HttpStatusCode.Ok,
        'Vehicle unlocked successfully'
      );
    } catch (error) {
      console.log(error);
      next();
    }
  };

  public startVehicle = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { orderId } = req.params;
      const unlockResult = await this.orderService.startVehicle(
        orderId,
        req.user?.id
      );
      return this.send(
        res,
        unlockResult,
        HttpStatusCode.Ok,
        'Vehicle unlocked successfully'
      );
    } catch (error) {
      console.log(error);
      next();
    }
  };

  public completeOrder = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const orderId = req.params.orderId;
    const userId = req.user?.id;

    try {
      const details = await this.orderService.completeOrder(orderId, userId);
      return this.send(
        res,
        details,
        HttpStatusCode.Ok,
        'Order marked as completed successfully'
      );
    } catch (error) {
      if (error.message === 'Not authorized to complete this order.') {
        res.status(403).json({ error: error.message });
      } else if (error.message === 'Order not found.') {
        res.status(404).json({ error: error.message });
      } else if (error.message === 'Order is not in CONFIRMED status.') {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Internal Server Error.' });
      }
      next();
    }
  };

  public getUserOrdersByStatus = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const userId = req.user?.id;
    const status: OrderStatus | undefined = req.query.status as OrderStatus;

    try {
      const orders = await this.orderService.getUserOrdersByStatus(
        userId,
        status
      );
      return this.send(
        res,
        orders,
        HttpStatusCode.Ok,
        'Orders fetched successfully'
      );
    } catch (error) {
      console.log(error);
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
      const availability =
        await this.orderService.getVehicleBookedPeriodsIncludingOngoing(
          vehicleId
        );

      return this.send(res, availability);
    } catch (error) {
      next(error);
    }
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

      if (!isAvailable) {
        return this.send(res, { isAvailable, totalRentPrice: null });
      }

      const totalRentPrice = await this.orderService.calculateTotalRentPrice(
        vehicleId,
        rentStarts as string,
        rentEnds as string
      );

      return this.send(res, { isAvailable, totalRentPrice });
    } catch (error) {
      next(error);
    }
  };
}
