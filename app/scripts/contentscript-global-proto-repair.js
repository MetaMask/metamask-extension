// This script is used to repair the globalThis object in contentscripts
// eslint-disable-next-line import/unambiguous
const revealTo = Object.getPrototypeOf(globalThis);
Object.getOwnPropertyNames(EventTarget.prototype).forEach((k) => {
  if (!Object.hasOwn(revealTo, k) && !Object.hasOwn(globalThis, k)) {
    Object.defineProperty(globalThis, k, {
      value: globalThis[k],
      enumerable: false,
      writable: true,
      configurable: true,
    });
  }
});
