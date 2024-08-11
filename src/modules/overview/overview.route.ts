import { Router } from 'express';
import OverviewController from './overview.controller';
import { verifyAuthToken, requireAuth } from '@/middlewares/auth';

const router: Router = Router();
const controller = new OverviewController();

router.get('/', verifyAuthToken, requireAuth, controller.getOverview);
router.get(
  '/pending-details',
  verifyAuthToken,
  requireAuth,
  controller.getPendingDetails
);

export default router;
