import {
  BATCH_SELL_ASSET_IDS,
  buildReceivedAsset,
  buildSendAssetConfigEntry,
} from '../../../../../test/data/batch-sell';
import { batchSellReviewStateReducer } from './reducers';
import { BatchSellReviewState, BatchSellReviewStateActionType } from './types';

const ASSET_ID_A = BATCH_SELL_ASSET_IDS.USDC;
const ASSET_ID_B = BATCH_SELL_ASSET_IDS.DAI;

const buildState = (
  overrides: Partial<BatchSellReviewState> = {},
): BatchSellReviewState => ({
  sendAssetsConfig: {
    [ASSET_ID_A]: buildSendAssetConfigEntry(true, {
      sendAmountPercent: 100,
      slippagePercent: 0.5,
    }),
    [ASSET_ID_B]: buildSendAssetConfigEntry(false, {
      sendAmountPercent: 50,
      slippagePercent: 1,
    }),
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
