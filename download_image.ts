import fs from 'fs';
import https from 'https';

const url = "https://lngyxcbbsbqkooybipbj.supabase.co/storage/v1/object/public/ilmaura%20storage/Capture.PNG";
const dest = "assets/capture.png";

https.get(url, (res) => {
  const fileStream = fs.createWriteStream(dest);
  res.pipe(fileStream);
  fileStream.on('finish', () => {
    fileStream.close();
    console.log("Download finished");
  });
}).on('error', (err) => {
  console.error("Error downloading:", err.message);
});
