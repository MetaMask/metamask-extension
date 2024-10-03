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

function getPrimitiveSize(data, dataType) {
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

/**
 * Main module's entry point
 * Calculates Bytes for the provided parameter
 *
 * @param data - handles object/string/boolean/buffer
 * @param maxSize
 * @returns {*}
 */
export function assertObjectMaxSize(data, maxSize = 0) {
  let size = 0;
  const topLevelType = typeof data;
  if (topLevelType !== 'object') {
    size = getPrimitiveSize(data, topLevelType);
    if (size > maxSize) {
      throw new Error('object exceeded max size');
    }
    return;
  }

  const objects = [data];

  function countValueSize(value) {
    const valueType = typeof value;
    if (valueType === 'object') {
      objects.push(value);
    } else {
      size += getPrimitiveSize(value, valueType);
      if (size > maxSize) {
        throw new Error('object exceeded max size');
      }
    }
  }

  for (const object of objects) {
    if (Array.isArray(object)) {
      for (const value of object) {
        countValueSize(value);
      }
    } else {
      // Iterate through keys first because they're faster to count, minimizing the number of object references we need to track before stopping
      for (const key of Object.keys(object)) {
        countValueSize(key);
      }
      for (const value of Object.values(object)) {
        countValueSize(value);
      }
    }
    // Delete object reference after it has been counted, to prevent objects array from growing unbounded
    objects.shift();
  }
}
