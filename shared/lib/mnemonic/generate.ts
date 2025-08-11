/* eslint-disable no-bitwise, no-plusplus, @typescript-eslint/no-shadow */

/**
 * Trie construction and operations.
 */

import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { deflate } from 'node-zopfli';
import { wordlist } from '@metamask/scure-bip39/dist/wordlists/english';
import { packLetterAndMask, packTermAndParent } from './bits';
import { NOT_TERMINAL } from './constants';

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
 * Helper function to generate and save binary files for the trie data.
 * This can be used to regenerate the binary files if needed.
 * Uncomment the fs require and calls when running in a Node.js environment.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
async function generateBinaryWordList(): Promise<void> {
  const { trieNodes, wordEndNodes } = buildTrie(wordlist);

  // Debug information
  console.debug(
    `Trie nodes: ${trieNodes.length}, Word end nodes: ${wordEndNodes.length}`,
  );
  console.debug(
    `Trie nodes size: ${trieNodes.byteLength} bytes, Word end nodes size: ${wordEndNodes.byteLength} bytes`,
  );
  console.debug(
    `Total size: ${trieNodes.byteLength + wordEndNodes.byteLength} bytes`,
  );

  // combine the two buffers into a single ArrayBuffer with metadata header
  const headerSize = 4; // 4 bytes for trieNodes size (wordEndNodes size is fixed at 4096 bytes)
  const totalBytes =
    headerSize + trieNodes.byteLength + wordEndNodes.byteLength;
  const buffer = new ArrayBuffer(totalBytes);

  // Write header with trieNodes size only (wordEndNodes size is always 4096 bytes)
  const headerView = new Uint32Array(buffer, 0, 1);
  headerView[0] = trieNodes.byteLength;

  // Write the data buffers directly to the main buffer
  const trieNodesView = new Uint8Array(
    buffer,
    headerSize,
    trieNodes.byteLength,
  );
  const wordEndNodesView = new Uint8Array(
    buffer,
    headerSize + trieNodes.byteLength,
    wordEndNodes.byteLength,
  );

  // Copy only the relevant portions of the source buffers
  trieNodesView.set(
    new Uint8Array(
      trieNodes.buffer,
      trieNodes.byteOffset,
      trieNodes.byteLength,
    ),
  );
  wordEndNodesView.set(
    new Uint8Array(
      wordEndNodes.buffer,
      wordEndNodes.byteOffset,
      wordEndNodes.byteLength,
    ),
  );

  // Use Zopfli for maximum compression - it produces raw deflate directly
  const compressed = await deflate(Buffer.from(buffer), {
    numiterations: 272,
  });

  console.debug(`Zopfli compressed size: ${compressed.byteLength} bytes`);

  const filePath = join(__dirname, './wordList.bin');
  await writeFile(filePath, compressed);
  console.debug('Trie nodes and word end nodes written to files.');
}

generateBinaryWordList().then(() => {
  console.log('done');
});
