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
 * Checks if `value` has typeof equal to `object` and is
 * not null
 *
 * @param {*} value
 * @returns {boolean}
 */
export function isObjectLike(value) {
  return !isNullish(value) && typeof value === 'object';
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
