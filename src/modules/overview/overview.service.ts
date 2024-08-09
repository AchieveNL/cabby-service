import prisma from '@/lib/prisma';

export default class OverviewService {
  public getOverview = async () => {
    const driversTotal = await prisma.userProfile.count({
      where: { status: { in: ['ACTIVE', 'APPROVED'] } },
    });
    const vehiclesTotal = await prisma.vehicle.count();
    const ordersTotal = await prisma.order.count();
    const ordersRejectionsTotal = await prisma.orderRejection.count();

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const usersNew = await prisma.user.count({
      where: {
        createdAt: {
          gte: oneWeekAgo,
        },
      },
    });

    const ordersNew = await prisma.order.count({
      where: {
        createdAt: {
          gte: oneWeekAgo,
        },
      },
    });

    // Pending Orders count
    const pendingOrders = await prisma.order.count({
      where: {
        status: 'PENDING',
      },
    });

    // Pending Drivers count
    const pendingDrivers = await prisma.userProfile.count({
      where: {
        status: 'PENDING',
      },
    });

    return {
      totals: {
        drivers: driversTotal,
        vehicles: vehiclesTotal,
        orders: ordersTotal,
        ordersRejection: ordersRejectionsTotal,
        pendingOrders,
        pendingDrivers,
      },
      newThisWeek: {
        drivers: usersNew,
        orders: ordersNew,
      },
    };
  };

  public getPendingDetails = async () => {
    try {
      // Retrieve important details of pending drivers
      const pendingDrivers = await prisma.userProfile.findMany({
        where: {
          status: 'PENDING',
        },
        select: {
          id: true,
          firstName: true,
          user: {
            select: {
              email: true,
            },
          },
        },
      });

      // Retrieve important details of pending orders
      const pendingOrders = await prisma.order.findMany({
        where: {
          status: 'PENDING',
        },
        select: {
          id: true,
          vehicleId: true,
          totalAmount: true,
          rentalStartDate: true,
          rentalEndDate: true,
        },
      });

      return {
        pendingDrivers,
        pendingOrders,
      };
    } catch (error) {
      throw new Error('Failed to fetch pending details');
    }
  };
}
