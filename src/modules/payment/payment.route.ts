import { Router } from 'express';
import PaymentController from './payment.controller';
import { CreatePaymentDto, UpdatePaymentDto } from './payment.dto';
import RequestValidator from '@/middlewares/request-validator';

const router: Router = Router();
const controller = new PaymentController();

router.get('/', controller.getAllPayments);
router.post(
  '/',
  RequestValidator.validate(CreatePaymentDto),
  controller.createPayment
);

router.put(
  '/:id',
  RequestValidator.validate(UpdatePaymentDto),
  controller.updatePayment
);

router.post(
  '/',
  RequestValidator.validate(CreatePaymentDto),
  controller.createPayment
);

router.post(
  '/registration',
  RequestValidator.validate(CreatePaymentDto),
  controller.createRegistrationPayment
);

router.post('/refund/:paymentId', controller.refundPayment);

router.post('/webhook', controller.handleMollieWebhook);

export default router;
