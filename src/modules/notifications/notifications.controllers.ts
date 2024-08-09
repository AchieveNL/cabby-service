import { type NextFunction, type Request, type Response } from 'express';
import { HttpStatusCode } from 'axios';
import { NotificationService } from './notification.service';
import Api from '@/lib/api';

export class NotificationController extends Api {
  private readonly notificationService = new NotificationService();

  public sendNotification = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const { title, body, userId, metadata } = req.body;

      await this.notificationService.sendNotificationToUser(
        userId,
        title,
        body,
        metadata
      );

      this.send(res, null, HttpStatusCode.Ok, 'Notification sent successfully');
    } catch (error) {
      next(error);
    }
  };

  public getUserNotifications = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.id as string;

      const data = await this.notificationService.getUserNotifications(userId);

      this.send(res, data, HttpStatusCode.Ok, 'Success');
    } catch (error) {
      next(error);
    }
  };

  public getUserNotificationsCount = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.id as string;

      const data =
        await this.notificationService.getUserNotificationsCount(userId);

      this.send(res, data, HttpStatusCode.Ok, 'Success');
    } catch (error) {
      next(error);
    }
  };

  public closeUserNotification = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const id = Number(req.params.id);
      const userId = req.user?.id as string;

      await this.notificationService.closeUserNotification(userId, id);

      this.send(res, null, HttpStatusCode.Ok, 'Success');
    } catch (error) {
      next(error);
    }
  };
}
