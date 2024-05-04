import express from 'express';
import { geminiPro } from './geminipro.js';
import { createClient } from '@deepgram/sdk';
import dotenv from 'dotenv';
dotenv.config();

const PORT = process.env.PORT || 10000;
const { VERIFICATION_TOKEN, PAGE_ACCESS_TOKEN, DEEPGRAM_API_KEY } = process.env;

const app = express();
app.use(express.json());

app.get('/', (req, res) => {
  console.log('GET /');
  
  res.send('Hello World');
});

app.get('/webhook', async (req, res) => {
  console.log('GET /webhook');
  
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  console.log('mode:', mode);
  console.log('token:', token);
  console.log('challenge:', challenge);
  console.log('VERIFICATION_TOKEN:', VERIFICATION_TOKEN);

  if (mode && token && mode === 'subscribe' && token === VERIFICATION_TOKEN) {
    console.log('Webhook verified');
    return res.send(challenge);
  }
  else {
    return res.status(403).send('Forbidden');
  }
});

app.post('/webhook', async (req, res) => {
  const { body } = req;
  console.log(JSON.stringify(body, null, 2));

  if (body.object !== 'page') return res.status(400).send('Bad Request');

  for (const entry of body.entry) {
    const webhookEvent = entry.messaging[0];
    const senderPsid = webhookEvent.sender.id;

    if (webhookEvent.message) {
      await handleMessage(senderPsid, webhookEvent.message);
    }
  }

  return res.status(200).send('OK');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

const handleMessage = async (sender_psid: string, received_message: any) => {
  const { text, attachments } = received_message;

  if (attachments && attachments[0] && attachments[0].type === 'audio') {
    await callSendAPI(sender_psid, 'Please wait...');

    const { payload } = attachments[0];
    if (payload && payload.url) {
      const { url } = payload;
      const response = await transcribeUrl(url);
      if (!response) return;
      try {
        const { transcript } = response?.results.channels[0].alternatives[0];
        // split large message into smaller messages
        const messages = transcript.match(/.{1,1800}/g)!;
        for (const message of messages) {
          await callSendAPI(sender_psid, message);
        }
      }
      catch (error) {
        console.error(error);
      }
    }
  }
  else if (text) {
    await callSendAPI(sender_psid, 'Please wait...');

    const response = await geminiPro(text);
    // split large message into smaller messages
    const messages = response.match(/.{1,1800}/g);
    for (const message of messages) {
      await callSendAPI(sender_psid, message);
    }
  }
};

const callSendAPI = async (sender_psid: string, response: any) => {
  const request_body = {
    recipient: {
      id: sender_psid
    },
    message: {
      text: response
    }
  };

  await fetch(`https://graph.facebook.com/v15.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(request_body)
  });
};

const transcribeUrl = async (url: string) => {
  const deepgram = createClient(DEEPGRAM_API_KEY as string);

  const { result, error } = await deepgram.listen.prerecorded.transcribeUrl(
    {
      url
    },
    {
      model: "whisper-large",
      detect_language: true,
      smart_format: true,
    }
  );

  if (error) {
    console.error(error);
  }
  else {
    console.log(JSON.stringify(result, null, 2));
  }

  return result;
};