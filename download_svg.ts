import fs from 'fs';
import https from 'https';

const url = "https://lngyxcbbsbqkooybipbj.supabase.co/storage/v1/object/public/ilmaura%20storage/converted-image.svg";
const dest = "public/logo.svg";

https.get(url, (res) => {
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  res.on('end', () => {
    fs.writeFileSync(dest, data);
    console.log("SVG Download finished");
  });
}).on('error', (err) => {
  console.error("Error downloading:", err.message);
});
