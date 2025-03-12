import { wordlist } from '@metamask/scure-bip39/dist/wordlists/english';

export type TrieNode = { [key: number]: TrieNode; index?: number };

const wordlistTrie = buildTrie(wordlist);

// Precompute word buffers once
const wordlistBuffers = wordlist.map((word) => new TextEncoder().encode(word));

/**
 * Builds a trie from a BIP-39 wordlist.
 *
 * @param words - The BIP-39 wordlist.
 */
function buildTrie(words: string[]): TrieNode {
  const root: TrieNode = { index: 0 } as TrieNode;
  words.forEach((word, index) => {
    let node = root;
    for (const char of word) {
      // ASCII byte value (97-122 for a-z)
      const byte = char.charCodeAt(0);
      if (!node[byte]) {
        node[byte] = {};
      }
      node = node[byte];
    }
    // Store the word’s index at the leaf
    node.index = index;
  });
  return root;
}

/**
 * Retrieves the index of a word in the BIP-39 wordlist from a trie.
 *
 * @param input - The UTF-8 encoded input string.
 * @param start - The start index of the word.
 * @param end - The end index of the word.
 * @throws {Error} If a word is not found in the wordlist.
 */
function getIndexFromTrie(
  input: Uint8Array,
  start: number,
  end: number,
): number {
  let node = wordlistTrie;
  for (let i = start; i < end; i++) {
    const byte = input[i];
    if (!node[byte]) {
      throw new Error('Word not found');
    }
    node = node[byte];
  }
  if (node.index === undefined) {
    throw new Error('Word not found');
  }
  return node.index;
}

/**
 * Encodes a BIP-39 mnemonic as the indices of words in the English BIP-39 wordlist.
 *
 * @param mnemonic - The BIP-39 mnemonic as a UTF-8 encoded Uint8Array.
 * @returns A Uint8Array where each pair of bytes is a 16-bit index.
 * @throws {Error} If a word is not found in the wordlist.
 */
export function convertMnemonicToWordlistIndices(
  mnemonic: Uint8Array,
): Uint8Array {
  const input = new Uint8Array(mnemonic); // Ensure input is Uint8Array
  const indices = [];
  let start = 0;

  // Iterate through the input to find word boundaries
  for (let i = 0; i < input.length; i++) {
    if (input[i] === 0x20) {
      // Space character
      if (i > start) {
        const index = getIndexFromTrie(input, start, i);
        indices.push(index);
      }
      start = i + 1;
    }
  }
  // Handle the last word
  if (start < input.length) {
    const index = getIndexFromTrie(input, start, input.length);
    indices.push(index);
  }

  // Convert indices to Uint8Array via Uint16Array buffer
  const uint16Array = new Uint16Array(indices);
  return new Uint8Array(uint16Array.buffer);
}

/**
 * Converts a BIP-39 mnemonic stored as indices of words in the English wordlist to a buffer of Unicode code points.
 *
 * @param wordlistIndices - Indices to specific words in the BIP-39 English wordlist, each as 2 bytes.
 * @returns The BIP-39 mnemonic formed from the words in the English wordlist, encoded as UTF-8.
 */
export function convertEnglishWordlistIndicesToCodepoints(
  wordlistIndices: Uint8Array,
): Uint8Array {
  // Create a Uint16Array view of the input to read 16-bit indices
  const indices = new Uint16Array(
    wordlistIndices.buffer,
    wordlistIndices.byteOffset,
    wordlistIndices.byteLength / 2,
  );
  const numWords = indices.length;

  // Calculate total output size: sum of word lengths plus spaces
  let totalSize = 0;
  for (let i = 0; i < numWords; i++) {
    totalSize += wordlistBuffers[indices[i]].length; // Length of each word
    if (i < numWords - 1) {
      totalSize += 1; // Space separator between words
    }
  }

  // Create the output buffer with the exact size
  const output = new Uint8Array(totalSize);
  let offset = 0;

  // Assemble the output by copying word buffers and adding spaces
  for (let i = 0; i < numWords; i++) {
    const wordBuffer = wordlistBuffers[indices[i]];
    // Copy word bytes
    output.set(wordBuffer, offset);
    offset += wordBuffer.length;
    if (i < numWords - 1) {
      // ASCII space
      output[offset] = 0x20;
      offset += 1;
    }
  }

  return output;
}
