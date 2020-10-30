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
 * @returns {Promise} A Promise that resolves when the stub has been called
 */
export default function waitUntilCalled (stub, wrappedThis = null) {
  let wasCalled
  const stubHasBeenCalled = new Promise((resolve) => {
    wasCalled = resolve
  })
  stub.callsFake((...args) => {
    if (stub.wrappedMethod) {
      stub.wrappedMethod.call(wrappedThis, ...args)
    }
    wasCalled()
  })
  return stubHasBeenCalled
}
