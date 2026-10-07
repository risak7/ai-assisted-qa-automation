import fs from 'fs';
import path from 'path';

const root = path.resolve(import.meta.dirname, '..');
const resultsDir = path.join(root, 'test-results');

function walkPngs(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walkPngs(full, out);
    else if (entry.name.endsWith('.png')) out.push(full);
  }
  return out;
}

const args = process.argv.slice(2);
let pngs = walkPngs(resultsDir);

if (args[0] === '--latest') {
  pngs.sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
  const latestDir = pngs[0] ? path.dirname(pngs[0]) : '';
  pngs = latestDir ? walkPngs(latestDir) : [];
} else if (args[0]) {
  const fragment = args[0];
  pngs = pngs.filter((p) => p.includes(fragment));
}

process.stdout.write(pngs.join('\n'));
