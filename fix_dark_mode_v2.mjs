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
  
  // Replace in className strings
  content = content.replace(/className=(["'])(.*?)\1/g, (match, quote, classes) => {
    let newClasses = classes;
    
    // bg-white -> bg-white dark:bg-slate-800
    if (newClasses.includes('bg-white') && !newClasses.includes('dark:bg-')) {
      newClasses = newClasses.replace(/\bbg-white\b/g, 'bg-white dark:bg-slate-800');
    }
    
    // bg-[#FCFBF8] -> bg-[#FCFBF8] dark:bg-slate-900
    if (newClasses.includes('bg-[#FCFBF8]') && !newClasses.includes('dark:bg-')) {
      newClasses = newClasses.replace(/bg-\[#FCFBF8\]/g, 'bg-[#FCFBF8] dark:bg-slate-900');
    }
    
    // text-[#6B1D2F] -> text-[#6B1D2F] dark:text-white (or dark:text-[#D4AF37] if it's a heading, but white is safer)
    if (newClasses.includes('text-[#6B1D2F]') && !newClasses.includes('dark:text-')) {
      newClasses = newClasses.replace(/text-\[#6B1D2F\]/g, 'text-[#6B1D2F] dark:text-white');
    }
    
    // border-[#E5E0D8] -> border-[#E5E0D8] dark:border-slate-700
    if (newClasses.includes('border-[#E5E0D8]') && !newClasses.includes('dark:border-')) {
      newClasses = newClasses.replace(/border-\[#E5E0D8\]/g, 'border-[#E5E0D8] dark:border-slate-700');
    }
    
    // border-[#6B1D2F]/10 -> border-[#6B1D2F]/10 dark:border-slate-700
    if (newClasses.includes('border-[#6B1D2F]/10') && !newClasses.includes('dark:border-')) {
      newClasses = newClasses.replace(/border-\[#6B1D2F\]\/10/g, 'border-[#6B1D2F]/10 dark:border-slate-700');
    }

    // text-[#A89F91] -> text-[#A89F91] dark:text-slate-400
    if (newClasses.includes('text-[#A89F91]') && !newClasses.includes('dark:text-')) {
      newClasses = newClasses.replace(/text-\[#A89F91\]/g, 'text-[#A89F91] dark:text-slate-400');
    }
    
    // text-slate-900 -> text-slate-900 dark:text-white
    if (newClasses.includes('text-slate-900') && !newClasses.includes('dark:text-')) {
      newClasses = newClasses.replace(/\btext-slate-900\b/g, 'text-slate-900 dark:text-white');
    }
    if (newClasses.includes('text-slate-800') && !newClasses.includes('dark:text-')) {
      newClasses = newClasses.replace(/\btext-slate-800\b/g, 'text-slate-800 dark:text-slate-100');
    }
    if (newClasses.includes('text-slate-700') && !newClasses.includes('dark:text-')) {
      newClasses = newClasses.replace(/\btext-slate-700\b/g, 'text-slate-700 dark:text-slate-200');
    }
    if (newClasses.includes('text-slate-600') && !newClasses.includes('dark:text-')) {
      newClasses = newClasses.replace(/\btext-slate-600\b/g, 'text-slate-600 dark:text-slate-300');
    }
    if (newClasses.includes('text-slate-500') && !newClasses.includes('dark:text-')) {
      newClasses = newClasses.replace(/\btext-slate-500\b/g, 'text-slate-500 dark:text-slate-400');
    }
    
    if (newClasses.includes('border-slate-200') && !newClasses.includes('dark:border-')) {
      newClasses = newClasses.replace(/\bborder-slate-200\b/g, 'border-slate-200 dark:border-slate-700');
    }
    if (newClasses.includes('border-slate-100') && !newClasses.includes('dark:border-')) {
      newClasses = newClasses.replace(/\bborder-slate-100\b/g, 'border-slate-100 dark:border-slate-800');
    }
    
    if (newClasses.includes('bg-slate-50') && !newClasses.includes('dark:bg-')) {
      newClasses = newClasses.replace(/\bbg-slate-50\b/g, 'bg-slate-50 dark:bg-slate-800/50');
    }
    
    return `className=${quote}${newClasses}${quote}`;
  });
  
  // Also replace in template literals like `bg-white ${...}`
  content = content.replace(/(`.*?`)/g, (match) => {
    let newMatch = match;
    if (newMatch.includes('bg-white') && !newMatch.includes('dark:bg-')) {
      newMatch = newMatch.replace(/\bbg-white\b/g, 'bg-white dark:bg-slate-800');
    }
    if (newMatch.includes('bg-[#FCFBF8]') && !newMatch.includes('dark:bg-')) {
      newMatch = newMatch.replace(/bg-\[#FCFBF8\]/g, 'bg-[#FCFBF8] dark:bg-slate-900');
    }
    if (newMatch.includes('text-[#6B1D2F]') && !newMatch.includes('dark:text-')) {
      newMatch = newMatch.replace(/text-\[#6B1D2F\]/g, 'text-[#6B1D2F] dark:text-white');
    }
    if (newMatch.includes('border-[#E5E0D8]') && !newMatch.includes('dark:border-')) {
      newMatch = newMatch.replace(/border-\[#E5E0D8\]/g, 'border-[#E5E0D8] dark:border-slate-700');
    }
    if (newMatch.includes('border-[#6B1D2F]/10') && !newMatch.includes('dark:border-')) {
      newMatch = newMatch.replace(/border-\[#6B1D2F\]\/10/g, 'border-[#6B1D2F]/10 dark:border-slate-700');
    }
    if (newMatch.includes('text-[#A89F91]') && !newMatch.includes('dark:text-')) {
      newMatch = newMatch.replace(/text-\[#A89F91\]/g, 'text-[#A89F91] dark:text-slate-400');
    }
    if (newMatch.includes('text-slate-900') && !newMatch.includes('dark:text-')) {
      newMatch = newMatch.replace(/\btext-slate-900\b/g, 'text-slate-900 dark:text-white');
    }
    if (newMatch.includes('text-slate-800') && !newMatch.includes('dark:text-')) {
      newMatch = newMatch.replace(/\btext-slate-800\b/g, 'text-slate-800 dark:text-slate-100');
    }
    if (newMatch.includes('text-slate-700') && !newMatch.includes('dark:text-')) {
      newMatch = newMatch.replace(/\btext-slate-700\b/g, 'text-slate-700 dark:text-slate-200');
    }
    if (newMatch.includes('text-slate-600') && !newMatch.includes('dark:text-')) {
      newMatch = newMatch.replace(/\btext-slate-600\b/g, 'text-slate-600 dark:text-slate-300');
    }
    if (newMatch.includes('text-slate-500') && !newMatch.includes('dark:text-')) {
      newMatch = newMatch.replace(/\btext-slate-500\b/g, 'text-slate-500 dark:text-slate-400');
    }
    return newMatch;
  });

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
