const { askKora } = require("./_lib/aiClient");

module.exports = async function handler(req, res) {
  // Allow the frontend (on a different domain) to call this
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Only POST is allowed." });
    return;
  }

  const messages = req.body.messages;

  if (!Array.isArray(messages) || messages.length === 0) {
    res.status(400).json({ error: "Expected a non-empty 'messages' array." });
    return;
  }

  try {
    const reply = await askKora(messages);
    res.status(200).json({ reply: reply });
  } catch (err) {
    if (err.type === "RATE_LIMITED") {
      res.status(429).json({ error: err.message, retryAfter: err.retryAfter });
      return;
    }

    console.error("Kora backend error:", err);
    res.status(500).json({ error: "Something went wrong talking to Kora's brain." });
  }
};
