import fs from 'fs';
import path from 'path';

const dir = 'teacher/pages';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

for (const file of files) {
  const filePath = path.join(dir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  
  content = content.replace(/className=(["'])(.*?)\1/g, (match, quote, classes) => {
    let newClasses = classes;
    
    if (newClasses.includes('bg-white') && !newClasses.includes('dark:bg-')) {
      newClasses = newClasses.replace(/\bbg-white\b/g, 'bg-white dark:bg-slate-800');
    }
    
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
    
    if (newClasses.includes('text-gray-900') && !newClasses.includes('dark:text-')) {
      newClasses = newClasses.replace(/\btext-gray-900\b/g, 'text-gray-900 dark:text-white');
    }
    if (newClasses.includes('text-gray-800') && !newClasses.includes('dark:text-')) {
      newClasses = newClasses.replace(/\btext-gray-800\b/g, 'text-gray-800 dark:text-gray-100');
    }
    if (newClasses.includes('text-gray-700') && !newClasses.includes('dark:text-')) {
      newClasses = newClasses.replace(/\btext-gray-700\b/g, 'text-gray-700 dark:text-gray-200');
    }
    if (newClasses.includes('text-gray-600') && !newClasses.includes('dark:text-')) {
      newClasses = newClasses.replace(/\btext-gray-600\b/g, 'text-gray-600 dark:text-gray-300');
    }
    
    if (newClasses.includes('border-slate-200') && !newClasses.includes('dark:border-')) {
      newClasses = newClasses.replace(/\bborder-slate-200\b/g, 'border-slate-200 dark:border-slate-700');
    }
    if (newClasses.includes('border-slate-100') && !newClasses.includes('dark:border-')) {
      newClasses = newClasses.replace(/\bborder-slate-100\b/g, 'border-slate-100 dark:border-slate-800');
    }
    if (newClasses.includes('border-gray-200') && !newClasses.includes('dark:border-')) {
      newClasses = newClasses.replace(/\bborder-gray-200\b/g, 'border-gray-200 dark:border-slate-700');
    }
    if (newClasses.includes('border-gray-100') && !newClasses.includes('dark:border-')) {
      newClasses = newClasses.replace(/\bborder-gray-100\b/g, 'border-gray-100 dark:border-slate-800');
    }
    
    if (newClasses.includes('bg-slate-50') && !newClasses.includes('dark:bg-')) {
      newClasses = newClasses.replace(/\bbg-slate-50\b/g, 'bg-slate-50 dark:bg-slate-800/50');
    }
    if (newClasses.includes('bg-gray-50') && !newClasses.includes('dark:bg-')) {
      newClasses = newClasses.replace(/\bbg-gray-50\b/g, 'bg-gray-50 dark:bg-slate-800/50');
    }
    
    return `className=${quote}${newClasses}${quote}`;
  });
  
  if (content !== fs.readFileSync(filePath, 'utf8')) {
    fs.writeFileSync(filePath, content);
    console.log(`Updated ${file}`);
  }
}
