import { type Request, type Response, type NextFunction } from 'express';
import { HttpStatusCode } from 'axios';
import { type user } from '@prisma/client';
import OrderService from './order.service';
import {
  type RejectOrderDto,
  type CreateOrderDto,
  type CancelOrderDto,
  type RejectConfirmOrderDto,
  type changeOrderStatusDto,
  type DeleteOrderDto,
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
      next(error);
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
      const user = req.user as user;
      await this.orderService.cancelOrder(orderId, user);
      return this.send(
        res,
        null,
        HttpStatusCode.Ok,
        'Order cancelled successfully'
      );
    } catch (error) {
      next(error);
    }
  };

  public stopOrder = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { orderId } = req.body as CancelOrderDto;
      await this.orderService.stopOrder(orderId);
      return this.send(res, null, 204, 'Order stopped successfully');
    } catch (error) {
      next(error);
    }
  };

  public completeOrderAdmin = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { orderId } = req.body as CancelOrderDto;
      await this.orderService.completeOrderAdmin(orderId);
      return this.send(res, null, 204, 'Order completed successfully');
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

  public deleteOrder = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { orderId } = req.body as DeleteOrderDto;
      await this.orderService.deleteOrder(orderId);
      return this.send(res, null, 200, 'Order deleted successfully');
    } catch (error) {
      next(error);
    }
  };

  public changeOrderStatus = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { orderId, status } = req.body as changeOrderStatusDto;
      await this.orderService.changeOrderStatus(orderId, status);
      return this.send(res, null, 200, 'Order changed successfully');
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

      const startDate = new Date(rentStarts as string);
      const endDate = new Date(rentEnds?.toString().trim() as string);

      // console.log(startDate, endDate, 'checkVehicleAvailabilityForTimeslot');

      const isAvailable = await this.orderService.isVehicleAvailableForTimeslot(
        vehicleId,
        startDate,
        endDate
      );

      if (!isAvailable) {
        return this.send(res, { isAvailable, totalRentPrice: null });
      }

      const amount = await this.orderService.calculateTotalRentPrice(
        vehicleId,
        startDate,
        endDate
      );

      const totalRentPrice = amount * 1.21;

      return this.send(res, { isAvailable, totalRentPrice });
    } catch (error) {
      next(error);
    }
  };
}
