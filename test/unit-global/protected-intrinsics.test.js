// Should occur before anything else
import './globalPatch';
import 'ses/lockdown';
import '../../app/scripts/lockdown-run';
import { strict as assert } from 'assert'; /* eslint-disable-line import/first,import/order */

const globalProperties = new Set([
  // This grabs every enumerable property on globalThis.
  ...Object.keys(globalThis),
  // universalPropertyNames is a constant added by lockdown to global scope
  // at the time of writing, it is initialized in 'ses/src/whitelist'.
  // These properties tend to be non-enumerable.
  ...Object.keys(universalPropertyNames),
]);

const NEW_PROPERTY = Symbol('newProperty');

describe('Promise global is immutable', function () {
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
        assert.equal(
          Object.isFrozen(value),
          true,
          `value of universal property globalThis["${propertyName}"] should be frozen`,
        );
        assert.throws(
          () => (value[NEW_PROPERTY] = 'bar'),
          `should be unable to create new properties on globalThis["${propertyName}"]`,
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
