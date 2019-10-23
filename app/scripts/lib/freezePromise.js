
/**
 * Freezes the Promise global and prevents its reassignment.
 */
const deepFreeze = require('deep-freeze-strict')

if (
  process.env.IN_TEST !== 'true' &&
  process.env.METAMASK_ENV !== 'test'
) {
  Promise = deepFreeze(Promise) /* eslint-disable-line */
  const { value, enumerable } = Object.getOwnPropertyDescriptor(global, 'Promise')
  Object.defineProperty(global, 'Promise', {
    value, enumerable, configurable: false, writable: false,
  })
}
