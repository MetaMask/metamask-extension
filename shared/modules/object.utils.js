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
 * @param {object<object|boolean>} mask - The mask to apply to the object
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
