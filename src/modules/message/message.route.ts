import { Router } from 'express';
import MessageController from './message.controller';
import { verifyAuthToken, requireAuth } from '@/middlewares/auth';

const router: Router = Router();
const controller = new MessageController();

router.get(
  '/conversations',
  verifyAuthToken,
  requireAuth,
  controller.getUserConversations
);

export default router;
