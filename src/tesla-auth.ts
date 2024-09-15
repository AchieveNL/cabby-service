import axios from 'axios';
import { Router } from 'express';
import * as Sentry from '@sentry/node';
import prisma from './lib/prisma';
import fetch from 'node-fetch';

const TESLA_CLIENT_ID = process.env.TESLA_CLIENT_ID;
const TESLA_CLIENT_SECRET = process.env.TESLA_CLIENT_SECRET;
const REDIRECT_URI = `https://${
  process.env.NODE_ENV === 'production' ? 'api' : 'api-staging'
}.cabbyrentals.com/tesla/auth/callback`;
const audience = 'https://fleet-api.prd.eu.vn.cloud.tesla.com';

const teslaAuth: Router = Router();

async function sendToDiscordWebhook(data: any) {
  try {
    const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
    if (!webhookUrl) {
      console.error('DISCORD_WEBHOOK_URL is not set');
      return;
    }
    await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: JSON.stringify(data),
      }),
    });
  } catch (error) {
    console.error('Error sending to Discord webhook:', error);
  }
}

export const refreshTeslaApiToken = async (
  teslaApiRefreshToken: string
): Promise<string> => {
  try {
    const refreshResponse = await axios.post(
      'https://auth.tesla.com/oauth2/v3/token',
      {
        grant_type: 'refresh_token',
        client_id: TESLA_CLIENT_ID,
        client_secret: TESLA_CLIENT_SECRET,
        refresh_token: teslaApiRefreshToken,
      }
    );

    const newAccessToken: string = refreshResponse.data.access_token;
    const newRefreshToken: string = refreshResponse.data.refresh_token;
    const expiresAt: number = refreshResponse.data.expires_at;

    await prisma.teslaToken.create({
      data: {
        token: newAccessToken,
        refreshToken: newRefreshToken,
        expiresAt: new Date(expiresAt * 1000),
      },
    });

    return newAccessToken;
  } catch (refreshError) {
    console.error('Error refreshing Tesla API token:', refreshError);
    Sentry.captureException(refreshError);
    throw new Error('Failed to refresh Tesla API token');
  }
};

teslaAuth.get('/partner/token', async (req, res) => {
  try {
    const tokenResponse = await axios.post(
      'https://auth.tesla.com/oauth2/v3/token',
      {
        grant_type: 'client_credentials',
        client_id: TESLA_CLIENT_ID,
        client_secret: TESLA_CLIENT_SECRET,
        audience,
      }
    );

    console.log('Tesla partner API token response:', tokenResponse);

    const partnerApiToken: string = tokenResponse.data.access_token;

    const registerResponse = await axios.post(
      `${audience}/api/1/partner_accounts`,
      {},
      {
        headers: {
          Authorization: `Bearer ${partnerApiToken}`,
        },
      }
    );

    console.log('Tesla app registration response:', registerResponse);

    if (registerResponse.status !== 200) {
      throw new Error('Registration failed');
    }

    res.send({
      message: 'Tesla Partner API token obtained and stored successfully.',
      token: partnerApiToken,
      data: registerResponse.data,
    });
  } catch (error) {
    console.error('Error during Tesla partner token generation:', error);
    res
      .status(500)
      .send(
        'Error during Tesla partner token generation: ' + JSON.stringify(error)
      );
  }
});

teslaAuth.get('/auth', (req, res) => {
  const teslaAuthUrl = `https://auth.tesla.com/oauth2/v3/authorize?client_id=${
    TESLA_CLIENT_ID as string
  }&redirect_uri=${encodeURIComponent(
    REDIRECT_URI
  )}&response_type=code&scope=openid vehicle_cmds offline_access vehicle_device_data`;
  res.redirect(teslaAuthUrl);
});

teslaAuth.get('/auth/callback', async (req, res) => {
  const authorizationCode = req.query.code as string;
  console.log('Authorization code:', authorizationCode);
  if (!authorizationCode) {
    return res.status(400).send('Authorization code is missing.');
  }

  try {
    const tokenResponse = await axios.post(
      'https://auth.tesla.com/oauth2/v3/token',
      {
        grant_type: 'authorization_code',
        client_id: TESLA_CLIENT_ID,
        client_secret: TESLA_CLIENT_SECRET,
        code: authorizationCode,
        redirect_uri: REDIRECT_URI,
        scope: 'openid vehicle_cmds offline_access vehicle_device_data',
        audience: 'https://fleet-api.prd.eu.vn.cloud.tesla.com',
      }
    );

    await sendToDiscordWebhook(tokenResponse.data);

    const {
      access_token: teslaApiToken,
      refresh_token: teslaRefreshToken,
      expires_at: expiresAt,
    } = tokenResponse.data;

    await prisma.teslaToken.create({
      data: {
        token: teslaApiToken,
        refreshToken: teslaRefreshToken,
        expiresAt: new Date(expiresAt * 1000),
      },
    });

    res.send('Tesla API token obtained and stored successfully.');
  } catch (error) {
    console.error('Error during Tesla token exchange:', error);
    Sentry.captureException(error);
    res.status(500).send('Failed to obtain Tesla API token.');
  }
});

export default teslaAuth;
