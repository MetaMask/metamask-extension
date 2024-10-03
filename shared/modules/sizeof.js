// Copyright 2014 Andrei Karpushonak

'use strict';

const ECMA_SIZES = {
  STRING: 2,
  BOOLEAN: 4,
  BYTES: 4,
  NUMBER: 8,
  Int8Array: 1,
  Uint8Array: 1,
  Uint8ClampedArray: 1,
  Int16Array: 2,
  Uint16Array: 2,
  Int32Array: 4,
  Uint32Array: 4,
  Float32Array: 4,
  Float64Array: 8,
};

/**
 * Get the size of a primitive value.
 *
 * @param {unknown} data - The primitive value to measure.
 * @param {ReturnType<typeof unknown>} dataType - The type of the value.
 * @throws Throws if the type is not a recognized primitive value.
 */
function getPrimitiveSize(data, dataType) {
  if (data === null || data === undefined) {
    return 1;
  }
  switch (dataType) {
    case 'string':
      // https://stackoverflow.com/questions/68789144/how-much-memory-do-v8-take-to-store-a-string/68791382#68791382
      return data.length * ECMA_SIZES.STRING;
    case 'boolean':
      return ECMA_SIZES.BOOLEAN;
    case 'number':
      return ECMA_SIZES.NUMBER;
    case 'symbol': {
      const isGlobalSymbol = Symbol.keyFor && Symbol.keyFor(data);
      return isGlobalSymbol
        ? Symbol.keyFor(data).length * ECMA_SIZES.STRING
        : (data.toString().length - 8) * ECMA_SIZES.STRING;
    }
    default:
      throw new Error(`Unrecognized type '${dataType}'`);
  }
}

function isPrimitive(data, dataType) {
  return data === null || dataType !== 'object';
}

/**
 * Assert that the data is below a certain size, in bytes.
 *
 * The size of the data is estimated piece by piece, halting and throwing an
 * error if the maximum size is reached.
 *
 * @param {unknown} data - The data to measure.
 * @param {number} [maxSize] - The maximum size, in bytes.
 * @throws Throws if the estimated size of the data exceeds the maximum size.
 */
export function assertObjectMaxSize(data, maxSize = 0) {
  let size = 0;

  /**
   * Count the size of a primitive value.
   *
   * @param {unknown} value - The value to count.
   * @param {ReturnType<typeof unknown>} valueType - The type of the value.
   * @throws Throws if the estimated size of all data counted so far exceeds the maximum size.
   */
  function countPrimitiveSize(value, valueType) {
    size += getPrimitiveSize(value, valueType);
    if (size > maxSize) {
      throw new Error('object exceeded max size');
    }
  }

  const topLevelType = typeof data;
  if (isPrimitive(data, topLevelType)) {
    countPrimitiveSize(data, topLevelType);
    return;
  }

  const objects = [data];

  /**
   * Count the size of a value. If the value is a non-primitive value, it's registered as an object
   * to be counted later.
   *
   * @param {unknown} value - The value to count.
   * @throws Throws if the estimated size of all data counted so far exceeds the maximum size.
   */
  function countValueSize(value) {
    const valueType = typeof value;
    if (isPrimitive(value, valueType)) {
      countPrimitiveSize(value, valueType);
    } else {
      objects.push(value);
    }
  }

  for (const object of objects) {
    if (Array.isArray(object)) {
      for (const value of object) {
        countValueSize(value);
      }
    } else {
      // Iterate through keys first because they're faster to count, minimizing the number of
      // object references we need to track before stopping
      for (const key of Object.keys(object)) {
        countValueSize(key);
      }
      for (const value of Object.values(object)) {
        countValueSize(value);
      }
    }
    // Delete object reference after it has been counted, to prevent objects array from growing
    // unbounded
    objects.shift();
  }
}
