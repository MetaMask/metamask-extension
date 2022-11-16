// Make all "object" and "function" own properties of globalThis
// non-configurable and non-writable, when possible.
// We call a property that is non-configurable and non-writable,
// "non-modifiable".
try {
  /**
   * `lockdown` only hardens the properties enumerated by the
   * universalPropertyNames constant specified in 'ses/src/whitelist'. This
   * function makes all function and object properties on the start compartment
   * global non-configurable and non-writable, unless they are already
   * non-configurable, or they were scuttled by LavaMoat runtime (LavaMoat#360).
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
    const lmre = // regex expression for LavaMoat scuttling error message
      /LavaMoat - property "[A-Za-z0-9]*" of globalThis is inaccessible under scuttling mode/u;

    const namedIntrinsics = Reflect.ownKeys(new Compartment().globalThis);

    // These named intrinsics are not automatically hardened by `lockdown`
    const shouldHardenManually = new Set(['eval', 'Function']);

    const globalProperties = new Set([
      // universalPropertyNames is a constant added by lockdown to global scope
      // at the time of writing, it is initialized in 'ses/src/whitelist'.
      // These properties tend to be non-enumerable.
      ...namedIntrinsics,

      // TODO: Also include the named platform globals
      // This grabs every enumerable property on globalThis.
      // ...Object.keys(globalThis),
    ]);

    globalProperties.forEach((propertyName) => {
      const descriptor = Reflect.getOwnPropertyDescriptor(
        globalThis,
        propertyName,
      );

      if (descriptor) {
        if (descriptor.configurable) {
          // If the property on globalThis is configurable, make it
          // non-configurable. If it has no accessor properties, also make it
          // non-writable.
          if (hasAccessor(descriptor)) {
            Object.defineProperty(globalThis, propertyName, {
              configurable: false,
            });
          } else {
            Object.defineProperty(globalThis, propertyName, {
              configurable: false,
              writable: false,
            });
          }
        }

        if (shouldHardenManually.has(propertyName)) {
          try {
            harden(globalThis[propertyName]);
          } catch (err) {
            if (!lmre.test(err.message)) {
              throw err;
            }
            console.warn(
              `Property ${propertyName} will not be hardened`,
              `because it is scuttled by LavaMoat protection.`,
              `Visit https://github.com/LavaMoat/LavaMoat/pull/360 to learn more.`,
            );
          }
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
     * @param {object} descriptor - The propertyName descriptor to check.
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
