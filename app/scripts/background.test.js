import { describe, it, expect } from '@jest/globals';

/**
 * Sanitizes control characters within JSON string values.
 * This is a copy of the function from background.js for testing purposes.
 *
 * @param {string} text - The JSON text to sanitize
 * @returns {string} The sanitized JSON text
 */
function sanitizeJsonText(text) {
  let result = '';
  let inString = false;
  let escapeNext = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const charCode = char.charCodeAt(0);

    // Handle escape sequences
    if (escapeNext) {
      result += char;
      escapeNext = false;
      continue;
    }

    if (char === '\\') {
      result += char;
      escapeNext = true;
      continue;
    }

    // Track whether we're inside a string literal
    if (char === '"') {
      inString = !inString;
      result += char;
      continue;
    }

    // If we're inside a string and encounter a control character, escape it
    if (inString && charCode >= 0x00 && charCode <= 0x1f) {
      const escapeMap = {
        '\b': '\\b',
        '\f': '\\f',
        '\n': '\\n',
        '\r': '\\r',
        '\t': '\\t',
      };
      result +=
        escapeMap[char] || `\\u${charCode.toString(16).padStart(4, '0')}`;
    } else {
      result += char;
    }
  }

  return result;
}

describe('sanitizeJsonText', () => {
  it('should escape newlines in string values', () => {
    const input = '{"key":"value\nwith newline"}';
    const output = sanitizeJsonText(input);
    const expected = '{"key":"value\\nwith newline"}';
    expect(output).toBe(expected);
    expect(() => JSON.parse(output)).not.toThrow();
  });

  it('should escape carriage returns in string values', () => {
    const input = '{"key":"value\rwith cr"}';
    const output = sanitizeJsonText(input);
    const expected = '{"key":"value\\rwith cr"}';
    expect(output).toBe(expected);
    expect(() => JSON.parse(output)).not.toThrow();
  });

  it('should escape tabs in string values', () => {
    const input = '{"key":"value\twith tab"}';
    const output = sanitizeJsonText(input);
    const expected = '{"key":"value\\twith tab"}';
    expect(output).toBe(expected);
    expect(() => JSON.parse(output)).not.toThrow();
  });

  it('should preserve valid JSON formatting with newlines outside strings', () => {
    const input = '{\n  "key": "value"\n}';
    const output = sanitizeJsonText(input);
    expect(output).toBe(input);
    expect(() => JSON.parse(output)).not.toThrow();
  });

  it('should not double-escape already escaped characters', () => {
    const input = '{"key":"value\\nwith escaped newline"}';
    const output = sanitizeJsonText(input);
    expect(output).toBe(input);
    expect(() => JSON.parse(output)).not.toThrow();
  });

  it('should handle multiple control characters in one string', () => {
    const input = '{"key":"line1\nline2\rline3\ttab"}';
    const output = sanitizeJsonText(input);
    const expected = '{"key":"line1\\nline2\\rline3\\ttab"}';
    expect(output).toBe(expected);
    expect(() => JSON.parse(output)).not.toThrow();
  });

  it('should handle control characters in multiple string values', () => {
    const input = '{"key1":"value1\n","key2":"value2\r"}';
    const output = sanitizeJsonText(input);
    const expected = '{"key1":"value1\\n","key2":"value2\\r"}';
    expect(output).toBe(expected);
    expect(() => JSON.parse(output)).not.toThrow();
  });

  it('should escape other control characters with unicode escape', () => {
    const input = '{"key":"value\x01with control"}';
    const output = sanitizeJsonText(input);
    const expected = '{"key":"value\\u0001with control"}';
    expect(output).toBe(expected);
    expect(() => JSON.parse(output)).not.toThrow();
  });

  it('should handle empty strings', () => {
    const input = '{"key":""}';
    const output = sanitizeJsonText(input);
    expect(output).toBe(input);
    expect(() => JSON.parse(output)).not.toThrow();
  });

  it('should handle nested objects with control characters', () => {
    const input = '{"outer":{"inner":"value\nwith newline"}}';
    const output = sanitizeJsonText(input);
    const expected = '{"outer":{"inner":"value\\nwith newline"}}';
    expect(output).toBe(expected);
    expect(() => JSON.parse(output)).not.toThrow();
  });

  it('should handle arrays with string values containing control characters', () => {
    const input = '{"arr":["value1\n","value2\r"]}';
    const output = sanitizeJsonText(input);
    const expected = '{"arr":["value1\\n","value2\\r"]}';
    expect(output).toBe(expected);
    expect(() => JSON.parse(output)).not.toThrow();
  });
});
