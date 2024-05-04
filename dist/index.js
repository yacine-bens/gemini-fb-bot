var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
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
app.get('/webhook', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
}));
app.post('/webhook', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { body } = req;
    console.log(JSON.stringify(body, null, 2));
    if (body.object !== 'page')
        return res.status(400).send('Bad Request');
    for (const entry of body.entry) {
        const webhookEvent = entry.messaging[0];
        const senderPsid = webhookEvent.sender.id;
        if (webhookEvent.message) {
            yield handleMessage(senderPsid, webhookEvent.message);
        }
    }
    return res.status(200).send('OK');
}));
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
const handleMessage = (sender_psid, received_message) => __awaiter(void 0, void 0, void 0, function* () {
    console.log(JSON.stringify(received_message, null, 2));
    const { text, attachments } = received_message;
    if (attachments && attachments[0] && attachments[0].type === 'audio') {
        yield callSendAPI(sender_psid, 'Please wait...');
        const { payload } = attachments[0];
        if (payload && payload.url) {
            const { url } = payload;
            const response = yield transcribeUrl(url);
            if (!response)
                return;
            try {
                const { transcript } = response === null || response === void 0 ? void 0 : response.results.channels[0].alternatives[0];
                // split large message into smaller messages
                const messages = transcript.match(/.{1,1800}/g);
                for (const message of messages) {
                    yield callSendAPI(sender_psid, message);
                }
            }
            catch (error) {
                console.error(error);
            }
        }
    }
    else if (text) {
        yield callSendAPI(sender_psid, 'Please wait...');
        const response = yield geminiPro(text);
        // split large message into smaller messages
        const messages = response.match(/.{1,1800}/g);
        for (const message of messages) {
            yield callSendAPI(sender_psid, message);
        }
    }
});
const callSendAPI = (sender_psid, response) => __awaiter(void 0, void 0, void 0, function* () {
    const request_body = {
        recipient: {
            id: sender_psid
        },
        message: {
            text: response
        }
    };
    yield fetch(`https://graph.facebook.com/v15.0/me/messages?access_token=${PAGE_ACCESS_TOKEN}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(request_body)
    });
});
const transcribeUrl = (url) => __awaiter(void 0, void 0, void 0, function* () {
    const deepgram = createClient(DEEPGRAM_API_KEY);
    const { result, error } = yield deepgram.listen.prerecorded.transcribeUrl({
        url
    }, {
        model: "whisper-large",
        detect_language: true,
        smart_format: true,
    });
    if (error) {
        console.error(error);
    }
    else {
        console.log(JSON.stringify(result, null, 2));
    }
    return result;
});
