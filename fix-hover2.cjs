const fs = require('fs');
const path = require('path');

const file = 'src/pages/Inventory.tsx';
let c = fs.readFileSync(file, 'utf8');

c = c.replace(/disabled:hover:bg-zinc-50 dark:bg-zinc-950/g, 'disabled:hover:bg-zinc-50 dark:disabled:hover:bg-zinc-950')
     .replace(/disabled:hover:text-zinc-500 dark:text-zinc-400/g, 'disabled:hover:text-zinc-500 dark:disabled:hover:text-zinc-400');

fs.writeFileSync(file, c);
console.log('Fixed disabled styles');
