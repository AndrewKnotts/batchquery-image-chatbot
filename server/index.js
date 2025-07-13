// index.js (ESM-compliant)
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { OpenAI } from "openai";
import fetch, { Headers } from "cross-fetch";
import { Blob } from "fetch-blob";
import { FormData } from "formdata-node";

// 🌐 Polyfill globals needed for OpenAI SDK
globalThis.fetch = fetch;
globalThis.Headers = Headers;
globalThis.Blob = Blob;
globalThis.FormData = FormData;

// 🌱 Load environment variables
dotenv.config();

// 🧠 Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 🚀 Create Express app
const app = express();
app.use(
  cors({
    origin: "https://andrewknotts.github.io",
    methods: ["POST"],
    allowedHeaders: ["Content-Type"],
  })
);
app.use(express.json({ limit: "25mb" }));

// 📦 Endpoint to analyze image and question
app.post("/api/analyze-image", async (req, res) => {
  const { base64Image, question } = req.body;

  console.log("📥 Incoming question:", question);
  console.log("🖼️ Image size:", base64Image?.length);

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

    console.log("✅ OpenAI raw response:", JSON.stringify(response, null, 2));

    const reply = response.choices?.[0]?.message?.content;

    if (!reply) {
      return res.status(500).json({ error: "No content in OpenAI response." });
    }

    res.json({ reply });
  } catch (error) {
    console.error("❌ OpenAI error:", error);
    res.status(500).json({ error: "Failed to get response from OpenAI." });
  }
});
// 🏁 Start the server
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`✅ Server listening on port ${PORT}`);
});
