import { Router } from 'express';
import OrderController from './order.controller';
import {
  CancelOrderDto,
  CreateOrderDto,
  RejectConfirmOrderDto,
} from './order.dto';
import RequestValidator from '@/middlewares/request-validator';
import { requireAdmin, requireAuth, verifyAuthToken } from '@/middlewares/auth';

const router = Router();
const orderController = new OrderController();

router.post(
  '/create',
  verifyAuthToken,
  requireAuth,
  RequestValidator.validate(CreateOrderDto),
  orderController.createOrder
);

router.get(
  '/:orderId/details',
  verifyAuthToken,
  requireAuth,
  orderController.getOrderDetailsWithStatus
);

router.get(
  '/user-orders',
  verifyAuthToken,
  requireAuth,
  orderController.getUserOrdersByStatus
);

router.patch(
  '/orders/:orderId/complete',
  verifyAuthToken,
  requireAuth,
  orderController.completeOrder
);

router.get(
  '/details/:orderId',
  verifyAuthToken,
  requireAuth,
  orderController.getOrderDetails
);

router.get(
  '/vehicle/:vehicleId/availability',
  verifyAuthToken,
  requireAuth,
  orderController.getVehicleAvailability
);

router.get(
  '/vehicle/:vehicleId/check-availability',
  verifyAuthToken,
  requireAuth,
  orderController.checkVehicleAvailabilityForTimeslot
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
  requireAdmin,
  RequestValidator.validate(RejectConfirmOrderDto),
  orderController.confirmOrder
);

router.post(
  '/reject',
  verifyAuthToken,
  requireAuth,
  requireAdmin,
  RequestValidator.validate(RejectConfirmOrderDto),
  orderController.rejectOrder
);

router.post(
  '/rejection/:orderId',
  verifyAuthToken,
  requireAuth,
  orderController.createOrderRejection
);

router.get(
  '/status/:status',
  verifyAuthToken,
  requireAuth,
  orderController.getOrdersByStatus
);

export default router;
