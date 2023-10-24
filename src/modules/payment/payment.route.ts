import { Router } from 'express';
import PaymentController from './payment.controller';
import { requireAuth, verifyAuthToken } from '@/middlewares/auth';

const router: Router = Router();
const controller = new PaymentController();

router.get('/', controller.getAllPayments);

router.post(
  '/registration',
  verifyAuthToken,
  requireAuth,
  controller.createRegistrationPayment
);

router.post('/registration/webhook', controller.registrationPaymentWebhook);

router.post('/order/webhook', controller.orderPaymentWebhook);

router.get(
  '/order/:orderId/checkout-url',
  controller.generateCheckoutUrlForOrder
);

export default router;
