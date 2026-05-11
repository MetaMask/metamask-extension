import { waitFor } from '@testing-library/react';
import { renderHook, act } from '@testing-library/react-hooks';
import { handleFetch } from '@metamask/controller-utils';
import {
  useTokensData,
  MAX_BATCH_SIZE,
  type TokenAsset,
} from './useTokensData';

jest.mock('@metamask/controller-utils', () => ({
  handleFetch: jest.fn(),
}));

const mockHandleFetch = handleFetch as jest.Mock;

// Each test should use unique addresses so that the module-level token cache
// (which persists for the lifetime of the test suite) never serves a cached
// result unintentionally.  We increment this counter in every helper call that
// creates a fresh address.
let addressCounter = 0;

function uniqueAddress(): string {
  addressCounter += 1;
  return `0x${String(addressCounter).padStart(40, '0')}`;
}

function buildAssetId(address: string, chainId = '1'): string {
  return `eip155:${chainId}/erc20:${address}`;
}

function buildTokenAsset(overrides: Partial<TokenAsset> = {}): TokenAsset {
  return {
    assetId: buildAssetId(uniqueAddress()),
    name: 'Test Token',
    symbol: 'TST',
    iconUrl: 'https://tokens.api/tst.png',
    decimals: 18,
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe('useTokensData', () => {
  describe('when called with an empty asset ID list', () => {
    it('returns an empty map and does not call the API', () => {
      const { result } = renderHook(() => useTokensData([]));

      expect(result.current).toStrictEqual({});
      expect(mockHandleFetch).not.toHaveBeenCalled();
    });
  });

  describe('when the API returns token data', () => {
    it('returns tokens indexed by lower-cased asset ID after fetch resolves', async () => {
      const address = uniqueAddress();
      const assetId = buildAssetId(address);
      const token = buildTokenAsset({ assetId, name: 'Alpha', symbol: 'ALP' });

      mockHandleFetch.mockResolvedValue([token]);

      const { result } = renderHook(() => useTokensData([assetId]));

      await waitFor(() => {
        expect(result.current[assetId]).toBeDefined();
      });

      expect(result.current[assetId]).toStrictEqual(token);
    });

    it('normalises checksummed asset IDs from the API to lowercase keys', async () => {
      const address = uniqueAddress();
      const lowercasedId = buildAssetId(address);
      // Simulate the API returning an EIP-55 checksummed address variant.
      const checksummedId = lowercasedId
        .replace('0x', '0x')
        .toUpperCase()
        .replace('EIP155', 'eip155')
        .replace('ERC20', 'erc20');

      const token = buildTokenAsset({
        assetId: checksummedId,
        name: 'Checksummed',
        symbol: 'CKS',
      });
      mockHandleFetch.mockResolvedValue([token]);

      const { result } = renderHook(() => useTokensData([lowercasedId]));

      await waitFor(() => {
        expect(result.current[lowercasedId]).toBeDefined();
      });

      // The token is stored under the lowercased key; its assetId field keeps
      // the original value returned by the API.
      expect(result.current[lowercasedId]).toStrictEqual(token);
      expect(result.current[checksummedId]).toBeUndefined();
    });

    it('returns multiple tokens when the API resolves them in one batch', async () => {
      const addressA = uniqueAddress();
      const addressB = uniqueAddress();
      const assetIdA = buildAssetId(addressA);
      const assetIdB = buildAssetId(addressB);
      const tokenA = buildTokenAsset({ assetId: assetIdA, symbol: 'AAA' });
      const tokenB = buildTokenAsset({ assetId: assetIdB, symbol: 'BBB' });

      mockHandleFetch.mockResolvedValue([tokenA, tokenB]);

      const { result } = renderHook(() => useTokensData([assetIdA, assetIdB]));

      await waitFor(() => {
        expect(result.current[assetIdA]).toBeDefined();
        expect(result.current[assetIdB]).toBeDefined();
      });

      expect(result.current[assetIdA].symbol).toBe('AAA');
      expect(result.current[assetIdB].symbol).toBe('BBB');
    });
  });

  describe('when the API request fails', () => {
    it('silently ignores the error and returns an empty map', async () => {
      const assetId = buildAssetId(uniqueAddress());
      mockHandleFetch.mockRejectedValue(new Error('Network failure'));

      const { result } = renderHook(() => useTokensData([assetId]));

      // Allow the rejected promise to settle before asserting.
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(result.current).toStrictEqual({});
    });
  });

  describe('request batching', () => {
    it('sends a single request when the number of IDs equals the batch limit', async () => {
      const assetIds = Array.from({ length: MAX_BATCH_SIZE }, () =>
        buildAssetId(uniqueAddress()),
      );

      mockHandleFetch.mockResolvedValue(
        assetIds.map((id) => buildTokenAsset({ assetId: id })),
      );

      const { result } = renderHook(() => useTokensData(assetIds));

      await waitFor(() => {
        expect(result.current[assetIds[0]]).toBeDefined();
      });

      expect(mockHandleFetch).toHaveBeenCalledTimes(1);
    });

    it('splits IDs into two parallel batches when count exceeds the batch limit', async () => {
      const assetIds = Array.from({ length: MAX_BATCH_SIZE + 1 }, () =>
        buildAssetId(uniqueAddress()),
      );

      mockHandleFetch.mockResolvedValue([]);

      renderHook(() => useTokensData(assetIds));

      await waitFor(() => {
        expect(mockHandleFetch).toHaveBeenCalledTimes(2);
      });
    });

    it('encodes asset IDs and includeIconUrl correctly in the query string', async () => {
      const address = uniqueAddress();
      const assetId = buildAssetId(address);
      mockHandleFetch.mockResolvedValue([]);

      renderHook(() => useTokensData([assetId]));

      await waitFor(() => {
        expect(mockHandleFetch).toHaveBeenCalled();
      });

      const calledUrl: string = mockHandleFetch.mock.calls[0][0];
      expect(calledUrl).toContain('assetIds=');
      expect(calledUrl).toContain(encodeURIComponent(assetId));
      expect(calledUrl).toContain('includeIconUrl=true');
    });
  });

  describe('in-flight request deduplication', () => {
    it('issues only one HTTP request when two hook instances request the same batch', async () => {
      const assetId = buildAssetId(uniqueAddress());

      // Keep the fetch unresolved so both hooks are simultaneously in-flight.
      let resolveFetch!: (value: TokenAsset[]) => void;
      const pending = new Promise<TokenAsset[]>((res) => {
        resolveFetch = res;
      });
      mockHandleFetch.mockReturnValue(pending);

      renderHook(() => useTokensData([assetId]));
      renderHook(() => useTokensData([assetId]));

      await act(async () => {
        resolveFetch([buildTokenAsset({ assetId })]);
        await pending;
      });

      expect(mockHandleFetch).toHaveBeenCalledTimes(1);
    });
  });

  describe('cleanup on unmount', () => {
    it('does not update state after the component unmounts', async () => {
      const assetId = buildAssetId(uniqueAddress());

      let resolveFetch!: (value: TokenAsset[]) => void;
      const pending = new Promise<TokenAsset[]>((res) => {
        resolveFetch = res;
      });
      mockHandleFetch.mockReturnValue(pending);

      const { result, unmount } = renderHook(() => useTokensData([assetId]));

      // Unmount before the fetch settles; this sets the `cancelled` flag.
      unmount();

      await act(async () => {
        resolveFetch([buildTokenAsset({ assetId })]);
        await pending;
      });

      // State should remain empty because the cancelled flag prevented the update.
      expect(result.current).toStrictEqual({});
    });
  });

  describe('when asset IDs change', () => {
    it('fetches new tokens when the asset ID list changes', async () => {
      const assetIdA = buildAssetId(uniqueAddress());
      const assetIdB = buildAssetId(uniqueAddress());

      mockHandleFetch.mockResolvedValue([]);

      const { rerender } = renderHook(
        ({ ids }: { ids: string[] }) => useTokensData(ids),
        { initialProps: { ids: [assetIdA] } },
      );

      await waitFor(() => {
        expect(mockHandleFetch).toHaveBeenCalledTimes(1);
      });

      rerender({ ids: [assetIdB] });

      await waitFor(() => {
        expect(mockHandleFetch).toHaveBeenCalledTimes(2);
      });
    });

    it('does not re-fetch when the same asset IDs are passed in a new array reference', async () => {
      const assetId = buildAssetId(uniqueAddress());
      mockHandleFetch.mockResolvedValue([]);

      const { rerender } = renderHook(
        ({ ids }: { ids: string[] }) => useTokensData(ids),
        { initialProps: { ids: [assetId] } },
      );

      await waitFor(() => {
        expect(mockHandleFetch).toHaveBeenCalledTimes(1);
      });

      // Re-render with a new array reference but identical contents.
      // The hook uses a joined string as the effect dependency, so no
      // additional fetch should be triggered.
      rerender({ ids: [assetId] });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      expect(mockHandleFetch).toHaveBeenCalledTimes(1);
    });
  });
});
