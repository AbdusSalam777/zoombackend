const mongoose = require('mongoose');

const teacherSchema = new mongoose.Schema({
  name: { type: String, required: true },
  username: { type: String, required: true, unique: true }, // unique teacher identifier
  zoom: {
    connected: { type: Boolean, default: false },
    access_token: String,
    refresh_token: String,
    zoom_user_id: String
  }
}, { timestamps: true });

module.exports = mongoose.model('Teacher', teacherSchema);