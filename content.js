import { OPENAI_API_KEY } from './env';

// Select the message container and input field
const inputFieldSelector = '#message-box-text-area'; // Adjust based on Fiverr's DOM

const AiIcon = 'https://img.icons8.com/?size=256&id=FBO05Dys9QCg';
const AiLoading = 'https://i.imgur.com/dWYN69j.gif';

async function getLastMessage() {
  const messagesVar = document.querySelectorAll('.message-content');
  const extraDetails = document.querySelector(inputFieldSelector).value;
  const messages = [];
  messagesVar.forEach((message) => {
    messages.push(message.innerText);
  });

  return { messages, extraDetails };
}

function addButton() {
  let confirmButton = document.querySelector('#confirm-suggestion-button');
  const inputField = document.querySelector(inputFieldSelector);
  if (!confirmButton) {
    confirmButton = document.createElement('button');
    confirmButton.id = 'confirm-suggestion-button';

    // Add the refresh icon (SVG)
    confirmButton.innerHTML = `
       <img src="${AiIcon}" alt="Refresh Icon" style="width: 24px; height: 24px;">
      `;

    confirmButton.style.position = 'absolute'; // Adjust styles as needed
    confirmButton.style.right = '10px';
    confirmButton.style.zIndex = '1000';
    confirmButton.style.color = 'white';
    confirmButton.style.border = 'none';
    confirmButton.style.cursor = 'pointer';
    confirmButton.style.borderRadius = '50%'; // Make the button circular
    confirmButton.style.width = '24px';
    confirmButton.style.height = '24px';

    const parent = inputField.parentElement;
    parent.style.position = 'relative'; // Ensure the parent has relative positioning
    parent.appendChild(confirmButton);

    confirmButton.addEventListener('click', async () => {
      const lastMessage = await getLastMessage();
      populateResponse(lastMessage);
    });
  }
}

async function populateResponse(lastMessage) {
  const inputField = document.querySelector(inputFieldSelector);

  if (inputField) {
    // Set the placeholder to show the suggestion
    inputField.value = await generateResponse(lastMessage.messages, lastMessage.extraDetails);

    // Trigger the input event to notify the site
    inputField.dispatchEvent(new Event('input', { bubbles: true }));
  } else {
    console.error('Input field not found.');
  }
}

async function generateResponse(messages, clientMessage = '') {
  let confirmButton = document.querySelector('#confirm-suggestion-button');
  try {
    if (confirmButton) {
      confirmButton.innerHTML = `
       <img src="${AiLoading}" alt="Loading..." style="width: 24px; height: 24px;">
      `;
    }

    const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

    // Format chat messages for OpenAI API
    const formattedMessages = messages.map((msg) => {
      const role = msg.startsWith('Me') ? 'assistant' : 'user';
      const content = msg.split('\n\n').slice(1).join('\n\n').trim();
      return { role, content };
    });

    if (clientMessage) {
      // Add the client's new message, which serves as the main response with context
      formattedMessages.push({
        role: 'assistant',
        content: `reformat this message: "${clientMessage}". Use the context provided to craft a professional and concise reply as a freelancer on Fiverr. Address the client's specific needs, outline the steps or services offered, and encourage further discussion if needed.`,
      });
    } else {
      // Generate a response based on the provided context alone
      formattedMessages.push({
        role: 'assistant',
        content:
          'Generate a response based on the context provided in the previous messages. Respond as a professional freelancer on Fiverr, crafting a concise and polite message that outlines your services, addresses any inferred client needs, and encourages further discussion if appropriate.',
      });
    }

    const requestBody = {
      model: 'gpt-4', // Choose GPT-4 for high-quality responses
      messages: formattedMessages,
      temperature: 0.7, // Balance creativity and professionalism
      max_tokens: 150, // Ensure responses are detailed but concise
    };

    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();

    if (confirmButton) {
      confirmButton.innerHTML = `
       <img src=${AiIcon} alt="Ready" style="width: 24px; height: 24px;">
      `;
    }

    // Extract and return the assistant's message
    if (data.choices && data.choices.length > 0) {
      const assistantResponse = data.choices[0].message.content.trim();
      return `${assistantResponse}`;
    } else {
      return 'Me:\n\nSorry, I could not generate a response.';
    }
  } catch (error) {
    console.error('Error fetching response from OpenAI:', error);
    return 'Me:\n\nSorry, I could not generate a response due to an error.';
  }
}

window.addEventListener('load', () => {
  console.log('Content script loaded');
  setInterval(addButton, 5000);
});
