import { Router } from 'express';
import multer from 'multer';
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

const upload = multer({
  dest: './data/uploads/', // Change 'uploads/' to your desired upload directory
  limits: {
    fileSize: 10 * 1024 * 1024, // Set your desired file size limit in bytes (10MB in this case)
  },
});

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
  upload.single('file'),
  RequestValidator.validate(UpdateExpiryDateDto),
  controller.updateExpiryDate
);

export default profile;
