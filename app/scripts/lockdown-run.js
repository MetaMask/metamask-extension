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
  captureError(error);
}

// Make all "object" and "function" own properties of globalThis
// non-configurable and non-writable, and harden most functions and objects
// not hardened by `lockdown`.
try {
  if (
    typeof process === 'undefined' ||
    (process.env.IN_TEST !== 'true' && process.env.METAMASK_ENV !== 'test')
  ) {
    protectIntrinsics();
  }
} catch (error) {
  console.error('Protecting intrinsics failed:', error);
  captureError(error);
}

/**
 * Logs an error to Sentry.
 *
 * @param {Error} error - The error to log.
 */
function captureError(error) {
  if (globalThis.sentry && globalThis.sentry.captureException) {
    globalThis.sentry.captureException(error);
  }
}

/**
 * `lockdown` only hardens the properties enumerated by the
 * universalPropertyNames constant specified in 'ses/src/whitelist'. This
 * function hardens other intrinsics that we may rely on, and prevents any
 * intrinsic from being overwritten (if possible).
 * 
 * It is critical that this function runs at the right time during
 * initialization, which should always be immediately after `lockdown` has been
 * called. At the time of writing, the modifications this function makes to the
 * runtime environment appear to be non-breaking, but that could change with
 * the addition of dependencies, or the order of our scripts in our HTML files.
 * Exercise caution.
 * 
 * See inline comments for implementation details.
 */
function protectIntrinsics() {
  const globalProperties = new Set([
    // This grabs every enumerable property on globalThis.
    ...Object.keys(globalThis),
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
      // First, if the property on globalThis is configurable, make it
      // non-configurable and non-writable.
      if (descriptor.configurable) {
        Object.defineProperty(globalThis, propertyName, {
          ...descriptor,
          configurable: false,
          ...(hasAccessor(descriptor) ? {} : { writable: false }),
        });
      }

      const hardenIgnoreList = new Set([
        // The browser won't let us freeze these, not that we'd want to.
        'frames',
        'parent',
        'top',

        // The browser also won't let us freeze these.
        'localStorage',
        'sessionStorage',

        // This function.
        'protectIntrinsics',
      ]);

      // Second, if the value of the property can be hardened and isn't
      // hardened by `lockdown`, harden the value.
      if (
        value !== globalThis && // We neither can nor want to freeze this.
        !(propertyName in universalPropertyNames) &&
        !hardenIgnoreList.has(propertyName)
      ) {
        try {
          harden(value);
        } catch (error) {
          // We should have enumerated everything in advance.
          console.error(`Failed to harden property "${propertyName}".`, error);
          captureError(error);
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
