
const fs = require('fs');
const path = require('path');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // Clean up duplicates added by previous script
      content = content.replace(/dark:bg-slate-900\s+(dark:bg-slate-[0-9]+\/[0-9]+)/g, '$1');
      content = content.replace(/(dark:bg-slate-[0-9]+\/[0-9]+)\s+dark:bg-slate-900/g, '$1');
      content = content.replace(/dark:border-slate-700\s+(dark:border-slate-[0-9]+)/g, '$1');
      content = content.replace(/dark:bg-slate-[0-9]+\s+(dark:hover:bg-slate-[0-9]+)/g, '$1');
      content = content.replace(/dark:text-slate-[0-9]+\s+(dark:text-slate-[0-9]+)/g, '$1');
      content = content.replace(/dark:bg-slate-800\s+(dark:bg-slate-800)/g, '$1');
      content = content.replace(/dark:bg-slate-800\s+(hover:bg-slate-50)/g, '$1 dark:hover:bg-slate-700');
      content = content.replace(/hover:bg-slate-50\s+dark:bg-slate-800/g, 'hover:bg-slate-50 dark:hover:bg-slate-700');
      
      fs.writeFileSync(fullPath, content, 'utf8');
    }
  }
}

processDir('src');
console.log('Cleaned');
