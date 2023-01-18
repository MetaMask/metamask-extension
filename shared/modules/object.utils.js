const MAX_SAFE_INTEGER = 9007199254740991;

/** `Object#toString` result references. */
const mapTag = '[object Map]';
const setTag = '[object Set]';

/**
 * Return a "masked" copy of the given object.
 *
 * The returned object includes only the properties present in the mask. The
 * mask is an object that mirrors the structure of the given object, except
 * the only values are `true` or a sub-mask. `true` implies the property
 * should be included, and a sub-mask implies the property should be further
 * masked according to that sub-mask.
 *
 * @param {object} object - The object to mask
 * @param {Object<object | boolean>} mask - The mask to apply to the object
 */
export function maskObject(object, mask) {
  return Object.keys(object).reduce((state, key) => {
    if (mask[key] === true) {
      state[key] = object[key];
    } else if (mask[key]) {
      state[key] = maskObject(object[key], mask[key]);
    }
    return state;
  }, {});
}

/**
 * Recursively clones a value of different types
 *
 * @param {*} value
 * @returns {*}
 */
export function cloneDeep(value) {
  if (value instanceof Date) {
    return new Date(value.getTime());
  }

  if (value instanceof Array) {
    return value.reduce((arr, item, i) => {
      arr[i] = cloneDeep(item);
      return arr;
    }, []);
  }

  if (value instanceof Object) {
    return Object.keys(value).reduce((clonedValue, key) => {
      clonedValue[key] = cloneDeep(value[key]);
      return clonedValue;
    }, {});
  }

  if (Buffer.isBuffer(value)) {
    return value.slice();
  }

  return value;
}

/**
 * Creates a new object composed of all properties of `object`
 * that are included in `keys`
 *
 * @param {object} object - The origin object
 * @param {string[]} keys - Array of object keys to pick
 * @param {boolean} negate - Wether to negate or not the condition
 * @returns {object}
 */
export function pick(object, keys, negate = false) {
  if (!isObjectLike(object)) {
    return object;
  }

  return Object.keys(object).reduce((destinationObj, key) => {
    let condition = keys.includes(key);
    condition = negate ? !condition : condition;

    if (condition) {
      if (object instanceof Array) {
        destinationObj.push(cloneDeep(object[key]));
      } else {
        destinationObj[key] = cloneDeep(object[key]);
      }
    }
    return destinationObj;
  }, {});
}

/**
 * Creates a new object composed of all properties of `object`
 * that are truthy for `predicate`
 *
 * @param {object | Array} object - The origin object
 * @param {Function?} predicate - Function that returns true or false
 * @param {boolean} negate - Wether to negate or not the predicate condition
 * @returns {object | Array}
 */
export function pickBy(object, predicate, negate = false) {
  if (!isObjectLike(object)) {
    return {};
  }

  if (isNullish(predicate)) {
    return object;
  }

  const isArray = object instanceof Array;
  const predicateIsFunction = typeof predicate === 'function';

  return Object.keys(object).reduce(
    (destinationObj, key) => {
      let condition = predicateIsFunction
        ? predicate(object[key], key)
        : !isNullish(object[key]) && object[key][predicate] === true;

      condition = negate ? !condition : condition;

      if (condition) {
        const leaf = cloneDeep(object[key]);

        if (isArray) {
          destinationObj.push(leaf);
        } else {
          destinationObj[key] = leaf;
        }
      }
      return destinationObj;
    },
    isArray ? [] : {},
  );
}

/**
 * Creates a new object composed of all properties of `object`
 * that are not included in `keys`
 *
 * @param {object} object - The origin object
 * @param {string[]} keys - Array of object keys to omit
 * @returns {object}
 */
export function omit(object, keys) {
  return pick(object, keys, true);
}

/**
 * Creates a new object composed of all properties of `object`
 * that are falsy for `predicate`
 *
 * @param {object | Array} object - The origin object
 * @param {Function?} predicate - Function that returns true or false
 * @returns {object | Array}
 */
export function omitBy(object, predicate) {
  return pickBy(object, predicate, true);
}

/**
 * Creates an object with the same keys as `object` and values generated
 * by running each own enumerable string keyed property of `object` thru
 * `iteratee`
 *
 * @param {object} object - The object to iterate over
 * @param {Function} iteratee - The function invoked per iteration
 * @returns {object}
 */
export function mapValues(object, iteratee) {
  if (isNullish(object) || !isPlainObject(object)) {
    return {};
  }

  const iterateeIsFunction = typeof iteratee === 'function';

  return Object.keys(object).reduce((destinationObj, key) => {
    destinationObj[key] = iterateeIsFunction
      ? iteratee(object[key])
      : object[key][iteratee];

    return destinationObj;
  }, {});
}

/**
 * Recursively merges own and
 * inherited enumerable string keyed properties of source objects into the
 * destination object. Source properties that resolve to `undefined` are
 * skipped if a destination value exists. Array and plain object properties
 * are merged recursively. Other objects and value types are overridden by
 * assignment. Source objects are applied from left to right. Subsequent
 * sources overwrite property assignments of previous sources
 *
 * @param {object} original - Destination object
 * @param {object} source - Source object
 * @returns {object}
 */
export function merge(original, source) {
  if (isNullish(source)) {
    return original;
  }

  return Object.keys(source).reduce((destinationObj, key) => {
    if (isObjectLike(source[key])) {
      destinationObj[key] = merge(original[key], source[key]);
      return destinationObj;
    }

    if (isNullish(source[key]) && !isNullish(original[key])) {
      return destinationObj;
    }

    destinationObj[key] = source[key];

    return destinationObj;
  }, original || {});
}

/**
 * Fills `array` with `value` provided from index `start`
 * to index `end`.
 * If `start` is not provided, 0 is used.
 * If `end is not provided, end of array is used.
 *
 * @param {Array} array - The array to fill
 * @param {*} value - The value used to fill the array
 * @param {number?} start - Start index, default to 0
 * @param {number?} end - Start index, default to end of array
 * @returns
 */
export function fill(array, value, start, end) {
  if (isNullish(array) || array.length === 0) {
    return [];
  }

  return array.fill(value, start, end);
}

/**
 * Checks if `value` is a plain object
 *
 * @param {*} value - The value to check
 * @returns {boolean} Returns `true` if `value` is a plain object, else `false`
 */
export function isPlainObject(value) {
  if (!isObjectLike(value)) {
    return false;
  }

  if (value.prototype) {
    return false;
  }

  if (value instanceof Array) {
    return false;
  }

  return true;
}

/**
 * Compares `value` with `other` to see if
 * they are equal in value
 *
 * @param {*} value
 * @param {*} other
 * @returns {boolean}
 */
export function isEqual(value, other) {
  if (!isObjectLike(value) || !isObjectLike(other)) {
    return value === other;
  }

  const valueProps = Object.getOwnPropertyNames(value);
  const otherProps = Object.getOwnPropertyNames(other);

  if (valueProps.length !== otherProps.length) {
    return false;
  }

  for (const prop of valueProps) {
    const v = value[prop];
    const o = other[prop];
    if (!isEqual(v, o)) {
      return false;
    }
  }

  return true;
}

/**
 * Gets the size of `collection` by returning its length for array-like
 * values or the number of own enumerable string keyed properties for objects.
 *
 * @param {*} collection
 * @returns {number} Returns the collection size.
 */
export function size(collection) {
  if (isArrayLike(collection)) {
    return collection.length;
  }

  if ([mapTag, setTag].includes(getTag(collection))) {
    return collection.size;
  }

  return Object.keys(collection).length;
}

export function isArrayLike(value) {
  return (
    value !== null && typeof value !== 'function' && isLength(value.length)
  );
}

/**
 * Checks if `value` has typeof equal to `object` and is
 * not null
 *
 * @param {*} value
 * @returns {boolean}
 */
export function isObjectLike(value) {
  return !isNullish(value) && typeof value === 'object';
}

export function isObject(value) {
  const type = typeof value;
  return value !== null && (type === 'object' || type === 'function');
}

/**
 * Checks if a value is null or undefined
 *
 * @param {*} value
 * @returns {boolean}
 */
export function isNullish(value) {
  return value === undefined || value === null;
}

export function isLength(value) {
  return (
    typeof value === 'number' &&
    value > -1 &&
    value % 1 === 0 &&
    value <= MAX_SAFE_INTEGER
  );
}

/**
 * Gets the `toStringTag` of `value`.
 *
 * @param {*} value - The value to query.
 * @returns {string} Returns the `toStringTag`.
 */
export function getTag(value) {
  if (isNullish(value)) {
    return value === undefined ? '[object Undefined]' : '[object Null]';
  }
  return Object.prototype.toString.call(value);
}
