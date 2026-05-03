import * as fs from 'fs';
import * as path from 'path';

function walk(dir: string) {
  let results: string[] = [];
  const list = fs.readdirSync(dir);
  list.forEach((file) => {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(fullPath));
    } else {
      if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts') || fullPath.endsWith('.css')) {
        results.push(fullPath);
      }
    }
  });
  return results;
}

const files = walk('./src');
files.forEach((file) => {
  let content = fs.readFileSync(file, 'utf8');
  let newContent = content
    .replace(/text-kawaii-text/g, 'text-slate-800')
    .replace(/shadow-\[0_4px_10px_rgba\(255,179,198,0\.5\)\]/g, 'shadow-[0_4px_10px_rgba(79,70,229,0.2)]')
    .replace(/bg-indigo-300/g, 'bg-indigo-600')
    .replace(/bg-pink-100\/50/g, 'bg-slate-100/50')
    .replace(/shadow-pink-/g, 'shadow-indigo-')
    .replace(/from-pink-/g, 'from-slate-')
    .replace(/to-pink-/g, 'to-slate-');
    
  if (content !== newContent) {
    fs.writeFileSync(file, newContent, 'utf8');
    console.log(`Cleaned up ${file}`);
  }
});
