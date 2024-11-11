import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function sendSMS(message) {
  try {
    await client.messages.create({
      body: message,
      to: process.env.PHONE_NUMBER,
      from: process.env.TWILIO_PHONE_NUMBER,
    });
    console.log('SMS sent successfully');
  } catch (error) {
    console.error('Error sending SMS:', error);
  }
}