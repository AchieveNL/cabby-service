import { type CreatePermitDto, type UpdatePermitDto } from './permit.dto';
import prisma from '@/lib/prisma';

export default class PermitService {
  public createPermit = async (
    data: CreatePermitDto & { userProfileId: string }
  ) => {
    const permit = await prisma.permitDetails.create({
      data: { ...data, kvkNumber: Number(data.kvkNumber) },
    });
    return permit;
  };

  public updatePermit = async (userProfileId, data: UpdatePermitDto) => {
    const permit = await prisma.permitDetails.update({
      where: { userProfileId },
      data: { ...data, kvkNumber: Number(data.kvkNumber) },
    });
    return permit;
  };

  async updateExpiryDate(userProfileId: string, taxiPermitExpiry) {
    const permit = await prisma.permitDetails.update({
      where: { userProfileId },
      data: {
        taxiPermitExpiry,
      },
    });
    return permit;
  }
}
