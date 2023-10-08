import { Router } from 'express';
import Controller from './licence.controller';
import { CreateDriverLicenseDto, UpdateDriverLicenseDto } from './licence.dto';
import RequestValidator from '@/middlewares/request-validator';
import { requireAuth } from '@/middlewares/auth';

const router: Router = Router();
const controller = new Controller();

// Endpoint to create a driver license
router.post(
  '/',
  requireAuth,
  RequestValidator.validate(CreateDriverLicenseDto),
  controller.createDriverLicense
);

// Endpoint to update a driver license
router.patch(
  '/:id',
  requireAuth,
  RequestValidator.validate(UpdateDriverLicenseDto),
  controller.updateDriverLicense
);

export default router;
