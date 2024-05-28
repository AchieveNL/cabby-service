import * as path from 'path';
import express, { Router, type Request, type Response } from 'express';
import { determineCorsOrigin } from './app';
import { netherlandsTimeNow } from './utils/date';

const home: Router = Router();

home.get('/test', (_req: Request, res: Response) => {
  try {
    const value = netherlandsTimeNow();
    console.log(value);
    res.send({ value });
  } catch (err) {
    res.status(500).send({
      success: false,
      message: err.toString(),
    });
  }
});

home.get('/', (_req: Request, res: Response) => {
  try {
    res.sendFile(path.join(__dirname, '../public/home.html'));
  } catch (err) {
    res.status(500).send({
      success: false,
      message: err.toString(),
    });
  }
});

home.get('/origin', (_req: Request, res: Response) => {
  try {
    res.status(200).json(determineCorsOrigin());
  } catch (err) {
    res.status(500).send({
      success: false,
      message: err.toString(),
    });
  }
});

home.use('/assets', express.static('../public/assets'));

home.get(
  '/.well-known/appspecific/com.tesla.3p.public-key.pem',
  (_req: Request, res: Response) => {
    try {
      res.sendFile(path.join(__dirname, '../public/assets/ec_public.pem'));
    } catch (err) {
      res.status(500).send({
        success: false,
        message: err.toString(),
      });
    }
  }
);

export default home;
