const { strict: assert } = require('assert');

module.exports = {
  getGlobalProperties,
  testIntrinsic,
};

/**
 * Gets the global intrinsic property names in a locked down environemnt.
 *
 * @returns {Set<string>} All global intrinsic property names.
 */
function getGlobalProperties() {
  // These are Agoric inventions, and we don't care about them.
  const ignoreList = new Set([
    'Compartment',
    'HandledPromise',
    'StaticModuleRecord',
  ]);

  const namedIntrinsics = Reflect.ownKeys(new Compartment().globalThis);

  return new Set(
    [
      // Added to global scope by ses/dist/lockdown.cjs.
      ...namedIntrinsics,

      // TODO: Also include the named platform globals
      // This grabs every enumerable property on globalThis.
      // ...Object.keys(globalThis),
    ].filter((propertyName) => !ignoreList.has(propertyName)),
  );
}

/**
 * Performs a number of assertions on the specified intrinsic property to
 * ensure that the environment is locked down properly.
 * Throws if any assertion fails.
 *
 * @param {string} propertyName - The name of the intrinsic property to test.
 */
function testIntrinsic(propertyName) {
  const descriptor = Reflect.getOwnPropertyDescriptor(globalThis, propertyName);

  assert.ok(
    descriptor,
    `globalThis["${propertyName}"] should have a descriptor`,
  );

  // As long as Object.isFrozen is the true Object.isFrozen, the object
  // it is called with cannot lie about being frozen.
  const value = globalThis[propertyName];
  if (value !== globalThis) {
    assert.equal(
      Object.isFrozen(value),
      true,
      `value of universal property globalThis["${propertyName}"] should be frozen`,
    );
  }

  // The writability of properties with accessors cannot be modified.
  if ('set' in descriptor || 'get' in descriptor) {
    assert.equal(
      descriptor.configurable,
      false,
      `globalThis["${propertyName}"] should be non-configurable`,
    );
  } else {
    assert.equal(
      descriptor.configurable,
      false,
      `globalThis["${propertyName}"] should be non-configurable`,
    );

    assert.equal(
      descriptor.writable,
      false,
      `globalThis["${propertyName}"] should be non-writable`,
    );
  }
}
