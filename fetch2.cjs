const https = require('https');

https.get('https://firebasestorage.googleapis.com/v0/b/qcc-online.firebasestorage.app/o/bingkai%2Fqcc%2Fframe1.png?alt=media', (res) => {
  console.log('Status: ', res.statusCode);
}).on('error', err => console.log('Error: ', err.message));
