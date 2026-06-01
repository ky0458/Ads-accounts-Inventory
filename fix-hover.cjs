const fs = require('fs');
const path = require('path');

const replacements = [
  { regex: /hover:bg-zinc-100 dark:bg-zinc-800/g, replacement: 'hover:bg-zinc-100 dark:hover:bg-zinc-800' },
  { regex: /hover:text-zinc-900 dark:text-white/g, replacement: 'hover:text-zinc-900 dark:hover:text-white' },
  { regex: /hover:text-zinc-800 dark:text-zinc-100/g, replacement: 'hover:text-zinc-800 dark:hover:text-zinc-100' },
  { regex: /hover:text-zinc-700 dark:text-zinc-200/g, replacement: 'hover:text-zinc-700 dark:hover:text-zinc-200' },
  { regex: /hover:border-zinc-300 dark:border-zinc-700/g, replacement: 'hover:border-zinc-300 dark:hover:border-zinc-700' },
  { regex: /hover:bg-zinc-200 dark:bg-zinc-700/g, replacement: 'hover:bg-zinc-200 dark:hover:bg-zinc-700' },
  { regex: /dark:text-zinc-400 dark:text-zinc-400/g, replacement: 'dark:text-zinc-400' },
  { regex: /hover:bg-white dark:bg-zinc-900/g, replacement: 'hover:bg-white dark:hover:bg-zinc-900' }
];

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
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
