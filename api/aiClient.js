const GEMINI_MODEL = "gemini-3.5-flash-lite";

const GEMINI_URL =
  `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const SYSTEM_PROMPT = `
You are K.O.R.A. — Knowledge, Operations, Reasoning & Assistance.

You are the user's personal AI assistant.

PERSONALITY:
- Calm
- Intelligent
- Helpful
- Natural
- Concise
- Slightly futuristic
- Never overly robotic
-Act and speak like Jarvis, but still like you are your own assisstant

ADDRESS:
Call the user "sir" or "boss" naturally by default.

IMPORTANT PHRASE RULE:
Only say "As you wish, sir" when the user's request is clearly a
"can you..." question or if saying something like "pull up..." or "show me.." or "analyse..." etc.

Do NOT automatically say "As you wish, sir" for:
- normal questions
- greetings
- weather
- date/time
- news
- statements
- commands that aren't "can you..." questions

DEFAULT LOCATION:
Rothbury, UK. But don't say it in conversation unless asked.

MEMORY:
The application can provide persistent memories stored locally on the user's
device.

Use those memories as context when relevant.

Never invent memories.

Never claim to have forgotten or deleted a memory.

If the user says "remember..." or asks you to remember something, acknowledge it.

The frontend is responsible for saving memories locally.

PRIVACY:
Do not claim that you can access WhatsApp, TikTok, YouTube, contacts,
messages, files, accounts, or other private services unless the application
actually provides that integration and its data to you.

Do not pretend to have permissions you don't have.

CAMERA:
If the application supplies an image from the camera, analyse that image. Do not analyse in detail unless asked to.

Never claim to see something through the camera unless an image has actually
been supplied.

VOICE:
Your replies are spoken aloud.

Write naturally for speech.

Avoid unnecessary markdown.

Avoid long lists unless requested.

Do not use fake robotic phrases such as:
"Affirmative."
"At once."
"Booting sequence initiated."
"Processing command."

The frontend handles the startup greeting.

Be K.O.R.A.
`;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function askKora(messages, context = {}) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const memory =
    typeof context.memory === "string"
      ? context.memory
      : "";

  const location =
    typeof context.location === "string" &&
    context.location.trim()
      ? context.location
      : "Rothbury, UK";

  const contextualPrompt = `
CURRENT CONTEXT

Default/current location:
${location}

PERSISTENT LOCAL MEMORY:
${memory || "(No memories stored yet.)"}

The memory above comes from the user's local device.
Use it only when relevant.
Do not invent additional memories.
`;

  const contents = messages.map(message => ({
    role:
      message.role === "assistant"
        ? "model"
        : "user",

    parts: [
      {
        text: String(
          message.content ??
          message.text ??
          ""
        )
      }
    ]
  }));

  const payload = {
    systemInstruction: {
      parts: [
        {
          text:
            SYSTEM_PROMPT +
            "\n\n" +
            contextualPrompt
        }
      ]
    },

    contents,

    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 700
    }
  };

  let lastError = null;

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const response = await fetch(
        `${GEMINI_URL}?key=${encodeURIComponent(apiKey)}`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify(payload)
        }
      );

      const text = await response.text();

      let data;

      try {
        data = JSON.parse(text);
      } catch {
        data = null;
      }

      if (response.status === 429) {
        lastError =
          new Error(
            "K.O.R.A. has temporarily reached the Gemini request limit."
          );

        if (attempt === 0) {
          await sleep(1500);
          continue;
        }

        lastError.type = "RATE_LIMITED";
        throw lastError;
      }

      if (!response.ok) {
        const message =
          data?.error?.message ||
          text ||
          `Gemini returned HTTP ${response.status}`;

        throw new Error(message);
      }

      const candidate =
        data?.candidates?.[0];

      const parts =
        candidate?.content?.parts || [];

      const reply =
        parts
          .map(part => part?.text || "")
          .join("")
          .trim();

      if (!reply) {
        throw new Error(
          "Gemini returned an empty response."
        );
      }

      return {
        text: reply,

        usage: {
          promptTokens:
            data?.usageMetadata?.promptTokenCount || 0,

          outputTokens:
            data?.usageMetadata?.candidatesTokenCount || 0,

          totalTokens:
            data?.usageMetadata?.totalTokenCount || 0
        }
      };

    } catch (error) {
      lastError = error;

      if (
        error?.type === "RATE_LIMITED"
      ) {
        throw error;
      }

      if (attempt === 0) {
        await sleep(500);
      }
    }
  }

  throw lastError ||
    new Error("K.O.R.A. could not contact Gemini.");
}

module.exports = {
  askKora
};
