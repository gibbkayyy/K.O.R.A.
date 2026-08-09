import express from 'express';
import session from 'express-session';
import crypto from 'crypto';
import path from 'path';
import { fileURLToPath } from 'url';
import { askKora } from './aiClient.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

const OWNER_EMAIL = process.env.OWNER_EMAIL || 'kgibb2425@gmail.com';
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(64).toString('hex');
const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || '';
const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || '21m00Tcm4TlvDq8ikWAM';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));

app.use(session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
    }
}));

const db = {
    users: new Map(),
    otps: new Map(),
    activityFeed: [],
    announcements: [],
    settings: {
        aiEnabled: true,
        visionEnabled: true,
        voiceEnabled: true,
        announcementsEnabled: true,
        authEnabled: true,
        maintenanceMode: false
    },
    clientVersion: '1.0.0',
    globalReloadTriggered: false
};

function logActivity(message, type = 'info') {
    const entry = {
        id: crypto.randomUUID(),
        timestamp: new Date().toISOString(),
        message,
        type
    };
    db.activityFeed.unshift(entry);
    if (db.activityFeed.length > 100) db.activityFeed.pop();
}

function requireOwner(req, res, next) {
    if (!req.session.user || req.session.user.email !== OWNER_EMAIL) {
        return res.status(403).json({ error: 'Unauthorized. Owner access required.' });
    }
    next();
}

// Chat API Route (Using Gemini 3.5 Flash-Lite)
app.post('/api/chat', async (req, res) => {
    try {
        const { messages } = req.body;
        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: 'Messages array required.' });
        }
        const reply = await askKora(messages);
        res.json({ reply });
    } catch (err) {
        res.status(500).json({ error: err.message || 'AI request failed.' });
    }
});

// ElevenLabs Voice Endpoint
app.post('/api/voice', async (req, res) => {
    const { text } = req.body;
    if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: 'Text required for speech generation.' });
    }

    if (!ELEVENLABS_API_KEY) {
        return res.status(503).json({ error: 'ElevenLabs API key not configured on server.' });
    }

    try {
        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}?output_format=mp3_44105_128`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'xi-api-key': ELEVENLABS_API_KEY
            },
            body: JSON.stringify({
                text: text,
                model_id: 'eleven_monolingual_v1',
                voice_settings: {
                    stability: 0.5,
                    similarity_boost: 0.75
                }
            })
        });

        if (!response.ok) {
            const errBody = await response.text();
            return res.status(response.status).json({ error: `ElevenLabs error: ${errBody}` });
        }

        const audioBuffer = await response.arrayBuffer();
        res.setHeader('Content-Type', 'audio/mpeg');
        res.send(Buffer.from(audioBuffer));
    } catch (err) {
        res.status(500).json({ error: 'Failed to generate speech via ElevenLabs.' });
    }
});

app.listen(PORT, () => {
    console.log(`K.O.R.A. server running on port ${PORT}`);
});
    console.log(`K.O.R.A. server running on port ${PORT}`);
});
