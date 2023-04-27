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
  const comp = new Compartment().globalThis;

  const ignoreList = new Set([
    'Compartment',
    ...Object.getOwnPropertySymbols(comp),
  ]);
  const namedIntrinsics = Reflect.ownKeys(comp);

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
  try {
    const value = globalThis[propertyName];
    if (value !== globalThis) {
      assert.equal(
        Object.isFrozen(value),
        true,
        `value of universal property globalThis["${propertyName}"] should be frozen`,
      );
    }
  } catch (err) {
    const lmre = // regex expression for LavaMoat scuttling error message
      /LavaMoat - property "[A-Za-z0-9]*" of globalThis is inaccessible under scuttling mode/u;

    if (!lmre.test(err.message)) {
      throw err;
    }
    console.warn(
      `Property ${propertyName} is not hardened`,
      `because it is scuttled by LavaMoat protection.`,
      `Visit https://github.com/LavaMoat/LavaMoat/pull/360 to learn more.`,
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
