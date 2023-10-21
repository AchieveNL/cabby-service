// permit.controller.ts
import { type Request, type Response, type NextFunction } from 'express';
import { HttpStatusCode } from 'axios';
import mindee from 'mindee';
import ProfileService from '../profile/profile.service';
import { type CreatePermitDto, type UpdatePermitDto } from './permit.dto';
import PermitService from './permit.service';
import Api from '@/lib/api';

export default class PermitController extends Api {
  private readonly permitService = new PermitService();
  private readonly profileService = new ProfileService();

  public createPermit = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const createPermitDto: CreatePermitDto = req.body;

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

      const permit = await this.permitService.createPermit({
        ...createPermitDto,
        userProfileId,
      });

      return this.send(
        res,
        permit,
        HttpStatusCode.Created,
        'Permit updated successfully'
      );
    } catch (error) {
      next(error);
    }
  };

  public updatePermit = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const updatePermitDto: UpdatePermitDto = req.body;
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

      const updatedPermit = await this.permitService.updatePermit(
        userProfileId,
        updatePermitDto
      );
      return this.send(
        res,
        updatedPermit,
        HttpStatusCode.Ok,
        'Permit updated successfully'
      );
    } catch (error) {
      next(error);
    }
  };

  extractTaxiPermit = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const file = req.file;
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

      const customEndpoint = mindeeClient.createEndpoint(
        'taxi_permit',
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

      const extractFieldContent = (fieldName: string) =>
        apiResponse.document.extras?.[fieldName];

      const mindeeData = {
        firstName: extractFieldContent('last_name'),
        lastName: extractFieldContent('first_name'),
        expiryDate: extractFieldContent('expiry_date'), // Adjust if needed, based on the actual data structure
      };

      const { firstName, lastName, expiryDate: inputExpiryDate } = req.body;

      // Date formatting logic, adjust as per your application's requirements
      const formattedExpiryDate = inputExpiryDate
        .replace(/\//g, '-')
        .replace(
          /(\d{2})-(\d{2})-(\d{4})/,
          (_, month, day: string, year: string) => {
            const monthNames = [
              'JAN',
              'FEB',
              'MAR',
              'APR',
              'MAY',
              'JUN',
              'JUL',
              'AUG',
              'SEP',
              'OCT',
              'NOV',
              'DEC',
            ];
            return `${day}-${monthNames[Number(month) - 1]}-${year}`;
          }
        );

      if (
        mindeeData.firstName === firstName &&
        mindeeData.lastName === lastName &&
        mindeeData.expiryDate === formattedExpiryDate
      ) {
        return this.send(
          res,
          apiResponse.document,
          HttpStatusCode.Ok,
          'Taxi Permission is valid'
        );
      } else {
        return this.send(
          res,
          apiResponse.document,
          HttpStatusCode.BadRequest,
          'Taxi Permission is not valid. Please upload valid Taxi Permission'
        );
      }
    } catch (error) {
      next(error);
    }
  };
}
