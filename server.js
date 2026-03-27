// server.js
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(bodyParser.json());
app.use(cors());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.log("❌ DB Error:", err));
// Routes
const authRoutes = require('./routes/auth');
const zoomRoutes = require('./routes/zoom');
app.use('/api/auth', authRoutes);
app.use('/api/zoom', zoomRoutes);
// Mount router at /api/zoom
app.get('/', (req, res) => {
  res.send('Backend is running ✅');
});



const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));