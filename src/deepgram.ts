import { createClient } from '@deepgram/sdk';
import dotenv from 'dotenv';
dotenv.config();

const { DEEPGRAM_API_KEY } = process.env;

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

export { transcribeUrl };