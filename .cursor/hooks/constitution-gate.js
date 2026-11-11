#!/usr/bin/env node
/**
 * Constitution WON'T gate for tests/** and pages/**.
 *
 * afterFileEdit matchers filter tool type (Write), not paths — scope here via
 * file_path from stdin JSON. BLOCK (exit 2) on mechanical violations; ALLOW (0).
 */
'use strict';

const fs = require('fs');

const LOG = 'constitution-gate';

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

function isGatedPath(filePath) {
  const p = normalizePath(filePath);
  return /(^|\/)tests\//.test(p) || /(^|\/)pages\//.test(p);
}

function isUnderTests(filePath) {
  return /(^|\/)tests\//.test(normalizePath(filePath));
}

function allow(message) {
  process.stderr.write(`${LOG}: ALLOW ${message}\n`);
  process.exit(0);
}

function block(message) {
  process.stderr.write(`${LOG}: BLOCK ${message}\n`);
  process.exit(2);
}

function fail(message) {
  process.stderr.write(`${LOG}: ERROR ${message}\n`);
  process.exit(1);
}

// --- Weakened / removed expect( (tests/** only) ---

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

function scanWeakenedAssertions(filePath, afterText, edits) {
  if (!isUnderTests(filePath)) return [];

  const reasons = [];
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

  if (edits.length === 0) return reasons;

  const afterRaw = countExpect(afterText);
  const afterActive = countActive(afterText);
  const beforeRaw = afterRaw - newRaw + oldRaw;
  const beforeActive = afterActive - newActive + oldActive;

  if (beforeRaw > afterRaw) {
    reasons.push(`expect( count dropped from ${beforeRaw} to ${afterRaw}`);
  }
  if (commentedOut || (beforeRaw <= afterRaw && beforeActive > afterActive)) {
    reasons.push('an expect( was commented out or weakened');
  }
  return reasons;
}

// --- Full-file WON'T scans (tests/** and pages/**) ---

function scanWaitForTimeout(content) {
  if (/\bwaitForTimeout\s*\(/.test(content)) {
    return ['page.waitForTimeout / waitForTimeout is forbidden'];
  }
  return [];
}

function scanXPathLocators(content) {
  const reasons = [];
  const locatorRe = /\.locator\s*\(\s*(['"`])((?:\\.|(?!\1).)*)\1/g;
  let match;
  while ((match = locatorRe.exec(content)) !== null) {
    const selector = match[2];
    if (selector.includes('//') || /^xpath=/i.test(selector.trim())) {
      reasons.push(`XPath locator not allowed: ${JSON.stringify(selector.slice(0, 80))}`);
    }
  }
  if (/\blocator\s*\(\s*['"`]xpath=/i.test(content)) {
    reasons.push('xpath= locator prefix is forbidden');
  }
  return reasons;
}

function scanAnyType(content) {
  const reasons = [];
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('*')) continue;
    if (
      /:\s*any\b/.test(line) ||
      /\bas\s+any\b/.test(line) ||
      /<any>/.test(line) ||
      /Array<any>/.test(line)
    ) {
      reasons.push(`\`any\` type at line ${i + 1}`);
      break;
    }
  }
  return reasons;
}

const CREDENTIAL_PATTERNS = [
  { id: 'jwt', re: /['"]eyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_.-]+/ },
  { id: 'github_pat', re: /github_pat_[A-Za-z0-9_]+/ },
  { id: 'atlassian_pat', re: /ATATT[A-Za-z0-9+/=_-]{24,}/ },
  { id: 'cursor_key', re: /crsr_[A-Za-z0-9]{20,}/ },
  {
    id: 'literal_password',
    re: /(?:^|[^\w.])(?:password|PASSWORD)\s*[:=]\s*['"][^'"]{4,}['"]/m,
  },
];

function scanHardcodedCredentials(content) {
  const reasons = [];
  for (const { id, re } of CREDENTIAL_PATTERNS) {
    if (re.test(content)) {
      reasons.push(`hardcoded credential pattern (${id})`);
      break;
    }
  }
  return reasons;
}

function scanDescribeTags(content, filePath) {
  if (!isUnderTests(filePath)) return [];
  const reasons = [];
  if (/test\.describe\s*\(\s*['"`]@[\w-]+/.test(content)) {
    reasons.push('tag on test.describe() title — tag each test instead');
  }
  if (/test\.describe\s*\([^)]*,\s*\{[^}]*\btag\s*:/s.test(content)) {
    reasons.push('tag option on test.describe() — tag each test instead');
  }
  return reasons;
}

function scanContent(filePath, content) {
  return [
    ...scanWaitForTimeout(content),
    ...scanXPathLocators(content),
    ...scanAnyType(content),
    ...scanHardcodedCredentials(content),
    ...scanDescribeTags(content, filePath),
  ];
}

(async () => {
  let payload;
  try {
    const raw = await readStdin();
    if (!raw.trim()) fail('empty stdin');
    payload = JSON.parse(raw);
  } catch (err) {
    fail(`stdin JSON: ${err.message}`);
  }

  const filePath = payload.file_path || payload.filePath;
  if (!filePath || !isGatedPath(filePath)) {
    allow(filePath ? `${filePath} — outside tests/** and pages/**` : '(no file_path)');
  }

  let afterText;
  try {
    afterText = fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    fail(`cannot read ${filePath}: ${err.message}`);
  }

  const edits = Array.isArray(payload.edits) ? payload.edits : [];
  const reasons = [
    ...scanContent(filePath, afterText),
    ...scanWeakenedAssertions(filePath, afterText, edits),
  ];

  if (reasons.length > 0) {
    block(`${filePath} — ${reasons.join('; ')}`);
  }

  allow(`${filePath} — constitution WON'T checks passed`);
})();
