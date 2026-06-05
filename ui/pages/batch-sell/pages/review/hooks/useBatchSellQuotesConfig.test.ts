import { renderHook, act } from '@testing-library/react-hooks';
import { useSelector } from 'react-redux';
import type { CaipAssetType, CaipChainId } from '@metamask/utils';
import {
  getAvailableBatchSellReceiveAssetsForNetwork,
  getAvailableBatchSellSwapAssetsForNetwork,
} from '../../../../../ducks/batch-sell/selectors';
import {
  buildBatchSellAsset,
  BATCH_SELL_CHAIN_ID,
  mockUseSelectorPassthrough,
} from '../../../../../../test/data/batch-sell';
import { useBatchSellQuotesConfig } from './useBatchSellQuotesConfig';

let mockSelectionState = {
  selectedNetworkChainId: null as string | null,
  selectedAssetsId: [] as string[],
  assetsOrderByBalance: 'desc' as 'asc' | 'desc',
  setSelectedNetworkChainId: jest.fn(),
  setSelectedAssetsId: jest.fn(),
  setAssetsOrderByBalance: jest.fn(),
};

jest.mock('../../../providers/batch-sell-selection-provider', () => ({
  useBatchSellSelection: () => mockSelectionState,
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

const ETH_CHAIN_ID = BATCH_SELL_CHAIN_ID as unknown as CaipChainId;
const ASSET_A_ID = 'eip155:1/erc20:0xaaa' as CaipAssetType;
const ASSET_B_ID = 'eip155:1/erc20:0xbbb' as CaipAssetType;
const ASSET_C_ID = 'eip155:1/erc20:0xccc' as CaipAssetType;
const RECEIVE_ASSET_A_ID = 'eip155:1/erc20:0xusdc' as CaipAssetType;
const RECEIVE_ASSET_B_ID = 'eip155:1/erc20:0xdai' as CaipAssetType;

const makeSwapAsset = (assetId: CaipAssetType) =>
  buildBatchSellAsset({
    assetId,
    chainId: ETH_CHAIN_ID,
    symbol: assetId.slice(-3).toUpperCase(),
    name: `Token ${assetId.slice(-3)}`,
  });

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
    mockSelectionState = {
      selectedNetworkChainId: ETH_CHAIN_ID,
      selectedAssetsId: [ASSET_A_ID, ASSET_B_ID],
      assetsOrderByBalance: 'desc',
      setSelectedNetworkChainId: jest.fn(),
      setSelectedAssetsId: jest.fn(),
      setAssetsOrderByBalance: jest.fn(),
    };

    mockGetReceivedAssets.mockReturnValue([
      MOCK_RECEIVED_ASSET_RAW_A,
      MOCK_RECEIVED_ASSET_RAW_B,
    ] as never);
    mockGetSwapAssets.mockReturnValue([
      makeSwapAsset(ASSET_A_ID),
      makeSwapAsset(ASSET_B_ID),
    ] as never);

    mockUseSelectorPassthrough(mockUseSelector);
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

      expect(result.current.selectedReceiveAsset.assetId).toBe(
        RECEIVE_ASSET_A_ID,
      );
      expect(result.current.selectedReceiveAsset.symbol).toBe('USDC');
    });

    it('sets editingSlippageAssetId to null', () => {
      const { result } = renderHook(() => useBatchSellQuotesConfig());

      expect(result.current.editingSlippageAssetId).toBeNull();
    });

    it('returns received assets from the selector', () => {
      const { result } = renderHook(() => useBatchSellQuotesConfig());

      expect(result.current.receivedAssets).toStrictEqual([
        MOCK_RECEIVED_ASSET_RAW_A,
        MOCK_RECEIVED_ASSET_RAW_B,
      ]);
    });
  });

  describe('hasInitialSelection', () => {
    it('returns true when selectedAssetsId has items and matching assets are available', () => {
      const { result } = renderHook(() => useBatchSellQuotesConfig());

      expect(result.current.hasInitialSelection).toBe(true);
    });

    it('returns false when selectedAssetsId is an empty array', () => {
      mockSelectionState = {
        ...mockSelectionState,
        selectedAssetsId: [],
      };

      const { result } = renderHook(() => useBatchSellQuotesConfig());

      expect(result.current.hasInitialSelection).toBe(false);
    });

    it('returns false when selectedAssetsId is undefined', () => {
      mockSelectionState = {
        ...mockSelectionState,
        selectedAssetsId: undefined as never,
      };

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
      mockSelectionState = {
        ...mockSelectionState,
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
      mockSelectionState = {
        ...mockSelectionState,
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
      mockSelectionState = {
        ...mockSelectionState,
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

    it('removes the asset from the selection context so it is not pre-selected on back navigation', () => {
      mockSelectionState = {
        ...mockSelectionState,
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

      // The updater function passed to setSelectedAssetsId should filter out the deleted asset
      const setSelectedAssetsIdMock = mockSelectionState.setSelectedAssetsId;
      expect(setSelectedAssetsIdMock).toHaveBeenCalledTimes(1);
      const updater = (setSelectedAssetsIdMock as jest.Mock).mock.calls[0][0];
      expect(updater([ASSET_A_ID, ASSET_B_ID, ASSET_C_ID])).toStrictEqual([
        ASSET_B_ID,
        ASSET_C_ID,
      ]);
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

      expect(result.current.selectedReceiveAsset.assetId).toBe(
        RECEIVE_ASSET_A_ID,
      );

      act(() => {
        result.current.selectReceivedAsset(RECEIVE_ASSET_B_ID);
      });

      expect(result.current.selectedReceiveAsset.assetId).toBe(
        RECEIVE_ASSET_B_ID,
      );
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

  describe('sendAssetsConfig ordering', () => {
    const ASSET_LOW_ID = 'eip155:1/erc20:0x111' as CaipAssetType;
    const ASSET_HIGH_ID = 'eip155:1/erc20:0x222' as CaipAssetType;

    const makeSortableAsset = (assetId: CaipAssetType, fiatAmount: number) =>
      buildBatchSellAsset({
        assetId,
        chainId: ETH_CHAIN_ID,
        tokenFiatAmount: fiatAmount,
      });

    beforeEach(() => {
      mockSelectionState = {
        ...mockSelectionState,
        selectedAssetsId: [ASSET_LOW_ID, ASSET_HIGH_ID],
      };
      mockGetSwapAssets.mockReturnValue([
        makeSortableAsset(ASSET_LOW_ID, 50),
        makeSortableAsset(ASSET_HIGH_ID, 200),
      ] as never);
    });

    it('orders sendAssetsConfig keys by balance descending when assetsOrderByBalance is desc', () => {
      mockSelectionState = {
        ...mockSelectionState,
        assetsOrderByBalance: 'desc',
      };

      const { result } = renderHook(() => useBatchSellQuotesConfig());

      expect(Object.keys(result.current.sendAssetsConfig)).toStrictEqual([
        ASSET_HIGH_ID,
        ASSET_LOW_ID,
      ]);
    });

    it('orders sendAssetsConfig keys by balance ascending when assetsOrderByBalance is asc', () => {
      mockSelectionState = {
        ...mockSelectionState,
        assetsOrderByBalance: 'asc',
      };

      const { result } = renderHook(() => useBatchSellQuotesConfig());

      expect(Object.keys(result.current.sendAssetsConfig)).toStrictEqual([
        ASSET_LOW_ID,
        ASSET_HIGH_ID,
      ]);
    });
  });

  describe('empty selection context', () => {
    it('handles empty selection gracefully', () => {
      mockSelectionState = {
        selectedNetworkChainId: null,
        selectedAssetsId: [],
        assetsOrderByBalance: 'desc',
        setSelectedNetworkChainId: jest.fn(),
        setSelectedAssetsId: jest.fn(),
        setAssetsOrderByBalance: jest.fn(),
      };
      mockGetSwapAssets.mockReturnValue([] as never);

      const { result } = renderHook(() => useBatchSellQuotesConfig());

      expect(result.current.hasInitialSelection).toBe(false);
      expect(result.current.sendAssetsConfig).toStrictEqual({});
    });
  });
});
