import { google } from 'googleapis';
import { NlpManager } from 'node-nlp';
import { getGoogleAuth } from './authService.js';
import { sendSMS } from './smsService.js';
import { createCalendarEvent } from './calendarService.js';
import { parseISO, isValid } from 'date-fns';

const nlpManager = new NlpManager({ languages: ['en'] });

// Train NLP manager with common patterns
nlpManager.addDocument('en', '%date%', 'date');
nlpManager.addDocument('en', 'due %date%', 'date');
nlpManager.addDocument('en', 'deadline %date%', 'date');
nlpManager.addDocument('en', 'submit by %date%', 'date');
nlpManager.addDocument('en', 'assignment: %task%', 'task');
nlpManager.addDocument('en', 'homework: %task%', 'task');
nlpManager.addDocument('en', 'project: %task%', 'task');

// Train the model
await nlpManager.train();

export async function processEmails() {
  const auth = await getGoogleAuth();
  const gmail = google.gmail({ version: 'v1', auth });

  try {
    // Get unread emails
    const response = await gmail.users.messages.list({
      userId: 'me',
      q: 'in:inbox is:unread label:school',
      maxResults: 10
    });

    if (!response.data.messages) {
      console.log('No new emails to process');
      return;
    }

    for (const message of response.data.messages) {
      const email = await gmail.users.messages.get({
        userId: 'me',
        id: message.id,
        format: 'full'
      });

      const { subject, content } = extractEmailContent(email);
      const { tasks, dates } = await analyzeContent(subject + '\n' + content);

      // Create summary of extracted information
      if (tasks.length > 0) {
        const summary = createSummary(tasks, dates);
        await sendSMS(summary);

        // Create calendar events for tasks with valid dates
        for (let i = 0; i < tasks.length; i++) {
          if (dates[i] && isValid(dates[i])) {
            await createCalendarEvent({
              summary: tasks[i],
              startTime: dates[i]
            });
          }
        }
      }

      // Mark email as read
      await gmail.users.messages.modify({
        userId: 'me',
        id: message.id,
        requestBody: {
          removeLabelIds: ['UNREAD']
        }
      });
    }
  } catch (error) {
    console.error('Error processing emails:', error);
    throw error;
  }
}

function extractEmailContent(email) {
  const headers = email.data.payload.headers;
  const subject = headers.find(h => h.name.toLowerCase() === 'subject')?.value || '';
  let content = '';

  function decodeBody(part) {
    if (part.body.data) {
      return Buffer.from(part.body.data, 'base64').toString();
    }
    return '';
  }

  function extractParts(part) {
    if (part.mimeType === 'text/plain') {
      content += decodeBody(part);
    } else if (part.parts) {
      part.parts.forEach(extractParts);
    }
  }

  if (email.data.payload.parts) {
    email.data.payload.parts.forEach(extractParts);
  } else {
    content = decodeBody(email.data.payload);
  }

  return { subject, content: content.trim() };
}

async function analyzeContent(text) {
  const tasks = [];
  const dates = [];
  const sentences = text.split(/[.!?\n]+/);

  for (const sentence of sentences) {
    if (sentence.trim()) {
      const result = await nlpManager.process('en', sentence);
      
      // Extract tasks
      const taskEntities = result.entities.filter(e => e.entity === 'task');
      if (taskEntities.length > 0) {
        tasks.push(taskEntities[0].utterance);
      } else if (sentence.toLowerCase().includes('assignment') || 
                 sentence.toLowerCase().includes('homework') || 
                 sentence.toLowerCase().includes('project')) {
        tasks.push(sentence.trim());
      }

      // Extract dates
      const dateEntities = result.entities.filter(e => e.entity === 'date');
      if (dateEntities.length > 0) {
        const parsedDate = parseISO(dateEntities[0].resolution.date);
        if (isValid(parsedDate)) {
          dates.push(parsedDate);
        }
      }
    }
  }

  return { tasks, dates };
}

function createSummary(tasks, dates) {
  return `New School Tasks:\n${tasks.map((task, i) => {
    const dateStr = dates[i] && isValid(dates[i]) 
      ? ` (Due: ${dates[i].toLocaleDateString()})`
      : '';
    return `${i + 1}. ${task}${dateStr}`;
  }).join('\n')}`;
}