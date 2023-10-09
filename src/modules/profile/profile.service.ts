import prisma from '@/lib/prisma';

export default class ProfileService {
  public async createUserProfile(userId, userProfileData) {
    try {
      const userProfile = await prisma.userProfile.create({
        data: {
          ...userProfileData,
          userId,
        },
      });
      return userProfile;
    } catch (error) {
      throw new Error('Error creating user profile');
    }
  }

  public async editUserProfile(id, userProfileData) {
    return await prisma.userProfile.update({
      where: { id },
      data: userProfileData,
    });
  }

  async getById(id: string) {
    return await prisma.userProfile.findUnique({
      where: { id },
    });
  }

  async getByUserId(userId: string) {
    return await prisma.userProfile.findUnique({
      where: { userId },
    });
  }
}
