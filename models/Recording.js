const mongoose = require("mongoose");

const recordingSchema = new mongoose.Schema({
  teacherId: { type: mongoose.Schema.Types.ObjectId, ref: "Teacher", required: true },
  zoomMeetingId: String,
  zoomRecordingId: { type: String, unique: true },
  topic: String,
  startTime: Date,
  duration: Number,
  audioUrl: String,
  filePath: String,
  transcript: String,
  metrics: {
    tone: String,
    engagement: Number,
    participation: Number
  },
  status: {
    type: String,
    enum: ["pending", "processing", "done"],
    default: "pending"
  }
}, { timestamps: true });

module.exports = mongoose.model("Recording", recordingSchema);