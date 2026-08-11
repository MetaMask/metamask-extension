import { Interface } from '@ethersproject/abi';
import namehash from 'eth-ens-namehash';
import browser from 'webextension-polyfill';

import {
  BNS_REGISTRY_RESOLVER_FRAGMENT,
  BNS_RESOLVER_CONTENTHASH_FRAGMENT,
} from '../../../../shared/bns/constants';
import { createBnsResolver } from './create-bns-resolver';
import { resetBnsResolverForTests, setupBnsResolver } from './setup';
import { setupBnsWebRequestRedirect } from './web-request';

jest.mock('webextension-polyfill', () => ({
  tabs: {
    update: jest.fn(),
    TAB_ID_NONE: -1,
  },
  webRequest: {
    onErrorOccurred: {
      addListener: jest.fn(),
      removeListener: jest.fn(),
    },
  },
}));

const REGISTRY = '0x2222222222222222222222222222222222222222';
const RESOLVER = '0x3333333333333333333333333333333333333333';
const CONTENTHASH =
  '0xe312209d6c2be50f70695347c6da90ab413d0fdd87c8f85b09b78d26718f61c3c7a70e';
const CID = 'QmYwAPJzv5CZsnAzt8auVZRnGxQK1dH5vzyMGrJMAbXKMF';
const GATEWAY = 'ipfs.bearnetwork.net';

const registryInterface = new Interface([BNS_REGISTRY_RESOLVER_FRAGMENT]);
const resolverInterface = new Interface([BNS_RESOLVER_CONTENTHASH_FRAGMENT]);

const validRpcs = [
  'https://rpc-a.example',
  'https://rpc-b.example',
  'https://rpc-c.example',
] as const;

function mockEthCall() {
  const node = namehash.hash('bear.bnes');
  return jest.fn(async ({ to }: { to: string }) => {
    if (to.toLowerCase() === REGISTRY) {
      expect(node).toMatch(/^0x/u);
      return registryInterface.encodeFunctionResult('resolver', [RESOLVER]);
    }
    return resolverInterface.encodeFunctionResult('contenthash', [CONTENTHASH]);
  });
}

describe('setupBnsWebRequestRedirect (H1.5)', () => {
  const updateTab = jest.fn();

  afterEach(() => {
    resetBnsResolverForTests();
    jest.clearAllMocks();
  });

  it('registers and removes onErrorOccurred for *.bnes main_frame', () => {
    const api = setupBnsWebRequestRedirect({ updateTab });
    expect(browser.webRequest.onErrorOccurred.addListener).toHaveBeenCalledWith(
      expect.any(Function),
      { urls: ['*://*.bnes/*'], types: ['main_frame'] },
    );
    api.remove();
    expect(
      browser.webRequest.onErrorOccurred.removeListener,
    ).toHaveBeenCalledWith(expect.any(Function));
  });

  it('redirects a failed .bnes navigation only to the pinned gateway URL', async () => {
    setupBnsResolver({
      configSources: {
        registryAddress: REGISTRY,
        gatewayHost: GATEWAY,
        rpcUrls: validRpcs,
      },
      ethCall: mockEthCall(),
    });

    const api = setupBnsWebRequestRedirect({
      updateTab,
      installListener: false,
    });

    await api.handleErrorOccurred({
      tabId: 7,
      url: 'https://bear.bnes/docs',
    });

    expect(updateTab).toHaveBeenCalledTimes(1);
    expect(updateTab).toHaveBeenCalledWith(7, {
      url: `https://${GATEWAY}/ipfs/${CID}/docs`,
    });
    const dest = updateTab.mock.calls[0][1].url as string;
    expect(dest.startsWith('https://')).toBe(true);
    expect(dest.includes('chrome-extension:')).toBe(false);
  });

  it('does not redirect when the host is malicious or non-BNS', async () => {
    setupBnsResolver({
      configSources: {
        registryAddress: REGISTRY,
        gatewayHost: GATEWAY,
        rpcUrls: validRpcs,
      },
      ethCall: mockEthCall(),
    });

    const api = setupBnsWebRequestRedirect({
      updateTab,
      installListener: false,
    });

    await api.handleErrorOccurred({
      tabId: 3,
      url: 'https://-evil.bnes/',
    });
    await api.handleErrorOccurred({
      tabId: 3,
      url: 'https://evil.eth/',
    });
    expect(updateTab).not.toHaveBeenCalled();
  });

  it('does not redirect when resolver is not installed or not configured', async () => {
    const apiMissing = setupBnsWebRequestRedirect({
      resolver: null,
      updateTab,
      installListener: false,
    });
    await apiMissing.handleErrorOccurred({
      tabId: 1,
      url: 'https://bear.bnes/',
    });
    expect(updateTab).not.toHaveBeenCalled();

    const unconfigured = createBnsResolver({
      configSources: { registryAddress: '', rpcUrls: validRpcs },
    });
    const apiUnconfigured = setupBnsWebRequestRedirect({
      resolver: unconfigured,
      updateTab,
      installListener: false,
    });
    await apiUnconfigured.handleErrorOccurred({
      tabId: 1,
      url: 'https://bear.bnes/',
    });
    expect(updateTab).not.toHaveBeenCalled();
  });

  it('ignores tab-less requests', async () => {
    setupBnsResolver({
      configSources: {
        registryAddress: REGISTRY,
        gatewayHost: GATEWAY,
        rpcUrls: validRpcs,
      },
      ethCall: mockEthCall(),
    });
    const api = setupBnsWebRequestRedirect({
      updateTab,
      installListener: false,
    });
    await api.handleErrorOccurred({
      tabId: -1,
      url: 'https://bear.bnes/',
    });
    expect(updateTab).not.toHaveBeenCalled();
  });
});
