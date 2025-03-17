import { wordlist } from '@scure/bip39/wordlists/english';

/**
 * Bit-packing utilities for compact trie storage.
 */

/**
 * Packs a 16-bit terminalIndex and 16-bit parentId into a Uint32.
 *
 * @param terminalIndex - 0xffff if not terminal, else (wordIndex)
 * @param parentId - 0 if root, else node ID of parent
 * @returns 32-bit packed value
 */
function packTermParent(terminalIndex: number, parentId: number): number {
  return (parentId << 16) | terminalIndex;
}

/**
 * Unpacks a Uint32 into terminalIndex.
 *
 * @param value - packed value
 * @returns 16-bit terminalIndex
 */
function unpackTerminalIndex(value: number): number {
  return value & 0xffff;
}

/**
 * Unpacks a Uint32 into parentId.
 *
 * @param value - packed value
 * @returns 16-bit parentId
 */
function unpackParentId(value: number): number {
  return value >>> 16;
}

/**
 * Packs a 6-bit letterFromParent and 26-bit childMask into a Uint32.
 *
 * @param letterFromParent - 0 if root, else (charCode + 1)
 * @param childMask - 1 bit per child presence
 * @returns 32-bit packed value
 */
function packMaskLetter(letterFromParent: number, childMask: number): number {
  return ((letterFromParent & 0x3f) << 26) | (childMask & 0x03ffffff);
}

/**
 * Unpacks a Uint32 into childMask.
 *
 * @param value - packed value
 * @returns 26-bit childMask
 */
function unpackChildMask(value: number): number {
  return value & 0x03ffffff;
}

/**
 * Unpacks a Uint32 into letterFromParent.
 *
 * @param value - packed value
 * @returns 6-bit letterFromParent
 */
function unpackLetterFromParent(value: number): number {
  return value >>> 26;
}

/**
 * AKA popcount32. Counts the number of set bits (1s) in a 32-bit integer.
 *
 * @param v - The 32-bit integer to count set bits in.
 * @returns The number of set bits in x.
 */
function countSetBits(v: number): number {
  // counts the number of set bits in each pair of bits (2-bit groups) across the 32-bit integer.
  v -= (v >>> 1) & 0x55555555;
  // combines the counts from adjacent 2-bit groups into 4-bit groups.
  v = (v & 0x33333333) + ((v >>> 2) & 0x33333333);
  // combines the counts from adjacent 4-bit groups into 8-bit groups.
  v = (v + (v >>> 4)) & 0x0f0f0f0f;
  // each of the four bytes in x now holds a count of set bits for that byte (0 to 8)
  return (v * 0x01010101) >>> 24;
}

/**
 * Trie construction and operations.
 */

/**
 * Builds a compact trie from the 2048 English wordlist, returning nodes and
 * word-end mappings. Only works for the English wordlist, as it assumes
 * 26 lowercase letters, and a resulting trie of limited depth.
 *
 * @param wordList - list of words to insert into the trie
 * @returns { trieNodes, wordEndNodes }
 */
function buildTrie(wordList: string[]): {
  trieNodes: Uint32Array;
  wordEndNodes: Uint16Array;
} {
  // Temporary node structure for building the trie
  interface TempNode {
    terminalIndex: number; // 0xffff if not terminal, else wordIndex
    children: Array<TempNode | null>;
    parentId: number;
    letterFromParent: number;
  }

  const root: TempNode = {
    terminalIndex: 0xffff,
    children: new Array(26).fill(null),
    parentId: 0,
    letterFromParent: 0,
  };

  // Insert all words into the trie
  for (let wordIndex = 0; wordIndex < wordList.length; wordIndex++) {
    const word = wordList[wordIndex];
    let current = root;
    for (let i = 0; i < word.length; i++) {
      const charCode = word.charCodeAt(i) - 97; // 'a' -> 0, ..., 'z' -> 25
      if (!current.children[charCode]) {
        current.children[charCode] = {
          terminalIndex: 0xffff,
          children: new Array(26).fill(null),
          parentId: 0,
          letterFromParent: 0,
        };
      }
      current = current.children[charCode]!;
    }
    current.terminalIndex = wordIndex; // Mark as terminal (end of word)
  }

  // Count total nodes via BFS
  let totalNodes = 0;
  const countQueue: TempNode[] = [root];
  while (countQueue.length > 0) {
    const node = countQueue.shift()!;
    totalNodes++;
    for (const child of node.children) {
      if (child) countQueue.push(child);
    }
  }

  // Allocate arrays
  const totalBytesForNodeArray = totalNodes * 3 * 4; // 4 bytes per Uint32
  const totalBytesForEndNode = wordList.length * 2; // 2 bytes per Uint16
  const totalBytes = totalBytesForNodeArray + totalBytesForEndNode;
  const buffer = new ArrayBuffer(totalBytes);
  const trieNodes = new Uint32Array(buffer, 0, totalNodes * 3);
  const wordEndNodes = new Uint16Array(
    buffer,
    totalBytesForNodeArray,
    wordList.length,
  );

  // Assign node IDs and populate arrays via BFS
  const bfsQueue: { node: TempNode; id: number }[] = [{ node: root, id: 0 }];
  let nextId = 1;

  while (bfsQueue.length > 0) {
    const { node, id } = bfsQueue.shift()!;
    const baseOffset = id * 3;

    // Store terminalIndex and parentId
    trieNodes[baseOffset] = packTermParent(node.terminalIndex, node.parentId);
    if (node.terminalIndex !== 0xffff) {
      wordEndNodes[node.terminalIndex] = id;
    }

    // Build and store childMask and letterFromParent
    let childMask = 0;
    let childCount = 0;
    for (let c = 0; c < 26; c++) {
      if (node.children[c]) {
        // there is another word with this same prefix, so we need to store it
        // in the childMask.
        childMask |= 1 << c;
        childCount++;
      }
    }
    trieNodes[baseOffset + 1] = packMaskLetter(
      node.letterFromParent,
      childMask,
    );

    // Set childBase and enqueue children
    const childBase = childCount > 0 ? nextId : 0;
    trieNodes[baseOffset + 2] = childBase;
    if (childCount > 0) {
      let assigned = 0;
      for (let c = 0; c < 26; c++) {
        const child = node.children[c];
        if (child) {
          child.parentId = id;
          child.letterFromParent = c;
          bfsQueue.push({ node: child, id: childBase + assigned });
          assigned++;
        }
      }
      nextId += childCount;
    }
  }

  return { trieNodes, wordEndNodes };
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
  for (let i = 0; i < word.length; i++) {
    const charCode = word[i] - 97;
    if (charCode < 0 || charCode >= 26) {
      throw new Error('Invalid character in word');
    }
    const baseOffset = nodeId * 3;
    const childMask = unpackChildMask(trieNodes[baseOffset + 1]);
    // check if the next character is in the trie at this node
    // the childMask is a 26-bit integer where each bit represents the presence
    // of a child node for a given character. The bit at position N is set if
    // the child node for the character with ASCII code N+97 is present.
    // If it is not present, the word is not in the trie.
    if (!(childMask & (1 << charCode))) {
      throw new Error('Word not found in trie');
    }
    const rank = countSetBits(childMask & ((1 << charCode) - 1));
    nodeId = trieNodes[baseOffset + 2] + rank;
  }
  const terminalIndex = unpackTerminalIndex(trieNodes[nodeId * 3]);
  if (terminalIndex === 0xffff) {
    // the word was found, but it is only a prefix of a longer word, so it is
    // not a valid word in the wordlist.
    throw new Error('Word not found in trie');
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
    result.push(97 + letterFromParent);
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
    reconstructWord(trieNodes, nodeId, result);
    if (i > 0) result.push(0x20); // Space separator after each word except the last
  }
  return result.reverse();
}

/**
 * Mnemonic utility class for BIP-39 conversions without strings in memory.
 */
export class MnemonicUtil {
  private readonly trieNodes: Uint32Array;
  private readonly wordEndNodes: Uint16Array;

  constructor() {
    const { trieNodes, wordEndNodes } = buildTrie(wordlist);
    this.trieNodes = trieNodes;
    this.wordEndNodes = wordEndNodes;
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
}
