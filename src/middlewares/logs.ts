import { type NextFunction, type Request, type Response } from 'express';
import prisma from '@/lib/prisma';

export const logsMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userId = req.user?.id || null;
  const { headers, body, query, params, method, url, hostname, ip } = req;
  if (method === 'GET') {
    next();
    return;
  }
  const ipAddress = (req.headers['x-forwarded-for'] ??
    req.socket.remoteAddress) as string;

  const data = { hostname, ip, ipAddress, headers };
  prisma.logs
    .create({
      data: { userId, data, method, url, body, params, query, ip: ipAddress },
    })
    .catch((err) => {
      console.log('Error saving log', err);
    });

  next();
};
