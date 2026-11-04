#!/usr/bin/env node
/**
 * Generation gate for Playwright specs under tests/**.
 * BLOCK (exit 2) when a spec has no expect( or uses CSS/XPath page.locator
 * selectors containing '.', '#', or '//'.
 *
 * Note: afterFileEdit matchers run against tool type "Write", not file paths.
 * Path filtering for tests/** happens here.
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

/** Only gate agent edits under tests/** (any extension under that tree). */
function isUnderTests(filePath) {
  const normalized = normalizePath(filePath);
  return /(^|\/)tests\//.test(normalized);
}

function hasCssOrXpathLocator(content) {
  const re = /page\.locator\s*\(\s*(['"`])([\s\S]*?)\1/g;
  let match;
  while ((match = re.exec(content)) !== null) {
    const selector = match[2];
    if (
      selector.includes('.') ||
      selector.includes('#') ||
      selector.includes('//')
    ) {
      return { blocked: true, selector };
    }
  }
  return { blocked: false };
}

(async () => {
  let payload;
  try {
    const raw = await readStdin();
    if (!raw.trim()) {
      process.stderr.write('generation-gate: empty stdin — allowing\n');
      process.exit(0);
    }
    payload = JSON.parse(raw);
  } catch (err) {
    process.stderr.write(
      `generation-gate: failed to parse stdin JSON: ${err.message}\n`
    );
    process.exit(1);
  }

  const filePath = payload.file_path;
  if (!filePath || !isUnderTests(filePath)) {
    process.exit(0);
  }

  let content;
  try {
    content = fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    process.stderr.write(
      `generation-gate: cannot read ${filePath}: ${err.message}\n`
    );
    process.exit(1);
  }

  if (!content.includes('expect(')) {
    process.stderr.write(
      `generation-gate: BLOCK ${filePath} — no expect( assertion found (spec asserts nothing)\n`
    );
    process.exit(2);
  }

  const locatorCheck = hasCssOrXpathLocator(content);
  if (locatorCheck.blocked) {
    process.stderr.write(
      `generation-gate: BLOCK ${filePath} — CSS/XPath page.locator is not allowed: ${JSON.stringify(locatorCheck.selector)}\n`
    );
    process.exit(2);
  }

  process.stderr.write(`generation-gate: ALLOW ${filePath}\n`);
  process.exit(0);
})();
