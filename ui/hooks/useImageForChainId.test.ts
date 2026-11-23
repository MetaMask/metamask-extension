import { CHAIN_IDS } from '../../shared/constants/network';
import { renderHookWithProvider } from '../../test/lib/render-helpers-navigate';
import { useImageForChainId } from './useImageForChainId';

const buildState = (networks: Record<string, unknown>, enabled: boolean) => ({
  metamask: {
    remoteFeatureFlags: { configRegistryApiEnabled: enabled },
    configs: { networks },
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
    expect(renderHook(CHAIN_IDS.MAINNET, buildState({}, false))).toBe(
      './images/eth_logo.svg',
    );
  });

  it('prefers registry image URLs by hex or CAIP key and falls back for unlisted chains', () => {
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
    expect(renderHook(CHAIN_IDS.MAINNET, state)).toBe('./images/eth_logo.svg');
  });
});
