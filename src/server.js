import express from 'express';
import { authenticateGoogle } from './services/authService.js';
import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function startServer() {
  const app = express();
  const port = process.env.PORT || 3000;

  app.use(express.json());
  app.use(express.static(path.join(__dirname, 'public')));

  app.get('/oauth2callback', async (req, res) => {
    try {
      const code = req.query.code;
      await authenticateGoogle(code);
      res.send('Authentication successful! You can close this window.');
    } catch (error) {
      res.status(500).send('Authentication failed: ' + error.message);
    }
  });

  app.post('/api/config/google', async (req, res) => {
    try {
      const { clientId, clientSecret } = req.body;
      const envContent = await fs.readFile('.env', 'utf-8').catch(() => '');
      
      const updatedContent = envContent.replace(
        /GOOGLE_CREDENTIALS=.*$/m,
        `GOOGLE_CREDENTIALS={"client_id": "${clientId}", "client_secret": "${clientSecret}"}`
      ) || `GOOGLE_CREDENTIALS={"client_id": "${clientId}", "client_secret": "${clientSecret}"}`;

      await fs.writeFile('.env', updatedContent);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/config/twilio', async (req, res) => {
    try {
      const { accountSid, authToken, twilioPhone, userPhone } = req.body;
      const envContent = await fs.readFile('.env', 'utf-8').catch(() => '');
      
      const twilioConfig = `
TWILIO_ACCOUNT_SID=${accountSid}
TWILIO_AUTH_TOKEN=${authToken}
TWILIO_PHONE_NUMBER=${twilioPhone}
PHONE_NUMBER=${userPhone}`;

      const updatedContent = envContent.includes('TWILIO_')
        ? envContent.replace(
            /TWILIO_ACCOUNT_SID=.*\nTWILIO_AUTH_TOKEN=.*\nTWILIO_PHONE_NUMBER=.*\nPHONE_NUMBER=.*/m,
            twilioConfig.trim()
          )
        : envContent + twilioConfig;

      await fs.writeFile('.env', updatedContent);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
    console.log('Please open this URL in your browser to configure the application');
  });
}