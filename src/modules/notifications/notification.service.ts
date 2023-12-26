import axios from 'axios';
import { google } from 'googleapis';
import prisma from '@/lib/prisma';

async function getAccessToken() {
  const SCOPES = ['https://www.googleapis.com/auth/firebase.messaging'];

  // Decode the Base64 encoded JSON
  const serviceAccountBase64 = process.env
    .FIREBASE_SERVICE_ACCOUNT_BASE64 as string;
  const serviceAccountJson = Buffer.from(
    serviceAccountBase64,
    'base64'
  ).toString('ascii');
  const serviceAccount = JSON.parse(serviceAccountJson);

  const jwtClient = new google.auth.JWT(
    serviceAccount.client_email,
    undefined,
    serviceAccount.private_key,
    SCOPES
  );

  const tokens = await jwtClient.authorize();

  return tokens.access_token as string;
}

export class NotificationService {
  private readonly fcmUrl =
    'https://fcm.googleapis.com/v1/projects/cabby-60c8c/messages:send';

  private readonly serverKey = process.env.FIREBASE_KEY as string;

  async sendNotificationToUser(
    userId: string,
    title: string,
    body: string,
    metadata: string
  ): Promise<void> {
    const userToken = await prisma.userTokens.findUnique({
      where: { userId },
    });

    if (!userToken) {
      throw new Error('User token not found');
    }

    const message = {
      message: {
        token: userToken.token,
        data: JSON.parse(metadata),
        notification: {
          title,
          body,
        },
      },
    };

    const accessToken = await getAccessToken();
    const headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    };

    await axios.post(this.fcmUrl, message, { headers });
  }
}
