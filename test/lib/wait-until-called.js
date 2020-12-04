/**
 * A function that wraps a sinon stubbed function and returns a Promise
 * when this stub was called.
 *
 * The stub that has been passed in will be setup to call the wrapped function
 * directly, then trigger the returned Promise to resolve.
 *
 * WARNING: Any existing `callsFake` behavior will be overwritten.
 *
 * @param {import('sinon').stub} stub - A sinon stub of a function
 * @param {unknown} [wrappedThis] - The object the stubbed function was called on, if any (i.e. the `this` value)
 * @param {number} [callCount] - The number of calls to wait for. Defaults to 1.
 * @returns {Promise} A Promise that resolves when the stub has been called
 */
function waitUntilCalled(stub, wrappedThis = null, callCount = 1) {
  let numCalls = 0
  let resolve
  const stubHasBeenCalled = new Promise((_resolve) => {
    resolve = _resolve
  })
  stub.callsFake((...args) => {
    try {
      if (stub.wrappedMethod) {
        stub.wrappedMethod.call(wrappedThis, ...args)
      }
    } finally {
      if (numCalls < callCount) {
        numCalls += 1
        if (numCalls === callCount) {
          resolve()
        }
      }
    }
  })
  return stubHasBeenCalled
}

module.exports = waitUntilCalled
