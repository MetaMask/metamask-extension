import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
  SortOrder,
  calcLatestSrcBalance,
  isNonEvmChainId,
  formatChainIdToHex,
  type QuoteResponseV1,
  isNativeAddress,
  RequestStatus,
  type QuoteMetadata,
} from '@metamask/bridge-controller';
import { zeroAddress } from 'ethereumjs-util';
import type { CaipAssetType, CaipChainId } from '@metamask/utils';
import { fetchTxAlerts } from '../../../shared/lib/bridge-utils/security-alerts-api.util';
import { trace, TraceName } from '../../../shared/lib/trace';
import { assetIdsMatch, getTokenExchangeRate, toBridgeToken } from './utils';
import type { BridgeState, TokenPayload } from './types';

const clearSlippageState = (state: BridgeState) => {
  state.slippage = undefined;
  state.isSlippageUserOverride = false;
};

const didAssetPairChange = (
  previousFromAssetId: string | undefined,
  previousToAssetId: string | undefined,
  nextFromAssetId: string | undefined,
  nextToAssetId: string | undefined,
) =>
  !assetIdsMatch(previousFromAssetId, nextFromAssetId) ||
  !assetIdsMatch(previousToAssetId, nextToAssetId);

export const initialState: BridgeState = {
  fromToken: null,
  toToken: null,
  fromTokenInputValue: null,
  fromTokenExchangeRate: null,
  fromTokenBalance: null,
  fromNativeBalance: null,
  sortOrder: SortOrder.COST_ASC,
  selectedQuote: null,
  wasTxDeclined: false,
  slippage: undefined,
  isSlippageUserOverride: false,
  txAlert: null,
  txAlertStatus: RequestStatus.FETCHED,
  isSrcAssetPickerOpen: false,
  isDestAssetPickerOpen: false,
};

export const setSrcTokenExchangeRates = createAsyncThunk(
  'bridge/setSrcTokenExchangeRates',
  getTokenExchangeRate,
);

export const setTxAlerts = createAsyncThunk(
  'bridge/setTxAlerts',
  fetchTxAlerts,
);

const getBalanceAmount = async ({
  selectedAddress,
  tokenAddress,
  chainId,
}: {
  selectedAddress?: string;
  tokenAddress: string;
  chainId: CaipChainId;
}) => {
  if (isNonEvmChainId(chainId) || !selectedAddress) {
    return null;
  }
  const isNative = isNativeAddress(tokenAddress);

  return await trace(
    {
      name: TraceName.BridgeBalancesUpdated,
      data: {
        srcChainId: chainId,
        isNative,
      },
      startTime: Date.now(),
    },
    async () =>
      (
        await calcLatestSrcBalance(
          global.ethereumProvider,
          selectedAddress,
          isNative ? zeroAddress() : tokenAddress,
          formatChainIdToHex(chainId),
        )
      )?.toString(),
  );
};

export const setEVMSrcNativeBalance = createAsyncThunk(
  'bridge/setEVMSrcNativeBalance',
  async ({
    selectedAddress,
    chainId,
  }: Omit<Parameters<typeof getBalanceAmount>[0], 'tokenAddress'>) =>
    await getBalanceAmount({
      selectedAddress,
      tokenAddress: zeroAddress(),
      chainId,
    }),
);

export const setEVMSrcTokenBalance = createAsyncThunk(
  'bridge/setEVMSrcTokenBalance',
  async (
    token: Parameters<typeof getBalanceAmount>[0] & { assetId: CaipAssetType },
  ) => await getBalanceAmount(token),
);

const bridgeSlice = createSlice({
  name: 'bridge',
  initialState: { ...initialState },
  reducers: {
    setFromToken: (state, { payload }: { payload: TokenPayload }) => {
      const previousFromAssetId = state.fromToken?.assetId;
      const previousToAssetId = state.toToken?.assetId;
      const currentFromToken = state.fromToken;
      const newFromToken = toBridgeToken(payload);
      state.isSrcAssetPickerOpen = false;
      // Set toToken to previous fromToken if new fromToken is the same as the current toToken
      if (
        state.toToken?.assetId &&
        newFromToken?.assetId &&
        newFromToken.assetId.toLowerCase() ===
          state.toToken.assetId.toLowerCase()
      ) {
        state.toToken = currentFromToken;
      }
      state.fromToken = newFromToken;
      state.fromTokenBalance = initialState.fromTokenBalance;
      state.fromTokenExchangeRate = initialState.fromTokenExchangeRate;
      state.fromNativeBalance = initialState.fromNativeBalance;
      state.fromTokenInputValue = initialState.fromTokenInputValue;
      state.txAlertStatus = initialState.txAlertStatus;
      state.txAlert = initialState.txAlert;
      if (
        didAssetPairChange(
          previousFromAssetId,
          previousToAssetId,
          state.fromToken?.assetId,
          state.toToken?.assetId,
        )
      ) {
        clearSlippageState(state);
      }
    },
    setToToken: (state, { payload }: { payload: TokenPayload }) => {
      const previousFromAssetId = state.fromToken?.assetId;
      const previousToAssetId = state.toToken?.assetId;
      state.toToken = payload ? toBridgeToken(payload) : null;
      state.isDestAssetPickerOpen = false;
      if (
        didAssetPairChange(
          previousFromAssetId,
          previousToAssetId,
          state.fromToken?.assetId,
          state.toToken?.assetId,
        )
      ) {
        clearSlippageState(state);
      }
    },
    setFromTokenInputValue: (
      state,
      { payload }: { payload: string | null },
    ) => {
      state.fromTokenInputValue = payload;
    },
    resetInputFields: (state: BridgeState) => {
      state.fromToken = initialState.fromToken;
      state.toToken = initialState.toToken;
      state.fromTokenInputValue = initialState.fromTokenInputValue;
      state.fromTokenExchangeRate = initialState.fromTokenExchangeRate;
      state.fromTokenBalance = initialState.fromTokenBalance;
      state.fromNativeBalance = initialState.fromNativeBalance;
      state.sortOrder = initialState.sortOrder;
      state.selectedQuote = initialState.selectedQuote;
      state.wasTxDeclined = initialState.wasTxDeclined;
      state.slippage = initialState.slippage;
      state.isSlippageUserOverride = initialState.isSlippageUserOverride;
      state.txAlert = initialState.txAlert;
      state.txAlertStatus = initialState.txAlertStatus;
      state.isSrcAssetPickerOpen = initialState.isSrcAssetPickerOpen;
      state.isDestAssetPickerOpen = initialState.isDestAssetPickerOpen;
    },
    rehydrateBridgeStore: (
      state,
      { payload: { bridgeState: maybeBridgeState } },
    ) => {
      const bridgeState = maybeBridgeState ?? (initialState as BridgeState);
      state.fromToken = bridgeState.fromToken;
      state.toToken = bridgeState.toToken;
      state.fromTokenInputValue = bridgeState.fromTokenInputValue;
      state.fromTokenExchangeRate = bridgeState.fromTokenExchangeRate;
      state.fromTokenBalance = bridgeState.fromTokenBalance;
      state.fromNativeBalance = bridgeState.fromNativeBalance;
      state.sortOrder = bridgeState.sortOrder;
      state.selectedQuote = bridgeState.selectedQuote;
      state.wasTxDeclined = bridgeState.wasTxDeclined;
      state.slippage = bridgeState.slippage;
      state.isSlippageUserOverride =
        bridgeState.isSlippageUserOverride ?? false;
      state.txAlert = bridgeState.txAlert;
      state.txAlertStatus = bridgeState.txAlertStatus;
      state.isSrcAssetPickerOpen = bridgeState.isSrcAssetPickerOpen;
      state.isDestAssetPickerOpen = bridgeState.isDestAssetPickerOpen;
    },
    restoreQuoteRequestFromState: (
      state,
      {
        payload: { sentAmount, quote },
      }: { payload: QuoteResponseV1 & QuoteMetadata },
    ) => {
      const pairChanged = didAssetPairChange(
        state.fromToken?.assetId,
        state.toToken?.assetId,
        quote.srcAsset.assetId,
        quote.destAsset.assetId,
      );

      state.fromToken = toBridgeToken(quote.srcAsset);
      state.toToken = toBridgeToken(quote.destAsset);
      state.fromTokenInputValue = sentAmount?.amount ?? null;
      if (pairChanged || !state.isSlippageUserOverride) {
        clearSlippageState(state);
        state.slippage = quote.slippage ?? undefined;
      }
    },
    setSortOrder: (state, action) => {
      state.sortOrder = action.payload;
    },
    setSelectedQuote: (state, action) => {
      state.selectedQuote = action.payload;
    },
    setWasTxDeclined: (state, action) => {
      state.wasTxDeclined = action.payload;
    },
    setSlippage: (state, action) => {
      state.slippage = action.payload;
    },
    setSlippageUserOverride: (
      state,
      { payload }: { payload: number | undefined },
    ) => {
      state.slippage = payload;
      state.isSlippageUserOverride = true;
    },
    setIsSrcAssetPickerOpen: (state, action) => {
      state.isSrcAssetPickerOpen = action.payload;
    },
    setIsDestAssetPickerOpen: (state, action) => {
      state.isDestAssetPickerOpen = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder.addCase(setSrcTokenExchangeRates.pending, (state) => {
      state.fromTokenExchangeRate = null;
    });
    builder.addCase(setSrcTokenExchangeRates.fulfilled, (state, action) => {
      state.fromTokenExchangeRate = action.payload ?? null;
    });
    builder.addCase(setTxAlerts.pending, (state) => {
      // Update status but persist the previous alert
      // The txAlert is only reset the src token changes or if a new response is fetched
      state.txAlertStatus = RequestStatus.LOADING;
    });
    builder.addCase(setTxAlerts.fulfilled, (state, action) => {
      state.txAlert = action.payload;
      state.txAlertStatus = RequestStatus.FETCHED;
    });
    builder.addCase(setTxAlerts.rejected, (state, action) => {
      // Ignore abort errors because they are expected when streaming quotes
      if (action.error.name === 'AbortError') {
        return;
      }
      state.txAlert = initialState.txAlert;
      state.txAlertStatus = RequestStatus.ERROR;
    });
    builder.addCase(setEVMSrcTokenBalance.fulfilled, (state, action) => {
      if (
        state.fromToken
          ? action.meta.arg.assetId.toLowerCase() ===
            state.fromToken.assetId.toLowerCase()
          : true
      ) {
        state.fromTokenBalance =
          action.payload ?? initialState.fromTokenBalance;
      }
    });
    builder.addCase(setEVMSrcTokenBalance.rejected, (state) => {
      state.fromTokenBalance = initialState.fromTokenBalance;
    });
    builder.addCase(setEVMSrcNativeBalance.fulfilled, (state, action) => {
      if (
        state.fromToken?.chainId
          ? state.fromToken.chainId === action.meta.arg.chainId
          : true
      ) {
        state.fromNativeBalance =
          action.payload?.toString() ?? initialState.fromNativeBalance;
      }
    });
    builder.addCase(setEVMSrcNativeBalance.rejected, (state) => {
      state.fromNativeBalance = initialState.fromNativeBalance;
    });
  },
});

export { bridgeSlice };
export default bridgeSlice.reducer;
