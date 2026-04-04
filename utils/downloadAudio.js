const axios = require("axios");
const fs = require("fs");
const path = require("path");

module.exports = async function downloadAudio(audioUrl, token, localPath) {
  try {
    const response = await axios({
      url: audioUrl,
      method: "GET",
      responseType: "stream",
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const writer = fs.createWriteStream(localPath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on("finish", resolve);
      writer.on("error", reject);
    });
  } catch (err) {
    console.error("Download failed:", err.message);
    throw err;
  }
};

