import express from 'express';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '.env.local' });
dotenv.config();

const app = express();
app.use(express.json());

// API Endpoint for secure server-side Groq AI calls
app.post('/api/ai', async (req, res) => {
  const { prompt, systemInstruction, history } = req.body;
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey || apiKey.trim() === '') {
    console.error('Server error: GROQ_API_KEY is not configured on the server side.');
    return res.status(500).json({ error: 'Server key not configured. Please set GROQ_API_KEY as an environment variable or in .env.local on the server.' });
  }

  const messages: any[] = [];
  if (systemInstruction) {
    messages.push({
      role: 'system',
      content: systemInstruction
    });
  }

  if (history && Array.isArray(history)) {
    history.forEach((h: any) => {
      messages.push({
        role: h.role === 'assistant' ? 'assistant' : 'user',
        content: h.content
      });
    });
  }

  messages.push({
    role: 'user',
    content: prompt
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'llama-3.3-70b-versatile',
        messages,
        temperature: 0.1
      }),
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `Groq API HTTP error ${response.status}`);
    }

    const data = await response.json();
    const replyText = data.choices?.[0]?.message?.content || '';

    res.json({ text: replyText });
  } catch (err: any) {
    clearTimeout(timeoutId);
    console.error('Groq API call on server failed:', err);
    if (err.name === 'AbortError') {
      res.status(500).json({ error: 'Request timed out. Groq API call took longer than 15 seconds.' });
    } else {
      res.status(500).json({ error: err.message || 'Error occurred while contacting Groq AI.' });
    }
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
