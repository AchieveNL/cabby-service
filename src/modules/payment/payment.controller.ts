import { type Request, type Response, type NextFunction } from 'express';
import { HttpStatusCode } from 'axios';
import { v4 as uuidv4 } from 'uuid';
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

  public createPayment = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const payment = await this.paymentService.createPayment(req.body);
      return this.send(
        res,
        payment,
        HttpStatusCode.Created,
        'Payment created successfully'
      );
    } catch (error) {
      next(error);
    }
  };

  public updatePayment = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;
      const payment = await this.paymentService.updatePayment(id, req.body);
      return this.send(
        res,
        payment,
        HttpStatusCode.Ok,
        'Payment updated successfully'
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
      const orderId = uuidv4(); // Generate a unique identifier for the payment

      const checkoutUrl = await this.paymentService.createRegistrationPayment({
        ...req.body,
        orderId, // This assumes that orderId is in your DTO, and you wish to save it
      });

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

  public refundPayment = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { paymentId } = req.params;
      await this.paymentService.refundPayment(paymentId);
      return this.send(res, null, HttpStatusCode.NoContent, 'Refund initiated');
    } catch (error) {
      next(error);
    }
  };

  public handleMollieWebhook = async (
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

      await this.paymentService.updatePaymentStatus(paymentId);
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
}
