import { appendFileSync, existsSync, writeFileSync } from 'fs';

// ---------------------------------------------------------------------------
// File paths (all under .tmp/, created by the workflow)
// ---------------------------------------------------------------------------

/** Hardcoded file paths under .tmp/ used by the audit workflow scripts. */
export const AUDIT_BASELINE_FILE = '.tmp/audit-baseline.json';
export const AUDIT_CURRENT_FILE = '.tmp/audit-current.json';
export const AUDIT_DETAILS_FILE = '.tmp/audit-details.md';

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
// Human-readable advisory tree (matches `yarn npm audit` output)
// ---------------------------------------------------------------------------

/** Format an advisory in the same tree style as `yarn npm audit`. */
export function formatAdvisoryTree(a: ParsedAdvisory): string {
  const hasTreeVersions = a.treeVersions.length > 0;
  const hasDependents = a.dependents.length > 0;
  const hasSections = hasTreeVersions || hasDependents;

  const lines: string[] = [];
  lines.push(`└─ ${a.moduleName}`);
  lines.push(`   ├─ ID: ${a.id ?? 'N/A'}`);
  lines.push(`   ├─ Issue: ${a.title}`);
  lines.push(`   ├─ URL: ${a.url}`);
  lines.push(`   ├─ Severity: ${a.effectiveSeverity}`);
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
