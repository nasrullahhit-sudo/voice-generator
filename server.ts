import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '10mb' }));

  const apiKey = process.env.GEMINI_API_KEY;
  const ai = new GoogleGenAI({
    apiKey: apiKey || '',
    httpOptions: {
      apiVersion: 'v1beta',
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({
      status: 'ok',
      hasApiKey: Boolean(apiKey),
      timestamp: new Date().toISOString(),
    });
  });

  // TTS Generation Endpoint with gemini-3.8-flash-tts
  app.post('/api/tts/generate', async (req, res) => {
    try {
      const { text, voiceName = 'Fenrir', style } = req.body;

      if (!text || typeof text !== 'string' || text.trim().length === 0) {
        return res.status(400).json({ error: 'Text prompt is required for TTS generation.' });
      }

      if (!apiKey) {
        return res.status(500).json({
          error: 'GEMINI_API_KEY is not configured on the server. Please attach an API key in the Secrets panel.',
        });
      }

      const narrationStyle = style || 'Solemn, deeply respectful, slow-paced, cinematic Bengali documentary narrator with dignified reverent cadence';

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash-tts',
        contents: text.trim(),
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: voiceName || 'Fenrir',
              },
            },
          },
        },
      });

      const candidatePart = response.candidates?.[0]?.content?.parts?.[0];
      const base64Audio = candidatePart?.inlineData?.data;

      if (!base64Audio) {
        console.error('TTS generation did not return inlineData audio:', JSON.stringify(response, null, 2));
        return res.status(502).json({
          error: 'Model did not return audio data. Please try again with a shorter phrase or different voice persona.',
        });
      }

      return res.json({
        success: true,
        mimeType: 'audio/wav',
        audioBase64: base64Audio,
        voiceUsed: voiceName,
      });
    } catch (err: any) {
      console.error('Error generating TTS:', err);
      return res.status(500).json({
        error: err?.message || 'Failed to generate voice audio with gemini-3.8-flash-tts.',
      });
    }
  });

  // Episode Generation Endpoint with gemini-3.8-flash
  app.post('/api/episodes/generate', async (req, res) => {
    try {
      const { prophetName = 'হযরত ইদরিস (আ.)', episodeNumber = 2, customInstructions = '' } = req.body;

      if (!apiKey) {
        return res.status(500).json({
          error: 'GEMINI_API_KEY is not configured on the server. Please attach an API key in the Secrets panel.',
        });
      }

      const prompt = `Write a cinematic 1-minute 20-second (80 seconds total) Islamic documentary video script in Bengali for the prophetic history series.
Target Prophet / Topic: ${prophetName}
Episode Number: ${episodeNumber}
Tone: গভীর, ভাবগম্ভীর ও সিনেম্যাটিক (Deep, solemn and cinematic)
BGM: মৃদু ও রহস্যময় অ্যাম্বিয়েন্ট সুর, যা ধীরে ধীরে মহিমান্বিত রূপ নেয়
${customInstructions ? `Additional Instructions: ${customInstructions}` : ''}

Structure requirement: Exactly 5 chronological scenes matching the 1m 20s timeline:
1. [00:00 – 00:15] আকর্ষণীয় সূচনা (হুক / Hook)
2. [00:15 – 00:35] নবুওয়াত, পরিচয় বা বিশিষ্ট অবদান (Prophethood / Key significance)
3. [00:35 – 00:55] প্রধান ঘটনা, সাধনা বা জাতির প্রতি বার্তা (Key trial, calling, or teachings)
4. [00:55 – 01:10] তাওহীদের দাওয়াত ও শিক্ষা (Message of Tawhid & lasting lessons)
5. [01:10 – 01:20] আউটরো ও পরবর্তী পর্বের টিজার (Outro teasing next prophet in the series)

Ensure high-quality, authentic, reverent Bengali language.`;

      let response: any = null;
      let lastErr: any = null;

      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          response = await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: prompt,
            config: {
              systemInstruction: 'You are an acclaimed Islamic history documentarian and scriptwriter specializing in authentic Quranic narratives (কাসাসুল আম্বিয়া) in dignified Bengali. Respond with valid JSON matching the requested fields.',
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING, description: 'Title of the episode in Bengali' },
                  prophetName: { type: Type.STRING, description: 'Name of the Prophet with honorific' },
                  episodeNumber: { type: Type.INTEGER },
                  duration: { type: Type.STRING, description: 'Duration label e.g. ১ মিনিট ২০ সেকেন্ড' },
                  durationSeconds: { type: Type.INTEGER, description: 'Total seconds e.g. 80' },
                  tone: { type: Type.STRING, description: 'Tone in Bengali' },
                  bgmDescription: { type: Type.STRING, description: 'BGM notes in Bengali' },
                  outroTeaser: { type: Type.STRING, description: 'Text for teasing next episode' },
                  scenes: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.STRING },
                        startSec: { type: Type.INTEGER },
                        endSec: { type: Type.INTEGER },
                        timestampLabel: { type: Type.STRING, description: 'e.g. 00:00 – 00:15' },
                        title: { type: Type.STRING, description: 'Scene title in Bengali' },
                        visualPrompt: { type: Type.STRING, description: 'Visual direction and camera cues in Bengali' },
                        voiceoverText: { type: Type.STRING, description: 'Bengali voiceover narration text' },
                      },
                      required: ['id', 'startSec', 'endSec', 'timestampLabel', 'title', 'visualPrompt', 'voiceoverText'],
                    },
                  },
                },
                required: ['title', 'prophetName', 'episodeNumber', 'duration', 'durationSeconds', 'tone', 'bgmDescription', 'scenes'],
              },
            },
          });
          if (response?.text) break;
        } catch (e: any) {
          lastErr = e;
          console.warn(`Attempt ${attempt} failed:`, e?.message);
          if (attempt < 3) {
            await new Promise((resolve) => setTimeout(resolve, 1500 * attempt));
          }
        }
      }

      if (!response?.text) {
        throw lastErr || new Error('Failed to generate episode after retries.');
      }

      const parsed = JSON.parse(response.text || '{}');
      return res.json({ success: true, episode: parsed });
    } catch (err: any) {
      console.error('Error generating episode script:', err);
      return res.status(500).json({
        error: err?.message || 'Failed to generate episode script with gemini-3.8-flash.',
      });
    }
  });

  // Vite middleware in dev or static serving in prod
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Prophet Stories Script & Voice Studio server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
