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
    .replace(/bg-slate-500/g, 'bg-indigo-700')
    .replace(/bg-slate-50/g, 'bg-slate-50') // noop
    .replace(/bg-slate-50\/80/g, 'bg-slate-50/80') // noop
    // also need to change text-slate-400 to text-slate-500 if we want better contrast
    // wait, any other substrings?
    // "text-indigo-400" -> "text-slate-600"
    // "text-slate-6000" doesn't exist
    // "border-indigo-100" -> "border-slate-200"
    // "border-slate-2000" doesn't exist
    
  if (content !== newContent) {
    fs.writeFileSync(file, newContent, 'utf8');
    console.log(`Fixed ${file}`);
  }
});
