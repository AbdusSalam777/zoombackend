const ExcelJS = require("exceljs");
const path = require("path");

async function generateReport(recordings, teacherName) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Analysis Report");

  ws.addRow(["Meeting ID", "Topic", "Start Time", "Duration (min)", "Tone", "Engagement", "Participation"]);

  recordings.forEach(r => {
    ws.addRow([
      r.zoomMeetingId,
      r.topic || "N/A",
      r.startTime ? new Date(r.startTime).toLocaleString() : "N/A",
      r.duration || 0,
      r.metrics.tone || "N/A",
      r.metrics.engagement || 0,
      r.metrics.participation || 0
    ]);
  });

  const fileName = `${teacherName.replace(/[^a-z0-9]/gi, '_')}_report_${Date.now()}.xlsx`;
  const filePath = path.join(__dirname, '../../reports', fileName);
  await wb.xlsx.writeFile(filePath);
  return filePath;
}

module.exports = generateReport;

