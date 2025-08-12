// Test the DFS function
function countJsonStringifyLength(obj, seen = new Set()) {
  // Handle circular references
  if (obj !== null && typeof obj === 'object') {
    if (seen.has(obj)) {
      return 4; // "null" - circular reference becomes null
    }
    seen.add(obj);
  }

  try {
    if (obj === null) {
      return 4; // "null"
    }

    if (obj === undefined) {
      return 0; // undefined is omitted in JSON.stringify
    }

    if (typeof obj === 'boolean') {
      return obj ? 4 : 5; // "true" or "false"
    }

    if (typeof obj === 'number') {
      if (isNaN(obj) || !isFinite(obj)) {
        return 4; // "null" for NaN and Infinity
      }
      return String(obj).length;
    }

    if (typeof obj === 'string') {
      // Account for quotes and escaped characters
      let length = 2; // opening and closing quotes
      for (let i = 0; i < obj.length; i++) {
        const char = obj[i];
        switch (char) {
          case '"':
          case '\\':
          case '\b':
          case '\f':
          case '\n':
          case '\r':
          case '\t':
            length += 2; // escaped character (\")
            break;
          default:
            if (char.charCodeAt(0) < 32) {
              length += 6; // unicode escape (\u0000)
            } else {
              length += 1;
            }
        }
      }
      return length;
    }

    if (typeof obj === 'function' || typeof obj === 'symbol') {
      return 0; // functions and symbols are omitted
    }

    if (Array.isArray(obj)) {
      let length = 2; // [ and ]
      for (let i = 0; i < obj.length; i++) {
        if (i > 0) length += 1; // comma separator
        length += countJsonStringifyLength(obj[i], seen);
      }
      return length;
    }

    if (typeof obj === 'object') {
      let length = 2; // { and }
      let hasProps = false;

      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          const value = obj[key];
          if (value !== undefined && typeof value !== 'function' && typeof value !== 'symbol') {
            if (hasProps) length += 1; // comma separator
            length += countJsonStringifyLength(key, seen); // key
            length += 1; // colon
            length += countJsonStringifyLength(value, seen); // value
            hasProps = true;
          }
        }
      }

      return length;
    }

    return 0;
  } finally {
    // Clean up the seen set for this object
    if (obj !== null && typeof obj === 'object') {
      seen.delete(obj);
    }
  }
}

// Test cases
const testCases = [
  { name: 'simple object', obj: { a: 1, b: "hello" } },
  { name: 'array', obj: [1, 2, 3] },
  { name: 'nested object', obj: { user: { name: "John", age: 30 }, items: [1, 2] } },
  { name: 'string with quotes', obj: { text: 'He said "hello"' } },
  { name: 'boolean values', obj: { a: true, b: false, c: null } },
  { name: 'numbers', obj: { int: 42, float: 3.14, zero: 0 } }
];

console.log('Testing DFS JSON character counting...\n');

testCases.forEach(testCase => {
  const jsonString = JSON.stringify(testCase.obj);
  const dfsLength = countJsonStringifyLength(testCase.obj);
  const match = jsonString.length === dfsLength;

  console.log(`${testCase.name}:`);
  console.log(`  JSON.stringify: ${jsonString.length} chars`);
  console.log(`  DFS count: ${dfsLength} chars`);
  console.log(`  Match: ${match ? '✅' : '❌'}`);
  if (!match) {
    console.log(`  JSON: ${jsonString}`);
  }
  console.log('');
});

console.log('DFS test completed!');
