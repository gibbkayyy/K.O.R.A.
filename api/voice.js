export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { text } = req.body || {};
    if (!text || typeof text !== 'string') {
        return res.status(400).json({ error: 'Text required for speech generation.' });
    }

    const apiKey = process.env.CUSTOM_ELEVEN_KEY;
    const ELEVENLABS_ID = '6rOxfAnZpbM3VIEhFaeV';

    if (!apiKey) {
        console.error("Server error: CUSTOM_ELEVEN_KEY environment variable is missing.");
        return res.status(503).json({ error: 'ElevenLabs API key not configured on server.' });
    }

    try {
        const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_ID}?output_format=mp3_44105_128`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'xi-api-key': apiKey.trim()
            },
            body: JSON.stringify({
                text: text,
                model_id: 'eleven_monolingual_v1',
                voice_settings: {
                    stability: 0.35,
                    similarity_boost: 0.75,
                    style: 0.20,
                    use_speaker_boost: true
                }
            })
        });

        if (!response.ok) {
            const errBody = await response.text();
            console.error(`ElevenLabs upstream error (${response.status}):`, errBody);
            return res.status(response.status).json({ error: `ElevenLabs error: ${errBody}` });
        }

        const audioBuffer = await response.arrayBuffer();
        res.setHeader('Content-Type', 'audio/mpeg');
        return res.send(Buffer.from(audioBuffer));
    } catch (err) {
        console.error('ElevenLabs fetch execution error:', err);
        return res.status(500).json({ error: 'Failed to generate speech via ElevenLabs.' });
    }
}
