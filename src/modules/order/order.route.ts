import { Router } from 'express';
import OrderController from './order.controller';
import { CancelOrderDto, ConfirmOrderDto, CreateOrderDto } from './order.dto';
import RequestValidator from '@/middlewares/request-validator';
import { requireAuth, verifyAuthToken } from '@/middlewares/auth';

const router = Router();
const orderController = new OrderController();

router.post(
  '/',
  verifyAuthToken,
  requireAuth,
  RequestValidator.validate(CreateOrderDto),
  orderController.createOrder
);

router.post(
  '/cancel',
  verifyAuthToken,
  requireAuth,
  RequestValidator.validate(CancelOrderDto),
  orderController.cancelOrder
);

router.post(
  '/confirm',
  verifyAuthToken,
  requireAuth,
  RequestValidator.validate(ConfirmOrderDto),
  orderController.confirmOrder
);

router.get(
  '/status/:status',
  verifyAuthToken,
  requireAuth,
  orderController.getOrdersByStatus
);

router.get(
  '/details/:orderId',
  verifyAuthToken,
  requireAuth,
  orderController.getOrderDetails
);

export default router;
