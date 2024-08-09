import { Router } from 'express';
import RefundController from './refunds.controller';
import { requireAdmin, requireAuth, verifyAuthToken } from '@/middlewares/auth';

const router: Router = Router();
const controller = new RefundController();

router.get(
  '/',
  verifyAuthToken,
  requireAuth,
  requireAdmin,
  controller.getAllRefunds
);

router.post(
  '/',
  verifyAuthToken,
  requireAuth,
  requireAdmin,
  controller.createRefund
);

export default router;
