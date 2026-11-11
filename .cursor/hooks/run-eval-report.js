#!/usr/bin/env node
/**
 * Regenerates eval-report.md after local agent / orchestrator sessions.
 */
'use strict';

const path = require('path');
const { spawn } = require('child_process');

const script = path.join(process.cwd(), 'scripts', 'generate-eval-report.mjs');

spawn(process.execPath, [script, '--trigger=local-session'], {
  cwd: process.cwd(),
  detached: true,
  stdio: 'ignore',
  windowsHide: true,
}).unref();

process.exit(0);
