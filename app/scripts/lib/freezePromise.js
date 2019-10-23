
/**
 * Freezes the Promise global and prevents its reassignment.
 */
const deepFreeze = require('deep-freeze-strict')

/* eslint-disable-next-line */
Promise = deepFreeze(Promise)
const { value, enumerable } = Object.getOwnPropertyDescriptor(global, 'Promise')
Object.defineProperty(global, 'Promise', {
  value, enumerable, configurable: false, writable: false,
})
