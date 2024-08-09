import { type Request, type Response, type NextFunction } from 'express';
import axios, { HttpStatusCode } from 'axios';
import VehicleService from './vehicle.service';
import {
  type FilterVehiclesDto,
  type UpdateVehicleStatusDto,
} from './vehicle.dto';
import { type VehicleStatus } from './types';
import Api from '@/lib/api';
import { bucketName, gStorage } from '@/utils/storage';

export default class VehicleController extends Api {
  private readonly vehicleService = new VehicleService();

  public createVehicle = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const vehicleData = req.body;

      const vehicle = await this.vehicleService.createVehicle(vehicleData);

      return this.send(
        res,
        vehicle,
        HttpStatusCode.Created,
        'Vehicle created successfully'
      );
    } catch (error) {
      next(error);
    }
  };

  public updateVehicle = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;
      const vehicleData = req.body;
      console.log(vehicleData);
      const images: Express.Multer.File[] = req.files as Express.Multer.File[];

      if (images) {
        const imageUrls: string[] = [];

        for (const image of images) {
          const remoteFileName = `vehicle-${Date.now()}`;
          await gStorage.bucket(bucketName).upload(image.path, {
            destination: remoteFileName,
          });
          const imageUrl = `https://storage.googleapis.com/${bucketName}/${remoteFileName}`;
          imageUrls.push(imageUrl);
        }

        vehicleData.images = imageUrls; // you may want to concatenate with existing images if applicable
      }

      const vehicle = await this.vehicleService.updateVehicle(id, vehicleData);

      return this.send(
        res,
        vehicle,
        HttpStatusCode.Ok,
        'Vehicle updated successfully'
      );
    } catch (error) {
      next(error);
    }
  };

  public getAllVehicles = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const vehicles = await this.vehicleService.getAllVehicles();
      return this.send(
        res,
        vehicles,
        HttpStatusCode.Ok,
        'Vehicles retrieved successfully'
      );
    } catch (error) {
      next(error);
    }
  };

  public getAvailableVehicles = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const vehicles = await this.vehicleService.getAllAvailableVehicles();
      return this.send(
        res,
        vehicles,
        HttpStatusCode.Ok,
        'Vehicles retrieved successfully'
      );
    } catch (error) {
      next(error);
    }
  };

  public getVehiclesByStatus = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const status = req.params.status as VehicleStatus;
      const vehicles = await this.vehicleService.getVehiclesByStatus(status);
      return this.send(
        res,
        vehicles,
        HttpStatusCode.Ok,
        `Vehicles with status ${status} retrieved successfully`
      );
    } catch (error) {
      next(error);
    }
  };

  public getVehicleByModel = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { model } = req.params;
      const vehicle = await this.vehicleService.getVehicleByModel(model);
      return this.send(
        res,
        vehicle,
        HttpStatusCode.Ok,
        `Vehicle model ${model} retrieved successfully`
      );
    } catch (error) {
      next(error);
    }
  };

  public getVehiclesByCategory = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { category } = req.params;
      const vehicles =
        await this.vehicleService.getVehiclesByCategory(category);
      return this.send(
        res,
        vehicles,
        HttpStatusCode.Ok,
        `Vehicles in category ${category} retrieved successfully`
      );
    } catch (error) {
      next(error);
    }
  };

  public getVehicleByLicensePlate = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { licensePlate } = req.params;
      const vehicle =
        await this.vehicleService.getVehicleByLicensePlate(licensePlate);
      return this.send(
        res,
        vehicle,
        HttpStatusCode.Ok,
        `Vehicle with license plate ${licensePlate} retrieved successfully`
      );
    } catch (error) {
      next(error);
    }
  };

  public getVehicleByLicensePlateFromOpenData = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { licensePlate } = req.params;
      const response = await axios.get(
        `https://opendata.rdw.nl/resource/m9d7-ebf2.json?kenteken=${licensePlate}`
      );
      return this.send(
        res,
        response.data, // Only send the data property
        HttpStatusCode.Ok,
        `Vehicle with license plate ${licensePlate} retrieved successfully`
      );
    } catch (error) {
      next(error);
    }
  };

  public getVehicleById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;
      const vehicle = await this.vehicleService.getVehicleById(id);
      return this.send(
        res,
        vehicle,
        HttpStatusCode.Ok,
        `Vehicle with ID ${id} retrieved successfully`
      );
    } catch (error) {
      next(error);
    }
  };

  public updateStatus = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const dto: UpdateVehicleStatusDto = req.body;
      const updatedVehicle = await this.vehicleService.updateVehicleStatus(dto);
      return this.send(
        res,
        updatedVehicle,
        HttpStatusCode.Ok,
        'Vehicle status updated successfully'
      );
    } catch (error) {
      next(error);
    }
  };

  public getFilteredVehicles = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const filter: FilterVehiclesDto = req.query;
      const vehicles = await this.vehicleService.filterVehicles(filter);
      return this.send(
        res,
        vehicles,
        HttpStatusCode.Ok,
        'Vehicles retrieved successfully'
      );
    } catch (error) {
      next(error);
    }
  };

  public deleteVehicle = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params; // assuming that id is sent as path parameter
      const deletedVehicle = await this.vehicleService.deleteVehicle(id);
      return this.send(
        res,
        deletedVehicle,
        HttpStatusCode.Ok,
        'Vehicle deleted successfully'
      );
    } catch (error) {
      next(error);
    }
  };

  public saveVehicleRejection = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { vehicleId, reason } = req.body;

      const rejectionData = {
        vehicleId,
        reason,
      };

      const rejectionResponse =
        await this.vehicleService.saveVehicleRejection(rejectionData);

      return this.send(
        res,
        rejectionResponse,
        HttpStatusCode.Created,
        'Vehicle rejection saved successfully'
      );
    } catch (error) {
      next(error);
    }
  };

  public getAvailableVehicleModels = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const availableVehicles =
        await this.vehicleService.getAvailableVehicleModels();
      return this.send(
        res,
        availableVehicles,
        HttpStatusCode.Ok,
        'Available vehicle models retrieved successfully'
      );
    } catch (error) {
      next(error);
    }
  };

  public getDeposit = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const deposit = await this.vehicleService.getDeposit();
      return this.send(
        res,
        deposit,
        HttpStatusCode.Ok,
        'Deposit retrieved successfully'
      );
    } catch (error) {
      next(error);
    }
  };

  public upsertDeposit = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { value } = req.body;
      const availableVehicles = await this.vehicleService.upsertDeposit(value);
      return this.send(
        res,
        availableVehicles,
        HttpStatusCode.Ok,
        'Deposit upserted successfully'
      );
    } catch (error) {
      next(error);
    }
  };

  public getLastVehicleDetails = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const details = await this.vehicleService.getLastVehicleDetails();
      return this.send(res, details, HttpStatusCode.Ok, 'sucess');
    } catch (error) {
      next(error);
    }
  };
}
