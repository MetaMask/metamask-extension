import { renderHook, act } from '@testing-library/react-hooks';
import { useSelector } from 'react-redux';
import type { CaipAssetType, CaipChainId } from '@metamask/utils';
import {
  getAvailableBatchSellReceiveAssetsForNetwork,
  getAvailableBatchSellSwapAssetsForNetwork,
} from '../../../../../ducks/batch-sell/selectors';
import type { BatchSellAsset } from '../../../../../ducks/batch-sell/types';
import { useBatchSellQuotesConfig } from './useBatchSellQuotesConfig';

// Overridden per test via mockLocationState
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let mockLocationState: any = null;

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: () => ({ state: mockLocationState }),
}));

jest.mock('react-redux', () => ({
  ...jest.requireActual('react-redux'),
  useSelector: jest.fn(),
}));

jest.mock('../../../../../ducks/batch-sell/selectors', () => ({
  getAvailableBatchSellReceiveAssetsForNetwork: jest.fn(),
  getAvailableBatchSellSwapAssetsForNetwork: jest.fn(),
}));

const mockUseSelector = jest.mocked(useSelector);
const mockGetReceivedAssets = jest.mocked(
  getAvailableBatchSellReceiveAssetsForNetwork,
);
const mockGetSwapAssets = jest.mocked(
  getAvailableBatchSellSwapAssetsForNetwork,
);

const ETH_CHAIN_ID = 'eip155:1' as CaipChainId;
const ASSET_A_ID = 'eip155:1/erc20:0xaaa' as CaipAssetType;
const ASSET_B_ID = 'eip155:1/erc20:0xbbb' as CaipAssetType;
const ASSET_C_ID = 'eip155:1/erc20:0xccc' as CaipAssetType;
const RECEIVE_ASSET_A_ID = 'eip155:1/erc20:0xusdc' as CaipAssetType;
const RECEIVE_ASSET_B_ID = 'eip155:1/erc20:0xdai' as CaipAssetType;

const makeSwapAsset = (assetId: CaipAssetType): BatchSellAsset =>
  ({
    assetId,
    chainId: ETH_CHAIN_ID,
    symbol: assetId.slice(-3).toUpperCase(),
    name: `Token ${assetId.slice(-3)}`,
    decimals: 18,
    balance: '100',
    iconUrl: '',
  }) as never;

const MOCK_RECEIVED_ASSET_RAW_A = {
  assetId: RECEIVE_ASSET_A_ID,
  chainId: ETH_CHAIN_ID,
  symbol: 'USDC',
  name: 'USD Coin',
  decimals: 6,
  balance: '500',
  iconUrl: 'usdc.png',
  tokenFiatAmount: 500,
  securityData: undefined,
};

const MOCK_RECEIVED_ASSET_RAW_B = {
  assetId: RECEIVE_ASSET_B_ID,
  chainId: ETH_CHAIN_ID,
  symbol: 'DAI',
  name: 'Dai',
  decimals: 18,
  balance: '200',
  iconUrl: 'dai.png',
  tokenFiatAmount: 200,
  securityData: undefined,
};

describe('useBatchSellQuotesConfig', () => {
  beforeEach(() => {
    mockLocationState = {
      selectedNetworkChainId: ETH_CHAIN_ID,
      selectedAssetsId: [ASSET_A_ID, ASSET_B_ID],
    };

    mockGetReceivedAssets.mockReturnValue([
      MOCK_RECEIVED_ASSET_RAW_A,
      MOCK_RECEIVED_ASSET_RAW_B,
    ] as never);
    mockGetSwapAssets.mockReturnValue([
      makeSwapAsset(ASSET_A_ID),
      makeSwapAsset(ASSET_B_ID),
    ] as never);

    mockUseSelector.mockImplementation(
      (selectorFn: (state: unknown) => unknown) => selectorFn({}),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('initial state', () => {
    it('initialises sendAssetsConfig from the available swap assets', () => {
      const { result } = renderHook(() => useBatchSellQuotesConfig());

      expect(Object.keys(result.current.sendAssetsConfig)).toStrictEqual([
        ASSET_A_ID,
        ASSET_B_ID,
      ]);
    });

    it('sets the default sendAmountPercent, slippagePercent and enabled for each asset', () => {
      const { result } = renderHook(() => useBatchSellQuotesConfig());

      expect(
        result.current.sendAssetsConfig[ASSET_A_ID]?.sendAmountPercent,
      ).toBe(100);
      expect(result.current.sendAssetsConfig[ASSET_A_ID]?.slippagePercent).toBe(
        0.5,
      );
      expect(result.current.sendAssetsConfig[ASSET_A_ID]?.enabled).toBe(true);
    });

    it('sets the first received asset as selectedReceiveAsset', () => {
      const { result } = renderHook(() => useBatchSellQuotesConfig());

      expect(result.current.selectedReceiveAsset.id).toBe(RECEIVE_ASSET_A_ID);
      expect(result.current.selectedReceiveAsset.symbol).toBe('USDC');
    });

    it('sets editingSlippageAssetId to null', () => {
      const { result } = renderHook(() => useBatchSellQuotesConfig());

      expect(result.current.editingSlippageAssetId).toBeNull();
    });

    it('maps received assets to the expected shape', () => {
      const { result } = renderHook(() => useBatchSellQuotesConfig());

      expect(result.current.receivedAssets).toStrictEqual([
        {
          id: RECEIVE_ASSET_A_ID,
          symbol: 'USDC',
          fiatBalance: 500,
          image: 'usdc.png',
          securityData: undefined,
        },
        {
          id: RECEIVE_ASSET_B_ID,
          symbol: 'DAI',
          fiatBalance: 200,
          image: 'dai.png',
          securityData: undefined,
        },
      ]);
    });
  });

  describe('hasInitialSelection', () => {
    it('returns true when selectedAssetsId has items and matching assets are available', () => {
      const { result } = renderHook(() => useBatchSellQuotesConfig());

      expect(result.current.hasInitialSelection).toBe(true);
    });

    it('returns false when selectedAssetsId is an empty array', () => {
      mockLocationState = {
        selectedNetworkChainId: ETH_CHAIN_ID,
        selectedAssetsId: [],
      };

      const { result } = renderHook(() => useBatchSellQuotesConfig());

      expect(result.current.hasInitialSelection).toBe(false);
    });

    it('returns false when selectedAssetsId is undefined', () => {
      mockLocationState = { selectedNetworkChainId: ETH_CHAIN_ID };

      const { result } = renderHook(() => useBatchSellQuotesConfig());

      expect(result.current.hasInitialSelection).toBe(false);
    });

    it('returns false when no swap assets are available for the selected IDs', () => {
      mockGetSwapAssets.mockReturnValue([] as never);

      const { result } = renderHook(() => useBatchSellQuotesConfig());

      expect(result.current.hasInitialSelection).toBe(false);
    });
  });

  describe('canDeleteAssets', () => {
    it('returns false when there are 2 or fewer assets', () => {
      const { result } = renderHook(() => useBatchSellQuotesConfig());

      expect(result.current.canDeleteAssets).toBe(false);
    });

    it('returns true when there are more than 2 assets', () => {
      mockLocationState = {
        selectedNetworkChainId: ETH_CHAIN_ID,
        selectedAssetsId: [ASSET_A_ID, ASSET_B_ID, ASSET_C_ID],
      };
      mockGetSwapAssets.mockReturnValue([
        makeSwapAsset(ASSET_A_ID),
        makeSwapAsset(ASSET_B_ID),
        makeSwapAsset(ASSET_C_ID),
      ] as never);

      const { result } = renderHook(() => useBatchSellQuotesConfig());

      expect(result.current.canDeleteAssets).toBe(true);
    });

    it('updates dynamically as assets are deleted', () => {
      mockLocationState = {
        selectedNetworkChainId: ETH_CHAIN_ID,
        selectedAssetsId: [ASSET_A_ID, ASSET_B_ID, ASSET_C_ID],
      };
      mockGetSwapAssets.mockReturnValue([
        makeSwapAsset(ASSET_A_ID),
        makeSwapAsset(ASSET_B_ID),
        makeSwapAsset(ASSET_C_ID),
      ] as never);

      const { result } = renderHook(() => useBatchSellQuotesConfig());

      expect(result.current.canDeleteAssets).toBe(true);

      act(() => {
        result.current.deleteAsset(makeSwapAsset(ASSET_A_ID));
      });

      expect(result.current.canDeleteAssets).toBe(false);
    });
  });

  describe('setSendAmountPercent', () => {
    it('updates sendAmountPercent and enables the asset when percent > 0', () => {
      const { result } = renderHook(() => useBatchSellQuotesConfig());

      act(() => {
        result.current.setSendAmountPercent(makeSwapAsset(ASSET_A_ID), 75);
      });

      expect(
        result.current.sendAssetsConfig[ASSET_A_ID]?.sendAmountPercent,
      ).toBe(75);
      expect(result.current.sendAssetsConfig[ASSET_A_ID]?.enabled).toBe(true);
    });

    it('updates sendAmountPercent and disables the asset when percent is 0', () => {
      const { result } = renderHook(() => useBatchSellQuotesConfig());

      act(() => {
        result.current.setSendAmountPercent(makeSwapAsset(ASSET_A_ID), 0);
      });

      expect(
        result.current.sendAssetsConfig[ASSET_A_ID]?.sendAmountPercent,
      ).toBe(0);
      expect(result.current.sendAssetsConfig[ASSET_A_ID]?.enabled).toBe(false);
    });
  });

  describe('setEnabled', () => {
    it('disables an asset', () => {
      const { result } = renderHook(() => useBatchSellQuotesConfig());

      act(() => {
        result.current.setEnabled(makeSwapAsset(ASSET_A_ID), false);
      });

      expect(result.current.sendAssetsConfig[ASSET_A_ID]?.enabled).toBe(false);
    });

    it('re-enables a previously disabled asset', () => {
      const { result } = renderHook(() => useBatchSellQuotesConfig());

      act(() => {
        result.current.setEnabled(makeSwapAsset(ASSET_A_ID), false);
      });
      act(() => {
        result.current.setEnabled(makeSwapAsset(ASSET_A_ID), true);
      });

      expect(result.current.sendAssetsConfig[ASSET_A_ID]?.enabled).toBe(true);
    });
  });

  describe('setSlippagePercent', () => {
    it('does not change slippage when editingSlippageAssetId is null', () => {
      const { result } = renderHook(() => useBatchSellQuotesConfig());

      const initialSlippage =
        result.current.sendAssetsConfig[ASSET_A_ID]?.slippagePercent;

      act(() => {
        result.current.setSlippagePercent(2);
      });

      expect(result.current.sendAssetsConfig[ASSET_A_ID]?.slippagePercent).toBe(
        initialSlippage,
      );
    });

    it('updates slippage for the editing asset when editingSlippageAssetId is set', () => {
      const { result } = renderHook(() => useBatchSellQuotesConfig());

      act(() => {
        result.current.setEditingSlippageAssetId(ASSET_A_ID);
      });
      act(() => {
        result.current.setSlippagePercent(2);
      });

      expect(result.current.sendAssetsConfig[ASSET_A_ID]?.slippagePercent).toBe(
        2,
      );
    });
  });

  describe('deleteAsset', () => {
    it('removes the asset from sendAssetsConfig', () => {
      mockLocationState = {
        selectedNetworkChainId: ETH_CHAIN_ID,
        selectedAssetsId: [ASSET_A_ID, ASSET_B_ID, ASSET_C_ID],
      };
      mockGetSwapAssets.mockReturnValue([
        makeSwapAsset(ASSET_A_ID),
        makeSwapAsset(ASSET_B_ID),
        makeSwapAsset(ASSET_C_ID),
      ] as never);

      const { result } = renderHook(() => useBatchSellQuotesConfig());

      act(() => {
        result.current.deleteAsset(makeSwapAsset(ASSET_A_ID));
      });

      expect(result.current.sendAssetsConfig[ASSET_A_ID]).toBeUndefined();
      expect(result.current.sendAssetsConfig[ASSET_B_ID]).toBeDefined();
      expect(result.current.sendAssetsConfig[ASSET_C_ID]).toBeDefined();
    });
  });

  describe('setEditingSlippageAssetId', () => {
    it('sets the editingSlippageAssetId', () => {
      const { result } = renderHook(() => useBatchSellQuotesConfig());

      act(() => {
        result.current.setEditingSlippageAssetId(ASSET_A_ID);
      });

      expect(result.current.editingSlippageAssetId).toBe(ASSET_A_ID);
    });

    it('clears the editingSlippageAssetId when null is passed', () => {
      const { result } = renderHook(() => useBatchSellQuotesConfig());

      act(() => {
        result.current.setEditingSlippageAssetId(ASSET_A_ID);
      });
      act(() => {
        result.current.setEditingSlippageAssetId(null);
      });

      expect(result.current.editingSlippageAssetId).toBeNull();
    });
  });

  describe('selectReceivedAsset', () => {
    it('updates selectedReceiveAsset when the asset exists in receivedAssets', () => {
      const { result } = renderHook(() => useBatchSellQuotesConfig());

      expect(result.current.selectedReceiveAsset.id).toBe(RECEIVE_ASSET_A_ID);

      act(() => {
        result.current.selectReceivedAsset(RECEIVE_ASSET_B_ID);
      });

      expect(result.current.selectedReceiveAsset.id).toBe(RECEIVE_ASSET_B_ID);
    });

    it('does not change selectedReceiveAsset when the asset is not found', () => {
      const { result } = renderHook(() => useBatchSellQuotesConfig());

      const initialAsset = result.current.selectedReceiveAsset;

      act(() => {
        result.current.selectReceivedAsset(
          'eip155:1/erc20:0xunknown' as CaipAssetType,
        );
      });

      expect(result.current.selectedReceiveAsset).toBe(initialAsset);
    });
  });

  describe('null location state', () => {
    it('handles null location state gracefully', () => {
      mockLocationState = null;
      mockGetSwapAssets.mockReturnValue([] as never);

      const { result } = renderHook(() => useBatchSellQuotesConfig());

      expect(result.current.hasInitialSelection).toBe(false);
      expect(result.current.sendAssetsConfig).toStrictEqual({});
    });
  });
});
