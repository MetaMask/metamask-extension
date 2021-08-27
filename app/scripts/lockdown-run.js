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
  // This affects Firefox v56 and Waterfox Classic
  console.error('Lockdown failed:', error);
  captureError(error);
}

const enumerableIntrinsics = new Set(globalThis.__ENUMERABLE_INTRINSICS);
delete globalThis.__ENUMERABLE_INTRINSICS;

// Make all "object" and "function" own properties of globalThis
// non-configurable and non-writable.
// `lockdown` does not do this by default.
try {
  // Skip doing it in test environments.
  if (
    typeof process === 'undefined' ||
    (process.env.IN_TEST !== 'true' && process.env.METAMASK_ENV !== 'test')
  ) {
    protectIntrinsics(globalThis, 'Promise');
  }
} catch (error) {
  console.error('Protecting intrinsics failed:', error);
  captureError(error);
}

/**
 *
 * @param {Error} error - The error to log.
 */
function captureError(error) {
  if (globalThis.sentry && globalThis.sentry.captureException) {
    globalThis.sentry.captureException(error);
  }
}

/**
 * Makes all
 */
function protectIntrinsics() {
  const globalProperties = new Set([
    ...Object.keys(globalThis),
    // universalPropertyNames is a constant added by lockdown to global scope
    // at the time of writing, it is initialized in 'ses/src/whitelist'.
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
      if (descriptor.configurable) {
        Object.defineProperty(globalThis, propertyName, {
          ...descriptor,
          configurable: false,
          ...(hasAccessor(descriptor) ? {} : { writable: false }),
        });
      }

      const hardenIgnoreList = new Set(['protectIntrinsics']);

      if (
        // enumerableIntrinsics.has(propertyName) &&
        !(propertyName in universalPropertyNames) &&
        // !hasAccessor(descriptor) &&
        !('set' in descriptor) &&
        !hardenIgnoreList.has(propertyName)
      ) {
        try {
          harden(value);
        } catch (error) {
          console.log('Failed to harden:', propertyName, error);
        }
      }
    }
  });
}

/**
 * Checks whether the given propertyName descriptor has any accessors, i.e. the
 * properties `get` or `set`.
 *
 * We want to make globals non-writable, and we can set the `writable` propertyName
 * and accessor properties at the same time.
 *
 * @param {Object} descriptor - The propertyName descriptor to check.
 * @returns {boolean} Whether the propertyName descriptor has any accessors.
 */
function hasAccessor(descriptor) {
  return 'set' in descriptor || 'get' in descriptor;
}
