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

const isNodePlatform =
  typeof process === 'object' && typeof require === 'function';

function allProperties(obj) {
  const stringProperties = [];
  for (const prop in obj) {
    if (Object.hasOwn(obj, prop)) {
      stringProperties.push(prop);
    }
  }
  if (Object.getOwnPropertySymbols) {
    const symbolProperties = Object.getOwnPropertySymbols(obj);
    Array.prototype.push.apply(stringProperties, symbolProperties);
  }
  return stringProperties;
}

function sizeOfObject(state, object) {
  if (object === null) {
    return;
  }

  const properties = allProperties(object);
  const calc = getCalculator(state);
  for (let i = 0; i < properties.length; i++) {
    const key = properties[i];
    calc(key);
    calc(object[key]);
  }
}

function getCalculator(state) {
  return function calculator(object) {
    if (state.size > state.maxSize) {
      throw new Error('object exceeded max size');
    }
    if (Buffer.isBuffer(object)) {
      state.size += object.length;
    }

    const objectType = typeof object;
    switch (objectType) {
      case 'string':
        // https://stackoverflow.com/questions/68789144/how-much-memory-do-v8-take-to-store-a-string/68791382#68791382
        state.size += isNodePlatform
          ? 12 + 4 * Math.ceil(object.length / 4)
          : object.length * ECMA_SIZES.STRING;
        return;
      case 'boolean':
        state.size += ECMA_SIZES.BOOLEAN;
        return;
      case 'number':
        state.size += ECMA_SIZES.NUMBER;
        return;
      case 'symbol': {
        const isGlobalSymbol = Symbol.keyFor && Symbol.keyFor(object);
        state.size += isGlobalSymbol
          ? Symbol.keyFor(object).length * ECMA_SIZES.STRING
          : (object.toString().length - 8) * ECMA_SIZES.STRING;
        return;
      }
      case 'object':
        if (Array.isArray(object)) {
          const calc = getCalculator(state);
          object.forEach((value) => {
            calc(value);
          });
        } else {
          sizeOfObject(state, object);
        }
        return
      default:
        return
    }
  };
}

/**
 * Main module's entry point
 * Calculates Bytes for the provided parameter
 *
 * @param object - handles object/string/boolean/buffer
 * @param maxSize
 * @returns {*}
 */
export function assertObjectMaxSize(object, maxSize = 0) {
  getCalculator({ size: 0, maxSize })(object);
}
