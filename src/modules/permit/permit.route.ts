// permit.route.ts
import { Router } from 'express';
import PermitController from './permit.controller';
import { CreatePermitDto, UpdatePermitDto } from './permit.dto';
import RequestValidator from '@/middlewares/request-validator';
import { requireAuth, verifyAuthToken } from '@/middlewares/auth';

const router: Router = Router();
const controller = new PermitController();

router.post(
  '/',
  verifyAuthToken,
  requireAuth,
  RequestValidator.validate(CreatePermitDto),
  controller.createPermit
);

router.patch(
  '/:userId',
  verifyAuthToken,
  requireAuth,
  RequestValidator.validate(UpdatePermitDto),
  controller.updatePermit
);

export default router;
