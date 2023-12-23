// profileController.ts
import { type Request, type Response, type NextFunction } from 'express';
import { ThirdPartyService } from './third-party.service';
import Api from '@/lib/api';

export class ThirdPartyController extends Api {
  private readonly thirdPartyService = new ThirdPartyService();

  public verifyUserInfo = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const extractedData = await this.thirdPartyService.extractDataFromImage(
        req.user?.id as string
      );

      res.status(201).json({
        message: 'User profile created successfully',
        data: extractedData,
      });
    } catch (error) {
      next(error);
    }
  };

  public verifyUserInfoById = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const extractedData =
        await this.thirdPartyService.extractDataFromImageById(req.params.id);

      res.status(201).json({
        message: 'User profile created successfully',
        data: extractedData,
      });
    } catch (error) {
      next(error);
    }
  };
}
