const https = require('https');

https.get('https://firebasestorage.googleapis.com/v0/b/qcc-online.firebasestorage.app/o?prefix=bingkai/qcc/', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => console.log(data));
}).on('error', err => console.log('Error: ', err.message));
