const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent";

const KORA_SYSTEM_PROMPT =
  "You are Kora, a fast, clean, reliable voice assistant, in the spirit of JARVIS but with your own identity. " +
  "You are not JARVIS, ChatGPT, Siri, or Google Assistant - you are Kora. " +
  "Since your replies may be spoken aloud, keep them conversational and concise - avoid long lists, " +
  "markdown formatting, or anything that only makes sense written down. " +
  "Speak the way a sharp, efficient assistant would speak out loud. Avoid sci-fi cliches like At once sir or Booting up.";

async function askKora(messages) {
  return callGeminiWithRetry(messages, 1);
}

async function callGeminiWithRetry(messages, attempt) {
  // Gemini's format is different from Groq/OpenAI-style APIs:
  // - "role" is "user" or "model" (not "assistant")
  // - message text goes in a "parts" array
  // - the system prompt is passed separately, not as a message
  const geminiContents = messages.map(function (m) {
    return {
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }]
    };
  });

  const response = await fetch(GEMINI_URL + "?key=" + process.env.GEMINI_API_KEY, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      contents: geminiContents,
      systemInstruction: {
        parts: [{ text: KORA_SYSTEM_PROMPT }]
      }
    })
  });

  if (response.status === 429) {
    const retryAfter = 2;

    if (attempt === 1) {
      await sleep(retryAfter * 1000);
      return callGeminiWithRetry(messages, attempt + 1);
    }

    const err = new Error("Kora's hit its request limit for the moment. Try again shortly.");
    err.type = "RATE_LIMITED";
    err.retryAfter = retryAfter;
    throw err;
  }

  if (!response.ok) {
    const body = await response.text();
    const err = new Error("Gemini API error (" + response.status + "): " + body);
    err.type = "PROVIDER_ERROR";
    throw err;
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

function sleep(ms) {
  return new Promise(function (resolve) {
    setTimeout(resolve, ms);
  });
}

module.exports = { askKora };
