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
  
  // Make it more aesthetic by changing light slate to deep sleek darks
  content = content.replace(/dark:bg-slate-800\/50/g, 'dark:bg-[#0f172a]'); // Deep slate for secondary backgrounds
  content = content.replace(/dark:bg-slate-800/g, 'dark:bg-[#1e293b]'); // Lighter slate for cards
  content = content.replace(/dark:bg-slate-900/g, 'dark:bg-[#020617]'); // Slate 950 for deep elements
  
  content = content.replace(/dark:border-slate-800/g, 'dark:border-[#334155]'); 
  content = content.replace(/dark:border-slate-700/g, 'dark:border-[#1e293b]');

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${filePath}`);
  }
}

['teacher', 'student', 'principal_admin', 'mother_admin', 'components'].forEach(dir => {
  if (fs.existsSync(dir)) {
    processDirectory(dir);
  }
});

console.log('Done upgrading dark mode aesthetics.');
