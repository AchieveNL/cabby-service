import { type Request, type Response, type NextFunction } from 'express';
import { HttpStatusCode } from 'axios';
import OrderService from './order.service';
import {
  type RejectOrderDto,
  type CreateOrderDto,
  type CancelOrderDto,
  type ConfirmOrderDto,
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
      const dto: CreateOrderDto = req.body;
      const order = await this.orderService.createOrder(dto);
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
      const { orderId, reason } = req.body as RejectOrderDto;
      await this.orderService.rejectOrder(orderId, reason);
      return this.send(res, null, 204, 'Order rejected successfully');
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
      const { orderId } = req.body as ConfirmOrderDto;
      await this.orderService.confirmOrder(orderId);
      return this.send(res, null, 204, 'Order confirmed successfully');
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
}
