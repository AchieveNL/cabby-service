import { Router } from 'express';
import DamageReportsController from './damage-reports.controller';
import { CreateDamageReportDto } from './damage-reports.dto';
import { verifyAuthToken, requireAuth, requireAdmin } from '@/middlewares/auth';
import RequestValidator from '@/middlewares/request-validator';

const router: Router = Router();
const controller = new DamageReportsController();

router.post(
  '/',
  verifyAuthToken,
  requireAuth,
  RequestValidator.validate(CreateDamageReportDto),
  controller.createDamageReport
);

router.get(
  '/',
  verifyAuthToken,
  requireAuth,
  requireAdmin,
  controller.getAllReports
);

router.get(
  '/details/:id',
  verifyAuthToken,
  requireAuth,
  requireAdmin,
  controller.getReportDetails
);

router.get(
  '/vehicle/:id',
  verifyAuthToken,
  requireAuth,
  requireAdmin,
  controller.getReportsByVehicle
);

router.patch(
  '/:id/close',
  verifyAuthToken,
  requireAuth,
  controller.closeDamageReport
);

router.get(
  '/:status',
  verifyAuthToken,
  requireAuth,
  controller.getReportsByStatus
);

export default router;
