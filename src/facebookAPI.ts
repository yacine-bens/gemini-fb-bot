import { transcribeUrl } from "./deepgram.js";
import { geminiPro, geminiProVision } from "./geminipro.js";
import dotenv from 'dotenv';
dotenv.config();

const { PAGE_ACCESS_TOKEN } = process.env;

const handleMessage = async (sender_psid: string, received_message: any) => {
    const { text, attachments } = received_message;

    if (attachments && attachments[0]) {
        await callSendAPI(sender_psid, 'Please wait...');
        
        const { payload } = attachments[0];
        if (!payload || payload.url) return;

        switch (attachments[0].type) {
            case 'audio':
                const response = await transcribeUrl(payload.url);
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
                break;
            case 'image':
                const base64image = await getBase64(payload.url);
                const visionResponse = await geminiProVision(base64image, `I can't see the image. Please describe it.`);
                // split large message into smaller messages
                const visionMessages = visionResponse.match(/.{1,1800}/g)!;
                for (const message of visionMessages) {
                    await callSendAPI(sender_psid, message);
                }
                break;
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

const getBase64 = async (url: string) => {
    const response = await fetch(url);
    const buffer = await response.arrayBuffer();
    return Buffer.from(buffer).toString('base64');
};

export { handleMessage };