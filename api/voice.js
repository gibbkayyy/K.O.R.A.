export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { text } = req.body;
    if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: 'Text required for speech generation.' });
    }

    const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY || '';
    const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || '8tsLeAV5vPVuzCCvqbbU';

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
        return res.send(Buffer.from(audioBuffer));
    } catch (err) {
        console.error('ElevenLabs fetch error:', err);
        return res.status(500).json({ error: 'Failed to generate speech via ElevenLabs.' });
    }
}
