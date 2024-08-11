import UserMailService from '../notifications/user-mails.service';
import prisma from '@/lib/prisma';

export default class RefundsService {
  readonly userMailService = new UserMailService();

  public getAllRefunds = async () => {
    const refunds = await prisma.refunds.findMany({
      include: {
        userProfile: {
          select: {
            firstName: true,
            fullName: true,
          },
        },
      },
    });
    return refunds;
  };

  public async createRefund(data) {
    const response = await prisma.refunds.create({
      data,
    });

    const userProfile = await prisma.userProfile.findUnique({
      where: { id: data.userProfileId },
      include: {
        user: {
          select: {
            email: true,
          },
        },
      },
    });

    await this.userMailService.refundUser(
      userProfile?.user.email ?? '',
      userProfile?.firstName ?? '',
      data.amount
    );

    return response;
  }
}
