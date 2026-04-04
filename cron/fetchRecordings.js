const Teacher = require("../models/Teacher");
const Recording = require("../models/Recording");
const { fetchRecordings } = require("../services/zoom.service");
const recordingQueue = require("../queues/recording.queue");

async function fetchCron() {
  console.log("🕐 Running cron: Fetching Zoom recordings...");

  const teachers = await Teacher.find({ "zoom.connected": true });

  for (const teacher of teachers) {
    try {
      console.log(`👤 Fetching for teacher: ${teacher.name}`);

      // ✅ Only last 24 hours
      const from = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      const pastMeetings = await fetchRecordings(teacher, from);

      for (const pastMeeting of pastMeetings) {
        for (const file of pastMeeting.recording_files || []) {
          if (file.file_type !== "M4A") continue;

          // ✅ Prevent duplicate
          const exists = await Recording.findOne({
            zoomRecordingId: file.id,
          });

          if (exists) continue;

          const rec = new Recording({
            teacherId: teacher._id,
            zoomMeetingId: pastMeeting.id,
            zoomRecordingId: file.id,
            topic: pastMeeting.topic,
            startTime: new Date(pastMeeting.start_time),
            duration: pastMeeting.duration,
            audioUrl: file.download_url,
            status: "pending",
          });

          await rec.save();

          // ✅ Add retry + backoff
          await recordingQueue.add(
            "processRecording",
            { recordingId: rec._id },
            {
              attempts: 3,
              backoff: {
                type: "exponential",
                delay: 5000,
              },
            }
          );

          console.log(`📥 Queued recording: ${rec.zoomRecordingId}`);
        }
      }
    } catch (error) {
      console.error(`❌ Error for teacher ${teacher.name}:`, error.message);
    }
  }

  console.log("✅ Cron job finished\n");
}

module.exports = fetchCron;