// Freezes all intrinsics
try {
  // eslint-disable-next-line no-undef,import/unambiguous
  lockdown({
    consoleTaming: 'unsafe',
    errorTaming: 'unsafe',
    mathTaming: 'unsafe',
    dateTaming: 'unsafe',
    overrideTaming: 'severe',
  });
} catch (error) {
  // If the `lockdown` call throws an exception, it interferes with the
  // contentscript injection on some versions of Firefox. The error is
  // caught and logged here so that the contentscript still gets injected.
  // This affects Firefox v56 and Waterfox Classic.
  console.error('Lockdown failed:', error);
  if (globalThis.sentry && globalThis.sentry.captureException) {
    globalThis.sentry.captureException(
      new Error(`Lockdown failed: ${error.message}`),
    );
  }
}

// Make all "object" and "function" own properties of globalThis
// non-configurable and non-writable, when possible.
// We call the a property that is non-configurable and non-writable,
// "non-modifiable".
try {
  /**
   * `lockdown` only hardens the properties enumerated by the
   * universalPropertyNames constant specified in 'ses/src/whitelist'. This
   * function makes all function and object properties on the start compartment
   * global non-configurable and non-writable, unless they are already
   * non-configurable.
   *
   * It is critical that this function runs at the right time during
   * initialization, which should always be immediately after `lockdown` has been
   * called. At the time of writing, the modifications this function makes to the
   * runtime environment appear to be non-breaking, but that could change with
   * the addition of dependencies, or the order of our scripts in our HTML files.
   * Exercise caution.
   *
   * See inline comments for implementation details.
   *
   * We write this function in IIFE format to avoid polluting global scope.
   */
  (function protectIntrinsics() {
    // TODO: Figure out how to import this object from ses/src/whitelist.js
    // These are a.k.a. the "named intrinsics".
    const universalPropertyNames = {
      // *** Function Properties of the Global Object

      isFinite: 'isFinite',
      isNaN: 'isNaN',
      parseFloat: 'parseFloat',
      parseInt: 'parseInt',

      decodeURI: 'decodeURI',
      decodeURIComponent: 'decodeURIComponent',
      encodeURI: 'encodeURI',
      encodeURIComponent: 'encodeURIComponent',

      // *** Constructor Properties of the Global Object

      Array: 'Array',
      ArrayBuffer: 'ArrayBuffer',
      BigInt: 'BigInt',
      BigInt64Array: 'BigInt64Array',
      BigUint64Array: 'BigUint64Array',
      Boolean: 'Boolean',
      DataView: 'DataView',
      EvalError: 'EvalError',
      Float32Array: 'Float32Array',
      Float64Array: 'Float64Array',
      Int8Array: 'Int8Array',
      Int16Array: 'Int16Array',
      Int32Array: 'Int32Array',
      Map: 'Map',
      Number: 'Number',
      Object: 'Object',
      Promise: 'Promise',
      Proxy: 'Proxy',
      RangeError: 'RangeError',
      ReferenceError: 'ReferenceError',
      Set: 'Set',
      String: 'String',
      Symbol: 'Symbol',
      SyntaxError: 'SyntaxError',
      TypeError: 'TypeError',
      Uint8Array: 'Uint8Array',
      Uint8ClampedArray: 'Uint8ClampedArray',
      Uint16Array: 'Uint16Array',
      Uint32Array: 'Uint32Array',
      URIError: 'URIError',
      WeakMap: 'WeakMap',
      WeakSet: 'WeakSet',

      // *** Other Properties of the Global Object

      JSON: 'JSON',
      Reflect: 'Reflect',

      // *** Annex B

      escape: 'escape',
      unescape: 'unescape',

      // ESNext

      lockdown: 'lockdown',
      harden: 'harden',
      HandledPromise: 'HandledPromise', // TODO: Until Promise.delegate (see below).
      StaticModuleRecord: 'StaticModuleRecord',
    };

    const globalProperties = new Set([
      // TODO: Also include the named platform globals
      // This grabs every enumerable property on globalThis.
      // ...Object.keys(globalThis),

      // universalPropertyNames is a constant added by lockdown to global scope
      // at the time of writing, it is initialized in 'ses/src/whitelist'.
      // These properties tend to be non-enumerable.
      ...Object.keys(universalPropertyNames),
    ]);

    globalProperties.forEach((propertyName) => {
      const descriptor = Reflect.getOwnPropertyDescriptor(
        globalThis,
        propertyName,
      );
      const value = globalThis[propertyName];

      if (
        descriptor &&
        Boolean(value) &&
        (typeof value === 'object' || typeof value === 'function')
      ) {
        // If the property on globalThis is configurable, make it
        // non-configurable. If it has no accessor properties, also make it
        // non-writable.
        if (descriptor.configurable) {
          Object.defineProperty(globalThis, propertyName, {
            ...descriptor,
            configurable: false,
            ...(hasAccessor(descriptor) ? {} : { writable: false }),
          });
        }
      }
    });

    /**
     * Checks whether the given propertyName descriptor has any accessors, i.e. the
     * properties `get` or `set`.
     *
     * We want to make globals non-writable, and we can't set the `writable`
     * property and accessor properties at the same time.
     *
     * @param {Object} descriptor - The propertyName descriptor to check.
     * @returns {boolean} Whether the propertyName descriptor has any accessors.
     */
    function hasAccessor(descriptor) {
      return 'set' in descriptor || 'get' in descriptor;
    }
  })();
} catch (error) {
  console.error('Protecting intrinsics failed:', error);
  if (globalThis.sentry && globalThis.sentry.captureException) {
    globalThis.sentry.captureException(
      new Error(`Protecting intrinsics failed: ${error.message}`),
    );
  }
}
