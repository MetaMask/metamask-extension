/**
 * Fitness function: Detect locale-query mismatches in tests
 *
 * Rule 1 — Hardcoded JSX + locale query (fragile coupling):
 * Test renders `<button>Close</button>` but queries via `messages.close.message`.
 * Fix: use `getByText('Close')` — the text is hardcoded, not i18n.
 *
 * Rule 2 — Hardcoded query string matching a locale value (brittle to translation changes):
 * Component renders via `t('tronDailyResources')` but test queries `getByText("Tron Daily Resources")`.
 * Fix: use `messages.tronDailyResources.message` — stays in sync with translations.
 * Scans ALL test files (not just those importing messages).
 */

import fs from 'fs';
import path from 'path';
import en from '../../app/_locales/en/messages.json';

const TEST_FILE_PATTERN = /\.test\.(ts|tsx|js|jsx)$/u;

/**
 * Recursively find files matching a pattern under a directory.
 *
 * @param dir - Root directory to search.
 * @param pattern - Regex to test against file names.
 * @returns Absolute paths of matching files.
 */
function findFiles(dir: string, pattern: RegExp): string[] {
  const results: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findFiles(full, pattern));
    } else if (pattern.test(entry.name)) {
      results.push(full);
    }
  }
  return results;
}

const enLocale = en as Record<string, { message: string }>;

const MESSAGES_IMPORT_PATTERN =
  /import\s+\{[^}]*enLocale\s+as\s+messages[^}]*\}\s+from/u;

const QUERY_FN_NAMES = [
  'getByText',
  'queryByText',
  'findByText',
  'getAllByText',
  'queryAllByText',
  'findAllByText',
  'getByRole',
  'queryByRole',
  'findByRole',
  'getByLabelText',
  'queryByLabelText',
  'findByLabelText',
  'getByPlaceholderText',
  'queryByPlaceholderText',
  'findByPlaceholderText',
];

const QUERY_FN_GROUP = QUERY_FN_NAMES.join('|');

// --- Rule 1: Hardcoded JSX text queried via messages.xxx.message ---

// Direct arg: getByText(messages.xxx.message)
const LOCALE_QUERY_DIRECT_PATTERN = new RegExp(
  `(?:${QUERY_FN_GROUP})\\s*\\(\\s*messages\\.(\\w+)\\.message`,
  'gu',
);

// Options arg: getByRole('...', { name: messages.xxx.message })
// Requires a query function before the { name: } to avoid matching plain objects.
// [^)]* spans newlines without crossing the closing paren of the query call.
const LOCALE_QUERY_OPTIONS_PATTERN = new RegExp(
  `(?:${QUERY_FN_GROUP})\\s*\\([^)]*\\{\\s*name:\\s*messages\\.(\\w+)\\.message`,
  'gu',
);

// Hardcoded text between JSX tags: >SomeText<
const HARDCODED_JSX_TEXT_PATTERN = />([A-Z][A-Za-z\s]{1,30})</gu;

type Violation = {
  file: string;
  line: number;
  rule: string;
  message: string;
};

/**
 * Compute the 1-based line number for a character offset within a string.
 *
 * @param content - Full file content.
 * @param offset - Character offset into content.
 * @returns 1-based line number.
 */
function lineNumberAt(content: string, offset: number): number {
  let count = 1;
  const end = Math.min(offset, content.length);
  for (let i = 0; i < end; i += 1) {
    if (content[i] === '\n') {
      count += 1;
    }
  }
  return count;
}

function findRule1Violations(filePath: string, lines: string[]): Violation[] {
  const violations: Violation[] = [];
  const content = lines.join('\n');

  // Collect all hardcoded JSX text in the file
  const hardcodedTexts = new Set<string>();
  for (const line of lines) {
    let match;
    HARDCODED_JSX_TEXT_PATTERN.lastIndex = 0;
    while ((match = HARDCODED_JSX_TEXT_PATTERN.exec(line)) !== null) {
      hardcodedTexts.add(match[1].trim());
    }
  }

  if (hardcodedTexts.size === 0) {
    return [];
  }

  // Helper: check if a matched message key corresponds to hardcoded JSX text
  const addViolationIfHardcoded = (messageKey: string, lineNum: number) => {
    const localeEntry = enLocale[messageKey];
    if (!localeEntry) {
      return;
    }
    const localeValue = localeEntry.message;
    if (hardcodedTexts.has(localeValue)) {
      violations.push({
        file: filePath,
        line: lineNum,
        rule: 'Rule 1',
        message:
          `Query uses messages.${messageKey}.message ("${localeValue}") ` +
          `but "${localeValue}" is hardcoded in JSX.\n` +
          `    Fix: use getByText('${localeValue}') instead.`,
      });
    }
  };

  // Pattern 1: Direct arg — match against full content to handle multiline calls
  let directMatch;
  LOCALE_QUERY_DIRECT_PATTERN.lastIndex = 0;
  while ((directMatch = LOCALE_QUERY_DIRECT_PATTERN.exec(content)) !== null) {
    const lineNum = lineNumberAt(
      content,
      directMatch.index + directMatch[0].length,
    );
    addViolationIfHardcoded(directMatch[1], lineNum);
  }

  // Pattern 2: Options object — may span lines, match against full content
  let optMatch;
  LOCALE_QUERY_OPTIONS_PATTERN.lastIndex = 0;
  while ((optMatch = LOCALE_QUERY_OPTIONS_PATTERN.exec(content)) !== null) {
    const lineNum = lineNumberAt(content, optMatch.index + optMatch[0].length);
    addViolationIfHardcoded(optMatch[1], lineNum);
  }

  return violations;
}

// --- Rule 2: Hardcoded string in query that matches a locale value ---

// Build reverse lookup: locale value → key (only for values ≥ 3 chars to avoid noise)
const localeValueToKey = new Map<string, string>();
for (const [key, entry] of Object.entries(enLocale)) {
  if (entry.message && entry.message.length >= 3) {
    // Use first key found (some values may duplicate across keys)
    if (!localeValueToKey.has(entry.message)) {
      localeValueToKey.set(entry.message, key);
    }
  }
}

// Match hardcoded strings in query calls:
//   getByText("..."), getByText('...')
//   getByRole('...', { name: '...' }), getByRole('...', { name: "..." })

// Direct arg: getByText('Close') or getByText(`Close`)
// Backtick branch excludes strings containing $ to avoid matching template interpolations.
const HARDCODED_QUERY_DIRECT_PATTERN_R2 = new RegExp(
  `(?:${QUERY_FN_GROUP})\\s*\\(\\s*(?:'([^']{3,})'|\`([^\`$]{3,})\`)`,
  'gu',
);

// Options arg: getByRole('button', { name: 'Close' })
// Requires a query function before { name: } to avoid matching plain objects.
// Backtick branch excludes strings containing $ to avoid matching template interpolations.
const HARDCODED_QUERY_OPTIONS_PATTERN_R2 = new RegExp(
  `(?:${QUERY_FN_GROUP})\\s*\\([^)]*\\{\\s*name:\\s*(?:'([^']{3,})'|\`([^\`$]{3,})\`)`,
  'gu',
);

// Strings that are common test data, not real i18n values — skip these
const IGNORED_STRINGS = new Set([
  'Test Account',
  'modal content',
  'test content',
  'test',
]);

/**
 * Baseline of pre-existing Rule 2 violations (file → count).
 * New violations are not allowed. Reduce counts as you fix files.
 * When a file reaches 0, remove it from this map.
 */
const RULE_2_BASELINE: Record<string, number> = {
  // Network configuration names are stored data, not i18n-rendered values.
  // These tests hardcode 'Ethereum Mainnet' in fixtures and assertions because
  // the name field represents persisted config, not a locale key resolved at
  // render time. Accepted as false positives per review consensus.
  'ui/components/app/multi-rpc-edit-modal/multi-rpc-edit-modal.test.tsx': 1,
  'ui/components/app/multi-rpc-edit-modal/network-list-item/network-list-item.test.tsx': 1,
  'ui/components/multichain-accounts/smart-contract-account-toggle/smart-contract-account-toggle.test.tsx': 1,
  'ui/components/multichain-accounts/smart-contract-account-toggle-section/smart-contract-account-toggle-section.test.tsx': 1,
  // Snap SDK Field props (label, error) are external input data, not i18n-rendered by the component under test.
  // Hardcoded to avoid tying Snap test fixtures to MetaMask locale files.
  'ui/components/app/snaps/snap-ui-renderer/components/address-input.test.ts': 2,
};

function findRule2Violations(filePath: string, lines: string[]): Violation[] {
  const violations: Violation[] = [];
  const content = lines.join('\n');

  // Deduplicate: same line + same value = one violation
  const seen = new Set<string>();

  const addViolationIfLocale = (hardcodedValue: string, lineNum: number) => {
    const dedupeKey = `${lineNum}:${hardcodedValue}`;
    if (IGNORED_STRINGS.has(hardcodedValue) || seen.has(dedupeKey)) {
      return;
    }
    const messageKey = localeValueToKey.get(hardcodedValue);
    if (messageKey) {
      seen.add(dedupeKey);
      violations.push({
        file: filePath,
        line: lineNum,
        rule: 'Rule 2',
        message:
          `Query uses hardcoded string "${hardcodedValue}" which matches ` +
          `locale key "${messageKey}".\n` +
          `    Fix: use messages.${messageKey}.message instead of "${hardcodedValue}".`,
      });
    }
  };

  // Pattern 1: Direct arg — match against full content to handle multiline calls
  let directMatch;
  HARDCODED_QUERY_DIRECT_PATTERN_R2.lastIndex = 0;
  while (
    (directMatch = HARDCODED_QUERY_DIRECT_PATTERN_R2.exec(content)) !== null
  ) {
    const lineNum = lineNumberAt(
      content,
      directMatch.index + directMatch[0].length,
    );
    addViolationIfLocale(directMatch[1] ?? directMatch[2], lineNum);
  }

  // Pattern 2: Options object — may span lines, match against full content
  let optMatch;
  HARDCODED_QUERY_OPTIONS_PATTERN_R2.lastIndex = 0;
  while (
    (optMatch = HARDCODED_QUERY_OPTIONS_PATTERN_R2.exec(content)) !== null
  ) {
    const lineNum = lineNumberAt(content, optMatch.index + optMatch[0].length);
    addViolationIfLocale(optMatch[1] ?? optMatch[2], lineNum);
  }

  return violations;
}

// --- Test runner ---

describe('Locale query mismatch fitness function', () => {
  it('should not use messages.xxx.message to query hardcoded JSX text (Rule 1)', () => {
    const uiDir = path.resolve(__dirname, '../../ui');
    const testFiles = findFiles(uiDir, TEST_FILE_PATTERN);

    const allViolations: Violation[] = [];

    for (const filePath of testFiles) {
      const content = fs.readFileSync(filePath, 'utf-8');
      if (!MESSAGES_IMPORT_PATTERN.test(content)) {
        continue;
      }
      const lines = content.split('\n');
      const violations = findRule1Violations(filePath, lines);
      allViolations.push(...violations);
    }

    if (allViolations.length > 0) {
      const report = formatReport(allViolations);
      throw new Error(
        `Found ${allViolations.length} Rule 1 violation(s) — ` +
          `hardcoded JSX text queried via messages.xxx.message:\n\n${report}`,
      );
    }
  });

  it('should not use hardcoded strings that match locale values (Rule 2)', () => {
    const rootDir = path.resolve(__dirname, '../..');
    const uiDir = path.join(rootDir, 'ui');
    const testFiles = findFiles(uiDir, TEST_FILE_PATTERN);

    const newViolations: Violation[] = [];

    for (const filePath of testFiles) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');
      const violations = findRule2Violations(filePath, lines);

      // Check against baseline — only flag violations above the allowed count
      const relPath = path.relative(rootDir, filePath);
      const baselineCount = RULE_2_BASELINE[relPath] ?? 0;

      if (violations.length > baselineCount) {
        // Report ALL violations for this file so the developer can identify
        // which ones are new (we can't know positionally which are "old").
        newViolations.push(...violations);
      }
    }

    if (newViolations.length > 0) {
      const report = formatReport(newViolations);
      throw new Error(
        `Rule 2 violation count exceeds baseline — ` +
          `hardcoded query strings matching locale values:\n\n${report}\n\n` +
          `Prefer messages.xxx.message over hardcoded strings so tests ` +
          `stay in sync with translations.\n` +
          `(Pre-existing violations are tracked in RULE_2_BASELINE.)`,
      );
    }
  });
});

function formatReport(violations: Violation[]): string {
  return violations
    .map(
      (v) =>
        `  ${path.relative(path.resolve(__dirname, '../..'), v.file)}:${v.line} [${v.rule}]\n` +
        `    ${v.message}`,
    )
    .join('\n\n');
}
