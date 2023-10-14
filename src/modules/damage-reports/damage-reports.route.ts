import { Router } from 'express';
import DamageReportsController from './damage-reports.controller';
import { CreateDamageReportDto } from './damage-reports.dto';
import { verifyAuthToken, requireAuth } from '@/middlewares/auth';
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

router.get('/', verifyAuthToken, requireAuth, controller.getAllReports);

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
