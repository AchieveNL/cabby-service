import { type Request, type Response, type NextFunction } from 'express';
import { HttpStatusCode } from 'axios';
import RefundsService from './refunds.service';
import Api from '@/lib/api';

export default class RefundController extends Api {
  private readonly refundService = new RefundsService();

  public getAllRefunds = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const payments = await this.refundService.getAllRefunds();
      return this.send(
        res,
        payments,
        HttpStatusCode.Ok,
        'Refunds retrieved successfully'
      );
    } catch (error) {
      next(error);
    }
  };

  public createRefund = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const data = await this.refundService.createRefund(req.body);

      return this.send(
        res,
        data,
        HttpStatusCode.Created,
        'Refund created successfully'
      );
    } catch (error) {
      next(error);
    }
  };
}
