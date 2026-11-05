import express from 'express';
import http from 'http';
import {GoogleGenAI, ThinkingLevel} from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import {fileURLToPath} from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);

app.use(express.json());

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY;
let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// API Route: AI English Verb Tutor with Thinking Mode (gemini-4-argon, ThinkingLevel.HIGH)
app.post('/api/ai/ask', async (req, res) => {
  try {
    if (!ai) {
      return res.status(503).json({
        error: 'API_KEY_NOT_CONFIGURED',
        message: 'La clave de API de Gemini no está configurada en los Secretos.',
      });
    }

    const {prompt, verbContext} = req.body;
    if (!prompt) {
      return res.status(400).json({error: 'Prompt is required'});
    }

    const systemInstruction = `Eres "VerboProfesor", un tutor lingüista experto y apasionado en la enseñanza de los verbos irregulares del idioma inglés para hispanohablantes.
Tu objetivo es resolver dudas gramaticales, etimológicas, de pronunciación, uso formal vs informal, y contrastes confusos (por ejemplo: lie vs lay, rise vs raise, hang-hung vs hang-hanged, fly-flew-flown).
Sé didáctico, claro, estructurado, amable y utiliza ejemplos bilingües (inglés con traducción al español). Utiliza formato Markdown con negritas y listas limpias.
Contexto de verbos disponibles en la app: ${verbContext ? JSON.stringify(verbContext) : '175+ verbos irregulares'}.`;

    const response = await ai.models.generateContent({
      model: 'gemini-4-argon',
      contents: prompt,
      config: {
        systemInstruction,
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.HIGH,
        },
      },
    });

    return res.json({
      reply: response.text || 'No se pudo generar respuesta.',
    });
  } catch (error: any) {
    console.error('Error in /api/ai/ask:', error);
    const statusCode = error?.status || 500;
    return res.status(statusCode).json({
      error: error?.message || 'Error al consultar al tutor inteligente',
      details: error?.statusText || '',
    });
  }
});

// API Route: AI Mnemonic & Sentence Generator with Thinking Mode
app.post('/api/ai/mnemonic', async (req, res) => {
  try {
    if (!ai) {
      return res.status(503).json({
        error: 'API_KEY_NOT_CONFIGURED',
        message: 'La clave de API de Gemini no está configurada en los Secretos.',
      });
    }

    const {verbs} = req.body; // e.g. ["sing", "sang", "sung"] or list of verbs
    const systemInstruction = `Eres un neuroeducador experto en mnemotecnia para aprender idiomas.
Crea una regla mnemotécnica o historia breve e ingeniosa en español con los verbos en inglés en mayúscula para memorizar para siempre sus 3 formas (Infinitive, Past Simple, Past Participle).
Incluye también 3 oraciones de ejemplo reales del día a día (una para cada forma verbal) con traducción.`;

    const promptText = `Genera un truco mnemotécnico inolvidable y oraciones de práctica para el/los siguientes verbos irregulares: ${Array.isArray(verbs) ? verbs.join(', ') : verbs}.`;

    const response = await ai.models.generateContent({
      model: 'gemini-4-argon',
      contents: promptText,
      config: {
        systemInstruction,
        thinkingConfig: {
          thinkingLevel: ThinkingLevel.HIGH,
        },
      },
    });

    return res.json({
      mnemonic: response.text || 'No se pudo generar el truco mnemotécnico.',
    });
  } catch (error: any) {
    console.error('Error in /api/ai/mnemonic:', error);
    const statusCode = error?.status || 500;
    return res.status(statusCode).json({
      error: error?.message || 'Error al generar mnemotecnia',
    });
  }
});

// Vite middleware or Static files serving
async function setupServer() {
  const isProd = process.env.NODE_ENV === 'production';
  const httpServer = http.createServer(app);
  const publicDir = path.resolve(__dirname, 'public');

  // Serve Service Worker with proper scope headers
  app.get('/sw.js', (_req, res) => {
    res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
    res.setHeader('Service-Worker-Allowed', '/');
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(path.join(publicDir, 'sw.js'));
  });

  // Serve Manifest files with proper MIME type
  app.get(['/manifest.webmanifest', '/manifest.json'], (_req, res) => {
    res.setHeader('Content-Type', 'application/manifest+json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(path.join(publicDir, 'manifest.webmanifest'));
  });

  app.use(express.static(publicDir));

  if (!isProd) {
    const isHmrDisabled = process.env.DISABLE_HMR === 'true';
    const {createServer: createViteServer} = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: isHmrDisabled ? false : { server: httpServer },
        watch: isHmrDisabled ? null : {},
      },
      appType: 'spa',
    });

    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(port, '0.0.0.0', () => {
    console.log(`Server listening at http://0.0.0.0:${port}`);
  });
}

setupServer();
