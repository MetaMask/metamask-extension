/* eslint-disable no-bitwise, no-plusplus */

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
 * 0xffff is the max uint16 value. we use it to represent a node that is not a
 * terminal node, i.e., not the last character of a word.
 */
const NOT_TERMINAL = 0xffff;

const ERROR_MESSAGE =
  'Invalid mnemonic phrase: The mnemonic phrase contains an unknown word.';

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
function packTermAndParent(terminalIndex: number, parentId: number): number {
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
function packLetterAndMask(
  letterFromParent: number,
  childMask: number,
): number {
  return (letterFromParent << 26) | (childMask & 0x03ffffff);
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
 * Trie construction and operations.
 */

/**
 * Builds a compact trie from the 2048 English wordlist, returning nodes and
 * word-end mappings. Only works for the English wordlist, as it assumes
 * 26 lowercase letters, and a resulting trie of limited depth.
 *
 * @param wordList - list of words to insert into the trie
 * @returns
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function buildTrie(wordList: string[]): {
  trieNodes: Uint32Array;
  wordEndNodes: Uint16Array;
} {
  // Temporary node structure for building the trie
  type TempNode = {
    terminalIndex: number; // 0xffff if not terminal, else wordIndex
    children: (TempNode | null)[];
    parentId: number;
    letterFromParent: number;
  };

  const root: TempNode = {
    terminalIndex: NOT_TERMINAL,
    children: new Array(26).fill(null),
    parentId: 0,
    letterFromParent: 0,
  };

  // Insert all words into the trie
  for (let wordIndex = 0; wordIndex < wordList.length; wordIndex++) {
    const word = wordList[wordIndex];
    let current = root;
    for (let i = 0; i < word.length; i++) {
      // make: 'a' -> 0, ..., 'z' -> 25
      const charCode = word.charCodeAt(i) - 0x61;
      const { children } = current;
      let next = children[charCode];
      if (next === null) {
        next = {
          // if this is the last character in the word `terminalIndex` will
          // be overwritten with the wordIndex
          terminalIndex: NOT_TERMINAL,
          children: new Array(26).fill(null),
          parentId: 0,
          letterFromParent: 0,
        };
        children[charCode] = next;
      }
      current = next;
    }
    // Mark as terminal (end of word)
    current.terminalIndex = wordIndex;
  }

  // Count total nodes via BFS
  let totalNodes = 0;
  const countQueue: TempNode[] = [root];
  while (countQueue.length > 0) {
    const node = countQueue.shift() as TempNode;
    totalNodes++;
    for (const child of node.children) {
      if (child !== null) {
        countQueue.push(child);
      }
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
  type BFSEntry = { node: TempNode; id: number };
  const bfsQueue: BFSEntry[] = [{ node: root, id: 0 }];
  let nextId = 1;

  while (bfsQueue.length > 0) {
    const { node, id } = bfsQueue.shift() as BFSEntry;
    const baseOffset = id * 3;

    // Store terminalIndex and parentId
    trieNodes[baseOffset] = packTermAndParent(
      node.terminalIndex,
      node.parentId,
    );
    if (node.terminalIndex !== NOT_TERMINAL) {
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
    trieNodes[baseOffset + 1] = packLetterAndMask(
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
 * Helper function to generate and save binary files for the trie data.
 * This can be used to regenerate the binary files if needed.
 * Uncomment the fs require and calls when running in a Node.js environment.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
// async function generateBinaryWordList(): Promise<void> {
//   const { wordlist } = await import(
//     // @ts-expect-error its fine
//     '@metamask/scure-bip39/dist/wordlists/english'
//   );
//   const fs = await import('fs');

//   const { trieNodes, wordEndNodes } = buildTrie(wordlist);

//   // Debug information
//   console.debug(
//     `Trie nodes: ${trieNodes.length}, Word end nodes: ${wordEndNodes.length}`,
//   );
//   console.debug(
//     `Trie nodes size: ${trieNodes.byteLength} bytes, Word end nodes size: ${wordEndNodes.byteLength} bytes`,
//   );
//   console.debug(
//     `Total size: ${trieNodes.byteLength + wordEndNodes.byteLength} bytes`,
//   );

//   // combine the two buffers into a single ArrayBuffer with metadata header
//   const headerSize = 8; // 4 bytes for trieNodes size + 4 bytes for wordEndNodes size
//   const totalBytes =
//     headerSize + trieNodes.byteLength + wordEndNodes.byteLength;
//   const buffer = new ArrayBuffer(totalBytes);

//   // Write header with sizes
//   const headerView = new Uint32Array(buffer, 0, 2);
//   headerView[0] = trieNodes.byteLength;
//   headerView[1] = wordEndNodes.byteLength;

//   // Write the data buffers directly to the main buffer
//   const trieNodesView = new Uint8Array(
//     buffer,
//     headerSize,
//     trieNodes.byteLength,
//   );
//   const wordEndNodesView = new Uint8Array(
//     buffer,
//     headerSize + trieNodes.byteLength,
//     wordEndNodes.byteLength,
//   );

//   // Copy only the relevant portions of the source buffers
//   trieNodesView.set(
//     new Uint8Array(
//       trieNodes.buffer,
//       trieNodes.byteOffset,
//       trieNodes.byteLength,
//     ),
//   );
//   wordEndNodesView.set(
//     new Uint8Array(
//       wordEndNodes.buffer,
//       wordEndNodes.byteOffset,
//       wordEndNodes.byteLength,
//     ),
//   );

//   // Use Zopfli for maximum compression - it produces raw deflate directly
//   const { default: zopfli } = await import('node-zopfli');
//   const compressed = zopfli.deflateSync(Buffer.from(buffer), {
//     numiterations: 221,
//   });

//   console.debug(
//     `Zopfli compressed size: ${compressed.byteLength} bytes (vs 38266)`,
//   );
//   // write to app/scripts/lib/trieNodes.bin
//   fs.writeFileSync('app/scripts/lib/trieNodes.bin', compressed);
//   console.debug('Trie nodes and word end nodes written to files.');
// }

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

  static async create(): Promise<MnemonicUtil> {
    // @ts-expect-error its fine, we need `import.meta.url` for our build process
    const url = new URL('./trieNodes.bin', import.meta.url);
    const response = await fetch(url);

    if (!response.ok || !response.body) {
      throw new Error(`Failed to fetch trieNodes.bin: ${response.statusText}`);
    }

    const ds = new DecompressionStream('deflate-raw');
    const decompressedStream = response.body.pipeThrough(ds);
    const combinedBuffer = await new Response(decompressedStream).arrayBuffer();

    // Read header to get sizes
    const headerView = new Uint32Array(combinedBuffer, 0, 2);
    const trieNodesSize = headerView[0];
    const wordEndNodesSize = headerView[1];

    // Extract the individual buffers
    const headerSize = 8; // 2 * 4 bytes
    const trieNodesBuffer = combinedBuffer.slice(
      headerSize,
      headerSize + trieNodesSize,
    );
    const wordEndNodesBuffer = combinedBuffer.slice(
      headerSize + trieNodesSize,
      headerSize + trieNodesSize + wordEndNodesSize,
    );

    const trieNodes = new Uint32Array(trieNodesBuffer);
    const wordEndNodes = new Uint16Array(wordEndNodesBuffer);

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
export const getMnemonicUtil = async () => {
  if (!singletonMnemonicUtil) {
    singletonMnemonicUtil = await MnemonicUtil.create();
  }
  return singletonMnemonicUtil;
};

export type { MnemonicUtil };
