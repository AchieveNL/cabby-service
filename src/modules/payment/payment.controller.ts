import { type Request, type Response, type NextFunction } from 'express';
import { HttpStatusCode } from 'axios';
import PaymentService from './payment.service';
import Api from '@/lib/api';

export default class PaymentController extends Api {
  private readonly paymentService = new PaymentService();

  public getAllPayments = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const payments = await this.paymentService.getAllPayments();
      return this.send(
        res,
        payments,
        HttpStatusCode.Ok,
        'Payments retrieved successfully'
      );
    } catch (error) {
      next(error);
    }
  };

  public createRegistrationPayment = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const checkoutUrl = await this.paymentService.createRegistrationPayment(
        req.user?.id
      );

      return this.send(
        res,
        { checkoutUrl },
        HttpStatusCode.Created,
        'Registration payment initiated successfully'
      );
    } catch (error) {
      next(error);
    }
  };

  public registrationPaymentWebhook = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const paymentId = req.body.id;

      if (!paymentId) {
        return this.send(
          res,
          null,
          HttpStatusCode.BadRequest,
          'Payment ID is missing.'
        );
      }

      await this.paymentService.updateRegistrationPaymentStatus(paymentId);
      return this.send(
        res,
        null,
        HttpStatusCode.Ok,
        'Payment status updated successfully'
      );
    } catch (error) {
      next(error);
    }
  };

  public orderPaymentWebhook = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const paymentId = req.body.id;

      if (!paymentId) {
        return this.send(
          res,
          null,
          HttpStatusCode.BadRequest,
          'Payment ID is missing.'
        );
      }

      await this.paymentService.updateOrderPaymentStatus(paymentId);
      return this.send(
        res,
        null,
        HttpStatusCode.Ok,
        'Order payment status updated successfully'
      );
    } catch (error) {
      next(error);
    }
  };

  public generateCheckoutUrlForOrder = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { orderId } = req.params;
      const checkoutUrl =
        await this.paymentService.createCheckoutUrlForOrder(orderId);
      return this.send(
        res,
        { checkoutUrl },
        HttpStatusCode.Ok,
        'Checkout URL generated successfully'
      );
    } catch (error) {
      next(error);
    }
  };

  public refundPayment = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { paymentId } = req.params;
      const data = await this.paymentService.refundPayment(paymentId);
      return this.send(
        res,
        data,
        HttpStatusCode.Ok,
        'Payment refunded successfully'
      );
    } catch (error) {
      next(error);
    }
  };
}
