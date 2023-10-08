// permit.route.ts
import { Router } from 'express';
import PermitController from './permit.controller';
import { CreatePermitDto, UpdatePermitDto } from './permit.dto';
import RequestValidator from '@/middlewares/request-validator';

const router: Router = Router();
const controller = new PermitController();

router.post(
  '/',
  RequestValidator.validate(CreatePermitDto),
  controller.createPermit
);

router.patch(
  '/:userId',
  RequestValidator.validate(UpdatePermitDto),
  controller.updatePermit
);

export default router;
