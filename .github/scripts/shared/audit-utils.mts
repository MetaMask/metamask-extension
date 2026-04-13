import { appendFileSync, existsSync, writeFileSync } from 'fs';

// ---------------------------------------------------------------------------
// File paths (all under .tmp/, created by the workflow)
// ---------------------------------------------------------------------------

/** Hardcoded file paths under .tmp/ used by the audit workflow scripts. */
export const AUDIT_BASELINE_FILE = '.tmp/audit-baseline.json';
export const AUDIT_CURRENT_FILE = '.tmp/audit-current.json';
export const AUDIT_DETAILS_FILE = '.tmp/audit-details.md';
export const AUDIT_NATIVE_FILE = '.tmp/audit-native.txt';

// ---------------------------------------------------------------------------
// Types shared between yarn-audit-and-triage.mts and yarn-audit-diff.mts
// ---------------------------------------------------------------------------

export type YarnSeverity =
  | 'info'
  | 'low'
  | 'moderate'
  | 'medium'
  | 'high'
  | 'critical';

export type ParsedAdvisory = {
  id: number | null;
  moduleName: string;
  title: string;
  url: string;
  vulnerableVersions: string;
  patchedVersions: string;
  originalSeverity: YarnSeverity;
  effectiveSeverity: YarnSeverity;
  isDevOnly: boolean;
  affectsProduction: boolean;
  matchedIssueRule: 'redos-dos-downgrade' | 'none';
  treeVersions: string[];
  dependents: string[];
};

// ---------------------------------------------------------------------------
// GitHub Actions helpers
// ---------------------------------------------------------------------------

/** Emit a GitHub Actions annotation (error, warning, or notice). */
export function githubAnnotate(
  kind: 'error' | 'warning' | 'notice',
  message: string,
): void {
  const sanitized = message.replace(/\r?\n/g, ' ');
  console.log(`::${kind}::${sanitized}`);
}

/** Append markdown to the current step's summary panel. */
export function writeStepSummary(text: string): void {
  const path = process.env.GITHUB_STEP_SUMMARY;
  if (!path) return;
  try {
    if (!existsSync(path)) writeFileSync(path, '', 'utf8');
    appendFileSync(path, text, 'utf8');
  } catch (error) {
    console.warn('Failed writing step summary:', error);
  }
}

// ---------------------------------------------------------------------------
// Severity gate (matches `yarn audit --severity moderate`)
// ---------------------------------------------------------------------------

/** Effective severities that block the build (moderate and above). */
export const BLOCKING_SEVERITIES: ReadonlySet<YarnSeverity> = new Set([
  'medium',
  'high',
  'critical',
]);

// ---------------------------------------------------------------------------
// Human-readable advisory tree (plain text, for CI markdown summaries)
// ---------------------------------------------------------------------------

/** Display-friendly severity — reverses the internal medium→moderate normalization. */
function displaySeverity(sev: YarnSeverity): string {
  return sev === 'medium' ? 'moderate' : sev;
}

/**
 * Extract per-advisory blocks from native `yarn npm audit` output and return
 * only the blocks whose numeric ID is in `ids`.  Each block starts with a
 * box-drawing character (`├─` or `└─`) at column 0 (possibly wrapped in ANSI
 * escape codes).  Inner tree lines (Tree Versions, Dependents) are always
 * indented, so a newline followed by a non-indented box char marks a boundary.
 */
export function extractNativeBlocks(
  nativeOutput: string,
  ids: ReadonlySet<number>,
): string[] {
  const blockBoundary = /\n(?=(?:\x1b\[[0-9;]*m)*[├└]─)/;
  const blocks = nativeOutput.split(blockBoundary);
  return blocks.filter((block) => {
    const plain = block.replace(/\x1b\[[0-9;]*m/g, '');
    const idMatch = plain.match(/ID:\s*(\d+)/);
    return idMatch !== null && ids.has(Number(idMatch[1]));
  });
}

/** Format an advisory in the same tree style as `yarn npm audit` (plain text). */
export function formatAdvisoryTree(a: ParsedAdvisory): string {
  const hasTreeVersions = a.treeVersions.length > 0;
  const hasDependents = a.dependents.length > 0;
  const hasSections = hasTreeVersions || hasDependents;

  const sevDisplay = displaySeverity(a.effectiveSeverity);

  const lines: string[] = [];
  lines.push(`└─ ${a.moduleName}`);
  lines.push(`   ├─ ID: ${a.id ?? 'N/A'}`);
  lines.push(`   ├─ Issue: ${a.title}`);
  lines.push(`   ├─ URL: ${a.url}`);
  lines.push(`   ├─ Severity: ${sevDisplay}`);
  lines.push(
    `   ${hasSections ? '├' : '└'}─ Vulnerable Versions: ${a.vulnerableVersions}`,
  );

  if (hasTreeVersions) {
    const connector = hasDependents ? '├' : '└';
    const indent = hasDependents ? '│  ' : '   ';
    lines.push(`   │`);
    lines.push(`   ${connector}─ Tree Versions`);
    for (let i = 0; i < a.treeVersions.length; i++) {
      const last = i === a.treeVersions.length - 1;
      lines.push(`   ${indent}${last ? '└' : '├'}─ ${a.treeVersions[i]}`);
    }
  }

  if (hasDependents) {
    lines.push(`   │`);
    lines.push(`   └─ Dependents`);
    for (let i = 0; i < a.dependents.length; i++) {
      const last = i === a.dependents.length - 1;
      lines.push(`      ${last ? '└' : '├'}─ ${a.dependents[i]}`);
    }
  }

  return lines.join('\n');
}
