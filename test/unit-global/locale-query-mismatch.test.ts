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

const enLocale: Record<string, { message: string }> =
  // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
  require('../../app/_locales/en/messages.json');

// --- Shared patterns ---

const MESSAGES_IMPORT_PATTERN =
  /import\s+\{[^}]*enLocale\s+as\s+messages[^}]*\}\s+from/u;

// Query functions used in @testing-library
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

// Query using messages.xxx.message as first arg or in { name: messages.xxx.message }
const LOCALE_QUERY_PATTERNS = [
  // Direct: getByText(messages.xxx.message)
  new RegExp(
    `(?:${QUERY_FN_GROUP})\\s*\\(\\s*messages\\.(\\w+)\\.message`,
    'gu',
  ),
  // Role name option: getByRole('...', { name: messages.xxx.message })
  /\{\s*name:\s*messages\.(\w+)\.message/gu,
];

// Hardcoded text between JSX tags: >SomeText<
const HARDCODED_JSX_TEXT_PATTERN = />([A-Z][A-Za-z\s]{1,30})</gu;

type Violation = {
  file: string;
  line: number;
  rule: string;
  message: string;
};

function findRule1Violations(
  _filePath: string,
  lines: string[],
): Violation[] {
  const violations: Violation[] = [];

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

  // Find query calls using messages.xxx.message (direct arg or { name: ... })
  for (let i = 0; i < lines.length; i++) {
    for (const pattern of LOCALE_QUERY_PATTERNS) {
      let match;
      pattern.lastIndex = 0;
      while ((match = pattern.exec(lines[i])) !== null) {
        const messageKey = match[1];
        const localeEntry = enLocale[messageKey];
        if (!localeEntry) {
          continue;
        }

        const localeValue = localeEntry.message;

        if (hardcodedTexts.has(localeValue)) {
          violations.push({
            file: _filePath,
            line: i + 1,
            rule: 'Rule 1',
            message:
              `Query uses messages.${messageKey}.message ("${localeValue}") ` +
              `but "${localeValue}" is hardcoded in JSX.\n` +
              `    Fix: use getByText('${localeValue}') instead.`,
          });
        }
      }
    }
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
const HARDCODED_QUERY_PATTERNS_R2 = [
  // Direct: getByText('Close')
  new RegExp(
    `(?:${QUERY_FN_GROUP})\\s*\\(\\s*['"]([^'"]{3,})['"]`,
    'gu',
  ),
  // Role name option: { name: 'Close' }
  /\{\s*name:\s*['"]([^'"]{3,})['"]/gu,
];

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
const RULE_2_BASELINE: Record<string, number> = {};

function findRule2Violations(
  filePath: string,
  lines: string[],
): Violation[] {
  const violations: Violation[] = [];

  for (let i = 0; i < lines.length; i++) {
    // Deduplicate across patterns (same line + same value = one violation)
    const seen = new Set<string>();
    for (const pattern of HARDCODED_QUERY_PATTERNS_R2) {
      let match;
      pattern.lastIndex = 0;
      while ((match = pattern.exec(lines[i])) !== null) {
        const hardcodedValue = match[1];

        if (IGNORED_STRINGS.has(hardcodedValue) || seen.has(hardcodedValue)) {
          continue;
        }

        const messageKey = localeValueToKey.get(hardcodedValue);
        if (messageKey) {
          seen.add(hardcodedValue);
          violations.push({
            file: filePath,
            line: i + 1,
            rule: 'Rule 2',
            message:
              `Query uses hardcoded string "${hardcodedValue}" which matches ` +
              `locale key "${messageKey}".\n` +
              `    Fix: use messages.${messageKey}.message instead of "${hardcodedValue}".`,
          });
        }
      }
    }
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
        // Only report the NEW violations (count above baseline)
        const newCount = violations.length - baselineCount;
        newViolations.push(...violations.slice(violations.length - newCount));
      }
    }

    if (newViolations.length > 0) {
      const report = formatReport(newViolations);
      throw new Error(
        `Found ${newViolations.length} NEW Rule 2 violation(s) — ` +
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
