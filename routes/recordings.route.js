const express = require("express");
const router = express.Router({ mergeParams: true });
const Recording = require("../models/Recording");
const Teacher = require("../models/Teacher");
const generateReport = require("../services/report.service");
const jwt = require("jsonwebtoken");

// Simple JWT middleware
const authMiddleware = (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ message: "No token" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.teacherId = decoded.id;
    next();
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
  }
};

router.get("/teacher/:teacherId", authMiddleware, async (req, res) => {
  if (req.teacherId !== req.params.teacherId) return res.status(403).json({ message: "Unauthorized" });
  const recordings = await Recording.find({ teacherId: req.params.teacherId }).sort({ createdAt: -1 });
  res.json(recordings);
});

router.get("/teacher/:teacherId/report", authMiddleware, async (req, res) => {
  if (req.teacherId !== req.params.teacherId) return res.status(403).json({ message: "Unauthorized" });
  const teacher = await Teacher.findById(req.params.teacherId);
  const recordings = await Recording.find({ teacherId: req.params.teacherId, status: "done" });
  const reportPath = await generateReport(recordings, teacher.name);
  res.download(reportPath);
});

module.exports = router;

