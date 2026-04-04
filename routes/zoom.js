// zoomRoutes.js
const express = require('express');
const router = express.Router();
const axios = require('axios');
const Teacher = require('../models/Teacher');
const jwt = require('jsonwebtoken');
const qs = require('querystring');

// --------------------
// BASE_URL (local / prod)
const BASE_URL =
  process.env.NODE_ENV === 'production'
    ? 'https://zoombackend-32ri.onrender.com' // Your Render backend URL
    : 'http://localhost:5000';

router.get('/connect', (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).send('Missing token');

  const redirectUri = `${BASE_URL}/api/zoom/callback`;

  const zoomOAuthUrl = `https://zoom.us/oauth/authorize?response_type=code&client_id=${process.env.ZOOM_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${token}&prompt=consent&scope=cloud_recording:read:list_user_recordings`;

  console.log('[Zoom Connect] OAuth URL:', zoomOAuthUrl);
  res.redirect(zoomOAuthUrl);
});

router.get('/callback', async (req, res) => {
  const { code, state } = req.query;

  console.log('--- Zoom OAuth Callback ---');
  console.log('Code:', code);
  console.log('State:', state);

  // Default redirect to dashboard
  const dashboardUrl = `${process.env.FRONTEND_URL}/users`;

  if (!state || !code) {
    console.error('[Zoom OAuth Failed]: Missing code or state');
    // Redirect with failure param
    return res.redirect(`${dashboardUrl}?zoom_connected=0`);
  }

  try {
    // Decode JWT to get teacher ID
    const decoded = jwt.verify(state, process.env.JWT_SECRET);
    const teacherId = decoded.id;

    const redirectUri = `${BASE_URL}/api/zoom/callback`; // MUST match /connect

    // Exchange code for access token
    const tokenResponse = await axios.post(
      'https://zoom.us/oauth/token',
      qs.stringify({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri
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

    // Save tokens and Zoom info in DB
    await Teacher.findByIdAndUpdate(teacherId, {
      zoom: {
        connected: true,
        access_token,
        refresh_token,
        zoom_id: zoomUser.id,
        email: zoomUser.email
      }
    });

    console.log(`[Zoom Callback] Teacher ${teacherId} connected Zoom account: ${zoomUser.email}`);

    // Redirect to frontend dashboard after success
    res.redirect(`${dashboardUrl}?zoom_connected=1`);
  } catch (err) {
    console.error('[Zoom OAuth Failed]:', err.response?.data || err.message);
    // Redirect to dashboard with failure param
    res.redirect(`${dashboardUrl}?zoom_connected=0`);
  }
});

// 3️⃣ Fetch all teachers (for preview / admin)
router.get('/users', async (req, res) => {
  try {
    console.log('[Backend] /users hit');
    const users = await Teacher.find({}, '-zoom.access_token -zoom.refresh_token');
    res.json(users);
  } catch (err) {
    console.error('[Backend /users Error]:', err.message);
    res.status(500).send('Failed to fetch users');
  }
});

module.exports = router;