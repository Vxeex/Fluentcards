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
      
      const replacements = {
        'text-slate-600': 'dark:text-slate-300',
        'text-slate-500': 'dark:text-slate-400',
        'text-slate-800': 'dark:text-slate-100',
        'text-slate-700': 'dark:text-slate-200',
        'text-indigo-600': 'dark:text-indigo-400',
        'text-indigo-500': 'dark:text-indigo-400',
        'bg-slate-50': 'dark:bg-slate-800',
        'bg-slate-100': 'dark:bg-slate-800',
        'bg-white': 'dark:bg-slate-900',
        'border-slate-200': 'dark:border-slate-700',
        'border-slate-300': 'dark:border-slate-600',
        'border-slate-400': 'dark:border-slate-500',
        'text-slate-400': 'dark:text-slate-500'
      };

      for (const [key, value] of Object.entries(replacements)) {
        const regex = new RegExp('([^a-zA-Z0-9:-])(' + key + ')(?![-a-zA-Z0-9])', 'g');
        content = content.replace(regex, (match, prefix, matchKey) => {
           if (prefix.endsWith('dark:')) return match;
           if (prefix.endsWith('hover:')) return match; 
           if (prefix.endsWith('focus:')) return match;
           
           // If the file already contains this value closely, we might skip, but let's replace anyways
           return prefix + matchKey + ' ' + value;
        });
      }

      // Deduplicate
      for (const value of Object.values(replacements)) {
          // Because they could be separated by other classes, simple consecutive deduplication might not catch everything
          // But consecutive is the most common result of our replacements
          const doubleValueRegex = new RegExp(value + '\\s+' + value, 'g');
          content = content.replace(doubleValueRegex, value);
      }
      
      fs.writeFileSync(fullPath, content, 'utf8');
    }
  }
}

processDir('src');
console.log('Done script');
