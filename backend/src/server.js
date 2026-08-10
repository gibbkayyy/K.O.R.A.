import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { askKora } from './aiClient.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(express.static(path.join(__dirname, '../public')));

// Chat API Route
app.post('/api/chat', async (req, res) => {
    try {
        const { messages } = req.body;
        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: 'Messages array required.' });
        }
        const reply = await askKora(messages);
        return res.json({ reply });
    } catch (err) {
        console.error('Chat endpoint error:', err);
        return res.status(500).json({ error: err.message || 'AI request failed.' });
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
        
        return res.json({ reply });
    } catch (err) {
        console.error('Vision endpoint error:', err);
        return res.status(500).json({ error: 'Vision processing failed.' });
    }
});

// News API Route stub
app.get('/api/news', async (req, res) => {
    try {
        return res.json({
            articles: [
                { source: 'System', title: 'All systems operating normally across local grid.' }
            ]
        });
    } catch (err) {
        return res.status(500).json({ error: 'Failed to fetch news.' });
    }
});

// Fallback for SPA routing
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Export app for Vercel serverless execution while keeping local testing alive
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`K.O.R.A. server running on port ${PORT}`);
    });
}

export default app;
