import { cloneDeep } from 'lodash';

// This will create an object that represents the structure of the given object
// it replaces all values with the result of their type

// {
//   "data": {
//     "CurrencyController": {
//       "currentCurrency": "string"
//       "currencyRates": {
//         "ETH": {
//           "conversionDate": "number",
//           "conversionRate": "number",
//           "usdConversionRate": "number",
//         }
//       },
//     }
// }

/**
 * Creates an object that represents the structure of the given object. It replaces all values with the result of their
 * type.
 *
 * @param {object} obj - The object for which a 'structure' will be returned. Usually a plain object and not a class.
 * @returns {object} The "mapped" version of a deep clone of the passed object, with each non-object property value
 * replaced with the javascript type of that value.
 */
export default function getObjStructure(obj) {
  const structure = cloneDeep(obj);
  return deepMap(structure, (value) => {
    return value === null ? 'null' : typeof value;
  });
}

/**
 * Modifies all the properties and deeply nested of a passed object. Iterates recursively over all nested objects and
 * their properties, and covers the entire depth of the object. At each property value which is not an object is modified.
 *
 * @param {object} target - The object to modify
 * @param {Function} visit - The modifier to apply to each non-object property value
 * @returns {object} The modified object
 */
function deepMap(target = {}, visit) {
  Object.entries(target).forEach(([key, value]) => {
    if (typeof value === 'object' && value !== null) {
      target[key] = deepMap(value, visit);
    } else {
      target[key] = visit(value);
    }
  });
  return target;
}
