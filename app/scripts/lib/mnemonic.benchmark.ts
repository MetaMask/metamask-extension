/**
 * Compares runtime between naive vs. optimized mnemonic <-> wordlist conversions
 * for 12-word and 24-word BIP-39 mnemonics.
 */

import { wordlist } from '@metamask/scure-bip39/dist/wordlists/english';

import {
  convertMnemonicToWordlistIndices as convertMnemonicToWordlistIndicesOptimized,
  convertEnglishWordlistIndicesToCodepoints as convertEnglishWordlistIndicesOptimized,
} from './mnemonic';

// ------------------ Naive Implementations ------------------

function convertMnemonicToWordlistIndicesNaive(buffer: Buffer) {
  // buffer -> string -> split -> indexOf -> build Uint16 -> get Uint8
  // "buffer" is a Node.js Buffer, so we can use toString() safely.
  const words = buffer.toString().split(' ');
  const indices = words.map((word) => wordlist.indexOf(word));

  return new Uint8Array(new Uint16Array(indices).buffer);
}

function convertEnglishWordlistIndicesToCodepointsNaive(
  wordlistIndices: Uint8Array,
) {
  // wordlistIndices -> interpret as Uint16 -> map words -> join with space -> Buffer.from
  const indices = new Uint16Array(wordlistIndices.buffer);
  const words = Array.from(indices).map((i) => wordlist[i]);
  const joined = words.join(' ');
  return Buffer.from(joined);
}

// ------------------ Test Mnemonics ------------------
//
// Make sure these are valid BIP-39 English words.
// Sample 12-word and 24-word mnemonics:

const mnemonic12 =
  'abandon ability able about abuse actor baby bachelor badge bag balance balcony';
const mnemonic24 =
  'abandon ability able about abuse actor baby bachelor badge bag balance balcony ' +
  'cable cactus camera camp camera candy canyon capable carbon cattle caution';

// Convert them to Node.js Buffers for naive approach
const mnemonic12Buffer = Buffer.from(mnemonic12, 'utf8');
const mnemonic24Buffer = Buffer.from(mnemonic24, 'utf8');

// Convert them to Uint8Array for optimized approach
const encoder = new TextEncoder();
const mnemonic12Uint8 = encoder.encode(mnemonic12);
const mnemonic24Uint8 = encoder.encode(mnemonic24);

// Helpers for results
function timeIt(label: string, fn: () => void) {
  const start = process.hrtime.bigint();
  fn();
  const end = process.hrtime.bigint();
  const diffMs = Number(end - start) / 1_000_000;
  console.log(`${label} took ${diffMs.toFixed(3)} ms`);
}

// How many iterations per test
const ITERATIONS = 100000;

// ------------------ Benchmarking ------------------

console.log(`\n--- Benchmarking with ${ITERATIONS} iterations each ---`);

/**
 * Test: convertMnemonicToWordlistIndices (naive vs. optimized)
 */
timeIt('Naive 12-word -> indices', () => {
  for (let i = 0; i < ITERATIONS; i++) {
    convertMnemonicToWordlistIndicesNaive(mnemonic12Buffer);
  }
});

timeIt('Optimized 12-word -> indices', () => {
  for (let i = 0; i < ITERATIONS; i++) {
    convertMnemonicToWordlistIndicesOptimized(mnemonic12Uint8);
  }
});

timeIt('Naive 24-word -> indices', () => {
  for (let i = 0; i < ITERATIONS; i++) {
    convertMnemonicToWordlistIndicesNaive(mnemonic24Buffer);
  }
});

timeIt('Optimized 24-word -> indices', () => {
  for (let i = 0; i < ITERATIONS; i++) {
    convertMnemonicToWordlistIndicesOptimized(mnemonic24Uint8);
  }
});

/**
 * Test: convertEnglishWordlistIndicesToCodepoints (naive vs. optimized)
 *
 * First, get the indices from each approach so we have valid input to the
 * "indices -> codepoints" step.
 */
const naive12Indices = convertMnemonicToWordlistIndicesNaive(mnemonic12Buffer);
const optimized12Indices =
  convertMnemonicToWordlistIndicesOptimized(mnemonic12Uint8);

const naive24Indices = convertMnemonicToWordlistIndicesNaive(mnemonic24Buffer);
const optimized24Indices =
  convertMnemonicToWordlistIndicesOptimized(mnemonic24Uint8);

timeIt('Naive 12-word indices -> codepoints', () => {
  for (let i = 0; i < ITERATIONS; i++) {
    convertEnglishWordlistIndicesToCodepointsNaive(naive12Indices);
  }
});

timeIt('Optimized 12-word indices -> codepoints', () => {
  for (let i = 0; i < ITERATIONS; i++) {
    convertEnglishWordlistIndicesOptimized(optimized12Indices);
  }
});

timeIt('Naive 24-word indices -> codepoints', () => {
  for (let i = 0; i < ITERATIONS; i++) {
    convertEnglishWordlistIndicesToCodepointsNaive(naive24Indices);
  }
});

timeIt('Optimized 24-word indices -> codepoints', () => {
  for (let i = 0; i < ITERATIONS; i++) {
    convertEnglishWordlistIndicesOptimized(optimized24Indices);
  }
});

console.log('\nDone.\n');
