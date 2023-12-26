import express from 'express';
import { NotificationController } from './notifications.controllers';
import { CreateNotificationDto } from './notifications.dto';
import { requireAuth, verifyAuthToken } from '@/middlewares/auth';
import RequestValidator from '@/middlewares/request-validator';

const notificationRouter = express.Router();
const controller = new NotificationController();

notificationRouter.post(
  '/send-notification',
  verifyAuthToken,
  requireAuth,
  RequestValidator.validate(CreateNotificationDto),
  controller.sendNotification
);

export default notificationRouter;
