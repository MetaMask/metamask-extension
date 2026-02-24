/**
 * Feature Flag Registry Check
 *
 * Scans PR diffs for feature flag references and verifies every referenced
 * flag exists in the central feature flag registry.  When a new flag is
 * introduced without a matching registry update the job fails, prompting
 * the author to keep the registry in sync.
 *
 * Usage: yarn tsx .github/scripts/check-feature-flag-registry.ts [base-branch]
 * In CI the base branch comes from GITHUB_BASE_REF (defaults to "main").
 */

import { execSync } from 'child_process';
import * as path from 'path';
import { context, getOctokit } from '@actions/github';
import { getRegisteredFlagNames } from '../../test/e2e/feature-flags';
import { buildKnownFlagConstants } from './known-feature-flag-constants';

// ============================================================================
// Configuration
// ============================================================================

const REGISTRY_DIR = 'test/e2e/feature-flags/';
const SCANNABLE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx']);
const SCAN_DIRECTORIES = ['app/', 'ui/', 'shared/', 'test/'];

/** Bracket-access patterns run BEFORE string stripping (need quoted flag name). */
const BRACKET_STRING_PATTERNS: RegExp[] = [
  /remoteFeatureFlags(?:\?\.)?\[\s*['"`](\w+)['"`]\s*\]/g,
  /getRemoteFeatureFlags\([^)]*\)(?:\?\.)?\[\s*['"`](\w+)['"`]\s*\]/g,
];

/** Dot-access patterns run AFTER string stripping to avoid false positives. */
const FLAG_ACCESS_PATTERNS: RegExp[] = [
  /remoteFeatureFlags\??\.(\w+)/g,
  /state\.metamask\.remoteFeatureFlags\??\.(\w+)/g,
  /remoteFeatureFlagController\.state\.remoteFeatureFlags\??\.(\w+)/g,
  /getRemoteFeatureFlags\([^)]*\)\??\.(\w+)/g,
];

/** Destructuring patterns — identifiers extracted via extractDestructuredIdentifiers. */
const DESTRUCTURING_PATTERNS: RegExp[] = [
  /\{\s*([^}]+)\}\s*=\s*getRemoteFeatureFlags/g,
  /\{\s*([^}]+)\}\s*=\s*useSelector\s*\(\s*getRemoteFeatureFlags/g,
  /useSelector\s*\(\s*getRemoteFeatureFlags\s*\)\s*as\s*\{\s*([^}]+)\}/g,
  /remoteFeatureFlags:\s*\{\s*([^}]+)\}/g,
];

/** Bracket-access with constants/variables. Resolved via KNOWN_FLAG_CONSTANTS. */
const CONSTANT_BRACKET_PATTERNS: RegExp[] = [
  /remoteFeatureFlags(?:\?\.)?\[([A-Za-z_]\w*(?:\.\w+)?)\]/g,
  /getRemoteFeatureFlags\([^)]*\)(?:\?\.)?\[([A-Za-z_]\w*(?:\.\w+)?)\]/g,
];

/** @see ./known-feature-flag-constants.ts */
const KNOWN_FLAG_CONSTANTS = buildKnownFlagConstants();

/** Property/method names that follow `remoteFeatureFlags.` but aren't flags. */
const NON_FLAG_NAMES = new Set([
  'constructor',
  'prototype',
  'hasOwnProperty',
  'toString',
  'valueOf',
  'toJSON',
  'keys',
  'values',
  'entries',
  'length',
  'name',
  'type',
  'status',
  'default',
  'then',
  'catch',
  'finally',
  'map',
  'filter',
  'reduce',
  'forEach',
  'find',
  'some',
  'every',
  'includes',
  'undefined',
]);

/** Hidden HTML marker to identify/update the bot comment across pushes. */
const PR_COMMENT_MARKER = '<!-- check-feature-flag-registry -->';

type FlagReference = {
  flagName: string;
  filePath: string;
};

async function main(): Promise<void> {
  const baseBranch =
    process.env.GITHUB_BASE_REF || process.argv[2] || 'main';

  console.log(
    `\nChecking feature flag references against registry (base: ${baseBranch})...\n`,
  );

  const registeredFlags = new Set(getRegisteredFlagNames());
  console.log(`Registry contains ${registeredFlags.size} flags`);

  const diff = getDiff(baseBranch);
  if (!diff.trim()) {
    console.log('No relevant diff found. Nothing to check.');
    process.exit(0);
  }

  const { added: fileChanges, removed: fileRemovals } = parseDiff(diff);
  const fileCount = [...fileChanges.values()].filter((c) => c.length > 0).length;
  console.log(`Found changes in ${fileCount} file(s)\n`);

  logRegistryChanges(baseBranch);

  // --- Collect flag references from added lines ---
  const allReferences: FlagReference[] = [];

  for (const [filePath, chunks] of fileChanges) {
    if (!isScannableFile(filePath)) {
      continue;
    }
    for (const chunk of chunks) {
      for (const line of chunk) {
        allReferences.push(...extractFlagReferences(line, filePath));
      }
      for (let i = 0; i < chunk.length - 1; i++) {
        const joined = `${chunk[i].trimEnd()}${chunk[i + 1].trimStart()}`;
        allReferences.push(
          ...extractFlagReferences(joined, filePath, true),
        );
      }
    }
  }

  // --- Collect flag references from removed lines ---
  const removedReferences: FlagReference[] = [];
  for (const [filePath, lines] of fileRemovals) {
    if (!isScannableFile(filePath)) {
      continue;
    }
    for (const line of lines) {
      removedReferences.push(...extractFlagReferences(line, filePath));
    }
  }

  // --- De-duplicate added flags: flag -> set of files ---
  const flagToFiles = new Map<string, Set<string>>();
  for (const { flagName, filePath } of allReferences) {
    if (!flagToFiles.has(flagName)) {
      flagToFiles.set(flagName, new Set());
    }
    flagToFiles.get(flagName)?.add(filePath);
  }

  // --- Partition into registered / unregistered ---
  const unregisteredFlags: Array<{ flag: string; files: string[] }> = [];
  let registeredCount = 0;

  for (const [flag, files] of flagToFiles) {
    if (registeredFlags.has(flag)) {
      registeredCount += 1;
    } else {
      unregisteredFlags.push({ flag, files: [...files].sort() });
    }
  }

  // --- Detect removed flags with no remaining codebase references ---
  const addedFlagNames = new Set(flagToFiles.keys());
  const removedOnlyFlags = new Set<string>();
  for (const { flagName } of removedReferences) {
    if (!addedFlagNames.has(flagName) && registeredFlags.has(flagName)) {
      removedOnlyFlags.add(flagName);
    }
  }
  const orphanedFlags = findOrphanedFlags([...removedOnlyFlags]);

  // --- Report ---
  console.log(
    `\nResults: ${flagToFiles.size} unique flag(s) referenced in changed files`,
  );
  console.log(`  ${registeredCount} flag(s) are registered`);
  console.log(`  ${unregisteredFlags.length} flag(s) are NOT registered`);
  if (orphanedFlags.length > 0) {
    console.log(`  ${orphanedFlags.length} flag(s) may need removal from the registry`);
  }
  console.log('');

  const hasIssues = unregisteredFlags.length > 0 || orphanedFlags.length > 0;

  if (!hasIssues) {
    console.log('All detected feature flags are registered.');
    await deletePrComment();
    process.exit(0);
  }

  const sortedUnregistered = unregisteredFlags.sort((a, b) =>
    a.flag.localeCompare(b.flag),
  );

  if (sortedUnregistered.length > 0) {
    console.error('Unregistered feature flags detected!\n');
    for (const { flag, files } of sortedUnregistered) {
      console.error(`  - ${flag}`);
      for (const file of files) {
        console.error(`      ${file}`);
      }
    }
  }

  if (orphanedFlags.length > 0) {
    console.warn('\nFlags with no remaining codebase references:\n');
    for (const flag of orphanedFlags) {
      console.warn(`  - ${flag}`);
    }
    console.warn(
      '\nConsider removing these from the registry or marking them as deprecated.\n',
    );
  }

  await postPrComment(sortedUnregistered, orphanedFlags);

  // Fail only for unregistered flags; orphaned flags are warnings
  if (sortedUnregistered.length > 0) {
    process.exit(1);
  }
}

/** Computes the full-range diff between the base branch and HEAD. */
function getDiff(baseBranch: string): string {
  const paths = SCAN_DIRECTORIES.join(' ');
  const candidates = [
    `git diff origin/${baseBranch}...HEAD -- ${paths}`,
    `git diff origin/${baseBranch}..HEAD -- ${paths}`,
    `git diff ${baseBranch}...HEAD -- ${paths}`,
    `git diff ${baseBranch}..HEAD -- ${paths}`,
  ];

  for (const cmd of candidates) {
    try {
      return execSync(cmd, {
        encoding: 'utf-8',
        maxBuffer: 50 * 1024 * 1024,
      });
    } catch {
      // try next
    }
  }

  console.error(
    `Could not compute diff against base branch "${baseBranch}".`,
  );
  console.error(
    'Ensure the base branch is fetched (e.g. git fetch origin <base> --depth=1).',
  );
  process.exit(1);
}

type DiffResult = {
  added: Map<string, string[][]>;
  removed: Map<string, string[]>;
};

/** Returns true if the file is in a scannable directory with a valid extension. */
function isScannableFile(filePath: string): boolean {
  if (filePath.startsWith(REGISTRY_DIR)) {
    return false;
  }
  if (!SCANNABLE_EXTENSIONS.has(path.extname(filePath))) {
    return false;
  }
  return SCAN_DIRECTORIES.some((dir) => filePath.startsWith(dir));
}

/**
 * Checks which flags have no remaining references in the codebase.
 * Uses `git grep` for fast searching across tracked files.
 */
function findOrphanedFlags(flagNames: string[]): string[] {
  const orphaned: string[] = [];
  const dirs = SCAN_DIRECTORIES.map((d) => `"${d}"`).join(' ');

  for (const flag of flagNames) {
    try {
      const result = execSync(
        `git grep -l "${flag}" -- ${dirs}`,
        { encoding: 'utf-8', stdio: 'pipe' },
      ).trim();
      const files = result
        .split('\n')
        .filter((f) => f && !f.startsWith(REGISTRY_DIR));
      if (files.length === 0) {
        orphaned.push(flag);
      }
    } catch {
      // git grep exits non-zero when no matches found
      orphaned.push(flag);
    }
  }
  return orphaned.sort();
}

/** Parses diff into added line chunks and removed lines per file. */
function parseDiff(diff: string): DiffResult {
  const added = new Map<string, string[][]>();
  const removed = new Map<string, string[]>();
  let currentFile = '';
  let lastWasAdded = false;

  for (const line of diff.split('\n')) {
    if (line.startsWith('+++ b/')) {
      currentFile = line.slice(6);
      if (!added.has(currentFile)) {
        added.set(currentFile, []);
      }
      if (!removed.has(currentFile)) {
        removed.set(currentFile, []);
      }
      lastWasAdded = false;
    } else if (
      line.startsWith('+') &&
      !line.startsWith('+++') &&
      currentFile
    ) {
      const chunks = added.get(currentFile)!;
      if (!lastWasAdded || chunks.length === 0) {
        chunks.push([]);
      }
      chunks[chunks.length - 1].push(line.slice(1));
      lastWasAdded = true;
    } else if (
      line.startsWith('-') &&
      !line.startsWith('---') &&
      currentFile
    ) {
      removed.get(currentFile)?.push(line.slice(1));
      lastWasAdded = false;
    } else {
      lastWasAdded = false;
    }
  }

  return { added, removed };
}

/**
 * Extracts feature flag references from a line of code.
 * @param skipDestructuring - skip destructuring patterns (used for joined line pairs)
 */
function extractFlagReferences(
  line: string,
  filePath: string,
  skipDestructuring = false,
): FlagReference[] {
  const refs: FlagReference[] = [];
  const trimmed = line.trim();

  if (
    trimmed.startsWith('//') ||
    trimmed.startsWith('*') ||
    trimmed.startsWith('/*')
  ) {
    return refs;
  }

  // 1. Strip inline comments so trailing remarks like
  //    "code(); // remoteFeatureFlags.old" don't produce false positives.
  const commentStripped = stripInlineComments(line);

  // 2. Build a mask where string literal contents are replaced with spaces
  //    (same length) so character positions stay aligned.
  const masked = maskStringLiterals(commentStripped);

  // 3. Strip string literals (may change length) for remaining patterns.
  const sanitized = stripStringLiterals(commentStripped);

  // 4. Run bracket string-literal patterns on commentStripped (needs the
  //    quoted flag name), but use the same-length mask to reject matches
  //    that fall inside an outer string literal.
  for (const pattern of BRACKET_STRING_PATTERNS) {
    pattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(commentStripped)) !== null) {
      const posInMasked = masked.charAt(match.index);
      if (posInMasked === ' ' && commentStripped.charAt(match.index) !== ' ') {
        continue;
      }
      if (isLikelyFlagName(match[1])) {
        refs.push({ flagName: match[1], filePath });
      }
    }
  }

  // 5. Dot-access patterns (run on fully sanitized line)
  for (const pattern of FLAG_ACCESS_PATTERNS) {
    pattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(sanitized)) !== null) {
      if (isLikelyFlagName(match[1])) {
        refs.push({ flagName: match[1], filePath });
      }
    }
  }

  // 6. Bracket access with constants (run on fully sanitized line)
  for (const pattern of CONSTANT_BRACKET_PATTERNS) {
    pattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(sanitized)) !== null) {
      const constantExpr = match[1];
      const resolved = KNOWN_FLAG_CONSTANTS[constantExpr];
      if (resolved) {
        refs.push({ flagName: resolved, filePath });
      } else if (isStaticConstant(constantExpr)) {
        // Unknown static constant (UPPER_CASE or Enum.Member) — fail the job
        // so the author adds it to KNOWN_FLAG_CONSTANTS.
        refs.push({
          flagName: `<unresolved constant: ${constantExpr}>`,
          filePath,
        });
      }
      // Lowercase variables (e.g. `flagName`) are runtime-dynamic and
      // cannot be resolved statically.  The actual flag values they hold
      // are typically already registered, so we skip them to avoid
      // false failures.
    }
  }

  // 7. Destructuring patterns (run on fully sanitized line)
  //    Skipped for joined line pairs where brace-matching is unreliable.
  if (skipDestructuring) {
    return refs;
  }
  for (const pattern of DESTRUCTURING_PATTERNS) {
    pattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(sanitized)) !== null) {
      for (const id of extractDestructuredIdentifiers(match[1])) {
        if (isLikelyFlagName(id)) {
          refs.push({ flagName: id, filePath });
        }
      }
    }
  }

  return refs;
}

/** Extracts identifiers from a destructuring expression. */
function extractDestructuredIdentifiers(content: string): string[] {
  const ids: string[] = [];
  for (const part of content.split(/[,;]/)) {
    const trimmed = part.trim();
    if (!trimmed || trimmed.startsWith('...')) {
      continue;
    }
    const colonIdx = trimmed.indexOf(':');
    const raw = colonIdx > 0 ? trimmed.slice(0, colonIdx).trim() : trimmed;
    const m = raw.match(/^(\w+)/);
    if (m) {
      ids.push(m[1]);
    }
  }
  return ids;
}

/** Returns true for UPPER_CASE, PascalCase, or Enum.Member patterns (not camelCase). */
function isStaticConstant(expr: string): boolean {
  if (expr.includes('.')) {
    return /^[A-Z]\w*\.[A-Z]\w*$/.test(expr);
  }
  // UPPER_CASE or PascalCase (starts with uppercase, not camelCase)
  return /^[A-Z]/.test(expr);
}

/** Returns true when the name looks like a plausible feature flag. */
function isLikelyFlagName(name: string): boolean {
  if (NON_FLAG_NAMES.has(name)) {
    return false;
  }
  if (name.length < 3) {
    return false;
  }
  if (!/^[a-z]/.test(name)) {
    return false;
  }
  return true;
}

// Strips inline // and block comments that appear outside string literals.
function stripInlineComments(line: string): string {
  let result = '';
  let inSingle = false;
  let inDouble = false;
  let inTemplate = false;
  let escaped = false;
  let inBlock = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];

    if (escaped) {
      escaped = false;
      result += ch;
      continue;
    }

    if (inBlock) {
      if (ch === '*' && line[i + 1] === '/') {
        inBlock = false;
        i += 1;
      }
      continue;
    }

    if (ch === '\\' && (inSingle || inDouble || inTemplate)) {
      escaped = true;
      result += ch;
      continue;
    }

    if (ch === "'" && !inDouble && !inTemplate) {
      inSingle = !inSingle;
    } else if (ch === '"' && !inSingle && !inTemplate) {
      inDouble = !inDouble;
    } else if (ch === '`' && !inSingle && !inDouble) {
      inTemplate = !inTemplate;
    } else if (!inSingle && !inDouble && !inTemplate && ch === '/') {
      if (line[i + 1] === '/') {
        return result;
      }
      if (line[i + 1] === '*') {
        inBlock = true;
        i += 1;
        continue;
      }
      // Skip regex literals: /.../ preceded by =, (, [, !, &, |, ,, ;, :, ?
      // to avoid treating content inside regex as code.
      if (i === 0 || /[=([!&|,;:?]/.test(line[i - 1].trim() || '=')) {
        const closeIdx = line.indexOf('/', i + 1);
        if (closeIdx > i + 1) {
          result += line.slice(i, closeIdx + 1);
          i = closeIdx;
          continue;
        }
      }
    }

    result += ch;
  }
  return result;
}

/** Replaces string literal contents with empty placeholders (handles escaped quotes). */
function stripStringLiterals(line: string): string {
  return line
    .replace(/'(?:[^'\\]|\\.)*'/g, "''")
    .replace(/"(?:[^"\\]|\\.)*"/g, '""')
    .replace(/`(?:[^`\\]|\\.)*`/g, '``');
}

/** Replaces string literal contents with spaces (same length) so positions stay aligned. */
function maskStringLiterals(line: string): string {
  return line
    .replace(/'(?:[^'\\]|\\.)*'/g, (m) => `'${' '.repeat(Math.max(0, m.length - 2))}'`)
    .replace(/"(?:[^"\\]|\\.)*"/g, (m) => `"${' '.repeat(Math.max(0, m.length - 2))}"`)
    .replace(/`(?:[^`\\]|\\.)*`/g, (m) => `\`${' '.repeat(Math.max(0, m.length - 2))}\``);
}

/** Logs which flags were added/removed in the registry (informational only). */
function logRegistryChanges(baseBranch: string): void {
  const registryFile = 'test/e2e/feature-flags/feature-flag-registry.ts';
  const candidates = [
    `git diff origin/${baseBranch}...HEAD -- ${registryFile}`,
    `git diff ${baseBranch}...HEAD -- ${registryFile}`,
  ];

  let registryDiff = '';
  for (const cmd of candidates) {
    try {
      registryDiff = execSync(cmd, {
        encoding: 'utf-8',
        maxBuffer: 10 * 1024 * 1024,
      });
      break;
    } catch {
      // try next
    }
  }

  if (!registryDiff.trim()) {
    return;
  }

  const added: string[] = [];
  const removed: string[] = [];
  const nameRe = /name:\s*'(\w+)'/;

  for (const line of registryDiff.split('\n')) {
    const m = nameRe.exec(line);
    if (!m) {
      continue;
    }
    if (line.startsWith('+') && !line.startsWith('+++')) {
      added.push(m[1]);
    } else if (line.startsWith('-') && !line.startsWith('---')) {
      removed.push(m[1]);
    }
  }

  if (added.length > 0 || removed.length > 0) {
    console.log('Registry file was modified in this PR:');
    if (added.length > 0) {
      console.log(`  Added:   ${added.join(', ')}`);
    }
    if (removed.length > 0) {
      console.log(`  Removed: ${removed.join(', ')}`);
    }
    console.log('');
  }
}

/** Builds the Markdown body for the PR comment. */
function buildCommentBody(
  unregistered: Array<{ flag: string; files: string[] }>,
  orphaned: string[],
): string {
  const lines: string[] = [PR_COMMENT_MARKER, '## Feature Flag Registry Check', ''];

  if (unregistered.length > 0) {
    lines.push(
      'This PR introduces feature flag references that are **not yet registered** in the',
      '[feature flag registry](https://github.com/MetaMask/metamask-extension/blob/main/test/e2e/feature-flags/feature-flag-registry.ts).',
      '',
      '### Unregistered flags',
      '',
      '| Flag | Referenced in |',
      '| ---- | ------------ |',
    );
    for (const { flag, files } of unregistered) {
      const fileList = files.map((f) => `\`${f}\``).join(', ');
      lines.push(`| \`${flag}\` | ${fileList} |`);
    }
    lines.push(
      '',
      '<details>',
      '<summary>How to fix</summary>',
      '',
      'Add an entry for each flag in `test/e2e/feature-flags/feature-flag-registry.ts`:',
      '',
      '```ts',
      'myNewFlag: {',
      "  name: 'myNewFlag',",
      '  type: FeatureFlagType.Remote,',
      '  inProd: false,',
      '  productionDefault: false,',
      '  status: FeatureFlagStatus.Active,',
      '},',
      '```',
      '',
      'Set `inProd` and `productionDefault` to match the current production values from the',
      '[client-config API](https://client-config.api.cx.metamask.io/v1/flags?client=extension&distribution=main&environment=prod).',
      '',
      'If you access the flag via a **constant** (e.g. `remoteFeatureFlags[MY_CONSTANT]`),',
      'also add the constant to',
      '[`.github/scripts/known-feature-flag-constants.ts`](https://github.com/MetaMask/metamask-extension/blob/main/.github/scripts/known-feature-flag-constants.ts)',
      'so the CI check can resolve it.',
      '',
      '</details>',
    );
  }

  if (orphaned.length > 0) {
    if (unregistered.length > 0) {
      lines.push('', '---', '');
    }
    lines.push(
      '### Possibly unused flags',
      '',
      'This PR removes the last codebase references to the following registered flags.',
      'Consider removing them from the registry or marking them as `deprecated`.',
      '',
      ...orphaned.map((f) => `- \`${f}\``),
    );
  }

  return lines.join('\n');
}

/** Posts or updates the PR comment. Skips when not in a GitHub Actions context. */
async function postPrComment(
  unregistered: Array<{ flag: string; files: string[] }>,
  orphaned: string[] = [],
): Promise<void> {
  const token = process.env.GITHUB_TOKEN;
  const prNumber = context.payload.pull_request?.number;

  if (!token || !prNumber) {
    console.log(
      'Not in a GitHub Actions PR context — skipping PR comment.',
    );
    return;
  }

  const octokit = getOctokit(token);
  const { owner, repo } = context.repo;
  const body = buildCommentBody(unregistered, orphaned);

  try {
    const existingComment = await findMarkerComment(octokit, owner, repo, prNumber);

    if (existingComment) {
      await octokit.rest.issues.updateComment({
        owner,
        repo,
        comment_id: existingComment.id,
        body,
      });
      console.log(`Updated existing PR comment (id: ${existingComment.id}).`);
    } else {
      await octokit.rest.issues.createComment({
        owner,
        repo,
        issue_number: prNumber,
        body,
      });
      console.log('Posted new PR comment.');
    }
  } catch (error) {
    // Commenting is best-effort; don't let it mask the real failure
    console.warn('Failed to post PR comment:', error);
  }
}

/** Deletes a stale marker comment when all flags are registered. */
async function deletePrComment(): Promise<void> {
  const token = process.env.GITHUB_TOKEN;
  const prNumber = context.payload.pull_request?.number;

  if (!token || !prNumber) {
    return;
  }

  const octokit = getOctokit(token);
  const { owner, repo } = context.repo;

  try {
    const existing = await findMarkerComment(octokit, owner, repo, prNumber);
    if (existing) {
      await octokit.rest.issues.deleteComment({
        owner,
        repo,
        comment_id: existing.id,
      });
      console.log('Deleted stale PR comment.');
    }
  } catch {
    // best-effort
  }
}

/** Finds the bot comment by marker, paginating through all comments. */
async function findMarkerComment(
  octokit: ReturnType<typeof getOctokit>,
  owner: string,
  repo: string,
  prNumber: number,
): Promise<{ id: number } | undefined> {
  const iterator = octokit.paginate.iterator(
    octokit.rest.issues.listComments,
    { owner, repo, issue_number: prNumber, per_page: 100 },
  );

  for await (const { data: comments } of iterator) {
    const found = comments.find((c) => c.body?.includes(PR_COMMENT_MARKER));
    if (found) {
      return found;
    }
  }

  return undefined;
}

main().catch((error) => {
  console.error('Feature flag registry check failed:', error);
  process.exit(1);
});
