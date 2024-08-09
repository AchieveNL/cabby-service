import { type Response, type NextFunction, type Request } from 'express';
import { HttpStatusCode } from 'axios';
import _ from 'lodash';
import * as mindee from 'mindee';
import ProfileService from '../profile/profile.service';
import {
  type CreateDriverLicenseDto,
  type UpdateDriverLicenseDto,
} from './licence.dto';
import DriverLicenseService from './licence.service';
import Api from '@/lib/api';
import 'multer';

export default class DriverLicenseController extends Api {
  private readonly licenceService = new DriverLicenseService();
  private readonly profileService = new ProfileService();

  createDriverLicense = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userProfileId = await this.profileService.getUserProfileIdByUserId(
        req.user?.id
      );

      if (!userProfileId) {
        return this.send(
          res,
          null,
          HttpStatusCode.NotFound,
          'Error while creating driver license'
        );
      }

      const dto: CreateDriverLicenseDto = {
        userProfileId,
        ...req.body,
      };

      const driverLicense = await this.licenceService.createDriverLicense(dto);

      return this.send(
        res,
        driverLicense,
        HttpStatusCode.Ok,
        'Driver license created successfully'
      );
    } catch (error) {
      next(error);
    }
  };

  updateDriverLicense = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userProfileId = await this.profileService.getUserProfileIdByUserId(
        req.user?.id
      );

      const driverLicense = await this.licenceService.updateDriverLicense(
        userProfileId,
        req.body as UpdateDriverLicenseDto
      );

      return this.send(
        res,
        driverLicense,
        HttpStatusCode.Ok,
        'Driver license updated successfully'
      );
    } catch (error) {
      next(error);
    }
  };

  extractFrontDrivingLicense = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const file = req.file;
      if (!file) {
        return this.send(res, null, 400, 'No file attached');
      }

      const mindeeClient = new mindee.Client({
        apiKey: process.env.MINDEE_API_KEY,
      });
      const inputSource = mindeeClient.docFromPath(file.path);

      const customEndpoint = mindeeClient.createEndpoint(
        'driving_license_v1',
        'Cabby'
      );

      const apiResponse = await mindeeClient.parse(
        mindee.product.CustomV1,
        inputSource,
        {
          endpoint: customEndpoint,
        }
      );

      if (!apiResponse?.document) return;

      const extractFieldContent = (fieldName) =>
        apiResponse.document.extras?.[fieldName];

      const mindeeData = {
        firstName: extractFieldContent('last_name'),
        lastName: extractFieldContent('first_name'),
        dateOfBirth: extractFieldContent('date_of_birth'),
        expiryDate: extractFieldContent('expiry_date'),
      };

      const { firstName, lastName, dateOfBirth, expiryDate } = req.body;

      if (
        _.isEqual({ firstName, lastName, dateOfBirth, expiryDate }, mindeeData)
      ) {
        return this.send(
          res,
          apiResponse.document,
          HttpStatusCode.Ok,
          'Front driving license is valid'
        );
      } else {
        return this.send(
          res,
          apiResponse.document,
          HttpStatusCode.BadRequest,
          'Front driving license is not valid. Please upload valid license'
        );
      }
    } catch (error) {
      next(error);
    }
  };

  extractBackDrivingLicense = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const file = req.file;
      const profile = await this.profileService.getByUserId(
        req.user?.id as string
      );

      const { bsnNumber } = req.body;

      if (!profile) {
        this.send(res, null, HttpStatusCode.NotFound, 'Not found');
        return;
      }

      if (!file) {
        return this.send(
          res,
          null,
          HttpStatusCode.BadRequest,
          'No file attached'
        );
      }

      const mindeeClient = new mindee.Client({
        apiKey: process.env.MINDEE_API_KEY as string,
      });

      const inputSource = mindeeClient.docFromPath(file.path);

      const customEndpoint = mindeeClient.createEndpoint('driver_bsn', 'Cabby');

      const apiResponse = await mindeeClient.parse(
        mindee.product.CustomV1,
        inputSource,
        {
          endpoint: customEndpoint,
        }
      );

      if (!apiResponse?.document) return;

      const extractFieldContent = (fieldName: string) =>
        apiResponse.document.extras?.[fieldName];

      const mindeeData = {
        bsnNumber: extractFieldContent('bsn'),
      };

      if (bsnNumber === mindeeData.bsnNumber) {
        await this.licenceService.updateDriverLicense(profile.id, {
          bsnNumber,
        } satisfies UpdateDriverLicenseDto);
        return this.send(
          res,
          apiResponse.document,
          HttpStatusCode.Ok,
          'Back driving license is valid'
        );
      } else {
        return this.send(
          res,
          apiResponse.document,
          HttpStatusCode.BadRequest,
          'Back driving license is not valid. Please upload a valid license'
        );
      }
    } catch (error) {
      next(error);
    }
  };
}
