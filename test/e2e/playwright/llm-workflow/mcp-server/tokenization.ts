/**
 * Tokenization utilities used by the knowledge store.
 */

/**
 * Stopwords to remove from queries.
 * Includes common English stopwords and test-specific terms.
 */
const STOPWORDS = new Set([
  'a',
  'an',
  'the',
  'to',
  'from',
  'in',
  'on',
  'at',
  'for',
  'with',
  'and',
  'or',
  'but',
  'is',
  'are',
  'was',
  'were',
  'be',
  'been',
  'flow',
  'test',
  'should',
  'can',
  'will',
  'do',
  'does',
  'did',
  'have',
  'has',
  'had',
  'this',
  'that',
  'these',
  'those',
  'it',
  // Tool-specific stopwords - too generic and match everything
  'mm',
  'mcp',
]);

const MIN_TOKEN_LENGTH = 2;

/**
 * Tokenizes a string into searchable tokens.
 * - Lowercases all text
 * - Splits on non-alphanumeric characters
 * - Removes stopwords and short tokens
 * - Deduplicates tokens
 *
 * @param text - The text to tokenize
 * @returns Array of unique, meaningful tokens
 * @example
 * tokenize('send flow ETH to another account')
 * // Returns: ['send', 'eth', 'another', 'account']
 */
export function tokenize(text: string): string[] {
  if (!text) {
    return [];
  }

  const tokens = text
    .toLowerCase()
    .split(/[^a-z0-9]+/iu)
    .filter(
      (token) => token.length >= MIN_TOKEN_LENGTH && !STOPWORDS.has(token),
    );

  return [...new Set(tokens)];
}

/**
 * Tokenizes an identifier (testId, CSS class, etc.) into words.
 * Handles kebab-case, camelCase, snake_case, and mixed formats.
 *
 * @param identifier - The identifier to tokenize
 * @returns Array of tokens
 * @example
 * tokenizeIdentifier('coin-overview-send-button')
 * // Returns: ['coin', 'overview', 'send', 'button']
 * @example
 * tokenizeIdentifier('sendTokenButton')
 * // Returns: ['send', 'token', 'button']
 * @example
 * tokenizeIdentifier('send_token_btn')
 * // Returns: ['send', 'token', 'btn']
 */
export function tokenizeIdentifier(identifier: string): string[] {
  if (!identifier) {
    return [];
  }

  // Split camelCase: 'sendToken' → 'send Token'
  const withSpaces = identifier
    .replace(/([a-z])([A-Z])/gu, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/gu, '$1 $2');

  // Split on non-alphanumeric (handles kebab-case, snake_case)
  const tokens = withSpaces
    .toLowerCase()
    .split(/[^a-z0-9]+/iu)
    .filter((token) => token.length >= MIN_TOKEN_LENGTH);

  return [...new Set(tokens)];
}

/**
 * Synonyms for common MetaMask actions.
 * Maps user terms to related terms found in testIds/a11y names.
 *
 * Keep this minimal - only add proven high-value mappings.
 * Adding too many synonyms increases noise in search results.
 */
const ACTION_SYNONYMS: Record<string, string[]> = {
  // Transaction actions
  send: ['transfer', 'pay'],
  receive: ['deposit'],

  // Confirmation actions
  approve: ['confirm', 'accept', 'allow'],
  reject: ['deny', 'cancel', 'decline'],

  // Authentication
  unlock: ['login', 'signin'],

  // Connection
  connect: ['link', 'authorize'],

  // Trading
  swap: ['exchange', 'trade'],

  // Signing
  sign: ['signature'],
};

/**
 * Expands query tokens with synonyms.
 * Returns original tokens plus any synonyms for bidirectional matching.
 *
 * @param tokens - Array of query tokens
 * @returns Expanded array including synonyms
 * @example
 * expandWithSynonyms(['transfer'])
 * // Returns: ['transfer', 'send', 'pay']
 */
export function expandWithSynonyms(tokens: string[]): string[] {
  const expanded = new Set(tokens);

  for (const token of tokens) {
    // Check if token is a canonical term (key)
    if (ACTION_SYNONYMS[token]) {
      for (const synonym of ACTION_SYNONYMS[token]) {
        expanded.add(synonym);
      }
    }

    // Check if token is a synonym value
    for (const [canonical, synonyms] of Object.entries(ACTION_SYNONYMS)) {
      if (synonyms.includes(token)) {
        expanded.add(canonical);
        for (const synonym of synonyms) {
          expanded.add(synonym);
        }
      }
    }
  }

  return [...expanded];
}
