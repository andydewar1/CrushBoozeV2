/**
 * Repair StyleSheet.create: ensure every text-like style object has fontFamily: FONT_FAMILY_UI.
 * Skips // comments between keys. Idempotent if fontFamily already present in block.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function repairFile(absPath) {
  let s = fs.readFileSync(absPath, 'utf8');
  if (!s.includes('StyleSheet.create')) return false;
  if (!s.includes('FONT_FAMILY_UI')) return false;

  const m = s.match(/StyleSheet\.create\(\{/);
  if (!m) return false;
  const start = m.index + 'StyleSheet.create('.length;
  if (s[start] !== '{') return false;

  let depth = 0;
  let i = start;
  while (i < s.length) {
    const c = s[i];
    if (c === '{') depth += 1;
    else if (c === '}') {
      depth -= 1;
      if (depth === 0) {
        var end = i + 1;
        break;
      }
    }
    i += 1;
  }
  if (end === undefined) return false;

  const pre = s.slice(0, start);
  const inner = s.slice(start, end);
  const post = s.slice(end);

  function injectFont(block) {
    if (block.includes('fontFamily:') || block.includes('fontFamily :')) return block;
    if (!['fontSize', 'fontWeight', 'lineHeight', 'letterSpacing', 'textAlign'].some((k) => block.includes(k)))
      return block;
    const innerB = block.slice(1, -1);
    const mm = innerB.match(/\n(\s+)(?=\S)/);
    const indent = mm ? mm[1] : '    ';
    return '{' + '\n' + indent + 'fontFamily: FONT_FAMILY_UI,' + innerB + '\n}';
  }

  function extractBlock(text, openIdx) {
    let d = 0;
    let j = openIdx;
    while (j < text.length) {
      if (text[j] === '{') d += 1;
      else if (text[j] === '}') {
        d -= 1;
        if (d === 0) return [text.slice(openIdx, j + 1), j + 1];
      }
      j += 1;
    }
    throw new Error('unbalanced');
  }

  const body = inner.slice(1, -1);
  const out = ['{'];
  let pos = 0;
  const n = body.length;
  while (pos < n) {
    while (pos < n && /[\s,]/.test(body[pos])) {
      out.push(body[pos]);
      pos += 1;
    }
    if (pos >= n) break;
    if (pos + 1 < n && body.slice(pos, pos + 2) === '//') {
      const le = body.indexOf('\n', pos);
      if (le === -1) {
        out.push(body.slice(pos));
        pos = n;
        break;
      }
      out.push(body.slice(pos, le + 1));
      pos = le + 1;
      continue;
    }
    const km = body.slice(pos).match(/^([A-Za-z0-9_$]+)\s*:\s*/);
    if (!km) {
      out.push(body.slice(pos));
      break;
    }
    out.push(body.slice(pos, pos + km[0].length));
    pos += km[0].length;
    while (pos < n && /[\s\n]/.test(body[pos])) {
      out.push(body[pos]);
      pos += 1;
    }
    if (pos >= n) break;
    if (body[pos] !== '{') {
      let d = 0;
      const st = pos;
      while (pos < n) {
        const c = body[pos];
        if (c === '(') {
          let p = 1;
          pos += 1;
          while (pos < n && p > 0) {
            if (body[pos] === '(') p += 1;
            else if (body[pos] === ')') p -= 1;
            pos += 1;
          }
          continue;
        }
        if (c === '{') d += 1;
        else if (c === '}') d -= 1;
        else if (c === ',' && d === 0) {
          out.push(body.slice(st, pos));
          out.push(',');
          pos += 1;
          break;
        }
        pos += 1;
      }
      if (pos >= n || body[pos - 1] !== ',') out.push(body.slice(st, pos));
      continue;
    }
    const [blk, npos] = extractBlock(body, pos);
    out.push(injectFont(blk));
    pos = npos;
  }
  out.push('}');
  const newInner = out.join('');
  if (newInner === inner) return false;
  if (newInner.split('{').length !== newInner.split('}').length) {
    console.error('brace mismatch', absPath);
    return false;
  }
  fs.writeFileSync(absPath, pre + newInner + post, 'utf8');
  return true;
}

const targets = process.argv.slice(2);
if (!targets.length) {
  console.error('usage: node repair-stylesheet-fonts.mjs <files...>');
  process.exit(1);
}
for (const t of targets) {
  const abs = path.isAbsolute(t) ? t : path.join(__dirname, '..', t);
  if (repairFile(abs)) console.log('repaired', t);
}
