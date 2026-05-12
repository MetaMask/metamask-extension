import { appendFileSync, readFileSync } from 'fs';

// ---------------------------------------------------------------------------
// File paths (all under .tmp/, created by the workflow)
// ---------------------------------------------------------------------------

/** Hardcoded file paths under .tmp/ used by the audit workflow scripts. */
export const AUDIT_BASELINE_FILE = '.tmp/audit-baseline.json';
export const AUDIT_CURRENT_FILE = '.tmp/audit-current.json';
export const AUDIT_DETAILS_FILE = '.tmp/audit-details.md';

/** Pre-warmed raw audit output (written by the local script in parallel). */
export const AUDIT_RAW_PROD = '.tmp/audit-raw-production.txt';
export const AUDIT_RAW_DEV = '.tmp/audit-raw-development.txt';

// ---------------------------------------------------------------------------
// Types shared between yarn-audit-and-triage.mts and yarn-audit-diff.mts
// ---------------------------------------------------------------------------

export type YarnSeverity = 'info' | 'low' | 'moderate' | 'high' | 'critical';

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
    appendFileSync(path, text, 'utf8');
  } catch (error) {
    console.warn('Failed writing step summary:', error);
  }
}

// ---------------------------------------------------------------------------
// Severity gate (matches `yarn audit --severity moderate`)
// ---------------------------------------------------------------------------

/** Strip ANSI escape codes from a string (SGR sequences like colors/bold). */
export function stripAnsi(text: string): string {
  return text.replace(/\x1b\[[0-9;]*m/g, '');
}

/** Effective severities that block the build (moderate and above). */
export const BLOCKING_SEVERITIES: ReadonlySet<YarnSeverity> = new Set([
  'moderate',
  'high',
  'critical',
]);

// ---------------------------------------------------------------------------
// Advisory I/O
// ---------------------------------------------------------------------------

/** Default undefined/missing severity to 'info'. */
export function normalizeSeverity(
  severity: YarnSeverity | undefined,
): YarnSeverity {
  return severity ?? 'info';
}

/** Read a JSON array of ParsedAdvisory from disk. Returns null on I/O error. */
export function readAdvisories(filePath: string): ParsedAdvisory[] | null {
  try {
    const text = readFileSync(filePath, 'utf8').trim();
    if (!text || text === '[]') {
      return [];
    }
    return JSON.parse(text) as ParsedAdvisory[];
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Human-readable advisory tree (plain text, for CI markdown summaries)
// ---------------------------------------------------------------------------

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

  const sevDisplay = a.effectiveSeverity;

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
