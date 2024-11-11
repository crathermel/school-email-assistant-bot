import dotenv from 'dotenv';
import { processEmails } from './services/emailService.js';
import { startServer } from './server.js';

dotenv.config();

// Start the server for OAuth callbacks
startServer();

// Process emails every 5 minutes
const INTERVAL = 5 * 60 * 1000;
async function run() {
  try {
    await processEmails();
  } catch (error) {
    console.error('Error processing emails:', error);
  }
}

run();
setInterval(run, INTERVAL);