import { type Request, type Response, type NextFunction } from 'express';
import { HttpStatusCode } from 'axios';
import FileService from './file.service';
import Api from '@/lib/api';

export default class FileController extends Api {
  private readonly fileService = new FileService();

  public upload = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { file } = req;
      const fileType = req.body.type;

      if (!file?.buffer) {
        this.send(res, null, HttpStatusCode.BadRequest, 'File not provided');
        return;
      }

      const url = await this.fileService.uploadFile(
        file.buffer,
        file.originalname,
        file.mimetype,
        fileType
      );
      this.send(res, url, HttpStatusCode.Created, 'File uploaded successfully');
    } catch (error) {
      next(error);
    }
  };

  public delete = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filePath = req.query.filePath as string;

      await this.fileService.deleteFile(filePath);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };
}
