import fetch from 'node-fetch';

async function extractText() {
  const response = await fetch('https://lngyxcbbsbqkooybipbj.supabase.co/storage/v1/object/public/ilmaura%20storage/logs/Blue%20and%20White%20Modern%20School%20Registration%20Form%20A4.svg');
  let svg = await response.text();
  
  const attrRegex = /([a-z-]+)="([^"]+)"/g;
  let match;
  const attrs = new Set();
  while ((match = attrRegex.exec(svg)) !== null) {
    if (['id', 'class', 'name', 'label', 'title', 'aria-label'].includes(match[1])) {
      attrs.add(`${match[1]}=${match[2]}`);
    }
  }
  
  console.log("Extracted Attributes:", [...attrs].slice(0, 100));
}

extractText();
