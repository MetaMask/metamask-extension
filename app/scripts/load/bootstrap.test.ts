/* eslint-disable @typescript-eslint/no-require-imports */

jest.mock('../init-globals', () => ({}));
jest.mock('../sentry-install', () => ({}));

const stateHookInitializers = [
  {
    name: 'bootstrap',
    load: () => require('./bootstrap'),
  },
  {
    name: 'init-state-hooks',
    load: () => require('./init-state-hooks'),
  },
];

for (const { name, load } of stateHookInitializers) {
  describe(name, () => {
    let originalStateHooks: typeof globalThis.stateHooks;
    let hadStateHooks = false;

    beforeEach(() => {
      jest.resetModules();
      hadStateHooks = Object.prototype.hasOwnProperty.call(
        globalThis,
        'stateHooks',
      );
      originalStateHooks = globalThis.stateHooks;
    });

    afterEach(() => {
      if (hadStateHooks) {
        globalThis.stateHooks = originalStateHooks;
      } else {
        Reflect.deleteProperty(globalThis, 'stateHooks');
      }
    });

    it('creates the shared state hooks object when absent', () => {
      Reflect.deleteProperty(globalThis, 'stateHooks');

      load();

      expect(globalThis.stateHooks).toStrictEqual({});
    });

    it('preserves the shared state hooks object when present', () => {
      const existingStateHooks = {} as typeof stateHooks;
      globalThis.stateHooks = existingStateHooks;

      load();

      expect(globalThis.stateHooks).toBe(existingStateHooks);
    });
  });
}

export {};
