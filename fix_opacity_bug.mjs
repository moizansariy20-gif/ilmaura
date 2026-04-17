import fs from 'fs';
import path from 'path';

function processDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      processDirectory(fullPath);
    } else if (entry.isFile() && fullPath.endsWith('.tsx')) {
      processFile(fullPath);
    }
  }
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let originalContent = content;
  
  // Replace bg-white dark:bg-slate-800/XX with bg-white/XX dark:bg-slate-800/XX
  content = content.replace(/bg-white dark:bg-slate-800\/(\d+)/g, 'bg-white/$1 dark:bg-slate-800/$1');
  
  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
    console.log(`Fixed opacity bug in ${filePath}`);
  }
}

['teacher', 'student', 'principal_admin', 'mother_admin', 'components'].forEach(dir => {
  if (fs.existsSync(dir)) {
    processDirectory(dir);
  }
});
