import { type Request, type Response, type NextFunction } from 'express';
import { HttpStatusCode } from 'axios';
import DamageReportsService from './damage-reports.service';
import { type ReportStatus } from './types';
import Api from '@/lib/api';

export default class DamageReportsController extends Api {
  private readonly service = new DamageReportsService();

  public createDamageReport = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const report = await this.service.createDamageReport({
        ...req.body,
        userId: req.user?.id,
      });
      return this.send(
        res,
        report,
        HttpStatusCode.Created,
        'Damage report created successfully'
      );
    } catch (error) {
      next(error);
    }
  };

  public getAllReports = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const reports = await this.service.getAllReports();
      return this.send(
        res,
        reports,
        HttpStatusCode.Ok,
        'Reports fetched successfully'
      );
    } catch (error) {
      next(error);
    }
  };

  public closeDamageReport = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const updatedReport = await this.service.updateReportStatus(
        req.params.id
      );
      return this.send(
        res,
        updatedReport,
        HttpStatusCode.Ok,
        'Report status updated successfully'
      );
    } catch (error) {
      next(error);
    }
  };

  public getReportsByStatus = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const status = req.params.status as ReportStatus;
      const reports = await this.service.getReportsByStatus(status);
      return this.send(
        res,
        reports,
        HttpStatusCode.Ok,
        'Reports fetched successfully'
      );
    } catch (error) {
      next(error);
    }
  };

  public getReportDetails = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const id = req.params.id;
      const reports = await this.service.getReportDetails(id);
      return this.send(
        res,
        reports,
        HttpStatusCode.Ok,
        'Reports fetched successfully'
      );
    } catch (error) {
      next(error);
    }
  };
}
