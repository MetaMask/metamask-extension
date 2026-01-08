/**
 * Seed Phrase Detection Module
 *
 * This module provides functionality to detect if a given text is a valid
 * BIP39 seed phrase (mnemonic). It's used to protect users from accidentally
 * pasting their seed phrase on malicious websites.
 */

// BIP39 English wordlist - only import the words we need for validation
// This is a subset approach to keep the bundle size small for content scripts
import { wordlist } from '@metamask/scure-bip39/dist/wordlists/english';

// Valid seed phrase lengths according to BIP39
const VALID_SEED_PHRASE_LENGTHS = [12, 15, 18, 21, 24] as const;

// We focus on 12 and 24 word phrases as they are most common
const COMMON_SEED_PHRASE_LENGTHS = [12, 24] as const;

/**
 * Normalizes and parses text into individual words
 * @param text - The raw text to parse
 * @returns Array of lowercase words
 */
function parseWords(text: string): string[] {
  return text
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 0);
}

/**
 * Checks if a word is in the BIP39 English wordlist
 * @param word - The word to check
 * @returns True if the word is in the wordlist
 */
function isValidBip39Word(word: string): boolean {
  return wordlist.includes(word);
}

/**
 * Checks if all words in an array are valid BIP39 words
 * @param words - Array of words to validate
 * @returns True if all words are valid BIP39 words
 */
function areAllWordsBip39Valid(words: string[]): boolean {
  return words.every(isValidBip39Word);
}

/**
 * Result of seed phrase detection
 */
export type SeedPhraseDetectionResult = {
  /** Whether the text is detected as a seed phrase */
  isSeedPhrase: boolean;
  /** The number of words detected */
  wordCount: number;
  /** Whether the word count matches a valid BIP39 length */
  isValidLength: boolean;
  /** Whether all words are valid BIP39 words */
  allWordsValid: boolean;
  /** Confidence level: 'high' if 12/24 words and all valid, 'medium' if other valid length, 'low' otherwise */
  confidence: 'high' | 'medium' | 'low' | 'none';
};

/**
 * Detects if the given text is a BIP39 seed phrase
 *
 * This function checks:
 * 1. If the word count matches valid BIP39 lengths (12, 15, 18, 21, or 24)
 * 2. If all words are in the BIP39 English wordlist
 *
 * @param text - The text to check for seed phrase content
 * @returns Detection result with confidence level
 */
export function detectSeedPhrase(text: string): SeedPhraseDetectionResult {
  const words = parseWords(text);
  const wordCount = words.length;

  // Check if word count is a valid BIP39 length
  const isValidLength = VALID_SEED_PHRASE_LENGTHS.includes(
    wordCount as (typeof VALID_SEED_PHRASE_LENGTHS)[number],
  );

  // If not a valid length, it's definitely not a seed phrase
  if (!isValidLength) {
    return {
      isSeedPhrase: false,
      wordCount,
      isValidLength: false,
      allWordsValid: false,
      confidence: 'none',
    };
  }

  // Check if all words are valid BIP39 words
  const allWordsValid = areAllWordsBip39Valid(words);

  // Determine if this is a seed phrase and confidence level
  const isCommonLength = COMMON_SEED_PHRASE_LENGTHS.includes(
    wordCount as (typeof COMMON_SEED_PHRASE_LENGTHS)[number],
  );

  let confidence: SeedPhraseDetectionResult['confidence'] = 'none';
  let isSeedPhrase = false;

  if (allWordsValid) {
    isSeedPhrase = true;
    confidence = isCommonLength ? 'high' : 'medium';
  }

  return {
    isSeedPhrase,
    wordCount,
    isValidLength,
    allWordsValid,
    confidence,
  };
}

/**
 * Quick check if text could potentially be a seed phrase
 * This is a faster check for use in paste event handlers
 *
 * @param text - The text to check
 * @returns True if the text could be a seed phrase (has valid word count and all BIP39 words)
 */
export function isPotentialSeedPhrase(text: string): boolean {
  const result = detectSeedPhrase(text);
  return result.isSeedPhrase && result.confidence !== 'none';
}

/**
 * Strictly checks if text is a 12 or 24 word seed phrase with 100% valid BIP39 words
 * This is the function to use for blocking paste operations
 *
 * @param text - The text to check
 * @returns True if the text is definitely a 12 or 24 word seed phrase
 */
export function isDefinitelySeedPhrase(text: string): boolean {
  const result = detectSeedPhrase(text);
  return result.isSeedPhrase && result.confidence === 'high';
}
