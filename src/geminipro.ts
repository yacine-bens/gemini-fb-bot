import dotenv from 'dotenv';
dotenv.config();

const { GEMINI_PRO_TOKEN } = process.env;

async function geminiPro(text: string) {
    const geminiProUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_PRO_TOKEN}`;
    const body = {
        "contents": [
            {
                "parts": [
                    {
                        "text": text
                    }
                ]
            }
        ]
    };

    const response = await fetch(geminiProUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });

    const json = await response.json();
    const textResult = json.candidates[0].content.parts[0].text;

    return textResult;
}

async function geminiProVision(base64image: string, text: string, mime_type = 'image/jpeg') {
    const geminiProVisionUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro-vision:generateContent?key=${GEMINI_PRO_TOKEN}`;
    const body = {
        "contents": [
            {
                "parts": [
                    { "text": text },
                    {
                        "inline_data": {
                            "mime_type": mime_type,
                            "data": base64image
                        }
                    }
                ]
            }
        ]
    };

    const response = await fetch(geminiProVisionUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
    });

    const json = await response.json();
    // console.log('JSON:', json);
    const textResult = json.candidates[0].content.parts[0].text;

    return textResult;
}

export { geminiPro, geminiProVision };