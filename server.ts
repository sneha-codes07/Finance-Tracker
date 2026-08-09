import express from 'express';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import path from 'path';

dotenv.config({ path: '.env.local' });
dotenv.config();

const app = express();
app.use(express.json());

// API Endpoint for secure server-side Gemini AI calls
app.post('/api/ai', async (req, res) => {
  const { prompt, systemInstruction, history } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey.trim() === '') {
    console.error('Server error: GEMINI_API_KEY is not configured on the server side.');
    return res.status(500).json({ error: 'Server key not configured. Please set GEMINI_API_KEY as an environment variable or in .env.local on the server.' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    
    // Map history to the Google GenAI SDK parts format
    const contents = history ? history.map((h: any) => ({
      role: h.role,
      parts: [{ text: h.content }]
    })) : [];

    contents.push({
      role: 'user',
      parts: [{ text: prompt }]
    });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents,
      config: {
        systemInstruction
      }
    });

    res.json({ text: response.text || '' });
  } catch (err: any) {
    console.error('Gemini API call on server failed:', err);
    res.status(500).json({ error: err.message || 'Error occurred while contacting Gemini AI.' });
  }
});

const isProd = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT || (isProd ? 3000 : 3001);

if (isProd) {
  // Serve static client bundle from dist/ folder
  app.use(express.static('dist'));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve('dist/index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running in ${isProd ? 'production' : 'development'} mode on port ${PORT}`);
});
