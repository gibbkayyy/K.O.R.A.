const { askKora } = require("./aiClient");

module.exports = async function handler(req, res) {

  res.setHeader(
    "Access-Control-Allow-Origin",
    "*"
  );

  res.setHeader(
    "Access-Control-Allow-Methods",
    "POST, OPTIONS"
  );

  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type"
  );

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed."
    });
  }

  try {
    const body = req.body || {};

    if (
      !Array.isArray(body.messages) ||
      body.messages.length === 0
    ) {
      return res.status(400).json({
        error: "No conversation messages were provided."
      });
    }

    const messages =
      body.messages
        .slice(-30)
        .map(message => ({
          role:
            message.role === "assistant"
              ? "assistant"
              : "user",

          content:
            String(
              message.content ??
              message.text ??
              ""
            ).slice(0, 12000)
        }));

    const memory =
      typeof body.memory === "string"
        ? body.memory.slice(0, 20000)
        : "";

    const location =
      typeof body.location === "string"
        ? body.location.slice(0, 200)
        : "Rothbury, UK";

    const result =
      await askKora(
        messages,
        {
          memory,
          location
        }
      );

    return res.status(200).json({
      reply: result.text,

      usage: result.usage
    });

  } catch (error) {

    console.error(
      "K.O.R.A. API error:",
      error
    );

    if (
      error?.type === "RATE_LIMITED"
    ) {
      return res.status(429).json({
        error:
          "K.O.R.A. has temporarily reached the Gemini request limit."
      });
    }

    return res.status(500).json({
      error:
        "K.O.R.A. could not reach her AI service."
    });
  }
};
