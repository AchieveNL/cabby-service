import { Router } from 'express';
import multer from 'multer';
import PermitController from './vehicle.controller';
import {
  CreateVehicleDto,
  FilterVehiclesDto,
  UpdateVehicleStatusDto,
} from './vehicle.dto';
import RequestValidator from '@/middlewares/request-validator';
import { requireAdmin, requireAuth, verifyAuthToken } from '@/middlewares/auth';

const router: Router = Router();
const controller = new PermitController();

const upload = multer({
  dest: './data/uploads/',
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

router.post(
  '/create',
  verifyAuthToken,
  requireAuth,
  requireAdmin,
  upload.array('images', 5),
  RequestValidator.validate(CreateVehicleDto),
  controller.createVehicle
);

router.put(
  '/update/:id',
  verifyAuthToken,
  requireAuth,
  requireAdmin,
  upload.array('images', 5),
  RequestValidator.validate(CreateVehicleDto),
  controller.updateVehicle
);

router.get('/', verifyAuthToken, requireAuth, controller.getAllVehicles);

router.get(
  '/status/:status',
  verifyAuthToken,
  requireAuth,
  controller.getVehiclesByStatus
);

router.get(
  '/model/:model',
  verifyAuthToken,
  requireAuth,
  controller.getVehicleByModel
);

router.get(
  '/category/:category',
  verifyAuthToken,
  requireAuth,
  controller.getVehiclesByCategory
);

router.get(
  '/licensePlate/:licensePlate',
  verifyAuthToken,
  requireAuth,
  controller.getVehicleByLicensePlate
);

router.get('/:id', verifyAuthToken, requireAuth, controller.getVehicleById);

router.patch(
  '/status',
  verifyAuthToken,
  requireAuth,
  requireAdmin,
  RequestValidator.validate(UpdateVehicleStatusDto),
  controller.updateStatus
);

router.delete(
  '/:id',
  verifyAuthToken,
  requireAuth,
  requireAdmin,
  controller.deleteVehicle
);

router.get(
  '/filter',
  RequestValidator.validateQuery(FilterVehiclesDto),
  controller.getFilteredVehicles
);

export default router;
