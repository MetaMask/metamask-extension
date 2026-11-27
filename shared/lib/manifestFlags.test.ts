import { getManifestFlags } from './manifestFlags';

describe('getManifestFlags', () => {
  it('loads outside an extension without the `webextension-polyfill` mock', () => {
    // Jest mocks the polyfill and installs a `browser` global, which together hide a
    // module-scope import that throws when e2e benchmark flows load this in Node.
    const globals = globalThis as { browser?: unknown; chrome?: unknown };
    const { browser, chrome } = globals;
    delete globals.browser;
    delete globals.chrome;
    try {
      jest.isolateModules(() => {
        jest.unmock('webextension-polyfill');

        expect(() => jest.requireActual('./manifestFlags')).not.toThrow();
      });
    } finally {
      globals.browser = browser;
      globals.chrome = chrome;
    }
  });

  it('returns an empty object when the manifest carries no `_flags`', () => {
    expect(getManifestFlags()).toStrictEqual({});
  });
});
