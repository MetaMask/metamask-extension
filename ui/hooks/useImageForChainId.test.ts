import { CHAIN_IDS } from '../../shared/constants/network';
import { renderHookWithProvider } from '../../test/lib/render-helpers-navigate';
import { useImageForChainId } from './useImageForChainId';

type RegistryNetworkFixture = {
  chainId: string;
  imageUrl: string;
};

const buildState = (
  networks: Record<string, RegistryNetworkFixture>,
  registryEnabled: boolean,
) => ({
  metamask: {
    remoteFeatureFlags: { configRegistryApiEnabled: registryEnabled },
    configs: {
      networks: Object.fromEntries(
        Object.entries(networks).map(([key, value]) => [key, value]),
      ),
    },
    lastFetched: registryEnabled ? 1 : null,
    etag: null,
    version: '1.0',
  },
});

const renderHook = (chainId: string | undefined, state: unknown) =>
  renderHookWithProvider(() => useImageForChainId(chainId), state as never)
    .result.current;

describe('useImageForChainId', () => {
  it('returns undefined for an undefined chain ID', () => {
    expect(renderHook(undefined, buildState({}, false))).toBeUndefined();
  });

  it('resolves static network logos when the registry flag is off', () => {
    expect(
      renderHook(CHAIN_IDS.MAINNET, buildState({}, false)),
    ).toMatchInlineSnapshot('"./images/eth_logo.svg"');
  });

  it('prefers registry image URLs when the flag is on', () => {
    const state = buildState(
      {
        'eip155:99901': {
          chainId: 'eip155:99901',
          imageUrl: 'https://example.com/elysium.svg',
        },
      },
      true,
    );

    expect(renderHook('0x1863d', state)).toBe(
      'https://example.com/elysium.svg',
    );
    expect(renderHook('eip155:99901', state)).toBe(
      'https://example.com/elysium.svg',
    );
  });

  it('falls back to static network logos for chains missing from the registry', () => {
    const state = buildState(
      {
        'eip155:99901': {
          chainId: 'eip155:99901',
          imageUrl: 'https://example.com/elysium.svg',
        },
      },
      true,
    );

    expect(renderHook(CHAIN_IDS.MAINNET, state)).toMatchInlineSnapshot(
      '"./images/eth_logo.svg"',
    );
  });
});
