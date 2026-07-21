import { act, waitFor } from '@testing-library/react';
import type {
  TokenAsset,
  TokenSecurityFeature,
} from '@metamask/assets-controllers';
import type { CaipAssetType } from '@metamask/utils';
import { renderHookWithProvider } from '../../../test/lib/render-helpers-navigate';
import { createBridgeMockStore } from '../../../test/data/bridge/mock-bridge-store';
import { toBridgeToken } from '../../ducks/bridge/utils';
import { BridgeAssetSecurityDataType } from '../../pages/bridge/utils/tokens';
import { useSelectedTokenSecurityData } from './useSelectedTokenSecurityData';

const mockFetchCachedTokenAssets = jest.fn();

jest.mock('../../pages/bridge/utils/token-security', () => ({
  ...jest.requireActual('../../pages/bridge/utils/token-security'),
  fetchCachedTokenAssets: (...args: unknown[]) =>
    mockFetchCachedTokenAssets(...args),
}));

const SOURCE_ASSET_ID =
  'eip155:1/erc20:0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' as CaipAssetType;
const DESTINATION_ASSET_ID =
  'eip155:1/erc20:0xbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb' as CaipAssetType;
const OTHER_ASSET_ID =
  'eip155:1/erc20:0xcccccccccccccccccccccccccccccccccccccccc' as CaipAssetType;

function createBridgeToken(assetId: CaipAssetType) {
  return toBridgeToken({
    assetId,
    name: 'Token',
    symbol: 'TKN',
    decimals: 18,
  });
}

function createTokenAsset(
  assetId: CaipAssetType,
  resultType?: string,
  features: TokenSecurityFeature[] = [],
): TokenAsset {
  return {
    assetId,
    name: 'Token',
    symbol: 'TKN',
    decimals: 18,
    ...(resultType
      ? {
          securityData: {
            resultType,
            maliciousScore: '0',
            fees: {
              transfer: 0,
              transferFeeMaxAmount: null,
              buy: 0,
              sell: null,
            },
            features,
            financialStats: {
              supply: 0,
              topHolders: [],
              holdersCount: 0,
              tradeVolume24h: null,
              lockedLiquidityPct: null,
              markets: [],
            },
            metadata: {
              externalLinks: {
                homepage: null,
                twitterPage: null,
                telegramChannelId: null,
              },
            },
            created: '',
          },
        }
      : {}),
  };
}

function renderSecurityHook({
  fromToken = createBridgeToken(SOURCE_ASSET_ID),
  toToken = createBridgeToken(DESTINATION_ASSET_ID),
  useExternalServices = true,
} = {}) {
  return renderHookWithProvider(
    () => useSelectedTokenSecurityData(fromToken, toToken),
    createBridgeMockStore({
      metamaskStateOverrides: { useExternalServices },
    }),
  );
}

describe('useSelectedTokenSecurityData', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockFetchCachedTokenAssets.mockResolvedValue([]);
  });

  it('fetches source and destination security data in one request', async () => {
    renderSecurityHook();

    await waitFor(() => {
      expect(mockFetchCachedTokenAssets).toHaveBeenCalledWith([
        SOURCE_ASSET_ID,
        DESTINATION_ASSET_ID,
      ]);
    });
    expect(mockFetchCachedTokenAssets).toHaveBeenCalledTimes(1);
  });

  it('deduplicates identical selected asset IDs', async () => {
    renderSecurityHook({
      toToken: createBridgeToken(SOURCE_ASSET_ID),
    });

    await waitFor(() => {
      expect(mockFetchCachedTokenAssets).toHaveBeenCalledWith([
        SOURCE_ASSET_ID,
      ]);
    });
  });

  it('skips tokens with existing security metadata', async () => {
    const enrichedToken = {
      ...createBridgeToken(SOURCE_ASSET_ID),
      isVerified: false,
    };
    renderSecurityHook({
      fromToken: enrichedToken,
      toToken: createBridgeToken(DESTINATION_ASSET_ID),
    });

    await waitFor(() => {
      expect(mockFetchCachedTokenAssets).toHaveBeenCalledWith([
        DESTINATION_ASSET_ID,
      ]);
    });
  });

  it('matches EVM asset IDs case-insensitively and adapts security data', async () => {
    const feature = {
      featureId: 'verified-list',
      type: BridgeAssetSecurityDataType.VERIFIED,
      description: 'Verified by trusted sources',
    };
    mockFetchCachedTokenAssets.mockResolvedValue([
      createTokenAsset(
        'eip155:1/erc20:0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' as CaipAssetType,
        BridgeAssetSecurityDataType.VERIFIED,
        [feature],
      ),
      createTokenAsset(
        OTHER_ASSET_ID,
        BridgeAssetSecurityDataType.MALICIOUS,
      ),
    ]);

    const { result } = renderSecurityHook();

    await waitFor(() => {
      expect(result.current[SOURCE_ASSET_ID]).toEqual({
        isVerified: true,
        securityData: {
          type: BridgeAssetSecurityDataType.VERIFIED,
          metadata: { features: [feature] },
        },
      });
    });
    expect(result.current[OTHER_ASSET_ID]).toBeUndefined();
  });

  it('ignores stale responses when selected asset IDs change', async () => {
    let resolveFirstRequest: (tokens: TokenAsset[]) => void = () => undefined;
    mockFetchCachedTokenAssets
      .mockReturnValueOnce(
        new Promise<TokenAsset[]>((resolve) => {
          resolveFirstRequest = resolve;
        }),
      )
      .mockResolvedValueOnce([
        createTokenAsset(
          OTHER_ASSET_ID,
          BridgeAssetSecurityDataType.VERIFIED,
        ),
      ]);

    let fromToken = createBridgeToken(SOURCE_ASSET_ID);
    const toToken = {
      ...createBridgeToken(DESTINATION_ASSET_ID),
      isVerified: false,
    };
    const { result, rerender } = renderHookWithProvider(
      () => useSelectedTokenSecurityData(fromToken, toToken),
      createBridgeMockStore({
        metamaskStateOverrides: { useExternalServices: true },
      }),
    );

    await waitFor(() => {
      expect(mockFetchCachedTokenAssets).toHaveBeenCalledTimes(1);
    });
    fromToken = createBridgeToken(OTHER_ASSET_ID);
    rerender();

    await waitFor(() => {
      expect(result.current[OTHER_ASSET_ID]?.isVerified).toBe(true);
    });
    await act(async () => {
      resolveFirstRequest([
        createTokenAsset(
          SOURCE_ASSET_ID,
          BridgeAssetSecurityDataType.VERIFIED,
        ),
      ]);
    });

    expect(result.current[SOURCE_ASSET_ID]).toBeUndefined();
    expect(result.current[OTHER_ASSET_ID]?.isVerified).toBe(true);
  });

  it('does not fetch when external services are disabled', () => {
    const { result } = renderSecurityHook({ useExternalServices: false });

    expect(mockFetchCachedTokenAssets).not.toHaveBeenCalled();
    expect(result.current).toEqual({});
  });

  it.each([
    ['empty responses', () => Promise.resolve([])],
    ['failed responses', () => Promise.reject(new Error('Request failed'))],
  ])('treats %s as unknown security data', async (_description, getResponse) => {
    mockFetchCachedTokenAssets.mockReturnValue(getResponse());

    const { result } = renderSecurityHook();

    await waitFor(() => {
      expect(mockFetchCachedTokenAssets).toHaveBeenCalledTimes(1);
      expect(result.current).toEqual({});
    });
  });
});
