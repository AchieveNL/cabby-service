import path from 'path';
import { Router } from 'express';
import multer from 'multer';
import Controller from './profile.controller';
import {
  CreateRentalAgreementDto,
  CreateUserProfileDto,
  EditUserProfileDto,
  UpdateExpiryDateDto,
} from './profile.dto';
import RequestValidator from '@/middlewares/request-validator';
import { requireAdmin, requireAuth, verifyAuthToken } from '@/middlewares/auth';

const profile: Router = Router();
const controller = new Controller();

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(
      null,
      file.fieldname +
        '-' +
        Date.now().toString() +
        path.extname(file.originalname)
    );
  },
});

const upload = multer({ storage });

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

profile.get(
  '/current',
  verifyAuthToken,
  requireAuth,
  controller.getCurrentProfile
);

profile.patch(
  '/edit',
  verifyAuthToken,
  requireAuth,
  RequestValidator.validate(EditUserProfileDto),
  controller.editUserProfile
);

profile.post(
  '/rental-agreement',
  upload.single('signature'),
  RequestValidator.validate(CreateRentalAgreementDto),
  controller.createRentalAgreement
);

// Fetch any user's profile by id (Admin only)
profile.get(
  '/:id',
  verifyAuthToken,
  requireAuth,
  requireAdmin,
  controller.getUserProfileById
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
