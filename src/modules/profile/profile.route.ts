import { Router } from 'express';
import Controller from './profile.controller';
import {
  CreateUserProfileDto,
  EditUserProfileDto,
  UpdateExpiryDateDto,
} from './profile.dto';
import RequestValidator from '@/middlewares/request-validator';
import { requireAdmin, requireAuth, verifyAuthToken } from '@/middlewares/auth';

const profile: Router = Router();
const controller = new Controller();

profile.post(
  '/create',
  verifyAuthToken,
  requireAuth,
  RequestValidator.validate(CreateUserProfileDto),
  controller.createUserProfile
);

profile.patch(
  '/update-expiry',
  verifyAuthToken,
  requireAuth,
  RequestValidator.validate(UpdateExpiryDateDto),
  controller.updateExpiryDate
);

// Fetch current user's profile
profile.get(
  '/current',
  verifyAuthToken,
  requireAuth,
  controller.getCurrentProfile
);

// Fetch any user's profile by id (Admin only)
profile.get(
  '/:id',
  verifyAuthToken,
  requireAuth,
  requireAdmin,
  controller.getUserProfileById
);

// Edit user's profile
profile.patch(
  '/edit/:id',
  verifyAuthToken,
  requireAuth,
  RequestValidator.validate(EditUserProfileDto),
  controller.editUserProfile
);

profile.patch(
  '/update-images',
  verifyAuthToken,
  requireAuth,
  RequestValidator.validate(UpdateExpiryDateDto),
  controller.updateExpiryDate
);

profile.get('/drivers', verifyAuthToken, requireAuth, controller.getAllDrivers);

profile.patch(
  '/status/:id',
  verifyAuthToken,
  requireAuth,
  controller.updateUserProfileStatus
);

profile.get(
  '/status/:id',
  verifyAuthToken,
  requireAuth,
  controller.getUserProfileByStatus
);

export default profile;
