/* eslint-disable no-bitwise, no-plusplus, @typescript-eslint/no-shadow */

/**
 * Trie construction and operations.
 */

import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { deflate } from 'node-zopfli';
import { wordlist } from '@metamask/scure-bip39/dist/wordlists/english';
import { packLetterAndMask } from './bits';
import { NOT_TERMINAL } from './constants';

/**
 * Builds a compact trie from the 2048 English wordlist, returning nodes and
 * word-end mappings. Only works for the English wordlist, as it assumes
 * 26 lowercase letters, and a resulting trie of limited depth.
 *
 * @param wordList - list of words to insert into the trie
 * @returns
 */
export function buildTrie(wordList: string[]): {
  trieNodes: Uint32Array;
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

  console.debug(`Total nodes in trie: ${totalNodes}`);
  console.debug(
    `Average nodes per word: ${(totalNodes / wordList.length).toFixed(2)}`,
  );
  console.debug(`Expected uncompressed trie size: ${totalNodes * 8} bytes`);

  // Allocate arrays
  const totalBytes = totalNodes * 2 * 4; // 4 bytes per Uint32, 2 per node
  const buffer = new ArrayBuffer(totalBytes);
  const trieNodes = new Uint32Array(buffer, 0, totalNodes * 2);

  // Assign node IDs and populate arrays via BFS
  type BFSEntry = { node: TempNode; id: number };
  const bfsQueue: BFSEntry[] = [{ node: root, id: 0 }];
  let nextId = 1;

  while (bfsQueue.length > 0) {
    const { node, id } = bfsQueue.shift() as BFSEntry;
    const baseOffset = id * 2;

    // layout: 2 uint32s per node
    // uint32[0]: terminalIndex(16) + childBase(16)
    // uint32[1]: letterFromParent(6) + childMask(26)

    // Build childMask and count children first
    let childMask = 0;
    let childCount = 0;
    // Build and store childMask and letterFromParent
    for (let c = 0; c < 26; c++) {
      if (node.children[c]) {
        // there is another word with this same prefix, so we need to store it
        // in the childMask.
        childMask |= 1 << c;
        childCount++;
      }
    }

    // Set childBase
    const childBase = childCount > 0 ? nextId : 0;

    // Store terminalIndex and childBase in first uint32
    trieNodes[baseOffset] =
      (node.terminalIndex & 0xffff) | ((childBase & 0xffff) << 16);

    // Store letterFromParent and childMask in second uint32
    trieNodes[baseOffset + 1] = packLetterAndMask(
      node.letterFromParent,
      childMask,
    );

    if (childCount > 0) {
      let assigned = 0;
      for (let c = 0; c < 26; c++) {
        const child = node.children[c];
        if (child) {
          child.letterFromParent = c;
          bfsQueue.push({ node: child, id: childBase + assigned });
          assigned++;
        }
      }
      nextId += childCount;
    }
  }

  return { trieNodes };
}

/**
 * Helper function to generate and save binary files for the trie data.
 * This can be used to regenerate the binary files if needed.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function generateBinaryWordList(): Promise<void> {
  const { trieNodes } = buildTrie(wordlist);

  // Debug information
  console.debug(`Trie nodes: ${trieNodes.length}`);
  console.debug(`Trie nodes size: ${trieNodes.byteLength} bytes`);
  console.debug(`Total size: ${trieNodes.byteLength} bytes`);

  const buffer = trieNodes.buffer.slice(
    trieNodes.byteOffset,
    trieNodes.byteOffset + trieNodes.byteLength,
  );

  // Use Zopfli for maximum compression - it produces raw deflate directly
  const compressed = await deflate(Buffer.from(buffer), {
    numiterations: 850, // Optimal value found via multi-threaded mining
  });

  console.debug(`Zopfli compressed size: ${compressed.byteLength} bytes`);

  const filePath = join(__dirname, './wordList.bin');
  await writeFile(filePath, compressed);
  console.debug('Trie nodes written to wordList.bin');
}

generateBinaryWordList().then(() => {
  console.log('done');
});
