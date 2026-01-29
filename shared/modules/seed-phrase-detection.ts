/**
 * Seed Phrase Detection Module
 *
 * This module provides functionality to detect if a given text is a valid
 * BIP39 seed phrase (12 or 24 words). It's used to protect users from
 * accidentally pasting their seed phrase on malicious websites.
 */

import { wordlist } from '@metamask/scure-bip39/dist/wordlists/english';

/**
 * Valid seed phrase lengths - we only care about 12 and 24 word phrases
 */
const VALID_SEED_PHRASE_LENGTHS = [12, 24] as const;

/**
 * Normalizes and parses text into individual words.
 *
 * @param text - The raw text to parse
 * @returns Array of lowercase words
 */
function parseWords(text: string): string[] {
  return text
    .trim()
    .toLowerCase()
    .split(/\s+/u)
    .filter((word) => word.length > 0);
}

/**
 * Checks if a word is in the BIP39 English wordlist.
 *
 * @param word - The word to check
 * @returns True if the word is in the wordlist
 */
function isValidBip39Word(word: string): boolean {
  return wordlist.includes(word);
}

/**
 * Detects if the given text is a valid BIP39 seed phrase.
 *
 * A valid seed phrase must:
 * 1. Have exactly 12 or 24 words
 * 2. Have all words in the BIP39 English wordlist
 *
 * @param text - The text to check for seed phrase content
 * @returns True if the text is a valid 12 or 24 word seed phrase
 */
export function isSeedPhrase(text: string): boolean {
  const words = parseWords(text);
  const wordCount = words.length;

  // Must be exactly 12 or 24 words
  if (!VALID_SEED_PHRASE_LENGTHS.includes(wordCount as 12 | 24)) {
    return false;
  }

  // All words must be valid BIP39 words
  return words.every(isValidBip39Word);
}
