import axios from 'axios';
import { Router } from 'express';
import prisma from './lib/prisma';

const TESLA_CLIENT_ID = process.env.TESLA_CLIENT_ID;
const TESLA_CLIENT_SECRET = process.env.TESLA_CLIENT_SECRET;
const REDIRECT_URI = `https://api-staging.cabbyrentals.com/tesla/auth/callback`;
const audience = 'https://fleet-api.prd.eu.vn.cloud.tesla.com';

const teslaAuth: Router = Router();

export const refreshTeslaApiToken = async (
  currentToken: string,
  teslaApiRefreshToken: string
) => {
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

    console.log('Tesla API token refresh response:', refreshResponse.data);

    const newAccessToken = refreshResponse.data.access_token;
    // Update the stored tokens with the new access token and optionally the new refresh token

    await prisma.teslaToken.updateMany({
      where: { token: currentToken },
      data: {
        token: newAccessToken,
        refreshToken: teslaApiRefreshToken,
      },
    });

    return newAccessToken;

    // Retry the unlock request with the new access token
    // Make sure to update the request headers with the new token
  } catch (refreshError) {
    console.error('Error refreshing Tesla API token:', refreshError);
    // Handle refresh token error (e.g., also expired, network issues, etc.)
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
  )}&response_type=code&scope=openid vehicle_cmds offline_access`;
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
        audience: 'https://fleet-api.prd.eu.vn.cloud.tesla.com',
      }
    );

    const teslaApiToken = tokenResponse.data.access_token;
    const teslaRefreshToken = tokenResponse.data.refresh_token;

    console.log('tokenResponse.data', tokenResponse.data);

    await prisma.teslaToken.deleteMany();

    await prisma.teslaToken.create({
      data: {
        token: teslaApiToken,
        authorizationCode,
        refreshToken: teslaRefreshToken,
      },
    });

    res.send('Tesla API token obtained and stored successfully.');
  } catch (error) {
    console.error('Error during Tesla token exchange:', error);
    res.status(500).send('Failed to obtain Tesla API token.');
  }
});

export default teslaAuth;
