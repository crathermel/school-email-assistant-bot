document.getElementById('googleForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const clientId = document.getElementById('clientId').value;
  const clientSecret = document.getElementById('clientSecret').value;

  try {
    const response = await fetch('/api/config/google', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ clientId, clientSecret }),
    });

    if (response.ok) {
      showMessage('Google configuration saved successfully!', 'success');
    } else {
      showMessage('Failed to save Google configuration', 'error');
    }
  } catch (error) {
    showMessage('Error saving Google configuration', 'error');
  }
});

document.getElementById('twilioForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const accountSid = document.getElementById('accountSid').value;
  const authToken = document.getElementById('authToken').value;
  const twilioPhone = document.getElementById('twilioPhone').value;
  const userPhone = document.getElementById('userPhone').value;

  try {
    const response = await fetch('/api/config/twilio', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ accountSid, authToken, twilioPhone, userPhone }),
    });

    if (response.ok) {
      showMessage('Twilio configuration saved successfully!', 'success');
    } else {
      showMessage('Failed to save Twilio configuration', 'error');
    }
  } catch (error) {
    showMessage('Error saving Twilio configuration', 'error');
  }
});

function showMessage(message, type) {
  const existingMessage = document.querySelector('.success, .error');
  if (existingMessage) {
    existingMessage.remove();
  }

  const messageDiv = document.createElement('div');
  messageDiv.className = type;
  messageDiv.textContent = message;
  
  const form = document.querySelector(`form:has(button:focus)`);
  form.appendChild(messageDiv);
}