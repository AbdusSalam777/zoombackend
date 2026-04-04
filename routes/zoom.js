const express = require('express');
const router = express.Router();
const axios = require('axios');
const Teacher = require('../models/Teacher');
const jwt = require('jsonwebtoken');
const qs = require('querystring');

// Step 1: Redirect teacher to Zoom OAuth
const BASE_URL =
  process.env.NODE_ENV === 'production'
    ? 'https://zoombackend-32ri.onrender.com' // your Render URL
    : 'http://localhost:5000';

router.get('/connect', (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).send('Missing token');

  const redirectUri = `${BASE_URL}/api/zoom/callback`;

  const zoomOAuthUrl = `https://zoom.us/oauth/authorize?response_type=code&client_id=${process.env.ZOOM_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${token}&prompt=login&scope=cloud_recording:read:list_user_recordings`;

  console.log('Zoom OAuth URL:', zoomOAuthUrl); // log for debugging
  res.redirect(zoomOAuthUrl);
});
// Step 2: OAuth callback - Zoom redirects here after auth
router.get('/callback', async (req, res) => {
  const { code, state } = req.query;
  console.log('--- Zoom OAuth callback ---');
  console.log('Code:', code);
  console.log('State:', state);

  if (!state) return res.status(400).send('Missing state token');
  if (!code) return res.status(400).send('Missing authorization code from Zoom');

  try {
    // Decode JWT to get teacher ID
    const decoded = jwt.verify(state, process.env.JWT_SECRET);
    const teacherId = decoded.id;

    // Exchange code for access token
    const tokenResponse = await axios.post(
      'https://zoom.us/oauth/token',
      qs.stringify({
        grant_type: 'authorization_code',
        code,
        redirect_uri: `${process.env.BASE_URL}/api/zoom/callback`
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${Buffer.from(
            `${process.env.ZOOM_CLIENT_ID}:${process.env.ZOOM_CLIENT_SECRET}`
          ).toString('base64')}`
        }
      }
    );

    const { access_token, refresh_token } = tokenResponse.data;

    // Get Zoom user info
    const userRes = await axios.get('https://api.zoom.us/v2/users/me', {
      headers: { Authorization: `Bearer ${access_token}` }
    });

    const zoomUser = userRes.data;

    // Save tokens and Zoom info in DB - match schema zoom_id
    await Teacher.findByIdAndUpdate(teacherId, {
      zoom: {
        connected: true,
        access_token,
        refresh_token,
        zoom_id: zoomUser.id,
        email: zoomUser.email
      }
    });

    // Redirect to frontend after success
    res.redirect(`${process.env.FRONTEND_URL}/users?zoom_connected=1`);
  } catch (err) {
    console.error('Zoom OAuth failed:', err.response?.data || err.message);
    res.status(500).send('Zoom OAuth failed');
  }
});

// Optional: fetch all teachers for preview
router.get('/users', async (req, res) => {
  console.log('Backend /users hit');
  const users = await Teacher.find({}, '-zoom.access_token -zoom.refresh_token');
  res.json(users);
});

module.exports = router;

