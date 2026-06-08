const axios = require('axios');
const fs = require('fs');

async function testDriveUpload() {
  try {
    const res = await axios.get('https://dev.bungtemin.net/api/drive/list');
    console.log("Drive List:", res.data);
  } catch (err) {
    console.error("List failed:", err.message);
  }
}

testDriveUpload();
