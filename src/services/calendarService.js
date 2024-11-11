import { google } from 'googleapis';
import { getGoogleAuth } from './authService.js';

export async function createCalendarEvent({ summary, startTime }) {
  const auth = await getGoogleAuth();
  const calendar = google.calendar({ version: 'v3', auth });

  const event = {
    summary,
    start: {
      dateTime: startTime.toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    end: {
      dateTime: new Date(startTime.getTime() + 60 * 60 * 1000).toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 24 * 60 }, // 1 day before
        { method: 'popup', minutes: 60 }, // 1 hour before
      ],
    },
  };

  try {
    await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
    });
    console.log('Calendar event created successfully');
  } catch (error) {
    console.error('Error creating calendar event:', error);
  }
}