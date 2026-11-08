#!/usr/bin/env node
/**
 * Block test edits that weaken assertions.
 *
 * afterFileEdit matchers are compared to the tool name "Write", not the
 * file path. This script applies the tests/** scope: any other path is allowed.
 *
 * BLOCK (exit 2) when the edit has fewer expect( occurrences than before,
 * or an expect( that was live code is now inside a comment.
 * ALLOW (exit 0) otherwise.
 */
'use strict';

const fs = require('fs');

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf8');
}

function normalizePath(filePath) {
  return String(filePath || '').replace(/\\/g, '/');
}

/** tests/** — any file under a tests directory. */
function isUnderTests(filePath) {
  return /(^|\/)tests\//.test(normalizePath(filePath));
}

function countExpect(source) {
  const matches = String(source).match(/expect\(/g);
  return matches ? matches.length : 0;
}

function statementKey(line) {
  let key = line.replace(/\r/g, '').trim().replace(/\s+/g, ' ');
  for (let i = 0; i < 3; i++) {
    const next = key
      .replace(/^\/\/\s?/, '')
      .replace(/^\/\*\s?/, '')
      .replace(/^\*\s?/, '')
      .replace(/\*\/$/, '')
      .trim();
    if (next === key) break;
    key = next;
  }
  return key;
}

function pushExpects(list, key, text) {
  const count = countExpect(text);
  for (let i = 0; i < count; i++) list.push(key);
}

/**
 * Split expect( calls into live code vs comments.
 * Strings are skipped so a URL's "//" is not treated as a comment.
 */
function collectExpects(source) {
  const active = [];
  const commented = [];
  let inBlock = false;

  for (const raw of String(source).split('\n')) {
    const line = raw.replace(/\r$/, '');
    const key = statementKey(line);
    let i = 0;
    let inLineComment = false;

    while (i < line.length) {
      if (inBlock) {
        const end = line.indexOf('*/', i);
        if (end === -1) {
          pushExpects(commented, key, line.slice(i));
          i = line.length;
          break;
        }
        pushExpects(commented, key, line.slice(i, end));
        inBlock = false;
        i = end + 2;
        continue;
      }

      if (inLineComment) {
        pushExpects(commented, key, line.slice(i));
        break;
      }

      const two = line.slice(i, i + 2);
      if (two === '//') {
        inLineComment = true;
        i += 2;
        continue;
      }
      if (two === '/*') {
        inBlock = true;
        i += 2;
        continue;
      }

      const quote = line[i];
      if (quote === '"' || quote === "'" || quote === '`') {
        i += 1;
        while (i < line.length) {
          if (line[i] === '\\') {
            i += 2;
            continue;
          }
          if (line[i] === quote) {
            i += 1;
            break;
          }
          i += 1;
        }
        continue;
      }

      if (line.startsWith('expect(', i)) {
        active.push(key);
        i += 'expect('.length;
        continue;
      }

      i += 1;
    }
  }

  return { active, commented };
}

function countActive(source) {
  return collectExpects(source).active.length;
}

function multiset(keys) {
  const counts = new Map();
  for (const key of keys) counts.set(key, (counts.get(key) || 0) + 1);
  return counts;
}

/** True when a previously live expect( line is now commented. */
function expectWasCommentedOut(before, after) {
  const oldExpects = collectExpects(before);
  const newExpects = collectExpects(after);
  const stillLive = multiset(newExpects.active);
  const nowCommented = multiset(newExpects.commented);

  for (const key of oldExpects.active) {
    const live = stillLive.get(key) || 0;
    if (live > 0) {
      stillLive.set(key, live - 1);
      continue;
    }
    const commented = nowCommented.get(key) || 0;
    if (commented > 0) return true;
  }
  return false;
}

function editText(edit, field) {
  const value = edit && edit[field];
  return typeof value === 'string' ? value : '';
}

function allow(message) {
  process.stderr.write(`block-weakened-assertions: ALLOW ${message}\n`);
  process.exit(0);
}

function block(message) {
  process.stderr.write(`block-weakened-assertions: BLOCK ${message}\n`);
  process.exit(2);
}

(async () => {
  let payload;
  try {
    const raw = await readStdin();
    if (!raw.trim()) {
      process.stderr.write('block-weakened-assertions: empty stdin\n');
      process.exit(1);
    }
    payload = JSON.parse(raw);
  } catch (err) {
    process.stderr.write(
      `block-weakened-assertions: failed to parse stdin JSON: ${err.message}\n`
    );
    process.exit(1);
  }

  const filePath = payload.file_path || payload.filePath;
  if (!filePath || !isUnderTests(filePath)) {
    allow(filePath ? `${filePath} — outside tests/**` : '(no file_path)');
  }

  let afterText;
  try {
    afterText = fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    process.stderr.write(
      `block-weakened-assertions: cannot read ${filePath}: ${err.message}\n`
    );
    process.exit(1);
  }

  const edits = Array.isArray(payload.edits) ? payload.edits : [];
  let oldRaw = 0;
  let newRaw = 0;
  let oldActive = 0;
  let newActive = 0;
  let commentedOut = false;

  for (const edit of edits) {
    const before = editText(edit, 'old_string');
    const after = editText(edit, 'new_string');
    oldRaw += countExpect(before);
    newRaw += countExpect(after);
    oldActive += countActive(before);
    newActive += countActive(after);
    if (!commentedOut && expectWasCommentedOut(before, after)) {
      commentedOut = true;
    }
  }

  const afterRaw = countExpect(afterText);
  const afterActive = countActive(afterText);
  const beforeRaw = afterRaw - newRaw + oldRaw;
  const beforeActive = afterActive - newActive + oldActive;

  const reasons = [];
  if (beforeRaw > afterRaw) {
    reasons.push(`expect( count dropped from ${beforeRaw} to ${afterRaw}`);
  }
  if (commentedOut || (beforeRaw <= afterRaw && beforeActive > afterActive)) {
    reasons.push('an expect( was commented out');
  }

  if (reasons.length > 0) {
    block(`${filePath} — ${reasons.join('; ')}`);
  }

  allow(
    `${filePath} — expect( count unchanged (${afterRaw}); assertions not weakened`
  );
})();
