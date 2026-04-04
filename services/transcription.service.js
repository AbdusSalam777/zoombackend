// services/transcription.service.js
const fs = require("fs");
const OpenAI = require("openai");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// 🎯 Strong structured analysis
async function analyzeTranscript(transcript) {
  const prompt = `
You are an AI that analyzes Zoom class transcripts.

Return ONLY valid JSON in this format:
{
  "tone": "positive | neutral | negative",
  "engagement": number (0 to 1),
  "participation": number (0 to 1)
}

Transcript:
${transcript}
`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini", // ✅ cheaper + fast
    messages: [{ role: "user", content: prompt }],
    temperature: 0,
  });

  const resultText = response.choices[0].message.content;

  try {
    return JSON.parse(resultText);
  } catch (err) {
    console.error("❌ JSON Parse Failed:", resultText);
    return {
      tone: "unknown",
      engagement: 0,
      participation: 0,
    };
  }
}

module.exports = async function transcribeAndAnalyze(filePath) {
  try {
    console.log(`🎙 Transcribing ${filePath}...`);

    const audioStream = fs.createReadStream(filePath);

    // 1️⃣ Whisper
    const transcriptionRes = await openai.audio.transcriptions.create({
      file: audioStream,
      model: "whisper-1",
    });

    const transcript = transcriptionRes.text;

    console.log("🧠 Analyzing transcript...");

    // 2️⃣ GPT Analysis
    const metrics = await analyzeTranscript(transcript);

    return { transcript, metrics };
  } catch (error) {
    console.error("❌ Transcription Service Error:", error.message);
    throw error; // important for worker catch
  }
};
