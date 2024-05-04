import express from 'express';
import { geminiPro } from './geminipro';
const PORT = process.env.PORT || 10000;

const app = express();
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello World');
});

app.post('/geminipro', async (req, res) => {
  const { text } = req.body;
  if (!text) {
    return res.status(400).send('text is required');
  }

  try {
    const result = await geminiPro(text);
    res.send(result);
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal Server Error');
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});