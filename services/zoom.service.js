// services/zoom.service.js
const axios = require("axios");
const Teacher = require("../models/Teacher");

async function refreshZoomToken(teacher) {
  try {
    const res = await axios.post("https://zoom.us/oauth/token", null, {
      params: {
        grant_type: "refresh_token",
        refresh_token: teacher.zoom.refresh_token,
      },
      auth: {
        username: process.env.ZOOM_CLIENT_ID,
        password: process.env.ZOOM_CLIENT_SECRET,
      },
    });

    const { access_token, refresh_token, expires_in } = res.data;

    teacher.zoom.access_token = access_token;
    teacher.zoom.refresh_token = refresh_token;
    teacher.zoom.token_expires_at = new Date(Date.now() + expires_in * 1000);
    await teacher.save();

    console.log(`🔄 Zoom token refreshed for ${teacher.name}`);
    return access_token;
  } catch (err) {
    console.error(
      `❌ Failed to refresh Zoom token for ${teacher.name}:`,
      err.response?.data || err.message
    );
    throw err;
  }
}

/**
 * Fetch recordings for a teacher
 * @param {Object} teacher - Teacher document
 * @param {string} from - ISO date string, optional (fetch from this date)
 * @returns Array of recordings
 */
async function fetchRecordings(teacher, from = null) {
  let accessToken = teacher.zoom.access_token;

  try {
    const params = {};
    if (from) params.from = from;

    const res = await axios.get(
      `https://api.zoom.us/v2/users/${teacher.zoom.zoom_id}/recordings`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        params,
      }
    );

    return res.data.recordings || [];
  } catch (err) {
    // Token expired
    if (err.response?.status === 401 || err.response?.data?.code === 124) {
      console.log(`⚠ Access token expired for ${teacher.name}, refreshing...`);
      accessToken = await refreshZoomToken(teacher);

      // Retry after refresh
      const retryRes = await axios.get(
        `https://api.zoom.us/v2/users/${teacher.zoom.zoom_id}/recordings`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          params: from ? { from } : {},
        }
      );
      return retryRes.data.recordings || [];
    }

    console.error(
      `❌ Zoom API error for ${teacher.name}:`,
      err.response?.data || err.message
    );
    return [];
  }
}

module.exports = { fetchRecordings };