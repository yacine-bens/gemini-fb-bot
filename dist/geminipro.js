var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
const { GEMINI_PRO_TOKEN } = process.env;
function geminiPro(text) {
    return __awaiter(this, void 0, void 0, function* () {
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
        const response = yield fetch(geminiProUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });
        const json = yield response.json();
        const textResult = json.candidates[0].content.parts[0].text;
        return textResult;
    });
}
function geminiProVision(base64image_1, text_1) {
    return __awaiter(this, arguments, void 0, function* (base64image, text, mime_type = 'image/jpeg') {
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
        const response = yield fetch(geminiProVisionUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(body),
        });
        const json = yield response.json();
        // console.log('JSON:', json);
        const textResult = json.candidates[0].content.parts[0].text;
        return textResult;
    });
}
export { geminiPro, geminiProVision };
