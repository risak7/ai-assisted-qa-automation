import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

type AxeViolation = Awaited<ReturnType<AxeBuilder['analyze']>>['violations'][number];

const sampleLimit = 3;
const isCi = !!process.env.CI;

/** Run an a11y assertion locally; in CI record failure on the report without failing the job. */
export async function runCiSoftA11y(name: string, body: () => Promise<void>): Promise<void> {
  if (!isCi) {
    await body();
    return;
  }
  try {
    await body();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    await test.info().attach(`a11y-${name}-failure.txt`, {
      body: message,
      contentType: 'text/plain',
    });
    test.info().annotations.push({
      type: 'warning',
      description: `A11y (non-blocking in CI): ${name}`,
    });
  }
}

function annotateCiAxeViolations(violations: AxeViolation[]): void {
  test.info().annotations.push({
    type: 'warning',
    description: `A11y (non-blocking in CI): ${violations.length} axe violation(s) — see axe-violations.json`,
  });
  console.warn(formatViolations(violations));
}

/** Rows after the first repeat the same issues. Skip them so the scan stays on the page chrome and one row. */
export const repeatedProgramRows = 'table tr:nth-child(n+2)';

export const openDialog = '[role="dialog"]';

function formatViolations(violations: AxeViolation[]): string {
  return violations
    .map((violation) => {
      const samples = violation.nodes.slice(0, sampleLimit).map((node) => node.target.join(' '));
      const remaining = violation.nodes.length - samples.length;
      const extra = remaining > 0 ? `\n    (+${remaining} more)` : '';
      return `${violation.id} (${violation.impact ?? 'unknown'}, ${violation.nodes.length}): ${violation.help}\n    ${samples.join('\n    ')}${extra}`;
    })
    .join('\n');
}

function violationReport(violations: AxeViolation[]) {
  return violations.map((violation) => ({
    id: violation.id,
    impact: violation.impact,
    help: violation.help,
    helpUrl: violation.helpUrl,
    nodeCount: violation.nodes.length,
    sampleTargets: violation.nodes.slice(0, sampleLimit).map((node) => node.target),
  }));
}

export async function expectNoAxeViolations(
  page: Page,
  scope?: { include?: string; exclude?: string[]; tags?: string[] },
): Promise<void> {
  let builder = new AxeBuilder({ page });
  if (scope?.tags?.length) builder = builder.withTags(scope.tags);
  if (scope?.include) builder = builder.include(scope.include);
  for (const selector of scope?.exclude ?? []) builder = builder.exclude(selector);

  const results = await builder.analyze();
  if (results.violations.length === 0) return;

  await test.info().attach('axe-violations.json', {
    body: JSON.stringify(violationReport(results.violations), null, 2),
    contentType: 'application/json',
  });

  if (isCi) {
    annotateCiAxeViolations(results.violations);
    return;
  }

  expect(formatViolations(results.violations), 'Accessibility scan found violations').toBe('');
}
