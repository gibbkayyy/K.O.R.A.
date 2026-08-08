/**
 * aiClient.js
 * ------------------------------------------------------------------
 * This is Kora's "brain socket" - the ONLY place in the codebase that
 * knows which AI provider we're using. Every other file just calls
 * askKora(messages) and gets back a reply.
 * ------------------------------------------------------------------
 */

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

const KORA_SYSTEM_PROMPT =
  "You are Kora, a fast, clean, reliable AI assistant. " +
  "You have your own identity - you are not JARVIS, ChatGPT, Siri, or Google Assistant. " +
  "Speak concisely and directly. Be helpful and warm, but efficient with words. " +
  "Avoid sci-fi assistant cliches (At once sir, Booting up, etc). Just be Kora.";

export async function askKora(messages) {
  return callGroqWithRetry(messages, 1);
}

async function callGroqWithRetry(messages, attempt) {
  const response = await fetch(GROQ_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + process.env.GROQ_API_KEY
    },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
      messages: [{ role: "system", content: KORA_SYSTEM_PROMPT }].concat(messages)
    })
  });

  if (response.status === 429) {
    const retryAfter = Number(response.headers.get("retry-after")) || 2;

    if (attempt === 1) {
      await sleep(retryAfter * 1000);
      return callGroqWithRetry(messages, attempt + 1);
    }

    const err = new Error("Kora's hit its request limit for the moment. Try again shortly.");
    err.type = "RATE_LIMITED";
    err.retryAfter = retryAfter;
    throw err;
  }

  if (!response.ok) {
    const body = await response.text();
    const err = new Error("Groq API error (" + response.status + "): " + body);
    err.type = "PROVIDER_ERROR";
    throw err;
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

function sleep(ms) {
  return new Promise(function (resolve) {
    setTimeout(resolve, ms);
  });
}
