#!/usr/bin/env node
/**
 * Increments AskQuestion telemetry for eval-report ask-vs-guess metrics.
 */
'use strict';

const fs = require('fs');
const path = require('path');

const TELEMETRY = path.join(process.cwd(), '.eval', 'telemetry.json');

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf8');
}

function bump(field) {
  fs.mkdirSync(path.dirname(TELEMETRY), { recursive: true });
  let data = { askCount: 0, updatedAt: null };
  try {
    if (fs.existsSync(TELEMETRY)) data = { ...data, ...JSON.parse(fs.readFileSync(TELEMETRY, 'utf8')) };
  } catch {
    // reset corrupt file
  }
  data[field] = (Number(data[field]) || 0) + 1;
  data.updatedAt = new Date().toISOString();
  fs.writeFileSync(TELEMETRY, JSON.stringify(data, null, 2));
}

(async () => {
  try {
    const raw = await readStdin();
    if (!raw.trim()) process.exit(0);
    const payload = JSON.parse(raw);
    const toolName = payload.tool_name || payload.toolName || '';
    if (toolName === 'AskQuestion') bump('askCount');
  } catch {
    // never block the agent on telemetry
  }
  process.exit(0);
})();
