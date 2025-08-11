/* eslint-disable no-bitwise, no-plusplus */

import {
  unpackChildMask,
  unpackLetterFromParent,
  unpackParentId,
  unpackTerminalIndex,
} from './bits';
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
    const baseOffset = nodeId * 3;
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
    nodeId = trieNodes[baseOffset + 2] + rank;
  }
  const terminalIndex = unpackTerminalIndex(trieNodes[nodeId * 3]);
  if (terminalIndex === NOT_TERMINAL) {
    // the word was found, but it is only a prefix of a longer word, so it is
    // not a valid word in the wordlist.
    throw new Error(ERROR_MESSAGE);
  }
  return terminalIndex;
}

/**
 * Reconstructs a word’s UTF-8 bytes from its trie node ID.
 *
 * @param trieNodes - trie node data
 * @param nodeId - node ID of the word end
 * @param result - array to append the word to
 */
function reconstructWord(
  trieNodes: Uint32Array,
  nodeId: number,
  result: number[],
) {
  let currentId = nodeId;
  while (currentId !== 0) {
    const baseOffset = currentId * 3;
    const letterFromParent = unpackLetterFromParent(trieNodes[baseOffset + 1]);
    result.push(0x61 + letterFromParent);
    currentId = unpackParentId(trieNodes[baseOffset]);
  }
}

/**
 * Converts wordlist indices to a UTF-8 byte array mnemonic.
 *
 * @param trieNodes - trie node data
 * @param wordEndNodes - word end node IDs
 * @param indices - Uint16Array of wordlist indices
 * @returns UTF-8 byte array
 */
function indicesToUtf8Array(
  trieNodes: Uint32Array,
  wordEndNodes: Uint16Array,
  indices: Uint16Array,
): number[] {
  const result: number[] = [];
  for (let i = indices.length - 1; i >= 0; i--) {
    const nodeId = wordEndNodes[indices[i]];
    // nodeId 0 would be the root node, so it will never be a word end
    if (!nodeId) {
      throw new Error('Invalid word index');
    }
    reconstructWord(trieNodes, nodeId, result);
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

  private readonly wordEndNodes: Uint16Array;

  private constructor(trieNodes: Uint32Array, wordEndNodes: Uint16Array) {
    this.trieNodes = trieNodes;
    this.wordEndNodes = wordEndNodes;
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
    // 1) Read exactly 4 bytes of header
    const hdr = new Uint8Array(4);
    let filled = 0;
    let tail: Uint8Array | null = null;

    while (filled < 4) {
      const { value, done } = await reader.read();
      if (done) throw new Error('Truncated stream: missing 4-byte header');
      const take = Math.min(4 - filled, value.length);
      hdr.set(value.subarray(0, take), filled);
      filled += take;
      if (take < value.length) {
        tail = value.subarray(take); // remainder after header
        break;
      }
    }

    // 2) Parse sizes
    const dv = new DataView(hdr.buffer, hdr.byteOffset, 4);
    const trieBytes = dv.getUint32(0, true);
    const endBytes = 4096; // Fixed size: 2048 words * 2 bytes each

    const totalData = trieBytes + endBytes;

    // 3) Single allocation
    const data = new Uint8Array(totalData);
    let off = 0;

    if (tail) {
      const n = Math.min(tail.length, totalData);
      data.set(tail.subarray(0, n), 0);
      off = n;
    }

    while (off < totalData) {
      const { value, done } = await reader.read();
      if (done) break;
      data.set(value, off);
      off += value.length;
    }
    reader.releaseLock();

    // 4) Zero-copy views over the single backing buffer
    const buf = data.buffer;
    const trieNodes = new Uint32Array(buf, /*byteOffset*/ 0, trieBytes >>> 2);
    const wordEndNodes = new Uint16Array(
      buf,
      /*byteOffset*/ trieBytes,
      endBytes >>> 1,
    );

    console.timeEnd('MnemonicUtil.create');

    return new MnemonicUtil(trieNodes, wordEndNodes);
  }

  /**
   * Converts a UTF-8 encoded mnemonic to wordlist indices.
   *
   * @param mnemonic - UTF-8 byte array (e.g., "hello world" as bytes).
   * @returns Uint8Array of 16-bit indices.
   * @throws If a word isn’t in the wordlist or contains invalid characters.
   */
  convertMnemonicToWordlistIndices(mnemonic: Uint8Array): Uint8Array {
    const indices: number[] = [];
    let start = 0;
    for (let i = 0; i < mnemonic.length; i++) {
      if (mnemonic[i] === 0x20) {
        if (i > start) {
          const word = mnemonic.subarray(start, i);
          indices.push(findWordIndex(this.trieNodes, word));
        }
        start = i + 1;
      }
    }
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
    return indicesToUtf8Array(this.trieNodes, this.wordEndNodes, indices);
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
