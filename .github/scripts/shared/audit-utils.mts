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

const YARN_SEVERITIES: ReadonlySet<YarnSeverity> = new Set([
  'info',
  'low',
  'moderate',
  'high',
  'critical',
] as const);

/** Effective severities that block the build (moderate and above). */
export const BLOCKING_SEVERITIES: ReadonlySet<YarnSeverity> = new Set([
  'moderate',
  'high',
  'critical',
] as const);

export function advisoryIdentityKey(
  advisory: Pick<ParsedAdvisory, 'id' | 'moduleName' | 'title' | 'url'>,
): string {
  const moduleName = advisory.moduleName.trim();
  const ghsaId = advisory.url.match(/github\.com\/advisories\/(GHSA-[\w-]+)/iu);

  if (ghsaId?.[1]) {
    return `${moduleName}|ghsa:${ghsaId[1].toUpperCase()}`;
  }

  const normalizedUrl = advisory.url.trim().replace(/\/+$/u, '').toLowerCase();
  if (normalizedUrl) {
    return `${moduleName}|url:${normalizedUrl}`;
  }

  if (advisory.id !== null) {
    return `${moduleName}|id:${advisory.id}`;
  }

  return `${moduleName}|title:${advisory.title.trim().toLowerCase()}`;
}

export function isBlockingAdvisory(advisory: ParsedAdvisory): boolean {
  return (
    advisory.affectsProduction &&
    BLOCKING_SEVERITIES.has(advisory.effectiveSeverity)
  );
}

export function uniqueAdvisoriesByIdentity(
  advisories: ParsedAdvisory[],
): ParsedAdvisory[] {
  const seen = new Set<string>();
  const result: ParsedAdvisory[] = [];

  for (const advisory of advisories) {
    const key = advisoryIdentityKey(advisory);
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(advisory);
  }

  return result;
}

export function mergeAdvisoriesByIdentity(
  advisories: ParsedAdvisory[],
): ParsedAdvisory[] {
  const merged = new Map<string, ParsedAdvisory>();

  for (const advisory of advisories) {
    const key = advisoryIdentityKey(advisory);
    const existing = merged.get(key);
    if (!existing) {
      merged.set(key, advisory);
      continue;
    }

    const primary =
      advisory.affectsProduction && !existing.affectsProduction
        ? advisory
        : existing;
    const affectsProduction =
      existing.affectsProduction || advisory.affectsProduction;

    merged.set(key, {
      ...primary,
      id: primary.id ?? existing.id ?? advisory.id,
      affectsProduction,
      isDevOnly: !affectsProduction,
      // The same advisory can appear in both prod and dev audit output with
      // overlapping package paths, so merge paths without repeating them.
      treeVersions: [
        ...new Set([...existing.treeVersions, ...advisory.treeVersions]),
      ],
      dependents: [
        ...new Set([...existing.dependents, ...advisory.dependents]),
      ],
    });
  }

  return [...merged.values()];
}

export function diffAdvisories(
  current: ParsedAdvisory[],
  baseline: ParsedAdvisory[],
): {
  allNewAdvisories: ParsedAdvisory[];
  newlyBlockingAdvisories: ParsedAdvisory[];
} {
  const baselineIdentityKeys = new Set(
    baseline.map((advisory) => advisoryIdentityKey(advisory)),
  );
  const baselineBlockingIdentityKeys = new Set(
    baseline
      .filter(isBlockingAdvisory)
      .map((advisory) => advisoryIdentityKey(advisory)),
  );

  return {
    allNewAdvisories: current.filter(
      (advisory) => !baselineIdentityKeys.has(advisoryIdentityKey(advisory)),
    ),
    newlyBlockingAdvisories: current.filter(
      (advisory) =>
        isBlockingAdvisory(advisory) &&
        !baselineBlockingIdentityKeys.has(advisoryIdentityKey(advisory)),
    ),
  };
}

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

// ---------------------------------------------------------------------------
// Advisory I/O
// ---------------------------------------------------------------------------

/** Default missing or unexpected severity labels to 'info'. */
export function normalizeSeverity(severity: string | undefined): YarnSeverity {
  if (severity && YARN_SEVERITIES.has(severity as YarnSeverity)) {
    return severity as YarnSeverity;
  }
  return 'info';
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

/**
 * Render selected advisories using Yarn's native audit blocks when available,
 * falling back to the normalized JSON representation when native output cannot
 * be matched by advisory ID. Native blocks are an advisory-level enhancement,
 * not an all-or-nothing replacement, so a partial native match cannot hide
 * unmatched advisories from the rendered output.
 */
export function formatAdvisoryTreeText(
  advisories: ParsedAdvisory[],
  nativeOutput?: string,
  { stripAnsiOutput = false }: { stripAnsiOutput?: boolean } = {},
): string {
  const advisoryIds = new Set(
    advisories.map((a) => a.id).filter((id): id is number => id !== null),
  );
  const nativeBlocksById = new Map<number, string[]>();
  const nativeBlocks =
    nativeOutput && advisoryIds.size > 0
      ? extractNativeBlocks(nativeOutput, advisoryIds)
      : [];

  // Keep all native blocks for an ID; `--all` output can include the same
  // advisory through multiple paths or environments.
  for (const nativeBlock of nativeBlocks) {
    const plain = stripAnsi(nativeBlock);
    const idMatch = plain.match(/ID:\s*(\d+)/);
    if (!idMatch) {
      continue;
    }

    const id = Number(idMatch[1]);
    const renderedBlock = stripAnsiOutput ? plain : nativeBlock;
    nativeBlocksById.set(id, [
      ...(nativeBlocksById.get(id) ?? []),
      renderedBlock,
    ]);
  }

  return advisories
    .map((advisory) => {
      if (advisory.id === null) {
        return formatAdvisoryTree(advisory);
      }

      const matchingBlocks = nativeBlocksById.get(advisory.id);
      // Fall back per advisory so unmatched IDs still appear in the details.
      return matchingBlocks?.shift() ?? formatAdvisoryTree(advisory);
    })
    .join('\n\n');
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
