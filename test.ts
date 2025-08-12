/* eslint-disable no-plusplus, no-bitwise */
import { slice } from 'lodash';

type id = number;
type seq = number;
type total = number;
type data = string;

export type ChunkFrame = {
  id: id;
  total: total;
  seq: seq;
  data: data;
};

enum S {
  Id,
  Total,
  Seq,
  Data,
}

function assert(value: boolean, message?: string | number): asserts value {
  if (!value) {
    throw new Error(`Assertion failed: ${message ?? ''}`);
  }
}

/**
 * High-performance raw chunk frame parser.
 *
 * a chunk frame is in the form: `<id>|<total>|<seq>|<data>`, where:
 * - `<id>` is a unique number identifier for the chunked message
 * - `<total>` is the total number of chunks in the message
 * - `<seq>` is the sequence number of this chunk (0-based)
 * - `<data>` is the actual data of this chunk
 *
 * The state machine parser here is about 100x faster than regex+parseInt
 * parsing and  about 10x faster than string split+parseInt parsing.
 *
 * @param x - the value to parse
 * @param input
 * @returns a ChunkFrame if the value is a valid chunk frame, otherwise false
 */
const tryParseChunkFrame = (input: unknown): ChunkFrame | false => {
  if (typeof input !== 'string') {
    return false;
  }
  const { length } = input;
  // shortest legal message is: "0|0|0|" (6 characters)
  if (length < 6) {
    return false;
  }

  let state = S.Id;
  let value = 0;
  let hasDigit = false;

  let id = 0;
  let total = 0;
  let seq = 0;

  for (let i = 0; i < length; ++i) {
    if (state === S.Data) {
      // first byte of data → grab remainder and exit
      return { id, total, seq, data: input.slice(i) };
    }

    const cc = input.charCodeAt(i);
    if (cc >= 48 && cc <= 57) {
      // characters '0'..'9'
      const digit = cc ^ 48; // shift character so "0" is actually `0`
      value = (value << 3) + (value << 1) + digit;
      hasDigit = true;
      continue;
    }
    if (cc === 124) {
      // '|'
      if (!hasDigit) {
        // we didn't find any digits before a delimiter, so this is invalid
        return false;
      }
      switch (state) {
        case S.Id:
          id = value;
          break;
        case S.Total:
          total = value;
          break;
        case S.Seq:
          seq = value;
          break;
      }
      state++;
      value = 0;
      hasDigit = false;
      continue;
    }

    // invalid character
    return false;
  }

  // must have ended in Data state (allows empty data)
  return state === S.Data ? { id, total, seq, data: '' } : false;
};

const tryParseChunkFrame2 = (input: unknown): ChunkFrame | false => {
  // naive approach using indexOf to find pipe positions
  if (typeof input !== 'string') {
    return false;
  }

  // Helper function to check if a string contains only digits
  const isDigitsOnly = (str: string): boolean => {
    if (str.length === 0) {
      return false;
    }
    for (let i = 0; i < str.length; i++) {
      const c = str.charCodeAt(i);
      if (c < 48 || c > 57) {
        return false;
      } // not '0'-'9'
    }
    return true;
  };

  // Find the first 3 pipe positions
  const pipe1 = input.indexOf('|');
  if (pipe1 === -1 || pipe1 === 0) {
    return false;
  } // no pipe or empty id

  const pipe2 = input.indexOf('|', pipe1 + 1);
  if (pipe2 === -1 || pipe2 === pipe1 + 1) {
    return false;
  } // no pipe or empty total

  const pipe3 = input.indexOf('|', pipe2 + 1);
  if (pipe3 === -1 || pipe3 === pipe2 + 1) {
    return false;
  } // no pipe or empty seq

  // Extract the parts directly
  const idStr = input.slice(0, pipe1);
  const totalStr = input.slice(pipe1 + 1, pipe2);
  const seqStr = input.slice(pipe2 + 1, pipe3);
  const data = input.slice(pipe3 + 1);

  // Validate that numeric parts contain only digits
  if (
    !isDigitsOnly(idStr) ||
    !isDigitsOnly(totalStr) ||
    !isDigitsOnly(seqStr)
  ) {
    return false;
  }

  // Parse numbers (now guaranteed to be valid)
  const id = parseInt(idStr, 10);
  const total = parseInt(totalStr, 10);
  const seq = parseInt(seqStr, 10);

  return { id, total, seq, data };
};

const RE = /^(\d+)\|(\d+)\|(\d+)\|(.*)$/u;
const tryParseChunkFrame3 = (input: unknown): ChunkFrame | false => {
  // regex approach - clean and concise
  if (typeof input !== 'string') {
    return false;
  }

  const match = input.match(RE);
  if (!match) {
    return false;
  }

  const [, idStr, totalStr, seqStr, data] = match;

  return {
    id: parseInt(idStr, 10),
    total: parseInt(totalStr, 10),
    seq: parseInt(seqStr, 10),
    data,
  };
};

// benchmark the two functions
const bench = (name: string, fn: () => void) => {
  const start = performance.now();
  for (let i = 0; i < 1_000_00; i++) {
    fn();
  }
  const end = performance.now();
  console.log(`${name}: ${end - start} ms`);
};

const framesToTest = [
  [
    '1234|12345|45|dasfglkijihsdflgkhdsagkfhsdflkghlksdfghklsdfhgklshgklsdfhlkghsdfg',
    {
      id: 1234,
      total: 12345,
      seq: 45,
      data: 'dasfglkijihsdflgkhdsagkfhsdflkghlksdfghklsdfhgklshgklsdfhlkghsdfg',
    },
  ],
  [
    '0|0|0|',
    {
      id: 0,
      total: 0,
      seq: 0,
      data: '',
    },
  ], // minimal
  [
    '1|1|0|data',
    {
      id: 1,
      total: 1,
      seq: 0,
      data: 'data',
    },
  ], // single chunk
  [
    '2|3|1|moredata',
    {
      id: 2,
      total: 3,
      seq: 1,
      data: 'moredata',
    },
  ], // multiple chunks
  [
    '9999|10000|9999|lastchunkdata',
    {
      id: 9999,
      total: 10000,
      seq: 9999,
      data: 'lastchunkdata',
    },
  ], // large numbers
  [
    '1234|5678|90|',
    {
      id: 1234,
      total: 5678,
      seq: 90,
      data: '',
    },
  ], // empty data
  [
    `1234|5678|90|${'a'.repeat(10000)}`,
    {
      // large
      id: 1234,
      total: 5678,
      seq: 90,
      data: 'a'.repeat(10000),
    },
  ],
  [
    `1234|5678|90|${'a'.repeat(100000)}`,
    {
      // very large
      id: 1234,
      total: 5678,
      seq: 90,
      data: 'a'.repeat(100000),
    },
  ],
  [
    '1234|5678|90|data|extra',
    {
      // extra `|`, but this is fine!
      id: 1234,
      total: 5678,
      seq: 90,
      data: 'data|extra',
    },
  ],

  // invalids:
  ['1234|5678|90', false], // missing data
  ['|1234|5678|90|data', false], // missing id
  ['1234|notastring|90|data', false], // non-numeric total
  ['1234|90|0notastring|data', false], // non-numeric seq
];

// check the parsing functions
for (let i = 0; i < framesToTest.length; i++) {
  assert(
    JSON.stringify(tryParseChunkFrame(framesToTest[i][0])) ===
      JSON.stringify(framesToTest[i][1]),
    i,
  );
  assert(
    JSON.stringify(tryParseChunkFrame2(framesToTest[i][0])) ===
      JSON.stringify(framesToTest[i][1]),
    i,
  );
  assert(
    JSON.stringify(tryParseChunkFrame3(framesToTest[i][0])) ===
      JSON.stringify(framesToTest[i][1]),
    i,
  );
}

bench('tryParseChunkFrame (optimized state machine)', () => {
  for (let i = 0; i < framesToTest.length; i++) {
    tryParseChunkFrame(framesToTest[i][0]);
  }
});

bench('tryParseChunkFrame2 (indexOf + validation)', () => {
  for (let i = 0; i < framesToTest.length; i++) {
    tryParseChunkFrame2(framesToTest[i][0]);
  }
});

bench('tryParseChunkFrame3 (regex)', () => {
  for (let i = 0; i < framesToTest.length; i++) {
    tryParseChunkFrame3(framesToTest[i][0]);
  }
});
