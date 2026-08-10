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

const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(64).toString('hex');

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

// Chat API Route
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

// Vision API Route
app.post('/api/vision', async (req, res) => {
    try {
        const { image } = req.body;
        if (!image) {
            return res.status(400).json({ error: 'No image data provided.' });
        }
        
        const reply = await askKora([
            { role: 'user', content: 'Describe what you see in this image concisely as Kora.' }
        ]);
        
        res.json({ reply });
    } catch (err) {
        res.status(500).json({ error: 'Vision processing failed.' });
    }
});

// News API Route stub
app.get('/api/news', async (req, res) => {
    try {
        res.json({
            articles: [
                { source: 'System', title: 'All systems operating normally across local grid.' }
            ]
        });
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch news.' });
    }
});

app.listen(PORT, () => {
    console.log(`K.O.R.A. server running on port ${PORT}`);
});
