import { renderHook } from '@testing-library/react-hooks';
import { useSelector } from 'react-redux';
import { getNativeAssetForChainId } from '@metamask/bridge-controller';
import type { CaipAssetType } from '@metamask/utils';
import type { BatchSellQuotesConfig, BatchSellQuotesResults } from '../types';
import { useBatchSellAggregateValidation } from './useBatchSellAggregateValidation';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn(),
}));

jest.mock('@metamask/bridge-controller', () => ({
  getNativeAssetForChainId: jest.fn(),
}));

jest.mock('../../../../../ducks/batch-sell/selectors', () => ({
  getNativeAssetForChain: jest.fn(),
}));

const mockUseSelector = jest.mocked(useSelector);
const mockGetNativeAssetForChainId = jest.mocked(getNativeAssetForChainId);

const ETH_CHAIN_ID = 'eip155:1';
const ETH_NATIVE_ASSET_ID = 'eip155:1/slip44:60' as CaipAssetType;
const TOKEN_ASSET_ID = 'eip155:1/erc20:0xabc' as CaipAssetType;

const MOCK_NATIVE_ASSET = {
  assetId: ETH_NATIVE_ASSET_ID,
  chainId: ETH_CHAIN_ID,
  symbol: 'ETH',
  name: 'Ether',
  decimals: 18,
  balance: '10',
};

const MOCK_NATIVE_ASSET_INFO = {
  assetId: ETH_NATIVE_ASSET_ID,
  symbol: 'ETH',
  name: 'Ether',
  decimals: 18,
};

function makeTokenSendAssetsConfig(): BatchSellQuotesConfig['sendAssetsConfig'] {
  return {
    [TOKEN_ASSET_ID]: {
      asset: {
        assetId: TOKEN_ASSET_ID,
        chainId: ETH_CHAIN_ID,
        symbol: 'TOKEN',
        name: 'Token',
        decimals: 18,
        balance: '100',
      } as never,
      sendAmountPercent: 100,
      slippagePercent: 0.5,
      enabled: true,
    },
  };
}

function makeNativeSendAssetsConfig(
  balance = '10',
  sendAmountPercent = 50,
): BatchSellQuotesConfig['sendAssetsConfig'] {
  return {
    [ETH_NATIVE_ASSET_ID]: {
      asset: {
        assetId: ETH_NATIVE_ASSET_ID,
        chainId: ETH_CHAIN_ID,
        symbol: 'ETH',
        name: 'Ether',
        decimals: 18,
        balance,
      } as never,
      sendAmountPercent,
      slippagePercent: 0.5,
      enabled: true,
    },
  };
}

describe('useBatchSellAggregateValidation', () => {
  beforeEach(() => {
    mockUseSelector.mockReset();
    mockGetNativeAssetForChainId.mockReset();

    mockUseSelector.mockReturnValue(undefined);
    mockGetNativeAssetForChainId.mockReturnValue(
      MOCK_NATIVE_ASSET_INFO as never,
    );
  });

  describe('isNoQuotesAvailable', () => {
    it('returns false when quotes is undefined', () => {
      const { result } = renderHook(() =>
        useBatchSellAggregateValidation({
          sendAssetsConfig: makeTokenSendAssetsConfig(),
          quotes: undefined,
        }),
      );

      expect(result.current.isNoQuotesAvailable).toBe(false);
    });

    it('returns false when quotes is an empty object', () => {
      const { result } = renderHook(() =>
        useBatchSellAggregateValidation({
          sendAssetsConfig: makeTokenSendAssetsConfig(),
          quotes: {},
        }),
      );

      expect(result.current.isNoQuotesAvailable).toBe(false);
    });

    it('returns true when all quotes have hasQuote false', () => {
      const quotes: BatchSellQuotesResults['quotes'] = {
        [TOKEN_ASSET_ID]: {
          asset: makeTokenSendAssetsConfig()[TOKEN_ASSET_ID].asset,
          quote: undefined as never,
          hasQuote: false,
          isLoadingQuote: false,
        },
      };

      const { result } = renderHook(() =>
        useBatchSellAggregateValidation({
          sendAssetsConfig: makeTokenSendAssetsConfig(),
          quotes,
        }),
      );

      expect(result.current.isNoQuotesAvailable).toBe(true);
    });

    it('returns false when at least one quote has hasQuote true', () => {
      const OTHER_ASSET_ID = 'eip155:1/erc20:0xdef' as CaipAssetType;
      const quotes: BatchSellQuotesResults['quotes'] = {
        [TOKEN_ASSET_ID]: {
          asset: makeTokenSendAssetsConfig()[TOKEN_ASSET_ID].asset,
          quote: undefined as never,
          hasQuote: false,
          isLoadingQuote: false,
        },
        [OTHER_ASSET_ID]: {
          asset: { assetId: OTHER_ASSET_ID } as never,
          quote: undefined as never,
          hasQuote: true,
          isLoadingQuote: false,
        },
      };

      const { result } = renderHook(() =>
        useBatchSellAggregateValidation({
          sendAssetsConfig: makeTokenSendAssetsConfig(),
          quotes,
        }),
      );

      expect(result.current.isNoQuotesAvailable).toBe(false);
    });
  });

  describe('isInsufficientGasForFee', () => {
    it('returns false when totalNetworkFee is undefined', () => {
      mockUseSelector.mockReturnValue(MOCK_NATIVE_ASSET);

      const { result } = renderHook(() =>
        useBatchSellAggregateValidation({
          sendAssetsConfig: makeTokenSendAssetsConfig(),
          totalNetworkFee: undefined,
        }),
      );

      expect(result.current.isInsufficientGasForFee).toBe(false);
    });

    it('returns false when nativeAsset is undefined', () => {
      mockUseSelector.mockReturnValue(undefined);

      const { result } = renderHook(() =>
        useBatchSellAggregateValidation({
          sendAssetsConfig: makeTokenSendAssetsConfig(),
          totalNetworkFee: '0.01',
        }),
      );

      expect(result.current.isInsufficientGasForFee).toBe(false);
    });

    it('returns false when feeAssetId is a non-native token', () => {
      mockUseSelector.mockReturnValue(MOCK_NATIVE_ASSET);
      const NON_NATIVE_FEE_ASSET = 'eip155:1/erc20:0xfee' as CaipAssetType;

      const { result } = renderHook(() =>
        useBatchSellAggregateValidation({
          sendAssetsConfig: makeTokenSendAssetsConfig(),
          totalNetworkFee: '100',
          feeAssetId: NON_NATIVE_FEE_ASSET,
        }),
      );

      expect(result.current.isInsufficientGasForFee).toBe(false);
    });

    it('returns false when native balance is sufficient', () => {
      mockUseSelector.mockReturnValue({ ...MOCK_NATIVE_ASSET, balance: '10' });

      const { result } = renderHook(() =>
        useBatchSellAggregateValidation({
          sendAssetsConfig: makeTokenSendAssetsConfig(),
          totalNetworkFee: '0.001',
        }),
      );

      expect(result.current.isInsufficientGasForFee).toBe(false);
    });

    it('returns true when native balance is insufficient', () => {
      mockUseSelector.mockReturnValue({
        ...MOCK_NATIVE_ASSET,
        balance: '0.0001',
      });

      const { result } = renderHook(() =>
        useBatchSellAggregateValidation({
          sendAssetsConfig: makeTokenSendAssetsConfig(),
          totalNetworkFee: '0.01',
        }),
      );

      expect(result.current.isInsufficientGasForFee).toBe(true);
    });

    it('returns true when fee is explicitly the native asset and balance is insufficient', () => {
      mockUseSelector.mockReturnValue({
        ...MOCK_NATIVE_ASSET,
        balance: '0.001',
      });

      const { result } = renderHook(() =>
        useBatchSellAggregateValidation({
          sendAssetsConfig: makeTokenSendAssetsConfig(),
          totalNetworkFee: '0.01',
          feeAssetId: ETH_NATIVE_ASSET_ID,
        }),
      );

      expect(result.current.isInsufficientGasForFee).toBe(true);
    });

    it('handles totalNetworkFee provided as a number', () => {
      mockUseSelector.mockReturnValue({
        ...MOCK_NATIVE_ASSET,
        balance: '0.0001',
      });

      const { result } = renderHook(() =>
        useBatchSellAggregateValidation({
          sendAssetsConfig: makeTokenSendAssetsConfig(),
          totalNetworkFee: 0.01,
        }),
      );

      expect(result.current.isInsufficientGasForFee).toBe(true);
    });

    it('handles missing native asset balance by treating it as zero', () => {
      mockUseSelector.mockReturnValue({ ...MOCK_NATIVE_ASSET, balance: '' });

      const { result } = renderHook(() =>
        useBatchSellAggregateValidation({
          sendAssetsConfig: makeTokenSendAssetsConfig(),
          totalNetworkFee: '0.001',
        }),
      );

      expect(result.current.isInsufficientGasForFee).toBe(true);
    });

    it('subtracts the native send amount before comparing when user is selling native and balance remains sufficient', () => {
      // User has 10 ETH, selling 10% = 1 ETH, remaining 9 ETH, fee is 0.001 ETH → sufficient
      mockUseSelector.mockReturnValue({ ...MOCK_NATIVE_ASSET, balance: '10' });

      const { result } = renderHook(() =>
        useBatchSellAggregateValidation({
          sendAssetsConfig: makeNativeSendAssetsConfig('10', 10),
          totalNetworkFee: '0.001',
        }),
      );

      expect(result.current.isInsufficientGasForFee).toBe(false);
    });

    it('returns true when remaining native balance after sell is insufficient for the fee', () => {
      // User has 0.005 ETH, selling 100% = 0.005 ETH, remaining 0 ETH, fee is 0.001 ETH → insufficient
      mockUseSelector.mockReturnValue({
        ...MOCK_NATIVE_ASSET,
        balance: '0.005',
      });

      const { result } = renderHook(() =>
        useBatchSellAggregateValidation({
          sendAssetsConfig: makeNativeSendAssetsConfig('0.005', 100),
          totalNetworkFee: '0.001',
        }),
      );

      expect(result.current.isInsufficientGasForFee).toBe(true);
    });
  });

  describe('nativeAssetSymbol', () => {
    it('returns the native asset symbol when nativeAsset is defined', () => {
      mockUseSelector.mockReturnValue(MOCK_NATIVE_ASSET);

      const { result } = renderHook(() =>
        useBatchSellAggregateValidation({
          sendAssetsConfig: makeTokenSendAssetsConfig(),
        }),
      );

      expect(result.current.nativeAssetSymbol).toBe('ETH');
    });

    it('returns undefined when nativeAsset is undefined', () => {
      mockUseSelector.mockReturnValue(undefined);

      const { result } = renderHook(() =>
        useBatchSellAggregateValidation({
          sendAssetsConfig: makeTokenSendAssetsConfig(),
        }),
      );

      expect(result.current.nativeAssetSymbol).toBeUndefined();
    });
  });

  describe('empty sendAssetsConfig', () => {
    it('handles an empty sendAssetsConfig gracefully', () => {
      mockUseSelector.mockReturnValue(undefined);

      const { result } = renderHook(() =>
        useBatchSellAggregateValidation({
          sendAssetsConfig: {},
        }),
      );

      expect(result.current.isNoQuotesAvailable).toBe(false);
      expect(result.current.isInsufficientGasForFee).toBe(false);
      expect(result.current.nativeAssetSymbol).toBeUndefined();
    });
  });
});
