/**
 * Assertion engine — port of mobile's assert.js.
 * 8 operators applied to step results with dot-path field extraction.
 */

export type AssertOperator =
  | 'not_null'
  | 'eq'
  | 'neq'
  | 'gt'
  | 'length_eq'
  | 'length_gt'
  | 'contains'
  | 'not_contains';

export type AssertSpec = {
  operator: AssertOperator;
  field?: string;
  value?: unknown;
};

/**
 * Extract a value from an object using a dot-separated path.
 *
 * @param obj - The object to extract from
 * @param path - Dot-separated path (e.g. "state.isUnlocked")
 * @returns The extracted value, or undefined if not found
 */
function extractField(obj: unknown, path: string): unknown {
  let current: unknown = obj;
  for (const part of path.split('.')) {
    if (current === null || current === undefined) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

/**
 * Double-unwrap JSON strings (CDP encodes results with extra quotes).
 *
 * @param raw - The raw value to parse
 * @returns The parsed value
 */
function parseRaw(raw: unknown): unknown {
  if (typeof raw !== 'string') {
    return raw;
  }
  try {
    let parsed: unknown = JSON.parse(raw);
    // Double-unwrap: CDP sometimes double-stringifies
    if (typeof parsed === 'string') {
      try {
        parsed = JSON.parse(parsed);
      } catch {
        // keep single-parsed value
      }
    }
    return parsed;
  } catch {
    return raw;
  }
}

/**
 * Evaluate an assertion spec against a raw result value.
 * Returns true if the assertion passes, false otherwise.
 *
 * @param raw - The raw result value to check
 * @param spec - The assertion specification
 * @returns True if the assertion passes
 */
export function checkAssert(raw: unknown, spec: AssertSpec): boolean {
  const parsed = parseRaw(raw);

  const actual = spec.field ? extractField(parsed, spec.field) : parsed;
  const expected = spec.value;

  switch (spec.operator) {
    case 'not_null':
      return actual !== null && actual !== undefined;
    case 'eq':
      return actual === expected;
    case 'neq':
      return actual !== expected;
    case 'gt':
      return (
        typeof actual === 'number' && (actual as number) > (expected as number)
      );
    case 'length_eq':
      return getLength(actual) === expected;
    case 'length_gt':
      return getLength(actual) > (expected as number);
    case 'contains':
      if (Array.isArray(actual)) {
        return actual.includes(expected);
      }
      return typeof actual === 'string' && actual.includes(expected as string);
    case 'not_contains':
      if (Array.isArray(actual)) {
        return !actual.includes(expected);
      }
      return typeof actual !== 'string' || !actual.includes(expected as string);
    default:
      return false;
  }
}

/**
 * Get the length of an array or string value.
 *
 * @param val - The value to check
 * @returns The length, or -1 if not applicable
 */
function getLength(val: unknown): number {
  if (
    val !== null &&
    val !== undefined &&
    typeof (val as { length?: unknown }).length === 'number'
  ) {
    return (val as { length: number }).length;
  }
  return -1;
}
