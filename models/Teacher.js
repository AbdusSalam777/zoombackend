const mongoose = require("mongoose");

const teacherSchema = new mongoose.Schema({
  name: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  zoom: {
    connected: { type: Boolean, default: false },
    access_token: String,
    refresh_token: String,
    zoom_id: String, // was zoom_user_id
    email: String
  }
}, { timestamps: true });

module.exports = mongoose.model("Teacher", teacherSchema);

