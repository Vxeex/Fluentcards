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
    .replace(/pink-/g, 'indigo-')
    .replace(/rounded-3xl/g, 'rounded-xl')
    .replace(/rounded-2xl/g, 'rounded-lg')
    .replace(/rounded-\[40px\]/g, 'rounded-2xl')
    .replace(/rounded-\[32px\]/g, 'rounded-xl')
    .replace(/ \u2728/g, '') // Sparkles ✨
    .replace(/ \uD83C\uDF38/g, '') // Cherry blossom 🌸
    .replace(/ \uD83C\uDF31/g, '') // Seedling 🌱
    .replace(/ \uD83D\uDCDA/g, '') // Books 📚
    .replace(/\u2728/g, '')
    .replace(/\uD83C\uDF38/g, '')
    .replace(/\uD83C\uDF31/g, '')
    .replace(/\uD83D\uDCDA/g, '')
    .replace(/bg-indigo-50/g, 'bg-slate-50')
    .replace(/text-indigo-400/g, 'text-slate-600')
    .replace(/text-indigo-500/g, 'text-slate-800')
    .replace(/text-slate-600 hover:text-slate-800/g, 'text-slate-600 hover:text-slate-900')
    .replace(/bg-indigo-400/g, 'bg-indigo-600')
    .replace(/bg-indigo-500/g, 'bg-indigo-700')
    .replace(/border-indigo-100/g, 'border-slate-200')
    .replace(/border-indigo-200/g, 'border-slate-300')
    .replace(/border-indigo-300/g, 'border-slate-400')
    .replace(/border-indigo-400/g, 'border-indigo-500')
    .replace(/border-indigo-500/g, 'border-indigo-600')
    .replace(/text-indigo-300/g, 'text-slate-400')
    .replace(/focus:ring-indigo-300/g, 'focus:ring-indigo-500')
    .replace(/focus:ring-indigo-400/g, 'focus:ring-indigo-500')
    .replace(/focus:border-indigo-400/g, 'focus:border-indigo-500');

  if (content !== newContent) {
    fs.writeFileSync(file, newContent, 'utf8');
    console.log(`Updated ${file}`);
  }
});
