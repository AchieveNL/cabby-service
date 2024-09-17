import { Router } from 'express';
import PaymentController from './payment.controller';
import { paymentRefundDto } from './payment.dto';
import { requireAdmin, requireAuth, verifyAuthToken } from '@/middlewares/auth';
import RequestValidator from '@/middlewares/request-validator';

const router: Router = Router();
const controller = new PaymentController();

router.get('/', verifyAuthToken, requireAuth, controller.getAllPayments);

router.post(
  '/registration',
  verifyAuthToken,
  requireAuth,
  controller.createRegistrationPayment
);

router.post('/registration/webhook', controller.registrationPaymentWebhook);

router.post('/order/webhook', controller.orderPaymentWebhook);

router.post(
  '/refund/:paymentId',
  verifyAuthToken,
  requireAuth,
  requireAdmin,
  RequestValidator.validateParams(paymentRefundDto),
  controller.refundPayment
);

router.get(
  '/order/:orderId/checkout-url',
  controller.generateCheckoutUrlForOrder
);

export default router;
