const fs = require('fs');
const path = require('path');

const replacements = [
  { regex: /bg-zinc-950/g, replacement: 'bg-zinc-50 dark:bg-zinc-950' },
  { regex: /bg-zinc-900/g, replacement: 'bg-white dark:bg-zinc-900' },
  { regex: /bg-zinc-800/g, replacement: 'bg-zinc-100 dark:bg-zinc-800' },
  { regex: /bg-zinc-700/g, replacement: 'bg-zinc-200 dark:bg-zinc-700' },
  { regex: /border-zinc-800/g, replacement: 'border-zinc-200 dark:border-zinc-800' },
  { regex: /border-zinc-700/g, replacement: 'border-zinc-300 dark:border-zinc-700' },
  { regex: /text-white/g, replacement: 'text-zinc-900 dark:text-white' },
  { regex: /text-zinc-100/g, replacement: 'text-zinc-800 dark:text-zinc-100' },
  { regex: /text-zinc-200/g, replacement: 'text-zinc-700 dark:text-zinc-200' },
  { regex: /text-zinc-300/g, replacement: 'text-zinc-600 dark:text-zinc-300' },
  { regex: /text-zinc-400/g, replacement: 'text-zinc-500 dark:text-zinc-400' },
  { regex: /text-zinc-500/g, replacement: 'text-zinc-500 dark:text-zinc-400' }
];

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      // avoid replacing things twice if we run it multiple times
      if (content.includes('dark:bg-zinc-950')) continue;
      
      let modified = content;
      for (const { regex, replacement } of replacements) {
        modified = modified.replace(regex, replacement);
      }
      if (modified !== content) {
        fs.writeFileSync(fullPath, modified);
        console.log(`Updated ${fullPath}`);
      }
    }
  }
}

processDirectory(path.join(__dirname, 'src'));
