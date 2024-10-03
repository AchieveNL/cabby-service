import { type NextFunction, type Request, type Response } from 'express';
import prisma from '@/lib/prisma';

export const logsMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const userId = req.user?.id || null;
  const { method, url } = req;

  if (method === 'GET') {
    return next();
  }

  const ipAddress =
    (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() ||
    req.socket.remoteAddress ||
    null;

  const sanitizedBody = { ...req.body };
  delete sanitizedBody.password;

  const logData = {
    userId,
    method,
    url,
    ipAddress,
    body: sanitizedBody,
    params: req.params,
    query: req.query,
  };

  try {
    await prisma.logs.create({
      data: {
        method: logData.method,
        url: logData.url,
        ip: logData.ipAddress,
        body: logData.body,
        params: logData.params,
        query: logData.query,
        data: logData,
        userId: logData.userId,
      },
    });
  } catch (err) {
    console.log(err);
    next();
  }

  next();
};
