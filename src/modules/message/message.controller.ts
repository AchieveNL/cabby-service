import { type Request, type Response, type NextFunction } from 'express';
import { HttpStatusCode } from 'axios';
import MessageService from './message.service';
import Api from '@/lib/api';

export default class MessageController extends Api {
  private readonly messageService = new MessageService();

  public getUserConversations = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const userId: string = req.user?.id; // Assuming user id is attached to the request object after authentication
      const conversations =
        await this.messageService.getUserConversations(userId);

      return this.send(
        res,
        conversations,
        HttpStatusCode.Ok,
        'Conversations fetched successfully'
      );
    } catch (error) {
      next(error);
    }
  };
}
