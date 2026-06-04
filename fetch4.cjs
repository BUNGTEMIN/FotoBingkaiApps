const https = require('https');

const names = [
  '1.png', '2.png', '3.png', '4.png', '5.png', '6.png', '7.png', '8.png',
  'frame1.png', 'frame2.png', 'frame3.png', 'frame4.png',
  'bingkai1.png', 'bingkai2.png', 'bingkai3.png', 'bingkai4.png',
  '01.png', '02.png', '03.png', '04.png',
  '1.jpg', '2.jpg', 'frame1.jpg'
];

names.forEach(name => {
  const url = `https://firebasestorage.googleapis.com/v0/b/qcc-online.firebasestorage.app/o/bingkai%2Fqcc%2F${name}?alt=media`;
  https.get(url, (res) => {
    if (res.statusCode === 200) {
      console.log('FOUND:', name);
    }
  });
});
