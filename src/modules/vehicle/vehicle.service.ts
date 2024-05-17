import { Prisma } from '@prisma/client';
import { type VehicleStatus } from './types';
import {
  type FilterVehiclesDto,
  type UpdateVehicleStatusDto,
} from './vehicle.dto';
import prisma from '@/lib/prisma';

export default class VehicleService {
  public createVehicle = async (data) => {
    try {
      const vehicle = await prisma.vehicle.create({
        data,
      });
      return vehicle;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        const errorMessages = this.mapPrismaErrorToMessages(error);
        throw new Error(errorMessages.join('; '));
      } else {
        throw new Error('Failed to create vehicle');
      }
    }
  };

  mapPrismaErrorToMessages(error: Prisma.PrismaClientKnownRequestError) {
    const errorMessages: string[] = [];
    if (error.code === 'P2002' && error.meta) {
      const targets = error.meta.target as string[];
      errorMessages.push(`${targets.join(', ')} already exists.`);
    } else if (error.code === 'P4001') {
      errorMessages.push(error.message);
    } else {
      errorMessages.push('An error occurred while processing your request.');
    }
    return errorMessages;
  }

  public updateVehicle = async (id: string, data) => {
    try {
      const vehicle = await prisma.vehicle.update({
        where: { id },
        data,
      });
      return vehicle;
    } catch (error) {
      throw new Error('Failed to update vehicle');
    }
  };

  public getAllVehicles = async () => {
    try {
      const vehicles = await prisma.vehicle.findMany();
      return vehicles;
    } catch (error) {
      throw new Error('Failed to retrieve vehicles');
    }
  };

  public getVehiclesByStatus = async (status: VehicleStatus) => {
    try {
      const vehicles = await prisma.vehicle.findMany({
        where: { status },
      });
      return vehicles;
    } catch (error) {
      throw new Error('Failed to retrieve vehicles with status ' + status);
    }
  };

  public getVehicleByModel = async (model: string) => {
    try {
      const vehicle = await prisma.vehicle.findMany({
        where: { model },
      });
      return vehicle;
    } catch (error) {
      throw new Error('Failed to retrieve vehicle');
    }
  };

  public getVehiclesByCategory = async (category: string) => {
    try {
      const vehicles = await prisma.vehicle.findMany({
        where: { category },
      });
      return vehicles;
    } catch (error) {
      throw new Error('Failed to retrieve vehicles');
    }
  };

  public getVehicleByLicensePlate = async (licensePlate: string) => {
    try {
      const vehicle = await prisma.vehicle.findUnique({
        where: { licensePlate },
      });
      return vehicle;
    } catch (error) {
      throw new Error('Failed to retrieve vehicle');
    }
  };

  public getVehicleById = async (id: string) => {
    try {
      const vehicle = await prisma.vehicle.findUnique({
        where: { id },
      });
      return vehicle;
    } catch (error) {
      throw new Error('Failed to retrieve vehicle');
    }
  };

  public updateVehicleStatus = async (dto: UpdateVehicleStatusDto) => {
    try {
      const updatedVehicle = await prisma.vehicle.update({
        where: { id: dto.id },
        data: { status: dto.status as VehicleStatus },
      });
      return updatedVehicle;
    } catch (error) {
      throw new Error('Failed to update vehicle status');
    }
  };

  public filterVehicles = async (filter: FilterVehiclesDto) => {
    try {
      const vehicles = await prisma.vehicle.findMany({
        where: { ...filter },
      });
      return vehicles;
    } catch (error) {
      throw new Error('Failed to retrieve vehicles');
    }
  };

  public deleteVehicle = async (id) => {
    try {
      const deletedVehicle = await prisma.vehicle.delete({
        where: { id },
      });
      return deletedVehicle;
    } catch (error) {
      throw new Error('Failed to delete vehicle');
    }
  };

  public saveVehicleRejection = async (data: {
    vehicleId: string;
    reason: string;
  }) => {
    const rejection = await prisma.vehicleRejection.create({
      data,
    });
    return rejection;
  };

  public getAvailableVehicleModels = async () => {
    try {
      const vehicles = await prisma.vehicle.findMany({
        select: {
          companyName: true,
          model: true,
        },
        distinct: ['companyName', 'model'],
      });
      return vehicles;
    } catch (error) {
      throw new Error('Failed to retrieve available vehicle models');
    }
  };

  public getAllAvailableVehicles = async () => {
    try {
      const vehicles = await prisma.vehicle.findMany({
        where: { status: 'ACTIVE' },
        select: {
          id: true,
          logo: true,
          companyName: true,
          model: true,
          rentalDuration: true,
          licensePlate: true,
          category: true,
          manufactureYear: true,
          engineType: true,
          seatingCapacity: true,
          batteryCapacity: true,
          uniqueFeature: true,
          images: true,
          availability: true,
          unavailabilityReason: true,
          currency: true,
          pricePerDay: true,
          status: true,
          vin: false,
          orders: false,
          rejection: false,
          damageReports: false,
        },
      });
      return vehicles;
    } catch (error) {
      throw new Error('Failed to retrieve vehicles');
    }
  };

  public getDeposit = async () => {
    try {
      const deposit = await prisma.settings.findUnique({
        where: { key: 'deposit' },
      });
      return deposit?.value;
    } catch (error) {
      throw new Error('Failed to retrieve deposit');
    }
  };

  public upsertDeposit = async (value: number) => {
    try {
      const deposit = await prisma.settings.upsert({
        where: { key: 'deposit' },
        create: { key: 'deposit', value: value.toString() },
        update: { value: value.toString() },
      });
      return deposit;
    } catch (error) {
      throw new Error('Failed to upsert deposit');
    }
  };
}
