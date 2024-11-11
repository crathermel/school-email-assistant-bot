import { google } from 'googleapis';
import fs from 'fs/promises';

const SCOPES = [
  'https://www.googleapis.com/auth/gmail.modify',
  'https://www.googleapis.com/auth/calendar.events',
];

let auth = null;

export async function getGoogleAuth() {
  if (auth) return auth;

  const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
  
  auth = new google.auth.OAuth2(
    credentials.client_id,
    credentials.client_secret,
    'http://localhost:3000/oauth2callback'
  );

  try {
    const token = await fs.readFile('token.json', 'utf-8');
    auth.setCredentials(JSON.parse(token));
  } catch (error) {
    const authUrl = auth.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
    });
    console.log('Authorize this app by visiting:', authUrl);
  }

  return auth;
}

export async function authenticateGoogle(code) {
  const { tokens } = await auth.getToken(code);
  auth.setCredentials(tokens);
  await fs.writeFile('token.json', JSON.stringify(tokens));
}