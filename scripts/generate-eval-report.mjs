#!/usr/bin/env node
/**
 * Writes eval-report.md — suite reliability metrics from CI, PR history, and sessions.
 *
 * Usage:
 *   node scripts/generate-eval-report.mjs [--trigger=manual|test-generation|local-session] [--ci-runs=30]
 */
import fs from 'fs';
import path from 'path';
import { execFileSync, spawnSync } from 'child_process';
import { fileURLToPath } from 'url';
import { scanConstitutionViolations, isGatedPath } from './lib/constitution-scan.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const REPORT_PATH = path.join(REPO_ROOT, 'eval-report.md');
const TELEMETRY_PATH = path.join(REPO_ROOT, '.eval', 'telemetry.json');

function parseArgs(argv) {
  const out = { trigger: 'manual', ciRuns: 30, transcriptDays: 30 };
  for (const arg of argv) {
    if (arg.startsWith('--trigger=')) out.trigger = arg.slice('--trigger='.length);
    else if (arg.startsWith('--ci-runs=')) out.ciRuns = Number(arg.slice('--ci-runs='.length)) || 30;
    else if (arg.startsWith('--transcript-days=')) {
      out.transcriptDays = Number(arg.slice('--transcript-days='.length)) || 30;
    }
  }
  return out;
}

function gh(args, { json = true, maxBuffer = 50 * 1024 * 1024 } = {}) {
  try {
    const result = execFileSync('gh', args, {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      maxBuffer,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    if (!json) return result;
    return JSON.parse(result);
  } catch (err) {
    const stderr = err.stderr?.toString?.() || '';
    throw new Error(`gh ${args.join(' ')} failed: ${stderr || err.message}`);
  }
}

function ghAvailable() {
  return spawnSync('gh', ['--version'], { encoding: 'utf8' }).status === 0;
}

function defaultTranscriptRoot() {
  const home = process.env.USERPROFILE || process.env.HOME || '';
  const slug = 'c-GIT-Legion-Automation-ai-assisted-qa-automation';
  return path.join(home, '.cursor', 'projects', slug, 'agent-transcripts');
}

function listTranscriptFiles(root) {
  if (!root || !fs.existsSync(root)) return [];
  const files = [];
  const stack = [root];
  while (stack.length) {
    const dir = stack.pop();
    for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, ent.name);
      if (ent.isDirectory()) stack.push(full);
      else if (ent.name.endsWith('.jsonl')) files.push(full);
    }
  }
  return files;
}

function analyzeTranscripts(files, maxAgeDays) {
  const cutoff = Date.now() - maxAgeDays * 24 * 60 * 60 * 1000;
  let asks = 0;
  let guessHeuristic = 0;
  const guessPatterns = [
    /\bI(?:'|’)ll assume\b/i,
    /\bassuming\b/i,
    /\bdefaulting to\b/i,
    /\bwithout asking\b/i,
    /\bI(?:'|’)ll use\b[^.?]{0,40}\bfor now\b/i,
  ];

  for (const file of files) {
    try {
      const st = fs.statSync(file);
      if (st.mtimeMs < cutoff) continue;
      const lines = fs.readFileSync(file, 'utf8').split('\n');
      for (const line of lines) {
        if (!line.trim()) continue;
        let row;
        try {
          row = JSON.parse(line);
        } catch {
          continue;
        }
        const role = row.role;
        const content = row.message?.content;
        if (!Array.isArray(content)) continue;

        if (role === 'assistant') {
          for (const part of content) {
            if (part.type === 'tool_use' && part.name === 'AskQuestion') asks += 1;
            if (part.type === 'text' && typeof part.text === 'string') {
              if (guessPatterns.some((re) => re.test(part.text))) guessHeuristic += 1;
            }
          }
        }
      }
    } catch {
      // skip unreadable transcripts
    }
  }
  return { asks, guessHeuristic };
}

function loadTelemetryAsks() {
  try {
    if (!fs.existsSync(TELEMETRY_PATH)) return 0;
    const data = JSON.parse(fs.readFileSync(TELEMETRY_PATH, 'utf8'));
    return Number(data.askCount) || 0;
  } catch {
    return 0;
  }
}

function measureFlakes(ciRuns) {
  if (!ghAvailable()) {
    return {
      rate: null,
      flakyTests: 0,
      totalRuns: 0,
      runsScanned: 0,
      measurement:
        '`gh` CLI unavailable — set up GitHub CLI or run in CI with `GH_TOKEN`.',
      insight: 'Cannot score flake rate without E2E workflow logs.',
    };
  }

  let runs;
  try {
    runs = gh([
      'run',
      'list',
      '--workflow=e2e.yml',
      '--limit',
      String(ciRuns),
      '--json',
      'databaseId,conclusion,status,createdAt',
    ]);
  } catch (err) {
    return {
      rate: null,
      flakyTests: 0,
      totalRuns: 0,
      runsScanned: 0,
      measurement: `GitHub API: ${err.message}`,
      insight: 'E2E history could not be read.',
    };
  }

  const completed = runs.filter((r) => r.status === 'completed');
  const retryRe = /\(retry\s*#\d+\)/gi;
  const flakyKeys = new Set();
  let runsScanned = 0;

  for (const run of completed) {
    try {
      const log = gh(['run', 'view', String(run.databaseId), '--log'], { json: false });
      runsScanned += 1;
      const lines = log.split('\n');
      for (const line of lines) {
        if (!retryRe.test(line)) continue;
        retryRe.lastIndex = 0;
        const m = line.match(/›\s+(.+?)\s+\(retry\s*#\d+\)/i);
        if (m) flakyKeys.add(m[1].trim());
      }
    } catch {
      // log missing or too large
    }
  }

  const flakyTests = flakyKeys.size;
  const totalRuns = completed.length;
  const rate = totalRuns === 0 ? null : flakyTests / totalRuns;

  return {
    rate,
    flakyTests,
    totalRuns,
    runsScanned,
    measurement: `Parsed last ${ciRuns} \`e2e.yml\` runs via \`gh run view --log\`, counting unique test titles that show Playwright \`(retry #n)\` (CI \`retries: 2\` in playwright.config.ts).`,
    insight:
      flakyTests === 0
        ? 'No retry-only passes detected in the sampled CI window — suite looks stable or logs omit retries.'
        : 'Some tests only passed after retry — investigate env timing or tighten waits before raising retries.',
  };
}

function isHealPr(pr) {
  const branch = pr.headRefName || '';
  const title = (pr.title || '').toLowerCase();
  return branch.startsWith('heal/') || title.includes('heal drift') || title.includes('heal ');
}

function isGenerationPr(pr) {
  const branch = pr.headRefName || '';
  const title = pr.title || '';
  if (/^test\//.test(branch) || /^cursor\//.test(branch)) return true;
  return /DS-\d+/.test(title);
}

function prFiles(prNumber) {
  try {
    const out = execFileSync('gh', ['pr', 'diff', String(prNumber), '--name-only'], {
      cwd: REPO_ROOT,
      encoding: 'utf8',
    });
    return out
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

function firstPrE2eSuccess(pr) {
  const branch = pr.headRefName;
  if (!branch) return null;
  try {
    const runs = gh([
      'run',
      'list',
      '--branch',
      branch,
      '--workflow=e2e.yml',
      '--limit',
      '5',
      '--json',
      'conclusion,event,createdAt',
    ]);
    const prRuns = runs
      .filter((r) => r.event === 'pull_request')
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    const first = prRuns[0];
    if (!first) return null;
    return first.conclusion === 'success';
  } catch {
    return null;
  }
}

function extractTicketKey(pr) {
  const hay = `${pr.title} ${pr.headRefName}`;
  const m = hay.match(/DS-\d+/i);
  return m ? m[0].toUpperCase() : null;
}

function mapsToAc(ticketKey, files) {
  if (!ticketKey) return false;
  const feature = path.join(REPO_ROOT, 'features', `${ticketKey}.feature`);
  if (!fs.existsSync(feature)) return false;
  const featureText = fs.readFileSync(feature, 'utf8');
  if (!/@AC-/.test(featureText)) return false;
  const related = files.filter(
    (f) =>
      f === `features/${ticketKey}.spec.ts` ||
      f.startsWith('features/') ||
      f.startsWith('tests/'),
  );
  return related.length > 0;
}

function conformanceForFiles(files) {
  const violations = [];
  for (const rel of files) {
    if (!isGatedPath(rel)) continue;
    const abs = path.join(REPO_ROOT, rel);
    if (!fs.existsSync(abs)) continue;
    const content = fs.readFileSync(abs, 'utf8');
    const v = scanConstitutionViolations(rel, content);
    if (v.length) violations.push({ file: rel, reasons: v });
  }
  return violations;
}

function measureHeals() {
  if (!ghAvailable()) {
    return {
      rate: null,
      clean: 0,
      total: 0,
      maskedRegressions: 0,
      measurement: '`gh` unavailable.',
      insight: 'Heal KPI needs PR history.',
    };
  }

  const prs = gh(['pr', 'list', '--state', 'all', '--limit', '100', '--json', 'number,title,headRefName,state']);
  const heals = prs.filter(isHealPr);
  let clean = 0;
  let maskedRegressions = 0;
  const details = [];

  for (const pr of heals) {
    const files = prFiles(pr.number);
    const touchedTests = files.some((f) => f.startsWith('tests/') || f.startsWith('features/'));
    if (touchedTests) maskedRegressions += 1;
    const green = firstPrE2eSuccess(pr);
    const cleanHeal = !touchedTests && green === true;
    if (cleanHeal) clean += 1;
    details.push({ pr: pr.number, branch: pr.headRefName, touchedTests, green });
  }

  const total = heals.length;
  const rate = total === 0 ? null : clean / total;

  return {
    rate,
    clean,
    total,
    maskedRegressions,
    details,
    measurement:
      'GitHub PRs whose branch starts with `heal/` (or title mentions heal). Clean = smoke/E2E check passed and no `tests/**` or `features/**` diff (POM-only per self-heal policy). Masked regression = heal PR that touched spec/feature files.',
    insight:
      maskedRegressions > 0
        ? 'At least one heal changed assertions or specs — constitution violation risk.'
        : total === 0
          ? 'No heal PRs in sample — drift repair loop not exercised recently.'
          : 'Heal PRs stayed POM-only; keep triage before any locator edit.',
  };
}

function measureGenerationGate() {
  if (!ghAvailable()) {
    return {
      rate: null,
      passed: 0,
      total: 0,
      measurement: '`gh` unavailable.',
      insight: 'Generation gate needs PR history.',
    };
  }

  const prs = gh(['pr', 'list', '--state', 'all', '--limit', '100', '--json', 'number,title,headRefName,state']);
  const generated = prs.filter(isGenerationPr);
  let passed = 0;

  for (const pr of generated) {
    const files = prFiles(pr.number);
    const testFiles = files.filter((f) => f.startsWith('tests/') || f.endsWith('.spec.ts'));
    const violations = conformanceForFiles(testFiles);
    const ticket = extractTicketKey(pr);
    const ac = mapsToAc(ticket, files);
    const green = firstPrE2eSuccess(pr);
    const ok = green === true && violations.length === 0 && ac;
    if (ok) passed += 1;
  }

  const total = generated.length;
  const rate = total === 0 ? null : passed / total;

  return {
    rate,
    passed,
    total,
    measurement:
      'PRs from `test/*` or `cursor/*` branches or DS-* titles. Pass = earliest `e2e.yml` run on the PR branch succeeded, constitution WON\'T scan clean on new specs, and matching `features/DS-*.feature` contains `@AC-` tags with related spec files.',
    insight:
      rate === null || total === 0
        ? 'No generation PRs sampled.'
        : passed < total
          ? 'Some first-cut PRs missed green, conformity, or AC mapping — tighten test-writer checklist.'
          : 'Generated specs landed conforming and mapped to acceptance criteria on first PR.',
  };
}

function measureAskGuess(transcriptDays) {
  const transcriptRoot =
    process.env.EVAL_TRANSCRIPTS_DIR || defaultTranscriptRoot();
  const files = listTranscriptFiles(transcriptRoot);
  const { asks: transcriptAsks, guessHeuristic } = analyzeTranscripts(files, transcriptDays);
  const hookAsks = loadTelemetryAsks();
  const asks = transcriptAsks + hookAsks;

  const ratio =
    asks + guessHeuristic === 0 ? null : asks / (asks + guessHeuristic);

  return {
    asks,
    guesses: guessHeuristic,
    ratio,
    measurement: `Session review: ${files.length} Cursor agent transcript \`.jsonl\` files under \`${transcriptRoot}\` (last ${transcriptDays}d) — count \`AskQuestion\` tool uses + \`.eval/telemetry.json\` hook tally; guesses use assistant phrasing heuristics (\`assuming\`, \`defaulting to\`, etc.). No built-in Cursor telemetry.`,
    insight:
      guessHeuristic > asks
        ? 'Agents may be inventing values — add explicit AskQuestion gates in orchestration rules.'
        : 'Agents lean toward asking — keep AskQuestion for env, ticket scope, and merge approvals.',
  };
}

function fmtPct(rate) {
  if (rate === null || Number.isNaN(rate)) return 'n/a';
  return `${(rate * 100).toFixed(1)}%`;
}

function topRisk({ flakes, heals, generation, askGuess }) {
  if (heals.maskedRegressions > 0) {
    return {
      risk: 'Heal PRs that edited specs/assertions (masked regression).',
      action: 'Revert spec changes on heal branches; enforce POM-only self-heal and re-run triage before repair.',
    };
  }
  if (flakes.flakyTests > 0) {
    return {
      risk: 'CI tests passing only on Playwright retry.',
      action: 'Pull flake titles from the latest E2E logs and fix root timing/locator causes before relying on retries.',
    };
  }
  if (generation.total > 0 && generation.passed < generation.total) {
    return {
      risk: 'Generation gate not clearing on first PR.',
      action: 'Require feature `@AC-*` tags + constitution gate locally before opening test PRs.',
    };
  }
  if (askGuess.guesses > askGuess.asks) {
    return {
      risk: 'Invented values may outpace explicit user questions.',
      action: 'Route ambiguous ticket/env decisions through AskQuestion in qa-orchestration backlog mode.',
    };
  }
  return {
    risk: 'Limited signal in the measurement window (few CI runs or PRs).',
    action: 'Run `npm run eval:report` after the next test-generation workflow and review E2E retry lines in Actions logs.',
  };
}

function buildReport({ trigger, ciRuns, flakes, heals, generation, askGuess }) {
  const generatedAt = new Date().toISOString();
  const risk = topRisk({ flakes, heals, generation, askGuess });

  return `# Suite reliability eval report

Generated: ${generatedAt}  
Trigger: \`${trigger}\`  
CI window: last ${ciRuns} \`e2e.yml\` workflow runs

> Cursor has no built-in reliability telemetry. Metrics below are derived from GitHub Actions logs, pull-request history, constitution scans, and local agent session transcripts.

## Flake rate

| Metric | Value |
|--------|-------|
| Unique tests that passed only on retry | **${flakes.flakyTests}** |
| E2E workflow runs in window | ${flakes.totalRuns} (logs fetched for ${flakes.runsScanned}) |
| Flake rate (flaky tests ÷ runs) | **${fmtPct(flakes.rate)}** |

**How measured:** ${flakes.measurement}

**What it tells us:** ${flakes.insight}

## Heal success rate

| Metric | Value |
|--------|-------|
| Heal PRs (clean / total) | **${heals.clean} / ${heals.total}** |
| Heal success rate | **${fmtPct(heals.rate)}** |
| Masked regressions (must be 0) | **${heals.maskedRegressions}** |

**How measured:** ${heals.measurement}

**What it tells us:** ${heals.insight}

## Generation-gate pass rate

| Metric | Value |
|--------|-------|
| First-PR passes (green + conforming + maps-to-AC) | **${generation.passed} / ${generation.total}** |
| Pass rate | **${fmtPct(generation.rate)}** |

**How measured:** ${generation.measurement}

**What it tells us:** ${generation.insight}

## Ask vs guess

| Metric | Value |
|--------|-------|
| Times agent asked (AskQuestion + hooks) | **${askGuess.asks}** |
| Times agent likely invented a value (heuristic) | **${askGuess.guesses}** |
| Ask ratio (asks ÷ asks+guesses) | **${fmtPct(askGuess.ratio)}** |

**How measured:** ${askGuess.measurement}

**What it tells us:** ${askGuess.insight}

## Summary

**Top reliability risk:** ${risk.risk}

**Next action:** ${risk.action}

---

Refresh this report: \`npm run eval:report\` (local) or automatically after [\`test-generation.yml\`](.github/workflows/test-generation.yml) and on Cursor \`stop\` / \`sessionEnd\` hooks when running agents locally.
`;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  fs.mkdirSync(path.join(REPO_ROOT, '.eval'), { recursive: true });

  const flakes = measureFlakes(args.ciRuns);
  const heals = measureHeals();
  const generation = measureGenerationGate();
  const askGuess = measureAskGuess(args.transcriptDays);

  const markdown = buildReport({
    trigger: args.trigger,
    ciRuns: args.ciRuns,
    flakes,
    heals,
    generation,
    askGuess,
  });

  fs.writeFileSync(REPORT_PATH, markdown, 'utf8');
  console.log(`Wrote ${REPORT_PATH}`);
}

main();
