const clone = require('clone')

module.exports = getObjStructure

// This will create an object that represents the structure of the given object
// it replaces all values with the result of their type

// {
//   "data": {
//     "CurrencyController": {
//       "conversionDate": "number",
//       "conversionRate": "number",
//       "currentCurrency": "string"
//     }
// }

function getObjStructure(obj) {
  const structure = clone(obj)
  return deepMap(structure, (value) => {
    return value === null ? 'null' : typeof value
  })
}

function deepMap(target = {}, visit) {
  Object.entries(target).forEach(([key, value]) => {
    if (typeof value === 'object' && value !== null) {
      target[key] = deepMap(value, visit)
    } else {
      target[key] = visit(value)
    }
  })
  return target
}
