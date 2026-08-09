/**
 * aiClient.js
 * ------------------------------------------------------------------
 * This is Kora's "brain socket" - the ONLY place in the codebase that
 * knows which AI provider we're using. Every other file just calls
 * askKora(messages) and gets back a reply.
 * ------------------------------------------------------------------
 */

const GEMINI_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent";

const KORA_SYSTEM_PROMPT =
  "You are Kora, a fast, clean, reliable AI assistant. " +
  "You have your own identity - you are not JARVIS, ChatGPT, Siri, or Google Assistant. " +
  "Speak concisely and directly. Be helpful and warm, but efficient with words. " +
  "Avoid sci-fi assistant cliches (At once sir, Booting up, etc). Just be Kora.";

export async function askKora(messages) {
  return callGeminiWithRetry(messages, 1);
}

async function callGeminiWithRetry(messages, attempt) {
  const apiKey = process.env.GEMINI_API_KEY || "";

  const formattedContents = messages.map(msg => ({
    role: msg.role === "assistant" ? "model" : "user",
    parts: [{ text: msg.content }]
  }));

  const payload = {
    contents: formattedContents,
    systemInstruction: {
      parts: [{ text: KORA_SYSTEM_PROMPT }]
    }
  };

  const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  });

  if (response.status === 429) {
    const retryAfter = Number(response.headers.get("retry-after")) || 2;

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
  const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!replyText) {
    throw new Error("Received an empty response from Gemini.");
  }

  return replyText;
}

function sleep(ms) {
  return new Promise(function (resolve) {
    setTimeout(resolve, ms);
  });
}
