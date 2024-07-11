import { Router } from 'express';
import OrderController from './order.controller';
import {
  CancelOrderDto,
  CreateOrderAdminDto,
  CreateOrderDto,
  DeleteOrderDto,
  RejectConfirmOrderDto,
  changeOrderStatusDto,
  getRangeOrdersInvoicesDto,
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

router.post(
  '/create-admin',
  verifyAuthToken,
  requireAuth,
  requireAdmin,
  RequestValidator.validate(CreateOrderAdminDto),
  orderController.createOrderAdmin
);

router.get(
  '/range-invoices',
  verifyAuthToken,
  requireAuth,
  requireAdmin,
  RequestValidator.validateQuery(getRangeOrdersInvoicesDto),
  orderController.getRangeOrdersInvoices
);

router.get(
  '/:orderId/details',
  verifyAuthToken,
  requireAuth,
  orderController.getOrderDetailsWithStatus
);

router.post(
  '/order/:orderId/unlockVehicle',
  verifyAuthToken,
  requireAuth,
  orderController.unlockVehicle
);

router.post(
  '/order/:orderId/lockVehicle',
  verifyAuthToken,
  requireAuth,
  orderController.lockVehicle
);

router.post(
  '/order/:orderId/startVehicle',
  verifyAuthToken,
  requireAuth,
  orderController.startVehicle
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

router.get(
  '/vehicle/:vehicleId',
  verifyAuthToken,
  requireAuth,
  orderController.getVehicleOrders
);

router.post(
  '/cancel',
  verifyAuthToken,
  requireAuth,
  RequestValidator.validate(CancelOrderDto),
  orderController.cancelOrder
);

router.post(
  '/stop',
  verifyAuthToken,
  requireAuth,
  requireAdmin,
  RequestValidator.validate(CancelOrderDto),
  orderController.stopOrder
);

router.post(
  '/complete-admin',
  verifyAuthToken,
  requireAuth,
  requireAdmin,
  RequestValidator.validate(CancelOrderDto),
  orderController.completeOrderAdmin
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
  '/delete',
  verifyAuthToken,
  requireAuth,
  requireAdmin,
  RequestValidator.validate(DeleteOrderDto),
  orderController.deleteOrder
);

router.post(
  '/change-status',
  verifyAuthToken,
  requireAuth,
  requireAdmin,
  RequestValidator.validate(changeOrderStatusDto),
  orderController.changeOrderStatus
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
