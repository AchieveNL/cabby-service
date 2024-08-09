import { type Request, type Response, type NextFunction } from 'express';
import { HttpStatusCode } from 'axios';
import OverviewService from './overview.service';
import Api from '@/lib/api';

export default class OverviewController extends Api {
  private readonly overviewService = new OverviewService();

  public getOverview = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const overview = await this.overviewService.getOverview();
      return this.send(
        res,
        overview,
        HttpStatusCode.Ok,
        'Overview fetched successfully'
      );
    } catch (error) {
      next(error);
    }
  };

  public getPendingDetails = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const pendingDetails = await this.overviewService.getPendingDetails();
      return this.send(
        res,
        pendingDetails,
        HttpStatusCode.Ok,
        'Pending details fetched successfully'
      );
    } catch (error) {
      next(error);
    }
  };
}
