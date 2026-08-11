import {
  getBnsResolver,
  resetBnsResolverForTests,
  setupBnsResolver,
} from './setup';

describe('setupBnsResolver (H1.2 background install)', () => {
  afterEach(() => {
    resetBnsResolverForTests();
  });

  it('activates a resolver retrievable via getBnsResolver', () => {
    expect(getBnsResolver()).toBeNull();
    const api = setupBnsResolver({
      configSources: {
        registryAddress: '0x2222222222222222222222222222222222222222',
        rpcUrls: [
          'https://rpc-a.example',
          'https://rpc-b.example',
          'https://rpc-c.example',
        ],
      },
    });
    expect(getBnsResolver()).toBe(api);
    expect(api.isConfigured()).toBe(true);
  });

  it('can skip activation for isolated construction', () => {
    setupBnsResolver({
      activate: false,
      configSources: {
        registryAddress: '0x2222222222222222222222222222222222222222',
        rpcUrls: [
          'https://rpc-a.example',
          'https://rpc-b.example',
          'https://rpc-c.example',
        ],
      },
    });
    expect(getBnsResolver()).toBeNull();
  });
});
