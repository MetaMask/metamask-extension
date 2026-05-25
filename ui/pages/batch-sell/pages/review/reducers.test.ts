import { CaipAssetType } from '@metamask/utils';
import { batchSellReviewStateReducer } from './reducers';
import {
  BatchSellReviewState,
  BatchSellReviewStateActionType,
  ReceivedAsset,
} from './types';
import { BatchSellAsset } from '../../../../ducks/batch-sell/types';

const ASSET_ID_A =
  'eip155:1/erc20:0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' as CaipAssetType;
const ASSET_ID_B =
  'eip155:1/erc20:0x6B175474E89094C44Da98b954EedeAC495271d0F' as CaipAssetType;

const buildReceivedAsset = (
  overrides: Partial<ReceivedAsset> = {},
): ReceivedAsset => ({
  id: 'eip155:1/slip44:60' as CaipAssetType,
  symbol: 'ETH',
  ...overrides,
});

const buildState = (
  overrides: Partial<BatchSellReviewState> = {},
): BatchSellReviewState => ({
  sendAssetsConfig: {
    [ASSET_ID_A]: {
      asset: {} as BatchSellAsset,
      sendAmountPercent: 100,
      slippagePercent: 0.5,
      enabled: true,
    },
    [ASSET_ID_B]: {
      asset: {} as BatchSellAsset,
      sendAmountPercent: 50,
      slippagePercent: 1,
      enabled: false,
    },
  },
  selectedReceiveAsset: buildReceivedAsset(),
  editingSlippageAssetId: null,
  ...overrides,
});

describe('batchSellReviewStateReducer', () => {
  describe('SetSendAmountPercent', () => {
    it('updates sendAmountPercent for the specified asset', () => {
      const state = buildState();
      const nextState = batchSellReviewStateReducer(state, {
        type: BatchSellReviewStateActionType.SetSendAmountPercent,
        assetId: ASSET_ID_A,
        percent: 75,
      });

      expect(nextState.sendAssetsConfig[ASSET_ID_A].sendAmountPercent).toBe(75);
    });

    it('does not mutate other asset configs', () => {
      const state = buildState();
      const nextState = batchSellReviewStateReducer(state, {
        type: BatchSellReviewStateActionType.SetSendAmountPercent,
        assetId: ASSET_ID_A,
        percent: 75,
      });

      expect(nextState.sendAssetsConfig[ASSET_ID_B]).toStrictEqual(
        state.sendAssetsConfig[ASSET_ID_B],
      );
    });

    it('preserves the rest of the state', () => {
      const state = buildState();
      const nextState = batchSellReviewStateReducer(state, {
        type: BatchSellReviewStateActionType.SetSendAmountPercent,
        assetId: ASSET_ID_A,
        percent: 75,
      });

      expect(nextState.selectedReceiveAsset).toStrictEqual(
        state.selectedReceiveAsset,
      );
      expect(nextState.editingSlippageAssetId).toBeNull();
    });
  });

  describe('SetEnabled', () => {
    it('enables the specified asset', () => {
      const state = buildState();
      const nextState = batchSellReviewStateReducer(state, {
        type: BatchSellReviewStateActionType.SetEnabled,
        assetId: ASSET_ID_B,
        enabled: true,
      });

      expect(nextState.sendAssetsConfig[ASSET_ID_B].enabled).toBe(true);
    });

    it('disables the specified asset', () => {
      const state = buildState();
      const nextState = batchSellReviewStateReducer(state, {
        type: BatchSellReviewStateActionType.SetEnabled,
        assetId: ASSET_ID_A,
        enabled: false,
      });

      expect(nextState.sendAssetsConfig[ASSET_ID_A].enabled).toBe(false);
    });

    it('does not mutate other asset configs', () => {
      const state = buildState();
      const nextState = batchSellReviewStateReducer(state, {
        type: BatchSellReviewStateActionType.SetEnabled,
        assetId: ASSET_ID_A,
        enabled: false,
      });

      expect(nextState.sendAssetsConfig[ASSET_ID_B]).toStrictEqual(
        state.sendAssetsConfig[ASSET_ID_B],
      );
    });
  });

  describe('SetSlippagePercent', () => {
    it('updates slippagePercent for the specified asset', () => {
      const state = buildState();
      const nextState = batchSellReviewStateReducer(state, {
        type: BatchSellReviewStateActionType.SetSlippagePercent,
        assetId: ASSET_ID_A,
        percent: 2,
      });

      expect(nextState.sendAssetsConfig[ASSET_ID_A].slippagePercent).toBe(2);
    });

    it('clears editingSlippageAssetId after updating slippage', () => {
      const state = buildState({ editingSlippageAssetId: ASSET_ID_A });
      const nextState = batchSellReviewStateReducer(state, {
        type: BatchSellReviewStateActionType.SetSlippagePercent,
        assetId: ASSET_ID_A,
        percent: 2,
      });

      expect(nextState.editingSlippageAssetId).toBeNull();
    });

    it('does not mutate other asset configs', () => {
      const state = buildState();
      const nextState = batchSellReviewStateReducer(state, {
        type: BatchSellReviewStateActionType.SetSlippagePercent,
        assetId: ASSET_ID_A,
        percent: 2,
      });

      expect(nextState.sendAssetsConfig[ASSET_ID_B]).toStrictEqual(
        state.sendAssetsConfig[ASSET_ID_B],
      );
    });
  });

  describe('DeleteAsset', () => {
    it('removes the specified asset from sendAssetsConfig', () => {
      const state = buildState();
      const nextState = batchSellReviewStateReducer(state, {
        type: BatchSellReviewStateActionType.DeleteAsset,
        assetId: ASSET_ID_A,
      });

      expect(nextState.sendAssetsConfig[ASSET_ID_A]).toBeUndefined();
    });

    it('keeps other assets intact after deletion', () => {
      const state = buildState();
      const nextState = batchSellReviewStateReducer(state, {
        type: BatchSellReviewStateActionType.DeleteAsset,
        assetId: ASSET_ID_A,
      });

      expect(nextState.sendAssetsConfig[ASSET_ID_B]).toStrictEqual(
        state.sendAssetsConfig[ASSET_ID_B],
      );
    });

    it('preserves the rest of the state after deletion', () => {
      const state = buildState();
      const nextState = batchSellReviewStateReducer(state, {
        type: BatchSellReviewStateActionType.DeleteAsset,
        assetId: ASSET_ID_A,
      });

      expect(nextState.selectedReceiveAsset).toStrictEqual(
        state.selectedReceiveAsset,
      );
    });
  });

  describe('SetEditingSlippageAsset', () => {
    it('sets editingSlippageAssetId to the given asset ID', () => {
      const state = buildState();
      const nextState = batchSellReviewStateReducer(state, {
        type: BatchSellReviewStateActionType.SetEditingSlippageAsset,
        assetId: ASSET_ID_A,
      });

      expect(nextState.editingSlippageAssetId).toBe(ASSET_ID_A);
    });

    it('clears editingSlippageAssetId when null is passed', () => {
      const state = buildState({ editingSlippageAssetId: ASSET_ID_A });
      const nextState = batchSellReviewStateReducer(state, {
        type: BatchSellReviewStateActionType.SetEditingSlippageAsset,
        assetId: null,
      });

      expect(nextState.editingSlippageAssetId).toBeNull();
    });
  });

  describe('SetSelectedReceiveAsset', () => {
    it('replaces selectedReceiveAsset with the given asset', () => {
      const state = buildState();
      const newReceiveAsset = buildReceivedAsset({ symbol: 'WBTC' });
      const nextState = batchSellReviewStateReducer(state, {
        type: BatchSellReviewStateActionType.SetSelectedReceiveAsset,
        asset: newReceiveAsset,
      });

      expect(nextState.selectedReceiveAsset).toStrictEqual(newReceiveAsset);
    });

    it('does not mutate sendAssetsConfig', () => {
      const state = buildState();
      const nextState = batchSellReviewStateReducer(state, {
        type: BatchSellReviewStateActionType.SetSelectedReceiveAsset,
        asset: buildReceivedAsset({ symbol: 'WBTC' }),
      });

      expect(nextState.sendAssetsConfig).toStrictEqual(state.sendAssetsConfig);
    });
  });

  describe('unknown action', () => {
    it('returns the current state unchanged', () => {
      const state = buildState();
      const nextState = batchSellReviewStateReducer(
        state,
        // @ts-expect-error intentional unknown action type
        { type: 'UNKNOWN_ACTION' },
      );

      expect(nextState).toStrictEqual(state);
    });
  });
});
