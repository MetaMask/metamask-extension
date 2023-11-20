/**
 * This symbol matches all object properties when used in a mask
 */
export const AllProperties = Symbol('*');

/**
 * Return a "masked" copy of the given object. The returned object includes
 * only the properties present in the mask.
 *
 * The mask is an object that mirrors the structure of the given object, except
 * the only values are `true`, `false, a sub-mask, or the 'AllProperties"
 * symbol. `true` implies the property should be included, and `false` will
 * exclude it. A sub-mask implies the property should be further masked
 * according to that sub-mask. The "AllProperties" symbol is used for objects
 * with dynamic keys, and applies a rule (either `true`, `false`, or a
 * sub-mask`) to every property in that object.
 *
 * If a property is excluded, its type is included instead.
 *
 * @param {object} object - The object to mask
 * @param {Object<object | boolean>} mask - The mask to apply to the object
 */
export function maskObject(object, mask) {
  let maskAllProperties = false;
  if (Object.keys(mask).includes(AllProperties)) {
    if (Object.keys(mask).length > 1) {
      throw new Error('AllProperties mask key does not support sibling keys');
    }
    maskAllProperties = true;
  }
  return Object.keys(object).reduce((state, key) => {
    const maskKey = maskAllProperties ? mask[AllProperties] : mask[key];
    if (maskKey === true) {
      state[key] = object[key];
    } else if (maskKey && typeof maskKey === 'object') {
      state[key] = maskObject(object[key], maskKey);
    } else if (maskKey === undefined || maskKey === false) {
      state[key] = typeof object[key];
    } else {
      throw new Error(`Unsupported mask entry: ${maskKey}`);
    }
    return state;
  }, {});
}
