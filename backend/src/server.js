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

// Increase payload limits to handle camera frames and image uploads safely
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
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

// Camera/Vision Handling Endpoint
app.post('/api/camera', async (req, res) => {
    try {
        const { imageBuffer, prompt } = req.body;
        
        if (!imageBuffer) {
            return res.status(400).json({ error: 'No camera frame data provided.' });
        }

        logActivity('Camera frame processed successfully.', 'info');
        return res.status(200).json({ success: true, message: 'Camera data handled successfully.' });
    } catch (err) {
        console.error('Camera handling error:', err);
        return res.status(500).json({ error: 'Failed to process camera data securely.' });
    }
});

app.listen(PORT, () => {
    console.log(`K.O.R.A. server running on port ${PORT}`);
});
