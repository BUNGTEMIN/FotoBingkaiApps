const https = require('https');
https.get('https://storage.googleapis.com/sarmiento-prd-1/1000/2026-06-04/1717533578709592.png', (res) => {
  console.log("Status:", res.statusCode);
}).on('error', (e) => {
  console.error("Error:", e);
});
