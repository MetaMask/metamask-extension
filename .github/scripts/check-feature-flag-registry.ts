// Feature Flag Registry Check — scans PR diffs for feature flag references
// and verifies they exist in the registry. Fails if unregistered flags found.

import { execFileSync } from 'child_process';
import * as path from 'path';
import { context, getOctokit } from '@actions/github';
import { getRegisteredFlagNames } from '../../test/e2e/feature-flags';
import { buildKnownFlagConstants } from './known-feature-flag-constants';

const REGISTRY_DIR = 'test/e2e/feature-flags/';
const SCANNABLE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx']);
const SCAN_DIRECTORIES = ['app/', 'ui/', 'shared/', 'test/'];

/** Matches balanced parens with one level of nesting: (arg) or (fn(arg)) */
const ARGS = '[^)]*(?:\\([^)]*\\)[^)]*)*';

const QUOTE_FLAG = `(?:'(\\w+)'|"(\\w+)"|` + '`(\\w+)`' + `)`;
/** Bracket-access patterns run BEFORE string stripping (need quoted flag name). */
const BRACKET_STRING_PATTERNS: RegExp[] = [
  new RegExp(`remoteFeatureFlags(?:\\?\\.)?\\[\\s*${QUOTE_FLAG}\\s*\\]`, 'g'),
  new RegExp(`getRemoteFeatureFlags\\(${ARGS}\\)(?:\\?\\.)?\\[\\s*${QUOTE_FLAG}\\s*\\]`, 'g'),
];

const FLAG_ACCESS_PATTERNS: RegExp[] = [
  /remoteFeatureFlags\??\.(\w+)/g,
  /state\.metamask\.remoteFeatureFlags\??\.(\w+)/g,
  /remoteFeatureFlagController\.state\.remoteFeatureFlags\??\.(\w+)/g,
  new RegExp(`getRemoteFeatureFlags\\(${ARGS}\\)\\??\\.(\\w+)`, 'g'),
];

const DESTRUCTURING_PATTERNS: RegExp[] = [
  /\{\s*([^}]+)\}\s*(?::[^=]+)?\s*=\s*getRemoteFeatureFlags/g,
  /\{\s*([^}]+)\}\s*(?::[^=]+)?\s*=\s*useSelector\s*\(\s*getRemoteFeatureFlags/g,
  /useSelector\s*\(\s*getRemoteFeatureFlags\s*\)\s*as\s*\{\s*([^}]+)\}/g,
  /remoteFeatureFlags:\s*\{\s*([^}]+)\}/g,
];

const CONSTANT_BRACKET_PATTERNS: RegExp[] = [
  /remoteFeatureFlags(?:\?\.)?\[([A-Za-z_]\w*(?:\.\w+)?)\]/g,
  new RegExp(`getRemoteFeatureFlags\\(${ARGS}\\)(?:\\?\\.)?\\[([A-Za-z_]\\w*(?:\\.\\w+)?)\\]`, 'g'),
];

/** @see ./known-feature-flag-constants.ts */
const KNOWN_FLAG_CONSTANTS = buildKnownFlagConstants();

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
  'bind',
  'call',
  'apply',
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

  if (!/^[\w./-]+$/.test(baseBranch)) {
    console.error(`Invalid base branch name: "${baseBranch}"`);
    process.exit(1);
  }

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
        const j2 = `${stripInlineComments(chunk[i]).trimEnd()}${chunk[i + 1].trimStart()}`;
        allReferences.push(...extractFlagReferences(j2, filePath, true));
        if (i < chunk.length - 2) {
          const j3 = `${stripInlineComments(chunk[i]).trimEnd()}${stripInlineComments(chunk[i + 1]).trim()}${chunk[i + 2].trimStart()}`;
          allReferences.push(...extractFlagReferences(j3, filePath, true));
        }
      }
      allReferences.push(
        ...extractMultiLineDestructuring(chunk, filePath),
      );
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

function getDiff(baseBranch: string): string {
  const candidates: string[][] = [
    ['git', 'diff', `origin/${baseBranch}...HEAD`, '--', ...SCAN_DIRECTORIES],
    ['git', 'diff', `origin/${baseBranch}..HEAD`, '--', ...SCAN_DIRECTORIES],
    ['git', 'diff', `${baseBranch}...HEAD`, '--', ...SCAN_DIRECTORIES],
    ['git', 'diff', `${baseBranch}..HEAD`, '--', ...SCAN_DIRECTORIES],
  ];
  let lastError: unknown;
  for (const [cmd, ...args] of candidates) {
    try {
      return execFileSync(cmd, args, { encoding: 'utf-8', maxBuffer: 50 * 1024 * 1024 });
    } catch (error) { lastError = error; }
  }
  console.error(`Could not compute diff against base branch "${baseBranch}".`);
  console.error('Ensure the base branch is fetched (e.g. git fetch origin <base> --depth=1).');
  console.error('Last error:', lastError);
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

/** Checks which flags have no remaining references in the codebase. */
function findOrphanedFlags(flagNames: string[]): string[] {
  const orphaned: string[] = [];

  for (const flag of flagNames) {
    if (!/^[\w.]+$/.test(flag)) {
      continue;
    }
    try {
      const result = execFileSync(
        'git', ['grep', '-lFw', '--', flag, ...SCAN_DIRECTORIES],
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
  let pendingFile = '';
  let lastWasAdded = false;

  for (const line of diff.split('\n')) {
    if (line.startsWith('--- a/')) {
      pendingFile = line.slice(6);
    }
    if (line.startsWith('+++ b/')) {
      currentFile = line.slice(6);
      if (!added.has(currentFile)) {
        added.set(currentFile, []);
      }
      if (!removed.has(currentFile)) {
        removed.set(currentFile, []);
      }
      lastWasAdded = false;
    } else if (line.startsWith('+++ /dev/null') && pendingFile) {
      currentFile = pendingFile;
      if (!added.has(currentFile)) { added.set(currentFile, []); }
      if (!removed.has(currentFile)) { removed.set(currentFile, []); }
      lastWasAdded = false;
    } else if (
      line.startsWith('+') &&
      !line.startsWith('+++ ') &&
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
      !line.startsWith('--- ') &&
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

function extractFlagReferences(
  line: string,
  filePath: string,
  skipDestructuring = false,
): FlagReference[] {
  const refs: FlagReference[] = [];
  const trimmed = line.trim();

  if (
    trimmed.startsWith('//') ||
    trimmed.startsWith('*')
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

  // 4. Bracket string-literal patterns (use mask to reject matches inside outer strings).
  for (const pattern of BRACKET_STRING_PATTERNS) {
    pattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(commentStripped)) !== null) {
      const posInMasked = masked.charAt(match.index);
      if (posInMasked === ' ' && commentStripped.charAt(match.index) !== ' ') {
        continue;
      }
      const flagName = match[1] || match[2] || match[3];
      if (flagName && isLikelyFlagName(flagName)) {
        refs.push({ flagName, filePath });
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

/**
 * Handles destructuring that spans 3+ lines by scanning backwards from
 * lines containing `getRemoteFeatureFlags` to find the opening `{`.
 */
function extractMultiLineDestructuring(
  chunk: string[],
  filePath: string,
): FlagReference[] {
  const refs: FlagReference[] = [];

  for (let i = 0; i < chunk.length; i++) {
    if (!chunk[i].includes('getRemoteFeatureFlags')) {
      continue;
    }
    let combined = '';
    for (let j = i; j >= 0 && j >= i - 10; j--) {
      const stripped = stripInlineComments(chunk[j]);
      combined = `${stripped} ${combined}`;
      if (stripped.includes('{')) {
        break;
      }
    }
    const sanitized = stripStringLiterals(combined);
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
      const prevNonWs = result.trimEnd().slice(-1);
      if (i === 0 || /[=([!&|,;:?]/.test(prevNonWs)) {
        const closeIdx = findRegexClose(line, i + 1);
        if (closeIdx > i) {
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

function findRegexClose(line: string, start: number): number {
  let inCharClass = false;
  for (let k = start; k < line.length; k++) {
    let backslashes = 0;
    while (k - 1 - backslashes >= start && line[k - 1 - backslashes] === '\\') {
      backslashes++;
    }
    if (backslashes % 2 === 1) { continue; }
    const c = line[k];
    if (c === '[') { inCharClass = true; }
    else if (c === ']' && inCharClass) { inCharClass = false; }
    else if (c === '/' && !inCharClass) { return k; }
  }
  return -1;
}

// Single-pass string processor: strips or masks string literal contents.
function processStrings(line: string, mode: 'strip' | 'mask'): string {
  let result = '';
  let i = 0;
  while (i < line.length) {
    const ch = line[i];
    if (ch !== "'" && ch !== '"' && ch !== '`') { result += ch; i++; continue; }
    if (ch === '`') {
      let j = i + 1;
      let hasExpr = false;
      while (j < line.length) {
        if (line[j] === '\\') { j += 2; continue; }
        if (line[j] === '$' && line[j + 1] === '{') { hasExpr = true; break; }
        if (line[j] === '`') break;
        j++;
      }
      if (hasExpr) {
        let depth = 1, k = j + 2, foundClose = false;
        result += ch; if (mode === 'mask') result += ' '.repeat(j - i - 1); result += '${';
        while (k < line.length) {
          if (line[k] === '\\') { if (depth > 0) result += line[k] + (line[k+1]||' '); else if (mode === 'mask') result += '  '; k += 2; continue; }
          if (depth === 0) {
            if (line[k] === '`') { foundClose = true; result += '`'; break; }
            if (line[k] === '$' && line[k + 1] === '{') { depth = 1; result += '${'; k += 2; continue; }
            if (mode === 'mask') result += ' ';
          } else {
            if (line[k] === '$' && line[k + 1] === '{') { result += '${'; depth++; k++; }
            else if (line[k] === '{') { result += '{'; depth++; }
            else if (line[k] === '}') { result += '}'; depth--; }
            else if (line[k] === '`' && depth === 1) { result += '`'; depth++; }
            else if (line[k] === '`' && depth > 1) { result += '`'; depth--; }
            else result += line[k];
          }
          k++;
        }
        if (!foundClose) result += line.slice(k);
        i = foundClose ? k + 1 : line.length; continue;
      }
    }
    let j = i + 1;
    while (j < line.length) {
      if (line[j] === '\\') { j += 2; continue; }
      if (line[j] === ch) break;
      j++;
    }
    if (j >= line.length) { result += ch; i++; continue; }
    const len = j - i - 1;
    result += mode === 'mask' ? ch + ' '.repeat(len) + ch : ch + ch;
    i = j + 1;
  }
  return result;
}
function stripStringLiterals(line: string): string { return processStrings(line, 'strip'); }
function maskStringLiterals(line: string): string { return processStrings(line, 'mask'); }

/** Logs which flags were added/removed in the registry (informational only). */
function logRegistryChanges(baseBranch: string): void {
  const registryFile = 'test/e2e/feature-flags/feature-flag-registry.ts';
  const candidates: string[][] = [
    ['git', 'diff', `origin/${baseBranch}...HEAD`, '--', registryFile],
    ['git', 'diff', `${baseBranch}...HEAD`, '--', registryFile],
  ];
  let registryDiff = '';
  for (const [cmd, ...args] of candidates) {
    try {
      registryDiff = execFileSync(cmd, args, { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024 });
      break;
    } catch { /* try next */ }
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
