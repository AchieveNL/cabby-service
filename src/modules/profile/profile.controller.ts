import fs from 'fs';
import { HttpStatusCode } from 'axios';
import { type Response, type NextFunction, type Request } from 'express';
import { type userProfile } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import DriverLicenseService from '../licence/licence.service';
import PermitService from '../permit/permit.service';
import ProfileService from './profile.service';

import { type UpdateExpiryDateDto } from './profile.dto';
import { type UserProfileStatus } from './types';
import Api from '@/lib/api';
import { type CustomResponse } from '@/types/common.type';
import 'multer';
import { bucketName, gStorage } from '@/utils/storage';

export default class ProfileController extends Api {
  private readonly userProfileService = new ProfileService();
  private readonly driverLicenseService = new DriverLicenseService();
  private readonly permitService = new PermitService();

  public createUserProfile = async (
    req: Request,
    res: CustomResponse<userProfile>,
    next: NextFunction
  ) => {
    try {
      const userProfile = await this.userProfileService.createUserProfile(
        req.user?.id,
        req.body
      );
      this.send(
        res,
        userProfile,
        HttpStatusCode.Created,
        'User profile created successfully'
      );
    } catch (e) {
      next(e);
    }
  };

  public updateExpiryDate = async (
    req: Request,
    res: CustomResponse<userProfile>,
    next: NextFunction
  ) => {
    try {
      const { driverLicenseExpiry, taxiPermitExpiry } =
        req.body as UpdateExpiryDateDto;
      const user = await this.userProfileService.getByUserId(
        req.user?.id as string
      );

      if (!user) {
        this.send(res, null, HttpStatusCode.NotFound, 'Not found');
        return;
      }

      await this.driverLicenseService.updateExpiryDate(
        user.id,
        driverLicenseExpiry
      );

      await this.permitService.updateExpiryDate(user.id, taxiPermitExpiry);

      return this.send(
        res,
        null,
        HttpStatusCode.Ok,
        'Expiry dates updated successfully'
      );
    } catch (error) {
      next(error);
    }
  };

  public getCurrentProfile = async (req, res, next) => {
    try {
      const userProfile = await this.userProfileService.getByUserId(
        req.user.id
      );
      this.send(
        res,
        userProfile,
        HttpStatusCode.Ok,
        'User profile fetched successfully'
      );
    } catch (e) {
      next(e);
    }
  };

  public getUserProfileById = async (req, res, next) => {
    try {
      const userProfile = await this.userProfileService.getById(req.params.id);
      this.send(
        res,
        userProfile,
        HttpStatusCode.Ok,
        'User profile fetched successfully'
      );
    } catch (e) {
      next(e);
    }
  };

  public editUserProfile = async (req, res, next) => {
    try {
      await this.userProfileService.editUserProfile(req.params.id, req.body);
      this.send(
        res,
        null,
        HttpStatusCode.Ok,
        'User profile updated successfully'
      );
    } catch (e) {
      next(e);
    }
  };

  public updateDriverLicenseOrPermit = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const profile = await this.userProfileService.getByUserId(req.user?.id);
      if (!profile) {
        this.send(res, null, HttpStatusCode.NotFound, 'Not found');
        return;
      }

      const imageKey: string = req.query.imageKey as string;
      const localFilePath = req.file?.path as string;
      const remoteFileName =
        imageKey + 'image-' + (uuidv4() as string) + '.jpg';

      await gStorage.bucket(bucketName).upload(localFilePath, {
        destination: remoteFileName,
      });

      const url: string = `https://storage.googleapis.com/${bucketName}/${remoteFileName}`;
      let response;

      // Define keys and their respective services
      const userKeys = ['signature'];
      const driverLicenseKeys = ['driverLicenseFront', 'driverLicenseBack'];
      const permitKeys = [
        'taxiPermitPicture',
        'KVKDocument',
        'KiwaTaxiVergunning',
      ];

      if (userKeys.includes(imageKey)) {
        response = await this.userProfileService.editUserProfile(profile.id, {
          [imageKey]: url,
        });
      } else if (driverLicenseKeys.includes(imageKey)) {
        response = await this.driverLicenseService.updateDriverLicense(
          profile.id,
          {
            [imageKey]: url,
          }
        );
      } else if (permitKeys.includes(imageKey)) {
        response = await this.permitService.updatePermit(profile.id, {
          [imageKey]: url,
        });
      } else {
        return this.send(
          res,
          null,
          HttpStatusCode.BadRequest,
          'Invalid imageKey parameter'
        );
      }

      if (!response) {
        return this.send(
          res,
          null,
          HttpStatusCode.InternalServerError,
          'Something went wrong while uploading image'
        );
      }

      fs.unlink(localFilePath, (err: any) => {
        if (err) {
          console.error(`Error deleting file: ${localFilePath}`);
        } else {
          console.log(`Successfully deleted file: ${localFilePath}`);
        }
      });

      return this.send(
        res,
        { uploadedImage: url },
        HttpStatusCode.Ok,
        'File Uploaded'
      );
    } catch (error) {
      next(error);
    }
  };

  public getAllDrivers = async (req, res, next) => {
    try {
      const drivers = await this.userProfileService.getAllDrivers();
      this.send(
        res,
        drivers,
        HttpStatusCode.Ok,
        'Drivers fetched successfully'
      );
    } catch (e) {
      next(e);
    }
  };

  public updateUserProfileStatus = async (req, res, next) => {
    try {
      const { status } = req.body;
      const { id } = req.params;
      await this.userProfileService.updateUserProfileStatus(id, status);
      this.send(res, null, HttpStatusCode.Ok, 'Status updated successfully');
    } catch (e) {
      next(e);
    }
  };

  public getUserProfileByStatus = async (req, res, next) => {
    try {
      const status = req.params.status as UserProfileStatus;
      const response =
        await this.userProfileService.getUserProfileByStatus(status);
      this.send(
        res,
        response,
        HttpStatusCode.Ok,
        'Drivers fetched successfully'
      );
    } catch (e) {
      next(e);
    }
  };
}
