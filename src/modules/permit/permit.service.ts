import { type UpdatePermitDto } from './permit.dto';
import prisma from '@/lib/prisma';

export default class PermitService {
  public createPermit = async (data) => {
    try {
      const permit = await prisma.permitDetails.create({ data });
      return permit;
    } catch (error) {
      throw new Error('Failed to create permit');
    }
  };

  public updatePermit = async (userProfileId, data: UpdatePermitDto) => {
    try {
      const permit = await prisma.permitDetails.update({
        where: { userProfileId },
        data,
      });
      return permit;
    } catch (error) {
      throw new Error('Failed to update permit');
    }
  };

  async updateExpiryDate(userProfileId: string, taxiPermitExpiry) {
    const permit = await prisma.permitDetails.update({
      where: { userProfileId },
      data: {
        taxiPermitExpiry: new Date(taxiPermitExpiry),
      },
    });
    return permit;
  }
}
