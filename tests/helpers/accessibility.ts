import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

type AxeViolation = Awaited<ReturnType<AxeBuilder['analyze']>>['violations'][number];

const sampleLimit = 3;

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
  scope?: { include?: string; exclude?: string[] },
): Promise<void> {
  let builder = new AxeBuilder({ page });
  if (scope?.include) builder = builder.include(scope.include);
  for (const selector of scope?.exclude ?? []) builder = builder.exclude(selector);

  const results = await builder.analyze();
  if (results.violations.length === 0) return;

  await test.info().attach('axe-violations.json', {
    body: JSON.stringify(violationReport(results.violations), null, 2),
    contentType: 'application/json',
  });
  expect(formatViolations(results.violations), 'Accessibility scan found violations').toBe('');
}
