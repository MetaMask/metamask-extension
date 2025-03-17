import { wordlist } from '@scure/bip39/wordlists/english';

/**
 * Combine a 16-bit parentId (upper bits) and 16-bit terminalIndex (lower bits).
 * terminalIndex is "wordIndex+1" or 0.
 */
function packTermParent(terminalIndex: number, parentId: number): number {
  // Each value must be < 65536 or things break
  return ((parentId & 0xffff) << 16) | (terminalIndex & 0xffff);
}

/**
 * Extract parentId and terminalIndex from a 32-bit field.
 */
function unpackTermParent(value: number): {
  parentId: number;
  terminalIndex: number;
} {
  const terminalIndex = value & 0xffff; // lower 16 bits
  const parentId = (value >>> 16) & 0xffff; // upper 16 bits
  return { parentId, terminalIndex };
}

/**
 * Combine letterFromParent (6 bits) and childMask (26 bits) into a 32-bit integer.
 */
function packMaskLetter(letterFromParent: number, childMask: number): number {
  // letterFromParent in bits [31..26] (6 bits), childMask in [25..0]
  return ((letterFromParent & 0x3f) << 26) | (childMask & 0x03ffffff);
}

/**
 * Extract letterFromParent and childMask from a 32-bit field.
 */
function unpackMaskLetter(value: number): {
  letterFromParent: number;
  childMask: number;
} {
  const letterFromParent = (value >>> 26) & 0x3f; // bits [31..26]
  const childMask = value & 0x03ffffff; // bits [25..0]
  return { letterFromParent, childMask };
}

function computeRequiredNodes(wordList: string[]): number {
  interface TempNode {
    children: Array<TempNode | null>;
  }
  const root: TempNode = { children: new Array(26).fill(null) };
  let nodeCount = 1; // root

  for (const word of wordList) {
    let current = root;
    for (let i = 0; i < word.length; i++) {
      const c = word.charCodeAt(i) - 97; // 'a' => 97
      if (!current.children[c]) {
        current.children[c] = { children: new Array(26).fill(null) };
        nodeCount++;
      }
      current = current.children[c]!;
    }
  }
  return nodeCount;
}

function buildTypedArrayTrie(
  wordList: string[],
  totalNodes: number,
): {
  nodeArray: Uint32Array;
  endNodeForIndex: Uint16Array; // node ID for each word
} {
  interface TrieNode {
    terminalIndex: number; // 0 => not terminal, else (i+1)
    children: Array<TrieNode | null>;
    parentId: number; // we'll store BFS parent
    letterFromParent: number; // which letter led here
  }
  // A) Build pointer-based trie
  const root: TrieNode = {
    terminalIndex: 0,
    children: new Array(26).fill(null),
    parentId: 0,
    letterFromParent: 0,
  };

  // Insert words
  for (let i = 0; i < wordList.length; i++) {
    const word = wordList[i];
    let cur = root;
    for (let j = 0; j < word.length; j++) {
      const c = word.charCodeAt(j) - 97;
      if (!cur.children[c]) {
        cur.children[c] = {
          terminalIndex: 0,
          children: new Array(26).fill(null),
          parentId: 0,
          letterFromParent: 0,
        };
      }
      cur = cur.children[c]!;
    }
    cur.terminalIndex = i + 1; // store (i+1) so 0 means "no word"
  }

  // B) BFS to assign node IDs
  const totalBytesForNodeArray = totalNodes * 3 * 4; // 4 bytes per Uint32
  const totalBytesForEndNode = wordList.length * 2; // 2 bytes per Uint16
  const totalBytes = totalBytesForNodeArray + totalBytesForEndNode;
  const buffer = new ArrayBuffer(totalBytes);
  const nodeArray = new Uint32Array(buffer, 0, totalNodes * 3);
  // store node ID for each word index
  const endNodeForIndex = new Uint16Array(
    buffer,
    totalBytesForNodeArray,
    wordList.length,
  );

  type QueueItem = { node: TrieNode; id: number };
  const queue: QueueItem[] = [{ node: root, id: 0 }];
  let nextId = 1; // root = ID=0

  let maxBase = 0;

  while (queue.length > 0) {
    const { node, id } = queue.shift()!;
    // (1) determine parentId, terminalIndex from node
    const parentId = node.parentId;
    const termIndex = node.terminalIndex;
    // if this node ends word i => endNodeForIndex[i] = id
    if (termIndex > 0) {
      const realIndex = termIndex - 1;
      endNodeForIndex[realIndex] = id;
    }

    // pack them
    nodeArray[id * 3 + 0] = packTermParent(termIndex, parentId);

    // (2) build childMask
    let mask = 0;
    let childCount = 0;
    for (let c = 0; c < 26; c++) {
      if (node.children[c]) {
        mask |= 1 << c;
        childCount++;
      }
    }
    // letterFromParent is in node.letterFromParent
    // for root, that might be 0 or any sentinel
    nodeArray[id * 3 + 1] = packMaskLetter(node.letterFromParent, mask);

    // (3) childBase => nextId if childCount>0
    let base = 0;
    if (childCount > 0) {
      base = nextId;
      nextId += childCount;
    }
    nodeArray[id * 3 + 2] = base;

    // (4) assign IDs to children in alphabetical order
    let assigned = 0;
    for (let c = 0; c < 26; c++) {
      const child = node.children[c];
      if (child) {
        const childId = base + assigned;
        assigned++;
        // store parent pointer
        child.parentId = id;
        child.letterFromParent = c;
        queue.push({ node: child, id: childId });
      }
    }
  }

  return { nodeArray, endNodeForIndex };
}

function popcount32(x: number): number {
  // fast bit-twiddling
  x -= (x >>> 1) & 0x55555555;
  x = (x & 0x33333333) + ((x >>> 2) & 0x33333333);
  x = (x + (x >>> 4)) & 0x0f0f0f0f;
  x += x >>> 8;
  x += x >>> 16;
  return x & 0x3f;
}

/**
 * Look up a word in the trie and return its original index (0-based), or -1 if not found.
 */
function findWordIndexInTrie(nodeArray: Uint32Array, word: Uint8Array): number {
  let nodeId = 0; // root
  for (let i = 0; i < word.length; i++) {
    const c = word[i] - 97;
    if (c < 0 || c >= 26) throw new Error('Invalid character in word');

    const baseOff = nodeId * 3;
    const maskLetter = nodeArray[baseOff + 1];
    const { childMask } = unpackMaskLetter(maskLetter);

    // check if bit c is set
    if ((childMask & (1 << c)) === 0) {
      throw new Error('Invalid word, letter not found at this position');
    }
    // rank => how many bits < c are set
    const rank = popcount32(childMask & ((1 << c) - 1));
    const childBase = nodeArray[baseOff + 2];
    nodeId = childBase + rank;
  }
  // check terminal
  const termParent = nodeArray[nodeId * 3 + 0];
  const { terminalIndex } = unpackTermParent(termParent);
  if (terminalIndex === 0) throw new Error('Invalid word, not terminal');
  return terminalIndex - 1;
}

/**
 * Reconstruct a single word from the trie, given a node ID.
 * We'll walk up to root, collecting letters.
 */
function reconstructWordInto(
  chars: number[],
  nodeArray: Uint32Array,
  nodeId: number,
): void {
  while (nodeId !== 0) {
    // read the parent's ID from nodeArray[nodeId*3 + 0]
    const termParent = nodeArray[nodeId * 3 + 0];
    const { parentId } = unpackTermParent(termParent);

    // read letterFromParent from nodeArray[nodeId*3 + 1]
    const maskLetter = nodeArray[nodeId * 3 + 1];
    const { letterFromParent } = unpackMaskLetter(maskLetter);

    // letterFromParent in [0..25] => 'a'+ that letter
    chars.push(97 + letterFromParent);

    nodeId = parentId;
  }
}

/**
 * Given a list of word indices, reconstruct each word by going to
 * endNodeForIndex[index], walking up the parent pointers, collecting letters,
 * then joining all words with a space. Finally return a UTF-8 array.
 */
function wordListIndicesToUtf8NumberArrayMnemonic(
  nodeArray: Uint32Array,
  endNodeForIndex: Uint16Array,
  indices: Uint16Array,
): number[] {
  const reversedArray: number[] = [];
  for (let i = indices.length - 1; i >= 0; i--) {
    const wordIdx = indices[i];
    const nodeId = endNodeForIndex[wordIdx];
    reconstructWordInto(reversedArray, nodeArray, nodeId);
    if (i > 0) {
      reversedArray.push(0x20); // space
    }
  }
  return reversedArray.reverse();
}

/**
 * Handles mnemonic conversions without ever converting the mnemonic to a
 * string.
 *
 * It is important for the background process to never handle the
 * mnemonic as a string.
 */
export class MnemonicUtil {
  private endNodeForIndex: Uint16Array;
  private wordlistTrie: Uint32Array;

  constructor() {
    const totalNodes = 6246; // computeRequiredNodes(wordlist);
    const { nodeArray, endNodeForIndex } = buildTypedArrayTrie(
      wordlist,
      totalNodes,
    );
    this.endNodeForIndex = endNodeForIndex;
    this.wordlistTrie = nodeArray;
  }

  /**
   * Encodes a BIP-39 mnemonic as the indices of words in the English BIP-39
   * wordlist.
   *
   * Important: we avoid converting the mnemonic to a string to prevent the
   * plaintext mnemonic from being exposed in memory.
   *
   * @param mnemonic - The BIP-39 mnemonic as a UTF-8 encoded Uint8Array.
   * @returns A Uint8Array where each pair of bytes is a 16-bit index.
   * @throws {Error} If a word is not found in the wordlist.
   */
  convertMnemonicToWordlistIndices(mnemonic: Uint8Array): Uint8Array {
    const indices = [];
    let start = 0;

    // Iterate through the input to find word boundaries
    for (let i = 0, l = mnemonic.length; i < l; i++) {
      // 0x20 is the Space character
      if (mnemonic[i] === 0x20) {
        if (i > start) {
          const index = findWordIndexInTrie(
            this.wordlistTrie!,
            mnemonic.subarray(start, i),
          );
          indices.push(index);
        }
        start = i + 1;
      }
    }
    // Handle the last word
    if (start < mnemonic.length) {
      const index = findWordIndexInTrie(
        this.wordlistTrie!,
        mnemonic.subarray(start, mnemonic.length),
      );
      indices.push(index);
    }

    // Convert indices to Uint8Array via Uint16Array buffer
    const uint16Array = new Uint16Array(indices);
    return new Uint8Array(
      uint16Array.buffer,
      uint16Array.byteOffset,
      uint16Array.byteLength,
    );
  }

  /**
   * Converts a BIP-39 mnemonic stored as indices of words in the English wordlist to a buffer of Unicode code points.
   *
   * Important: we avoid converting the mnemonic to a string to prevent the
   * plaintext mnemonic from being exposed in memory.
   *
   * @param wordlistIndices - Indices to specific words in the BIP-39 English wordlist, each as 2 bytes.
   * @returns The BIP-39 mnemonic formed from the words in the English wordlist, encoded as UTF-8.
   */
  convertEnglishWordlistIndicesToCodepoints(
    wordlistIndices: Uint8Array,
  ): number[] {
    // Create a Uint16Array view of the input to read 16-bit indices
    const indices = new Uint16Array(
      wordlistIndices.buffer,
      wordlistIndices.byteOffset,
      wordlistIndices.byteLength / 2,
    );
    return wordListIndicesToUtf8NumberArrayMnemonic(
      this.wordlistTrie,
      this.endNodeForIndex,
      indices,
    );
  }
}
