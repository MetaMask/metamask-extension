'use strict';

const { isDeepStrictEqual } = require('node:util');

function parseRaw(raw) {
  let parsed = raw;

  if (typeof raw === 'string') {
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = raw;
    }
  }

  if (typeof parsed === 'string') {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      // Keep the plain string when it is not nested JSON.
    }
  }

  return parsed;
}

function getFieldValue(value, field) {
  if (field == null || field === '') {
    return value;
  }

  let current = value;
  for (const part of String(field).split('.')) {
    if (current == null) {
      return undefined;
    }
    current = current[part];
  }
  return current;
}

function checkAssert(raw, assertSpec) {
  if (!assertSpec) {
    return true;
  }

  const parsed = parseRaw(raw);
  return evaluateAssert(parsed, assertSpec);
}

function normalizeRegex(value) {
  if (value instanceof RegExp) {
    return value;
  }

  if (typeof value !== 'string') {
    return new RegExp(String(value));
  }

  const match = value.match(/^\/(.+)\/([dgimsuvy]*)$/);
  if (match) {
    return new RegExp(match[1], match[2]);
  }

  return new RegExp(value);
}

function evaluateAssert(parsed, assertSpec) {
  if (!assertSpec) {
    return true;
  }

  if (Array.isArray(assertSpec.all)) {
    return assertSpec.all.every((entry) => evaluateAssert(parsed, entry));
  }

  if (Array.isArray(assertSpec.any)) {
    return assertSpec.any.some((entry) => evaluateAssert(parsed, entry));
  }

  if (Array.isArray(assertSpec.none)) {
    return assertSpec.none.every((entry) => !evaluateAssert(parsed, entry));
  }

  const actual = getFieldValue(parsed, assertSpec.field);
  const expected = assertSpec.value;

  switch (assertSpec.operator) {
    case 'exists':
      return actual !== undefined;
    case 'not_null':
      return actual != null;
    case 'truthy':
      return Boolean(actual);
    case 'falsy':
      return !actual;
    case 'eq':
      return actual === expected;
    case 'deep_eq':
      return isDeepStrictEqual(actual, expected);
    case 'neq':
      return actual !== expected;
    case 'lt':
      return typeof actual === 'number' && actual < expected;
    case 'gt':
      return typeof actual === 'number' && actual > expected;
    case 'lte':
      return typeof actual === 'number' && actual <= expected;
    case 'gte':
      return typeof actual === 'number' && actual >= expected;
    case 'length_eq':
      return actual != null && actual.length === expected;
    case 'length_gt':
      return actual != null && actual.length > expected;
    case 'length_gte':
      return actual != null && actual.length >= expected;
    case 'contains':
      if (Array.isArray(actual)) {
        return actual.includes(expected);
      }
      return typeof actual === 'string' && actual.includes(expected);
    case 'not_contains':
      if (Array.isArray(actual)) {
        return !actual.includes(expected);
      }
      return typeof actual !== 'string' || !actual.includes(expected);
    case 'matches':
      return (
        (typeof actual === 'string' || typeof actual === 'number') &&
        normalizeRegex(assertSpec.pattern ?? expected).test(String(actual))
      );
    case 'one_of': {
      const values = Array.isArray(assertSpec.values) ? assertSpec.values : expected;
      return Array.isArray(values) && values.includes(actual);
    }
    default:
      throw new Error(`Unknown operator: ${assertSpec.operator}`);
  }
}

module.exports = {
  checkAssert,
  evaluateAssert,
  getFieldValue,
  normalizeRegex,
  parseRaw,
};
