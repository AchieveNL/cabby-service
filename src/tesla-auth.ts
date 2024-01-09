import axios from 'axios';
import { Router } from 'express';
import prisma from './lib/prisma';

const TESLA_CLIENT_ID = process.env.TESLA_CLIENT_ID;
const TESLA_CLIENT_SECRET = process.env.TESLA_CLIENT_SECRET;
const REDIRECT_URI = `https://api-staging.cabbyrentals.com/tesla/auth/callback`;

const teslaAuth: Router = Router();

teslaAuth.get('/auth', (req, res) => {
  const teslaAuthUrl = `https://auth.tesla.com/oauth2/v3/authorize?client_id=${
    TESLA_CLIENT_ID as string
  }&redirect_uri=${encodeURIComponent(
    REDIRECT_URI
  )}&response_type=code&scope=openid vehicle_cmds`;
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
        scope: 'openid vehicle_cmds',
      }
    );

    console.log('Tesla API token response:', tokenResponse);

    const teslaApiToken = tokenResponse.data.access_token;
    const refreshToken = tokenResponse.data.refresh_token;

    await prisma.teslaToken.create({
      data: { token: teslaApiToken, refreshToken, authorizationCode },
    });

    res.send('Tesla API token obtained and stored successfully.');
  } catch (error) {
    console.error('Error during Tesla token exchange:', error);
    res.status(500).send('Failed to obtain Tesla API token.');
  }
});

export default teslaAuth;
