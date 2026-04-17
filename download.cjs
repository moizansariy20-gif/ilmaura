const fs = require('fs');
const https = require('https');

const url = 'https://lngyxcbbsbqkooybipbj.supabase.co/storage/v1/object/public/ilmaura%20storage/profiles/Smart%20mascot%20with%20graduation%20gear.png';
const dest = './public/ilmaura-mascot.png';

https.get(url, {
  headers: {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
    'Referer': 'https://www.imghippo.com/'
  }
}, (res) => {
  if (res.statusCode === 200) {
    const file = fs.createWriteStream(dest);
    res.pipe(file);
    file.on('finish', () => {
      file.close();
      const stats = fs.statSync(dest);
      console.log(`Download completed successfully. File size: ${stats.size} bytes`);
    });
  } else if (res.statusCode === 301 || res.statusCode === 302) {
    console.log('Redirected to:', res.headers.location);
    https.get(res.headers.location, (redirectRes) => {
      const file = fs.createWriteStream(dest);
      redirectRes.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log('Redirect Download completed successfully.');
      });
    });
  } else {
    console.log('Failed with status:', res.statusCode);
  }
}).on('error', (err) => {
  console.error('Error:', err.message);
});
