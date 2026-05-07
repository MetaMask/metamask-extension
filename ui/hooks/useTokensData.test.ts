import { waitFor, act } from '@testing-library/react';
import { handleFetch } from '@metamask/controller-utils';
import { renderHookWithProvider } from '../../test/lib/render-helpers-navigate';
import { useTokensData, MAX_BATCH_SIZE } from './useTokensData';

jest.mock('@metamask/controller-utils', () => ({
  ...jest.requireActual('@metamask/controller-utils'),
  handleFetch: jest.fn(),
}));

const mockHandleFetch = handleFetch as jest.Mock;

const TOKEN_NAME_MOCK = 'Test Token';
const TOKEN_SYMBOL_MOCK = 'TT';
const TOKEN_ICON_URL_MOCK = 'https://example.com/icon.png';

// Each test gets a unique asset ID to avoid module-level cache pollution.
let assetIdCounter = 0;
const makeAssetId = () => {
  assetIdCounter += 1;
  return `eip155:1/erc20:0x${assetIdCounter.toString().padStart(40, '0')}`;
};

function makeTokenResponse(assetId: string) {
  return [
    {
      assetId,
      name: TOKEN_NAME_MOCK,
      symbol: TOKEN_SYMBOL_MOCK,
      iconUrl: TOKEN_ICON_URL_MOCK,
    },
  ];
}

function renderHook(assetIds: string[]) {
  return renderHookWithProvider(() => useTokensData(assetIds), {});
}

describe('useTokensData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns empty object initially before fetch resolves', () => {
    const assetId = makeAssetId();
    mockHandleFetch.mockResolvedValue(makeTokenResponse(assetId));

    const { result } = renderHook([assetId]);

    expect(result.current).toEqual({});
  });

  it('returns token data after fetch resolves', async () => {
    const assetId = makeAssetId();
    mockHandleFetch.mockResolvedValue(makeTokenResponse(assetId));

    const { result } = renderHook([assetId]);

    await waitFor(() => {
      expect(result.current[assetId]?.name).toBe(TOKEN_NAME_MOCK);
    });
  });

  it('returns symbol and iconUrl after fetch resolves', async () => {
    const assetId = makeAssetId();
    mockHandleFetch.mockResolvedValue(makeTokenResponse(assetId));

    const { result } = renderHook([assetId]);

    await waitFor(() => {
      expect(result.current[assetId]?.symbol).toBe(TOKEN_SYMBOL_MOCK);
      expect(result.current[assetId]?.iconUrl).toBe(TOKEN_ICON_URL_MOCK);
    });
  });

  it('returns empty object when fetch fails', async () => {
    mockHandleFetch.mockRejectedValue(new Error('Network error'));

    const { result } = renderHook([makeAssetId()]);

    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });

    expect(result.current).toEqual({});
  });

  it('returns empty object when assetIds is empty', () => {
    const { result } = renderHook([]);

    expect(result.current).toEqual({});
    expect(mockHandleFetch).not.toHaveBeenCalled();
  });

  it('calls API with correct URL including assetIds and includeIconUrl', async () => {
    const assetId = makeAssetId();
    mockHandleFetch.mockResolvedValue(makeTokenResponse(assetId));

    renderHook([assetId]);

    await waitFor(() => {
      expect(mockHandleFetch).toHaveBeenCalledTimes(1);
    });

    const calledUrl = mockHandleFetch.mock.calls[0][0] as string;
    expect(calledUrl).toContain('tokens.api.cx.metamask.io/v3/assets');
    expect(calledUrl).toContain(encodeURIComponent(assetId));
    expect(calledUrl).toContain('includeIconUrl=true');
  });

  it('deduplicates concurrent requests for the same asset IDs', async () => {
    const assetId = makeAssetId();
    mockHandleFetch.mockResolvedValue(makeTokenResponse(assetId));

    const { result: r1 } = renderHook([assetId]);
    const { result: r2 } = renderHook([assetId]);
    const { result: r3 } = renderHook([assetId]);

    await waitFor(() => {
      expect(r1.current[assetId]?.name).toBe(TOKEN_NAME_MOCK);
      expect(r2.current[assetId]?.name).toBe(TOKEN_NAME_MOCK);
      expect(r3.current[assetId]?.name).toBe(TOKEN_NAME_MOCK);
    });

    expect(mockHandleFetch).toHaveBeenCalledTimes(1);
  });

  it('returns cached data synchronously on second mount without re-fetching', async () => {
    const assetId = makeAssetId();
    mockHandleFetch.mockResolvedValue(makeTokenResponse(assetId));

    const { result: result1 } = renderHook([assetId]);
    await waitFor(() => {
      expect(result1.current[assetId]?.name).toBe(TOKEN_NAME_MOCK);
    });

    mockHandleFetch.mockClear();
    const { result: result2 } = renderHook([assetId]);

    expect(result2.current[assetId]?.name).toBe(TOKEN_NAME_MOCK);
    await act(async () => {
      await new Promise((r) => setTimeout(r, 50));
    });
    expect(mockHandleFetch).not.toHaveBeenCalled();
  });

  it('looks up token by lowercase key when API returns checksummed assetId', async () => {
    const lowercaseId = makeAssetId(); // already lowercase from makeAssetId
    const checksummedId = lowercaseId.replace(/0x[0-9a-f]+/u, (m) =>
      m.replace(/[a-f]/gu, (c) => c.toUpperCase()),
    );

    // API echoes back the checksummed version of the asset ID
    mockHandleFetch.mockResolvedValue([
      {
        assetId: checksummedId,
        name: TOKEN_NAME_MOCK,
        symbol: TOKEN_SYMBOL_MOCK,
        iconUrl: TOKEN_ICON_URL_MOCK,
      },
    ]);

    // Hook is called with the lowercase ID (as buildAssetId produces)
    const { result } = renderHook([lowercaseId]);

    await waitFor(() => {
      expect(result.current[lowercaseId]?.name).toBe(TOKEN_NAME_MOCK);
    });
  });

  it(`splits requests larger than ${MAX_BATCH_SIZE} into separate batches`, async () => {
    const assetIds = Array.from({ length: MAX_BATCH_SIZE + 1 }, () =>
      makeAssetId(),
    );

    mockHandleFetch.mockImplementation((url: string) => {
      const params = new URL(url).searchParams.get('assetIds') ?? '';
      return Promise.resolve(
        params.split(',').map((id) => ({
          assetId: id,
          name: TOKEN_NAME_MOCK,
          symbol: TOKEN_SYMBOL_MOCK,
          iconUrl: TOKEN_ICON_URL_MOCK,
        })),
      );
    });

    const { result } = renderHook(assetIds);

    await waitFor(() => {
      expect(Object.keys(result.current)).toHaveLength(assetIds.length);
    });

    expect(mockHandleFetch).toHaveBeenCalledTimes(2);

    const firstCallCount = (
      new URL(mockHandleFetch.mock.calls[0][0] as string).searchParams
        .get('assetIds')
        ?.split(',') ?? []
    ).length;
    const secondCallCount = (
      new URL(mockHandleFetch.mock.calls[1][0] as string).searchParams
        .get('assetIds')
        ?.split(',') ?? []
    ).length;

    expect(firstCallCount).toBe(MAX_BATCH_SIZE);
    expect(secondCallCount).toBe(1);
  });
});
