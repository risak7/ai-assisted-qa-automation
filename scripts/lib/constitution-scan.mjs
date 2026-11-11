/**
 * Shared constitution WON'T scans (mirrors .cursor/hooks/constitution-gate.js).
 */

export function isUnderTests(filePath) {
  return /(^|\/)tests\//.test(String(filePath).replace(/\\/g, '/'));
}

export function isUnderPages(filePath) {
  return /(^|\/)pages\//.test(String(filePath).replace(/\\/g, '/'));
}

export function isGatedPath(filePath) {
  const p = String(filePath).replace(/\\/g, '/');
  return /(^|\/)tests\//.test(p) || /(^|\/)pages\//.test(p);
}

export function scanConstitutionViolations(filePath, content) {
  const reasons = [];
  const file = String(filePath).replace(/\\/g, '/');

  if (/\bwaitForTimeout\s*\(/.test(content)) {
    reasons.push('waitForTimeout');
  }

  const locatorRe = /\.locator\s*\(\s*(['"`])((?:\\.|(?!\1).)*)\1/g;
  let match;
  while ((match = locatorRe.exec(content)) !== null) {
    const selector = match[2];
    if (selector.includes('//') || /^xpath=/i.test(selector.trim())) {
      reasons.push('xpath-locator');
      break;
    }
  }
  if (/\blocator\s*\(\s*['"`]xpath=/i.test(content)) {
    reasons.push('xpath-prefix');
  }

  if (isUnderTests(file)) {
    if (/test\.describe\s*\(\s*['"`]@[\w-]+/.test(content)) {
      reasons.push('tag-on-describe');
    }
    if (/test\.describe\s*\([^)]*,\s*\{[^}]*\btag\s*:/s.test(content)) {
      reasons.push('describe-tag-option');
    }
  }

  return reasons;
}
