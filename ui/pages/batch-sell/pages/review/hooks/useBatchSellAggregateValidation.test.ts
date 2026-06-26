import { renderHook } from '@testing-library/react-hooks';
import { useSelector } from 'react-redux';
import type { CaipAssetType } from '@metamask/utils';
import type { BatchSellQuotesConfig, BatchSellQuotesResults } from '../types';
import {
  BATCH_SELL_ASSET_IDS,
  BATCH_SELL_CHAIN_ID,
} from '../../../../../../test/data/batch-sell';
import { useBatchSellAggregateValidation } from './useBatchSellAggregateValidation';

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn(),
}));

jest.mock('../../../../../ducks/batch-sell/selectors', () => ({
  getNativeAssetForChain: jest.fn(),
}));

const mockUseSelector = jest.mocked(useSelector);

const ETH_CHAIN_ID = BATCH_SELL_CHAIN_ID;
const ETH_NATIVE_ASSET_ID = BATCH_SELL_ASSET_IDS.ETH_NATIVE;
const TOKEN_ASSET_ID = 'eip155:1/erc20:0xabc' as CaipAssetType;

const MOCK_NATIVE_ASSET = {
  assetId: ETH_NATIVE_ASSET_ID,
  chainId: ETH_CHAIN_ID,
  symbol: 'ETH',
  name: 'Ether',
  decimals: 18,
  balance: '10',
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

describe('useBatchSellAggregateValidation', () => {
  beforeEach(() => {
    mockUseSelector.mockReset();
    mockUseSelector.mockReturnValue(undefined);
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
      expect(result.current.nativeAssetSymbol).toBeUndefined();
    });
  });
});
