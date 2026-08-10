import { askKora } from '../src/aiClient.js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { messages } = req.body;
        if (!messages || !Array.isArray(messages)) {
            return res.status(400).json({ error: 'Messages array required.' });
        }
        
        const reply = await askKora(messages);
        return res.status(200).json({ reply });
    } catch (err) {
        console.error('Chat API Error:', err);
        return res.status(500).json({ error: err.message || 'AI request failed.' });
    }
}
