import { Router } from 'express';
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

router.post(
  '/create',
  verifyAuthToken,
  requireAuth,
  requireAdmin,
  RequestValidator.validate(CreateVehicleDto),
  controller.createVehicle
);

router.get(
  '/licensePlate/opendata/:licensePlate',
  verifyAuthToken,
  requireAuth,
  controller.getVehicleByLicensePlateFromOpenData
);

router.put(
  '/update/:id',
  verifyAuthToken,
  requireAuth,
  requireAdmin,
  RequestValidator.validate(CreateVehicleDto),
  controller.updateVehicle
);

router.get(
  '/available-models',
  verifyAuthToken,
  requireAuth,
  controller.getAvailableVehicleModels
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

router.post(
  '/rejection',
  verifyAuthToken,
  requireAuth,
  requireAdmin,
  controller.saveVehicleRejection
);

export default router;
