import "dotenv/config";
import express from "express";
import cors from "cors";
import { askKora } from "./aiClient.js";

const app = express();
app.use(cors());
app.use(express.json());

let conversation = [];

app.post("/api/chat", async (req, res) => {
  const message = req.body.message;

  if (!message || typeof message !== "string") {
    return res.status(400).json({ error: "Expected a non-empty 'message' string." });
  }

  conversation.push({ role: "user", content: message });

  try {
    const reply = await askKora(conversation);
    conversation.push({ role: "assistant", content: reply });
    res.json({ reply: reply });
  } catch (err) {
    conversation.pop();

    if (err.type === "RATE_LIMITED") {
      return res.status(429).json({
        error: err.message,
        retryAfter: err.retryAfter
      });
    }

    console.error("Kora backend error:", err);
    res.status(500).json({ error: "Something went wrong talking to Kora's brain." });
  }
});

app.get("/api/health", (req, res) => res.json({ status: "Kora backend is running" }));

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log("Kora backend listening on port " + PORT);
});
