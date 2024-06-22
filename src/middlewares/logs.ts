import { type NextFunction, type Request, type Response } from 'express';
import prisma from '@/lib/prisma';

export const logsMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userId = req.user?.id || null;
  const { headers, body, query, params, method, url, hostname, ip } = req;

  const data = { hostname, ip, headers };
  prisma.logs
    .create({
      data: { userId, data, method, url, body, params, query },
    })
    .catch((err) => {
      console.log('Error saving log', err);
    });
};
