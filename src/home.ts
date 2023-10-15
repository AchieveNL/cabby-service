import * as path from 'path';
import { Router, type Request, type Response } from 'express';
import { determineCorsOrigin } from './app';

const home: Router = Router();

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

export default home;
