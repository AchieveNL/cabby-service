import { type Request, type Response, type NextFunction } from 'express';
import * as Sentry from '@sentry/node';
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
import prisma from '@/lib/prisma';

export default class OrderController extends Api {
  readonly orderService = new OrderService();

  private readonly handleControllerError = (error, res) => {
    Sentry.captureException(error);

    if (error instanceof Error) {
      switch (error.message) {
        case 'Order not found.':
          return this.send(res, null, HttpStatusCode.NotFound, error.message);
        case 'Rental period has not started yet.':
          return this.send(res, null, HttpStatusCode.BadRequest, error.message);
        case 'Vehicle VIN not found.':
          return this.send(
            res,
            null,
            HttpStatusCode.BadRequest,
            'The vehicle may not support remote control.'
          );
        case 'Tesla API token or refresh token not found.':
          return this.send(
            res,
            null,
            HttpStatusCode.BadRequest,
            'Please contact the system administrator for Tesla API configuration.'
          );
        case 'Vehicle failed to come online after maximum attempts.':
          return this.send(
            res,
            null,
            HttpStatusCode.BadRequest,
            'The vehicle may not be connected to the internet or may be offline.'
          );
        case 'Error unlocking Tesla vehicle.':
        case 'Error locking Tesla vehicle.':
          return this.send(
            res,
            null,
            HttpStatusCode.InternalServerError,
            error.message
          );
        case 'Too many requests. Please try again later.':
          return this.send(
            res,
            null,
            HttpStatusCode.TooManyRequests,
            error.message
          );

        default:
          console.log(error);
          return this.send(
            res,
            null,
            HttpStatusCode.InternalServerError,
            'Internal Server Error'
          );
      }
    }
  };

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

  public createOrderAdmin = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const dto = req.body;
      const response = await this.orderService.createOrderAdmin(dto);
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
      const unlockResult = await this.orderService.unlockVehicleService(
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
      return this.handleControllerError(error, res);
    }
  };

  public lockVehicle = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { orderId } = req.params;
      const lockResult = await this.orderService.lockVehicleService(
        orderId,
        req.user?.id
      );
      return this.send(
        res,
        lockResult,
        HttpStatusCode.Ok,
        'Vehicle locked successfully'
      );
    } catch (error) {
      return this.handleControllerError(error, res);
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
      const order = await prisma.order.findUnique({
        where: { id: orderId },
        include: { vehicle: true },
      });

      if (process.env.NODE_ENV === 'production' && order?.isVehicleUnlocked) {
        await this.orderService.lockVehicleService(orderId, userId);
      }
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
      // return this.handleControllerError(error, res);
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
      return this.send(res, null, 204, 'Order cancelled successfully');
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

  public getRangeOrdersInvoices = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const start = req.query.start as string;
      const end = req.query.end as string;

      const startDate = new Date(start);
      const endDate = new Date(end);
      const data = await this.orderService.getRangeOrdersInvoices(
        startDate,
        endDate
      );

      return this.send(res, data);
    } catch (error) {
      next(error);
    }
  };

  public getRangeOrdersExcel = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const start = req.query.start as string;
      const end = req.query.end as string;

      const startDate = new Date(start);
      const endDate = new Date(end);
      const buffer = await this.orderService.getRangeOrdersExcel(
        startDate,
        endDate
      );

      // Send the file
      res.setHeader('Content-Disposition', 'attachment; filename="data.xlsx"');
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      return res.send(buffer);
    } catch (error) {
      next(error);
    }
  };

  public getVehicleOrders = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const vehicleId = req.params.vehicleId;

      const data = await this.orderService.getVehicleOrders(vehicleId);

      return this.send(res, data);
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
