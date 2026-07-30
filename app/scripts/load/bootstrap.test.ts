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

describe('bootstrap Sentry globals', () => {
  const globalNames = [
    'fetch',
    'requestAnimationFrame',
    'setInterval',
    'setTimeout',
  ] as const;

  it('binds receiver-sensitive globals before installing Sentry', () => {
    const originalEnableSentry = process.env.ENABLE_SENTRY;
    const originalStateHooksDescriptor = Object.getOwnPropertyDescriptor(
      globalThis,
      'stateHooks',
    );
    const originalGlobalDescriptors = new Map(
      globalNames.map((globalName) => [
        globalName,
        Object.getOwnPropertyDescriptor(globalThis, globalName),
      ]),
    );

    try {
      process.env.ENABLE_SENTRY = 'true';
      for (const globalName of globalNames) {
        const receiverSensitiveGlobal = function (this: typeof globalThis) {
          expect(this).toBe(globalThis);
        };
        Reflect.set(globalThis, globalName, receiverSensitiveGlobal);
      }

      jest.resetModules();
      require('./bootstrap');

      for (const globalName of globalNames) {
        const boundGlobal = globalThis[globalName];
        expect(typeof boundGlobal).toBe('function');
        Reflect.apply(
          boundGlobal as (...args: unknown[]) => unknown,
          Object.create(null),
          [],
        );
      }
    } finally {
      if (originalEnableSentry === undefined) {
        delete process.env.ENABLE_SENTRY;
      } else {
        process.env.ENABLE_SENTRY = originalEnableSentry;
      }

      if (originalStateHooksDescriptor) {
        Object.defineProperty(
          globalThis,
          'stateHooks',
          originalStateHooksDescriptor,
        );
      } else {
        Reflect.deleteProperty(globalThis, 'stateHooks');
      }

      for (const [globalName, descriptor] of originalGlobalDescriptors) {
        if (descriptor) {
          Object.defineProperty(globalThis, globalName, descriptor);
        } else {
          Reflect.deleteProperty(globalThis, globalName);
        }
      }
    }
  });
});

export {};
