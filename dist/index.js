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
const PORT = process.env.PORT || 10000;
const app = express();
app.use(express.json());
app.get('/', (req, res) => {
    res.send('Hello World');
});
app.post('/geminipro', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { text } = req.body;
    if (!text) {
        return res.status(400).send('text is required');
    }
    try {
        const result = yield geminiPro(text);
        res.send(result);
    }
    catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
}));
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
