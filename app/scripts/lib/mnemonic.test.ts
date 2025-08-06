import { wordlist } from '@metamask/scure-bip39/dist/wordlists/english';
import { getMnemonicUtil, MnemonicUtil } from './mnemonic';

const abandon = wordlist[0];
const ability = wordlist[1];
const able = wordlist[2];
const zoo = wordlist[2047]; // a wordlist has 2048 words, grab the last one

/**
 * Helper to convert a string to a Uint8Array (UTF-8).
 *
 * @param str
 */
function toUtf8Array(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

/**
 * Helper to convert a Uint8Array (UTF-8) to string.
 *
 * @param arr
 */
function fromUtf8Array(arr: Uint8Array): string {
  return new TextDecoder().decode(arr);
}

describe('convertMnemonicToWordlistIndices', () => {
  let mu: MnemonicUtil;

  beforeAll(async () => {
    mu = await getMnemonicUtil();
  });

  it(`converts a single valid word (e.g. "${abandon}") to the correct index`, () => {
    const input = toUtf8Array(abandon);
    const indices = mu.convertMnemonicToWordlistIndices(input);

    // indices is a Uint8Array view of 16-bit numbers (one word = one 16-bit index).
    // So we interpret indices as a Uint16Array, expecting a single value of 0.
    expect(new Uint16Array(indices.buffer)[0]).toBe(0);
  });

  it('converts multiple valid words (e.g. "abandon ability" -> [0, 1])', () => {
    // "abandon" -> index 0, "ability" -> index 1
    const input = toUtf8Array(`${abandon} ${ability}`);
    const indices = mu.convertMnemonicToWordlistIndices(input);

    const converted = new Uint16Array(indices.buffer);
    expect(converted).toHaveLength(2);
    expect(converted[0]).toBe(0); // abandon
    expect(converted[1]).toBe(1); // ability
  });

  it('ignores leading spaces, trailing spaces, and multiple spaces between words', () => {
    // "abandon" is index 0, "ability" is index 1
    // We add leading spaces, multiple spaces in between, and trailing spaces:
    const input = toUtf8Array(`   ${abandon}   ${ability}   `);
    const indices = mu.convertMnemonicToWordlistIndices(input);
    const converted = new Uint16Array(indices.buffer);

    expect(converted).toHaveLength(2);
    expect(converted[0]).toBe(0); // abandon
    expect(converted[1]).toBe(1); // ability
  });

  it('returns an empty Uint8Array if the mnemonic is empty or only spaces', () => {
    const input = toUtf8Array('   ');
    const indices = mu.convertMnemonicToWordlistIndices(input);

    expect(indices).toBeInstanceOf(Uint8Array);
    expect(indices.length).toBe(0);
  });

  it('throws an error if any word is not in the BIP-39 English list', () => {
    // "abandon" is valid, but "INVALIDWORD" is not.
    const input = toUtf8Array(`${abandon} INVALIDWORD`);
    expect(() => mu.convertMnemonicToWordlistIndices(input)).toThrow(
      'Invalid mnemonic phrase: The mnemonic phrase contains an unknown word.',
    );
  });

  it('throws if we have a partial word that is only a prefix in the trie', () => {
    // "abando" is a prefix of "abandon" but not a valid word in the list
    const input = toUtf8Array('abando');
    expect(() => mu.convertMnemonicToWordlistIndices(input)).toThrow(
      'Invalid mnemonic phrase: The mnemonic phrase contains an unknown word.',
    );
  });

  it('throws when character in word is not found at depth during traversal, index 0', () => {
    // no words start with "x"
    const input = toUtf8Array('xylophone');
    expect(() => mu.convertMnemonicToWordlistIndices(input)).toThrow(
      'Invalid mnemonic phrase: The mnemonic phrase contains an unknown word.',
    );
  });

  it('throws when character in word is not found at depth during traversal, index > 0', () => {
    // aqua isn't a word in the wordlist at all
    const input = toUtf8Array('aqua');
    expect(() => mu.convertMnemonicToWordlistIndices(input)).toThrow(
      'Invalid mnemonic phrase: The mnemonic phrase contains an unknown word.',
    );
  });
});

describe('convertEnglishWordlistIndicesToCodepoints', () => {
  it(`converts a single valid index (0 -> "${abandon}")`, () => {
    // Single word with index 0 => "abandon"
    // We store 0 in a Uint16. That becomes [0, 0] in bytes for little-endian systems.
    const indices = new Uint16Array([0]);
    const input = new Uint8Array(indices.buffer);

    const result = Uint8Array.from(
      mu.convertEnglishWordlistIndicesToCodepoints(input),
    );
    const decoded = fromUtf8Array(result);

    expect(decoded).toBe(abandon);
  });

  it(`converts multiple valid indices ([0, 1] -> "${abandon} ${ability}")`, () => {
    // 0 -> "abandon", 1 -> "ability"
    const indices = new Uint16Array([0, 1]);
    const input = new Uint8Array(indices.buffer);

    const result = Uint8Array.from(
      mu.convertEnglishWordlistIndicesToCodepoints(input),
    );
    const decoded = fromUtf8Array(result);

    expect(decoded).toBe(`${abandon} ${ability}`);
  });

  it('returns an empty Uint8Array if no indices are provided', () => {
    const indices = new Uint16Array([]);
    const input = new Uint8Array(indices.buffer);

    const result = mu.convertEnglishWordlistIndicesToCodepoints(input);
    expect(result.length).toBe(0);
  });

  it('throws an error if an index is out of range (e.g., 999999)', () => {
    // The wordlist has 2048 words. Any index >= 2048 is invalid.
    const indices = new Uint16Array([999999]);
    const input = new Uint8Array(indices.buffer);

    expect(() => {
      mu.convertEnglishWordlistIndicesToCodepoints(input);
    }).toThrow();
  });
});

describe('Round-trip tests', () => {
  it('converts a valid mnemonic to indices and back, resulting in the same mnemonic', () => {
    const originalMnemonic = `${abandon} ${ability} ${able}`; // indexes [0, 1, 2]
    const input = toUtf8Array(originalMnemonic);

    const indices = mu.convertMnemonicToWordlistIndices(input);
    const roundTripped = Uint8Array.from(
      mu.convertEnglishWordlistIndicesToCodepoints(indices),
    );
    const finalMnemonic = fromUtf8Array(roundTripped);

    expect(finalMnemonic).toBe(originalMnemonic);
  });

  it('works for a short or single-word mnemonic as well', () => {
    const originalMnemonic = zoo;
    // "zoo" is the last word in the standard BIP-39 list (index 2047).
    // Check it round-trips properly.
    const input = toUtf8Array(originalMnemonic);

    const indices = mu.convertMnemonicToWordlistIndices(input);
    const roundTripped = Uint8Array.from(
      mu.convertEnglishWordlistIndicesToCodepoints(indices),
    );
    const finalMnemonic = fromUtf8Array(roundTripped);

    expect(finalMnemonic).toBe(originalMnemonic);
  });
});
