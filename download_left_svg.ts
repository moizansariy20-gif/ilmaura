import fs from 'fs';

const url = "https://lngyxcbbsbqkooybipbj.supabase.co/storage/v1/object/public/ilmaura%20storage/converted-image%20(1).svg";
const dest = "public/left-image.svg";

fetch(url)
  .then(res => res.text())
  .then(data => {
    fs.writeFileSync(dest, data);
    console.log("Left SVG Download finished");
  })
  .catch(err => console.error("Error downloading:", err));
