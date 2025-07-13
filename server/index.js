
// =====================
// Import Dependencies
// =====================
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { OpenAI } from "openai";
import fetch, { Headers } from "cross-fetch";
import { Blob } from "fetch-blob";
import { FormData } from "formdata-node";

// =====================
// Polyfill Globals (for OpenAI SDK compatibility in Node)
// =====================
globalThis.fetch = fetch;
globalThis.Headers = Headers;
globalThis.Blob = Blob;
globalThis.FormData = FormData;

// =====================
// Load Environment Variables
// =====================
dotenv.config();

// =====================
// Initialize OpenAI
// =====================
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// =====================
// Create Express App
// =====================
const app = express();

app.use(
  cors({
    origin: "https://andrewknotts.github.io",
    methods: ["POST"],
    allowedHeaders: ["Content-Type"],
  })
);

app.use(express.json({ limit: "25mb" }));

// =====================
// API Endpoint: Analyze Image + Question
// =====================
app.post("/api/analyze-image", async (req, res) => {
  const { base64Image, question } = req.body;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { type: "image_url", image_url: { url: base64Image } },
            { type: "text", text: question },
          ],
        },
      ],
      max_tokens: 500,
    });

    const reply = response.choices?.[0]?.message?.content;

    if (!reply) {
      return res.status(500).json({ error: "No content in OpenAI response." });
    }

    res.json({ reply });
  } catch {
    res.status(500).json({ error: "Failed to get response from OpenAI." });
  }
});

// =====================
// Start Server
// =====================
const PORT = process.env.PORT || 4000;

app.listen(PORT);
