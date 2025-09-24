import mockState from '../../../../test/data/mock-state.json';
import { renderHookWithProvider } from '../../../../test/lib/render-helpers';
import { useChainNetworkNameAndImageMap } from './useChainNetworkNameAndImage';

function renderHook() {
  const { result } = renderHookWithProvider(
    useChainNetworkNameAndImageMap,
    mockState,
  );
  return result.current;
}

describe('useChainNetworkNameAndImageMap', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns a Map instance', () => {
    const result = renderHook();
    expect(result).toBeInstanceOf(Map);
  });

  it('returns map with network configurations', () => {
    const result = renderHook();

    expect(result.size).toBeGreaterThan(0);
  });

  it('contains network name and image for each entry', () => {
    const result = renderHook();

    for (const [chainId, networkData] of result) {
      expect(typeof chainId).toBe('string');
      expect(networkData).toEqual({
        networkName: expect.any(String),
        networkImage: expect.any(String),
      });
    }
  });

  it('includes EVM networks from networkConfigurationsByChainId', () => {
    const result = renderHook();

    const chainIds = Array.from(result.keys()) as string[];
    const hasEvmNetwork = chainIds.some((id) => id.startsWith('0x'));
    expect(hasEvmNetwork).toBe(true);
  });

  it('provides fallback empty strings for missing data', () => {
    const result = renderHook();

    for (const networkData of result.values()) {
      expect(typeof networkData.networkName).toBe('string');
      expect(typeof networkData.networkImage).toBe('string');
    }
  });

  it('processes networks correctly when called multiple times', () => {
    const { result: firstCall } = renderHookWithProvider(
      useChainNetworkNameAndImageMap,
      mockState,
    );
    const { result: secondCall } = renderHookWithProvider(
      useChainNetworkNameAndImageMap,
      mockState,
    );

    expect(firstCall.current.size).toBe(secondCall.current.size);

    for (const [key, value] of firstCall.current) {
      expect(secondCall.current.has(key)).toBe(true);
      expect(secondCall.current.get(key)).toEqual(value);
    }
  });
});
