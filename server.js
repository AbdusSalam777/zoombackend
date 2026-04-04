require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const connectDB = require('./config/db');
const cron = require('node-cron');
const fetchCron = require('./cron/fetchRecordings');

const authRoutes = require('./routes/auth');
const zoomRoutes = require('./routes/zoom');
const recordingsRoutes = require('./routes/recordings.route');

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());

// DB
connectDB();

// Routes - balanced with existing
app.use('/api/auth', authRoutes);
app.use('/api/zoom', zoomRoutes);
app.use('/api/recordings', recordingsRoutes);

// Health
app.get('/', (req, res) => {
  res.json({ message: 'Zoom Analysis Backend running ✅' });
});

// Cron: Fetch recordings every 10 min
cron.schedule('*/10 * * * *', async () => {
  try {
    await fetchCron();
  } catch (err) {
    console.error('Cron error:', err);
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));