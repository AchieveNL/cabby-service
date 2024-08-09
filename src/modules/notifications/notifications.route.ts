import express from 'express';
import { NotificationController } from './notifications.controllers';
import {
  CreateNotificationDto,
  closeUserNotificationDto,
} from './notifications.dto';
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

notificationRouter.get(
  '/',
  verifyAuthToken,
  requireAuth,
  controller.getUserNotifications
);

notificationRouter.get(
  '/count',
  verifyAuthToken,
  requireAuth,
  controller.getUserNotificationsCount
);

notificationRouter.patch(
  '/:id',
  verifyAuthToken,
  requireAuth,
  RequestValidator.validateParams(closeUserNotificationDto),
  controller.closeUserNotification
);

// notificationRouter.get('/test-email', async () => {
//   await new UserMailService().optMailSender('', '12345');
// });
export default notificationRouter;
