import './install-lockdown';
import '../../app/scripts/lockdown-run';
import { strict as assert } from 'assert';

describe('non-modifiable intrinsics', function () {
  const globalProperties = new Set([
    // This grabs every enumerable property on globalThis.
    ...Object.keys(globalThis),
    // Added to global scope by ses/dist/lockdown.cjs.
    ...Object.keys(universalPropertyNames),
  ]);

  globalProperties.forEach((propertyName) => {
    it(`intrinsic globalThis["${propertyName}"]`, function () {
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
        if (propertyName in universalPropertyNames) {
          assert.equal(
            descriptor.configurable,
            false,
            `universal property globalThis["${propertyName}"] should be non-configurable`,
          );

          assert.equal(
            descriptor.writable,
            false,
            `universal property globalThis["${propertyName}"] should be non-writable`,
          );

          // As long as Object.isFrozen is the true Object.isFrozen, the object
          // it is called with cannot lie about being frozen.
          assert.equal(
            Object.isFrozen(value),
            true,
            `value of universal property globalThis["${propertyName}"] should be frozen`,
          );
        } else {
          assert.equal(
            descriptor.configurable,
            false,
            `globalThis["${propertyName}"] should be non-configurable`,
          );
        }
      }
    });
  });
});
