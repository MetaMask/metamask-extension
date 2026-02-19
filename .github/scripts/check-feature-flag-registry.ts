/**
 * Feature Flag Registry Check
 *
 * Scans PR diffs for feature flag references and verifies every referenced
 * flag exists in the central feature flag registry.  When a new flag is
 * introduced (or an existing one removed) without a matching registry
 * update the job fails, prompting the author to keep the registry in sync.
 *
 * Detected patterns
 * -----------------
 * Direct property access:
 * - `remoteFeatureFlags.flagName`  /  `remoteFeatureFlags?.flagName`
 * - `this.remoteFeatureFlagController?.state?.remoteFeatureFlags?.flagName`
 * - `state.metamask.remoteFeatureFlags.flagName`
 * - `remoteFeatureFlagController.state.remoteFeatureFlags.flagName`
 * - `getRemoteFeatureFlags(state).flagName`
 *
 * Bracket access (string literals):
 * - `remoteFeatureFlags['flagName']`  /  `remoteFeatureFlags["flagName"]`
 * - `getRemoteFeatureFlags(state)['flagName']`
 *
 * Bracket access (constants — resolved via KNOWN_FLAG_CONSTANTS):
 * - `remoteFeatureFlags[ASSETS_UNIFY_STATE_FLAG]`
 * - `remoteFeatureFlags[FeatureFlagNames.AssetsDefiPositionsEnabled]`
 * - `getRemoteFeatureFlags(state)[CONSTANT]`
 *
 * Destructuring:
 * - `{ flagA, flagB } = getRemoteFeatureFlags(...)`
 * - `useSelector(getRemoteFeatureFlags) as { flagA, ... }`
 * - `remoteFeatureFlags: { flagA, flagB }` (nested destructuring)
 *
 * Usage
 * -----
 *   yarn tsx .github/scripts/check-feature-flag-registry.ts [base-branch]
 *
 * In CI the base branch comes from GITHUB_BASE_REF.
 * Locally you can pass it as the first positional argument (defaults to
 * "main").
 */

import { execSync } from 'child_process';
import * as path from 'path';
import { context, getOctokit } from '@actions/github';
import { getRegisteredFlagNames } from '../../test/e2e/feature-flags';

// ============================================================================
// Configuration
// ============================================================================

/** Changes inside this directory are excluded from scanning. */
const REGISTRY_DIR = 'test/e2e/feature-flags/';

/** Only files with these extensions are scanned. */
const SCANNABLE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx']);

/** Only files under these directories are scanned. */
const SCAN_DIRECTORIES = ['app/', 'ui/', 'shared/', 'test/'];

/**
 * Regexes that require access to the original string literal content.
 * These are run BEFORE string stripping so bracket access like
 * `remoteFeatureFlags['flagName']` is still matchable.
 * Each pattern MUST expose the flag name in capture-group 1.
 */
const BRACKET_STRING_PATTERNS: RegExp[] = [
  // remoteFeatureFlags['flagName']  /  remoteFeatureFlags?.['flagName']
  /remoteFeatureFlags(?:\?\.)?\[['"](\w+)['"]\]/g,

  // getRemoteFeatureFlags(state)['flagName']  /  getRemoteFeatureFlags(state)?.['flagName']
  /getRemoteFeatureFlags\([^)]*\)(?:\?\.)?\[['"](\w+)['"]\]/g,
];

/**
 * Regexes that capture a flag name via property (dot) access.
 * These are run AFTER string stripping to avoid false positives from
 * flag names inside quoted text or inline comments.
 * Each pattern MUST expose the flag name in capture-group 1.
 */
const FLAG_ACCESS_PATTERNS: RegExp[] = [
  // remoteFeatureFlags.flagName  /  remoteFeatureFlags?.flagName
  // Also matches: this.remoteFeatureFlagController?.state?.remoteFeatureFlags?.flagName
  //               initialRemoteFeatureFlagsState?.remoteFeatureFlags?.flagName
  //               prevState?.remoteFeatureFlags?.flagName
  //               state.RemoteFeatureFlagController?.remoteFeatureFlags?.flagName
  /remoteFeatureFlags\??\.(\w+)/g,

  // state.metamask.remoteFeatureFlags.flagName
  /state\.metamask\.remoteFeatureFlags\??\.(\w+)/g,

  // remoteFeatureFlagController.state.remoteFeatureFlags.flagName
  /remoteFeatureFlagController\.state\.remoteFeatureFlags\??\.(\w+)/g,

  // getRemoteFeatureFlags(state).flagName  /  getRemoteFeatureFlags(state)?.flagName
  /getRemoteFeatureFlags\([^)]*\)\??\.(\w+)/g,
];

/**
 * Regexes that capture the *contents* of a destructuring assignment from
 * a remote-feature-flag selector.  The identifiers are then extracted in
 * a second step via {@link extractDestructuredIdentifiers}.
 */
const DESTRUCTURING_PATTERNS: RegExp[] = [
  // const { flagA, flagB } = getRemoteFeatureFlags(state)
  /\{\s*([^}]+)\}\s*=\s*getRemoteFeatureFlags/g,

  // const { flagA, flagB } = useSelector(getRemoteFeatureFlags)
  /\{\s*([^}]+)\}\s*=\s*useSelector\s*\(\s*getRemoteFeatureFlags/g,

  // useSelector(getRemoteFeatureFlags) as { flagA, flagB }
  /useSelector\s*\(\s*getRemoteFeatureFlags\s*\)\s*as\s*\{\s*([^}]+)\}/g,

  // Nested destructuring: remoteFeatureFlags: { flagA, flagB }
  // e.g. selectBridgeFeatureFlags({ remoteFeatureFlags: { bridgeConfig } })
  // e.g. ({ remoteFeatureFlags: { smartTransactionsNetworks } })
  /remoteFeatureFlags:\s*\{\s*([^}]+)\}/g,

  // const { remoteFeatureFlags } = state.metamask  (then accessed later)
  // Captured by FLAG_ACCESS_PATTERNS when properties are read
];

/**
 * Regexes that capture bracket-access with a non-string-literal key
 * (constants, enum members, or variables).
 * These require resolution via {@link KNOWN_FLAG_CONSTANTS}.
 * Capture-group 1 holds the identifier / constant expression.
 *
 * Handles both `[key]` and optional-chaining `?.[key]` syntax.
 */
const CONSTANT_BRACKET_PATTERNS: RegExp[] = [
  // remoteFeatureFlags[identifier]  /  remoteFeatureFlags?.[identifier]
  /remoteFeatureFlags(?:\?\.)?\[([A-Za-z_]\w*(?:\.\w+)?)\]/g,

  // getRemoteFeatureFlags(state)[identifier]  /  getRemoteFeatureFlags(state)?.[identifier]
  /getRemoteFeatureFlags\([^)]*\)(?:\?\.)?\[([A-Za-z_]\w*(?:\.\w+)?)\]/g,
];

/**
 * Map of known constant names/expressions to their resolved flag name string.
 * Sourced from the codebase to handle bracket-access with constants.
 *
 * When a new constant is used for feature-flag bracket access, add it here.
 */
const KNOWN_FLAG_CONSTANTS: Record<string, string> = {
  // shared/modules/feature-flags.ts
  'FeatureFlagNames.AssetsDefiPositionsEnabled': 'assetsDefiPositionsEnabled',

  // app/scripts/controller-init/assets/assets-controller-init.ts
  // ui/selectors/assets-unify-state/feature-flags.ts
  ASSETS_UNIFY_STATE_FLAG: 'assetsUnifyState',

  // ui/selectors/multichain-accounts/feature-flags.ts
  STATE_1_FLAG: 'enableMultichainAccounts',
  STATE_2_FLAG: 'enableMultichainAccountsState2',
};

/**
 * Property / method names that may follow `remoteFeatureFlags.` but are
 * never actual flags.
 */
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

/**
 * Marker used to identify the bot comment so it can be updated on
 * subsequent pushes instead of posting duplicate comments.
 */
const PR_COMMENT_MARKER =
  '<!-- check-feature-flag-registry -->';

// ============================================================================
// Types
// ============================================================================

type FlagReference = {
  flagName: string;
  filePath: string;
};

// ============================================================================
// Main
// ============================================================================

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

  const fileChanges = parseDiff(diff);
  const fileCount = [...fileChanges.values()].filter((c) => c.length > 0).length;
  console.log(`Found changes in ${fileCount} file(s)\n`);

  // Informational: log if the registry itself was touched
  logRegistryChanges(baseBranch);

  // --- Collect flag references from added lines ---
  const allReferences: FlagReference[] = [];

  for (const [filePath, chunks] of fileChanges) {
    if (filePath.startsWith(REGISTRY_DIR)) {
      continue;
    }
    if (!SCANNABLE_EXTENSIONS.has(path.extname(filePath))) {
      continue;
    }
    if (!SCAN_DIRECTORIES.some((dir) => filePath.startsWith(dir))) {
      continue;
    }

    for (const chunk of chunks) {
      // Per-line scan
      for (const line of chunk) {
        allReferences.push(...extractFlagReferences(line, filePath));
      }

      // Multiline pass: join truly adjacent line pairs within each chunk
      // to catch patterns split across two lines like:
      //   remoteFeatureFlags
      //     .myFlag
      for (let i = 0; i < chunk.length - 1; i++) {
        const joined = `${chunk[i].trimEnd()}${chunk[i + 1].trimStart()}`;
        allReferences.push(
          ...extractFlagReferences(joined, filePath, true),
        );
      }
    }
  }

  // --- De-duplicate: flag -> set of files ---
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

  // --- Report ---
  console.log(
    `\nResults: ${flagToFiles.size} unique flag(s) referenced in changed files`,
  );
  console.log(`  ${registeredCount} flag(s) are registered`);
  console.log(`  ${unregisteredFlags.length} flag(s) are NOT registered\n`);

  if (unregisteredFlags.length === 0) {
    console.log('All detected feature flags are registered.');
    // If a previous run left a comment, delete it since everything is clean now
    await deletePrComment();
    process.exit(0);
  }

  // ---- Failure path ----
  const sorted = unregisteredFlags.sort((a, b) =>
    a.flag.localeCompare(b.flag),
  );

  // Log to CI console
  console.error('Unregistered feature flags detected!\n');
  for (const { flag, files } of sorted) {
    console.error(`  - ${flag}`);
    for (const file of files) {
      console.error(`      ${file}`);
    }
  }

  // Post / update PR comment
  await postPrComment(sorted);

  process.exit(1);
}

// ============================================================================
// Git helpers
// ============================================================================

/**
 * Computes the diff between the base branch and HEAD for the directories
 * we care about.  Only tries full-range diffs against the base branch so
 * the entire PR is scanned.  Fails hard if no diff can be computed — a
 * silent fallback to a single-commit diff could miss unregistered flags
 * introduced in earlier commits.
 */
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

/**
 * Parses a unified diff into a map of `filePath -> chunks`.
 * Each chunk is an array of truly adjacent added lines (consecutive `+`
 * lines in the diff with no context or removed lines between them).
 * This lets the multiline join only combine lines that are actually
 * next to each other in the file.
 */
function parseDiff(diff: string): Map<string, string[][]> {
  const result = new Map<string, string[][]>();
  let currentFile = '';
  let lastWasAdded = false;

  for (const line of diff.split('\n')) {
    if (line.startsWith('+++ b/')) {
      currentFile = line.slice(6);
      if (!result.has(currentFile)) {
        result.set(currentFile, []);
      }
      lastWasAdded = false;
    } else if (
      line.startsWith('+') &&
      !line.startsWith('+++') &&
      currentFile
    ) {
      const chunks = result.get(currentFile)!;
      if (!lastWasAdded || chunks.length === 0) {
        chunks.push([]);
      }
      chunks[chunks.length - 1].push(line.slice(1));
      lastWasAdded = true;
    } else {
      lastWasAdded = false;
    }
  }

  return result;
}

// ============================================================================
// Flag detection
// ============================================================================

/**
 * Extracts feature flag references from a single line (or joined line pair).
 * String literals are stripped before scanning to prevent false positives
 * from flag names that appear inside quoted text.
 *
 * @param skipDestructuring - When true, destructuring patterns are not run.
 *   Used for joined line pairs where brace-matching is unreliable (e.g.
 *   `) {` joined with `const { flag } = getRemoteFeatureFlags(state);`
 *   would cause the greedy `[^}]+` to match from the wrong brace).
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

  // 2. Run bracket string-literal patterns on the comment-stripped line
  //    BEFORE stripping string literals (they need the quoted flag name).
  for (const pattern of BRACKET_STRING_PATTERNS) {
    pattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(commentStripped)) !== null) {
      if (isLikelyFlagName(match[1])) {
        refs.push({ flagName: match[1], filePath });
      }
    }
  }

  // 3. Strip string literal contents so remaining patterns don't match
  //    flag names inside quoted text (e.g. log messages, error strings).
  const sanitized = stripStringLiterals(commentStripped);

  // 4. Dot-access patterns (run on fully sanitized line)
  for (const pattern of FLAG_ACCESS_PATTERNS) {
    pattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(sanitized)) !== null) {
      if (isLikelyFlagName(match[1])) {
        refs.push({ flagName: match[1], filePath });
      }
    }
  }

  // 5. Bracket access with constants (run on fully sanitized line)
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

  // 6. Destructuring patterns (run on fully sanitized line)
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

/**
 * Pulls identifiers out of a destructuring expression.
 * Handles renaming (`original: local`) and skips spread elements.
 */
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

/**
 * Returns `true` when the expression looks like a static constant that
 * should be resolvable (UPPER_CASE or Enum.Member), as opposed to a
 * runtime variable (camelCase) that cannot be resolved statically.
 */
function isStaticConstant(expr: string): boolean {
  // Enum.Member pattern (e.g. FeatureFlagNames.AssetsDefiPositionsEnabled)
  // Both parts must start with an uppercase letter to distinguish from
  // runtime expressions like options.key or config.flagName.
  if (expr.includes('.')) {
    return /^[A-Z]\w*\.[A-Z]\w*$/.test(expr);
  }
  // UPPER_CASE_CONSTANT pattern (e.g. ASSETS_UNIFY_STATE_FLAG)
  return /^[A-Z_][A-Z0-9_]*$/.test(expr);
}

/**
 * Returns `true` when the name looks like a plausible feature flag
 * (camelCase, >= 3 chars, not a well-known property / method name).
 */
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

/**
 * Strips trailing inline comments from a line of code.
 * Finds `//` that is not inside a string literal and removes everything
 * after it.  This prevents patterns in comments like
 * `code(); // remoteFeatureFlags.oldFlag` from being detected.
 */
function stripInlineComments(line: string): string {
  let inSingle = false;
  let inDouble = false;
  let inTemplate = false;
  let escaped = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];

    if (escaped) {
      escaped = false;
      continue;
    }

    if (ch === '\\' && (inSingle || inDouble || inTemplate)) {
      escaped = true;
      continue;
    }

    if (ch === "'" && !inDouble && !inTemplate) {
      inSingle = !inSingle;
    } else if (ch === '"' && !inSingle && !inTemplate) {
      inDouble = !inDouble;
    } else if (ch === '`' && !inSingle && !inDouble) {
      inTemplate = !inTemplate;
    } else if (
      ch === '/' &&
      line[i + 1] === '/' &&
      !inSingle &&
      !inDouble &&
      !inTemplate
    ) {
      return line.slice(0, i);
    }
  }
  return line;
}

/**
 * Replaces the contents of string literals with empty placeholders so that
 * regex scanning does not match flag names inside quoted text.
 *
 * Handles single-quoted, double-quoted, and backtick template strings.
 * Does not handle escaped quotes or multi-line template literals, but
 * covers the common cases that would produce false positives.
 */
function stripStringLiterals(line: string): string {
  return line
    .replace(/'[^']*'/g, "''")
    .replace(/"[^"]*"/g, '""')
    .replace(/`[^`]*`/g, '``');
}

// ============================================================================
// Registry-change reporting (informational only)
// ============================================================================

/**
 * If the registry file was modified in this PR, logs which flags were added
 * or removed.  This is purely informational and never causes failure.
 */
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

// ============================================================================
// PR commenting
// ============================================================================

/**
 * Builds the Markdown body for the PR comment.
 */
function buildCommentBody(
  flags: Array<{ flag: string; files: string[] }>,
): string {
  const lines: string[] = [
    PR_COMMENT_MARKER,
    '## Feature Flag Registry Check',
    '',
    'This PR introduces feature flag references that are **not yet registered** in the',
    '[feature flag registry](https://github.com/MetaMask/metamask-extension/blob/main/test/e2e/feature-flags/feature-flag-registry.ts).',
    '',
    'Please add the missing flags with their production default values so that',
    'E2E tests run against accurate configurations.',
    '',
    '### Unregistered flags',
    '',
    '| Flag | Referenced in |',
    '| ---- | ------------ |',
  ];

  for (const { flag, files } of flags) {
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
    '</details>',
  );

  return lines.join('\n');
}

/**
 * Posts or updates a comment on the current PR.
 * Uses the hidden marker to find an existing comment to update.
 * Silently skips when not running in a GitHub Actions PR context.
 */
async function postPrComment(
  flags: Array<{ flag: string; files: string[] }>,
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
  const body = buildCommentBody(flags);

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

/**
 * Deletes the marker comment if one exists (called on success so stale
 * warnings don't linger after the author fixes the issue).
 */
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

/**
 * Finds the bot comment identified by {@link PR_COMMENT_MARKER}.
 * Paginates through all comments to handle PRs with 100+ comments.
 */
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

// ============================================================================
// Entry point
// ============================================================================

main().catch((error) => {
  console.error('Feature flag registry check failed:', error);
  process.exit(1);
});
