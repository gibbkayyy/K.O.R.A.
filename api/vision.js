const GEMINI_MODEL = "gemini-3.1-flash-lite";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed." });

  try {
    const image = typeof req.body?.image === "string" ? req.body.image : "";
    if (!image.startsWith("data:image/")) {
      return res.status(400).json({ error: "No valid camera image was supplied." });
    }

    const match = image.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
    if (!match) return res.status(400).json({ error: "Invalid image data." });

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return res.status(500).json({ error: "GEMINI_API_KEY is not configured." });

    const response = await fetch(`${GEMINI_URL}?key=${encodeURIComponent(apiKey)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: {
          parts: [{
            text: "You are K.O.R.A. vision. Analyse the supplied camera image accurately. Describe only what is actually visible. Do not claim to access the user's camera or hardware directly; the image has already been supplied to you. Be concise and natural because your answer will be spoken aloud. Address the user as Sir naturally when appropriate."
          }]
        },
        contents: [{
          role: "user",
          parts: [
            { text: "Analyse this image and tell me what you can see." },
            { inlineData: { mimeType: match[1], data: match[2] } }
          ]
        }],
        generationConfig: {
          temperature: 0.4,
          maxOutputTokens: 500
        }
      })
    });

    const data = await response.json();
    if (!response.ok) {
      return res.status(response.status).json({
        error: data?.error?.message || "Gemini vision request failed."
      });
    }

    const reply = (data?.candidates?.[0]?.content?.parts || [])
      .map(part => part?.text || "")
      .join("")
      .trim();

    if (!reply) return res.status(502).json({ error: "Gemini returned no vision result." });

    return res.status(200).json({ reply });
  } catch (error) {
    console.error("K.O.R.A. vision API error:", error);
    return res.status(500).json({ error: "K.O.R.A. could not analyse the supplied image." });
  }
};
