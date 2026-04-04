// /workers/recording.worker.js
const { Worker } = require("bullmq");
const path = require("path");
const fs = require("fs");
require('dotenv').config();

const Recording = require("../models/Recording");
const Teacher = require("../models/Teacher");
const downloadAudio = require("../utils/downloadAudio");
const transcribe = require("../services/transcription.service");

const redisClient = require("../config/redis");

new Worker(
  "recordingQueue",
  async (job) => {
    const { recordingId } = job.data;

    const recording = await Recording.findById(recordingId);
    if (!recording) return;

    const teacher = await Teacher.findById(recording.teacherId);
    if (!teacher) return;

    const filePath = path.join(__dirname, "..", "uploads", `${recording._id}.m4a`);

    try {
      // 🔄 Set processing
      recording.status = "processing";
      await recording.save();

      // ⬇ Download audio
      await downloadAudio(recording.audioUrl, teacher.zoom.access_token, filePath);

      // 🤖 Transcribe + Analyze (ONE function)
      const { transcript, metrics } = await transcribe(filePath);

      // 💾 Save results
      recording.filePath = filePath;
      recording.transcript = transcript;
      recording.metrics = metrics;
      recording.status = "done";

      await recording.save();

      console.log(`✅ Processed recording: ${recording._id}`);
    } catch (error) {
      console.error("❌ Worker Error:", error.message);

      recording.status = "failed";
      await recording.save();
    } finally {
      // 🧹 Delete file after processing
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  },
  {
    connection: redisClient,
  }
);