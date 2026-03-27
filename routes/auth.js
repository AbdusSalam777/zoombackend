// routes/auth.js
const express = require('express');
const router = express.Router();
const Teacher = require('../models/Teacher');
const jwt = require('jsonwebtoken');

router.post('/login', async (req, res) => {
  const { name, username } = req.body; // frontend now sends name + username only

  try {
    if (!name || !username) {
      return res.status(400).json({ message: "Name and username are required" });
    }

    // ✅ Check if teacher exists with same name AND username
    let teacher = await Teacher.findOne({ name, username });

    if (teacher) {
      // Teacher already exists → message + token
      const token = jwt.sign({ id: teacher._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

      return res.status(200).json({
        message: "User already exists, logging in...",
        token,
        teacher
      });
    }

    // Teacher does not exist → auto-create
    teacher = new Teacher({ name, username });
    await teacher.save();
    console.log('Teacher auto-created:', teacher);

    const token = jwt.sign({ id: teacher._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      message: "User created successfully",
      token,
      teacher
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;