import express from 'express';
import { handleMessage } from './facebookAPI.js';
import dotenv from 'dotenv';
dotenv.config();

const PORT = process.env.PORT || 10000;
const { VERIFICATION_TOKEN } = process.env;

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
      // Your endpoint should return a 200 OK response within 5 or less seconds
      // https://developers.facebook.com/docs/messenger-platform/webhooks
      res.status(200).send('EVENT_RECEIVED');
      // Continue processing the message
      await handleMessage(senderPsid, webhookEvent.message);
    }
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});