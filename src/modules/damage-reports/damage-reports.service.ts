import { ReportStatus } from './types';
import prisma from '@/lib/prisma';

export default class DamageReportsService {
  public createDamageReport = async (data: any) => {
    console.log(data);
    return await prisma.damageReport.create({
      data,
    });
  };

  public getAllReports = async () => {
    return await prisma.damageReport.findMany();
  };

  public updateReportStatus = async (id: string) => {
    return await prisma.damageReport.update({
      where: { id: parseInt(id) },
      data: { status: ReportStatus.REPAIRED },
    });
  };

  public getReportsByStatus = async (status: ReportStatus) => {
    return await prisma.damageReport.findMany({
      where: { status },
      include: {
        user: {
          select: {
            profile: {
              select: {
                fullName: true,
              },
            },
          },
        },
        vehicle: {
          select: {
            model: true,
            companyName: true,
          },
        },
      },
    });
  };
}
