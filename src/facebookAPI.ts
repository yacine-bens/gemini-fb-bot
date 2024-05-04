import { transcribeUrl } from "./deepgram.js";
import { geminiPro } from "./geminipro.js";
import dotenv from 'dotenv';
dotenv.config();

const { PAGE_ACCESS_TOKEN } = process.env;

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

export { handleMessage };