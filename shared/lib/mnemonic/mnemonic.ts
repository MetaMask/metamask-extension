/* eslint-disable no-bitwise, no-plusplus */

import { unpackChildBase, unpackChildMask, unpackTerminalIndex } from './bits';
import { ERROR_MESSAGE, NOT_TERMINAL } from './constants';

/**
 * @file Mnemonic utility for converting between BIP-39 mnemonics and wordlist
 * indices without using strings in memory.
 *
 * This utility is designed to be used in environments where strings are not
 * allowed in memory and where the process is long-running, such as the
 * extension background process. It uses a compact trie to store the wordlist
 * and convert between mnemonics and wordlist indices.
 *
 * The trie is built from the English wordlist, and can only be used with the
 * English wordlist, as it assumes 26 lowercase letters and a resulting trie of
 * limited depth.
 *
 * It has been optimized for memory size while maintaining reasonable search
 * performance. It is typically 2x-5x faster than the string-based approach and
 * uses only a little more memory (likely due to the application still importing
 * the string-based wordlist elsewhere).
 *
 * This module is not suitable for using in the UI, as it has a non-trivial
 * startup time.
 *
 * Additional startup improvements can be made by precomputing the trie and
 * index. This would allow the trie to be used in the UI, but complicates
 * maintenance.
 */

/**
 * AKA popcount32. Counts the number of set bits (1s) in a 32-bit integer.
 *
 * @param v - The 32-bit integer to count set bits in.
 * @returns The number of set bits in x.
 */
function countSetBits(v: number): number {
  let n = v;
  // counts the number of set bits in each pair of bits (2-bit groups) across
  // the 32-bit integer.
  n -= (n >>> 1) & 0x55555555;
  // combines the counts from adjacent 2-bit groups into 4-bit groups.
  n = (n & 0x33333333) + ((n >>> 2) & 0x33333333);
  // combines the counts from adjacent 4-bit groups into 8-bit groups.
  n = (n + (n >>> 4)) & 0x0f0f0f0f;
  // each of the four bytes in v now holds a count of set bits for that byte (0
  // to 8)
  return (n * 0x01010101) >>> 24;
}

/**
 * Finds the wordlist index of a word given as a UTF-8 byte array.
 *
 * @param trieNodes - trie node data
 * @param word - UTF-8 byte array (e.g., "hello" as bytes)
 * @returns wordlist index
 * @throws If the word is not in the trie or contains invalid characters.
 */
function findWordIndex(trieNodes: Uint32Array, word: Uint8Array): number {
  let nodeId = 0; // Start at root
  for (const char of word) {
    const charCode = char - 0x61;
    if (charCode < 0 || charCode >= 26) {
      throw new Error(ERROR_MESSAGE);
    }
    // layout: 2 uint32s per node
    // uint32[0]: terminalIndex(16) + childBase(16)
    // uint32[1]: letterFromParent(6) + childMask(26)
    const baseOffset = nodeId * 2;
    const childMask = unpackChildMask(trieNodes[baseOffset + 1]);
    // check if the next character is in the trie at this node
    // the childMask is a 26-bit integer where each bit represents the presence
    // of a child node for a given character. The bit at position N is set if
    // the child node for the character with ASCII code N+97 is present.
    // If it is not present, the word is not in the trie.
    if (!(childMask & (1 << charCode))) {
      throw new Error(ERROR_MESSAGE);
    }
    const rank = countSetBits(childMask & ((1 << charCode) - 1));
    const childBase = unpackChildBase(trieNodes[baseOffset]);
    nodeId = childBase + rank;
  }
  const terminalIndex = unpackTerminalIndex(trieNodes[nodeId * 2]);
  if (terminalIndex === NOT_TERMINAL) {
    // the word was found, but it is only a prefix of a longer word, so it is
    // not a valid word in the wordlist.
    throw new Error(ERROR_MESSAGE);
  }
  return terminalIndex;
}

/**
 * Reconstructs a word's UTF-8 bytes from its terminalIndex by searching the trie.
 * Uses forward traversal to find the node with the matching terminalIndex.
 *
 * @param trieNodes - trie node data
 * @param targetTerminalIndex - the terminalIndex (word index) we're looking for
 * @param result - array to append the word to
 */
function reconstructWord(
  trieNodes: Uint32Array,
  targetTerminalIndex: number,
  result: number[],
) {
  // Use BFS to find the node with the target terminalIndex
  type QueueEntry = {
    nodeId: number;
    path: number[];
  };

  const queue: QueueEntry[] = [{ nodeId: 0, path: [] }];

  while (queue.length > 0) {
    // we've guaranteed that `queue.shift()` will not return null, typescript is
    // just not smart enough to realize it.
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const { nodeId, path: currentPath } = queue.shift()!;

    // Check if this node is a terminal with our target index
    const baseOffset = nodeId * 2;
    const terminalIndex = unpackTerminalIndex(trieNodes[baseOffset]);

    if (terminalIndex === targetTerminalIndex) {
      // Found it! Reconstruct the word from the path
      for (let i = currentPath.length - 1; i >= 0; i--) {
        result.push(0x61 + currentPath[i]); // Convert back to ASCII
      }
      return;
    }

    // Explore all children
    const childBase = unpackChildBase(trieNodes[baseOffset]);

    if (childBase === 0) {
      continue; // No children
    }

    const childMask = unpackChildMask(trieNodes[baseOffset + 1]);

    let childIndex = 0;
    for (let letter = 0; letter < 26; letter++) {
      if (childMask & (1 << letter)) {
        const childNodeId = childBase + childIndex;
        const newPath = [...currentPath, letter];
        queue.push({ nodeId: childNodeId, path: newPath });
        childIndex++;
      }
    }
  }

  throw new Error(`Terminal index ${targetTerminalIndex} not found in trie`);
}

/**
 * Converts wordlist indices to a UTF-8 byte array mnemonic.
 *
 * @param trieNodes - trie node data
 * @param indices - Uint16Array of wordlist indices
 * @returns UTF-8 byte array
 */
function indicesToUtf8Array(
  trieNodes: Uint32Array,
  indices: Uint16Array,
): number[] {
  const result: number[] = [];
  for (let i = indices.length - 1; i >= 0; i--) {
    const terminalIndex = indices[i];
    // Validate word index
    if (terminalIndex >= 2048) {
      throw new Error('Invalid word index');
    }
    reconstructWord(trieNodes, terminalIndex, result);
    // Space separator after each word except the last
    if (i > 0) {
      result.push(0x20);
    }
  }
  return result.reverse();
}

/**
 * Mnemonic utility class for BIP-39 conversions without holding strings in
 * memory.
 */
class MnemonicUtil {
  private readonly trieNodes: Uint32Array;

  private constructor(trieNodes: Uint32Array) {
    this.trieNodes = trieNodes;
  }

  static async create(
    compressedDataStream?: ReadableStream<Uint8Array>,
  ): Promise<MnemonicUtil> {
    let readableStream: ReadableStream<Uint8Array>;

    if (compressedDataStream) {
      // Use provided stream (for testing)
      readableStream = compressedDataStream;
    } else {
      // @ts-expect-error it's fine, we need `import.meta.url` for our build
      // process to output the correct path to use at runtime
      const url = new URL('./wordList.bin', import.meta.url);
      const response = await fetch(url);

      if (!response.ok || !response.body) {
        throw new Error(`Failed to fetch wordList.bin: ${response.statusText}`);
      }

      readableStream = response.body;
    }

    const decompressionStream = new DecompressionStream('deflate-raw');
    const decompressedStream = readableStream.pipeThrough(decompressionStream);
    const reader = decompressedStream.getReader();

    // Read all data
    const chunks: Uint8Array[] = [];
    let totalLength = 0;

    // `while (true)` this is just how you do this sort of thing yo
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        break;
      }
      chunks.push(value);
      totalLength += value.length;
    }
    reader.releaseLock();

    // Combine all chunks into a single buffer
    const data = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      data.set(chunk, offset);
      offset += chunk.length;
    }

    // Create zero-copy view over the data
    const buf = data.buffer;
    const trieNodes = new Uint32Array(
      buf,
      data.byteOffset,
      data.byteLength >>> 2,
    );

    return new MnemonicUtil(trieNodes);
  }

  /**
   * Converts a UTF-8 encoded mnemonic to wordlist indices.
   *
   * @param mnemonic - UTF-8 byte array (e.g., "hello world" as bytes).
   * @returns Uint8Array of 16-bit indices.
   * @throws If a word isn't in the wordlist or contains invalid characters.
   */
  convertMnemonicToWordlistIndices(mnemonic: Uint8Array): Uint8Array {
    const indices: number[] = [];
    let start = 0;
    for (let i = 0; i < mnemonic.length; i++) {
      // split on spaces
      if (mnemonic[i] === 0x20) {
        if (i > start) {
          const word = mnemonic.subarray(start, i);
          indices.push(findWordIndex(this.trieNodes, word));
        }
        start = i + 1;
      }
    }
    // Handle last word
    if (start < mnemonic.length) {
      const word = mnemonic.subarray(start);
      indices.push(findWordIndex(this.trieNodes, word));
    }
    const uint16Array = new Uint16Array(indices);
    return new Uint8Array(uint16Array.buffer);
  }

  /**
   * Converts wordlist indices to a UTF-8 encoded mnemonic.
   *
   * @param wordlistIndices - Uint8Array of 16-bit indices.
   * @returns array of numbers representing UTF-8 bytes of the mnemonic.
   */
  convertEnglishWordlistIndicesToCodepoints(
    wordlistIndices: Uint8Array,
  ): number[] {
    const indices = new Uint16Array(
      wordlistIndices.buffer,
      wordlistIndices.byteOffset,
      wordlistIndices.byteLength / 2,
    );
    return indicesToUtf8Array(this.trieNodes, indices);
  }

  isValidWord(word: string): boolean {
    const wordBytes = new TextEncoder().encode(word);
    return findWordIndex(this.trieNodes, wordBytes) !== -1;
  }
}

let singletonMnemonicUtil: MnemonicUtil | undefined;
export const getMnemonicUtil = async (
  compressedDataStream?: ReadableStream<Uint8Array>,
) => {
  if (!singletonMnemonicUtil) {
    singletonMnemonicUtil = await MnemonicUtil.create(compressedDataStream);
  }
  return singletonMnemonicUtil;
};

export type { MnemonicUtil };
