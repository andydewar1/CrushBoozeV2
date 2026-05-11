import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');
const IMPORT_LINE = `import { FONT_FAMILY_UI } from '@/lib/typography';`;

function walk(dir, acc = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name.startsWith('.') || e.name === 'node_modules') continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, acc);
    else if (e.name.endsWith('.tsx') || e.name.endsWith('.ts')) acc.push(p);
  }
  return acc;
}

function ensureImport(content) {
  if (!content.includes('FONT_FAMILY_UI')) return content;
  if (content.includes(IMPORT_LINE) || content.includes("from \"@/lib/typography\"")) return content;

  const patterns = [/from\s+['"]react-native['"];/m, /from\s+['"]react-native\/[^'"]+['"];/];
  let insertAfter = -1;
  for (const re of patterns) {
    const m = content.match(re);
    if (m && m.index !== undefined) {
      insertAfter = m.index + m[0].length;
      break;
    }
  }
  if (insertAfter === -1) {
    const nl = content.indexOf('\n');
    return (nl === -1 ? content + '\n' : content.slice(0, nl + 1)) + IMPORT_LINE + '\n' + (nl === -1 ? '' : content.slice(nl + 1));
  }
  return content.slice(0, insertAfter) + '\n' + IMPORT_LINE + content.slice(insertAfter);
}

function main() {
  let n = 0;
  for (const dir of ['app', 'components', 'contexts']) {
    const base = path.join(ROOT, dir);
    if (!fs.existsSync(base)) continue;
    for (const f of walk(base)) {
      let c = fs.readFileSync(f, 'utf8');
      const next = ensureImport(c);
      if (next !== c) {
        fs.writeFileSync(f, next, 'utf8');
        console.log('import added', path.relative(ROOT, f));
        n++;
      }
    }
  }
  console.log('total', n);
}
main();
