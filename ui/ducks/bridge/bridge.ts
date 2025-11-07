import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
  SortOrder,
  getNativeAssetForChainId,
  type QuoteResponse,
} from '@metamask/bridge-controller';
import type { CaipChainId, type CaipAssetType } from '@metamask/utils';
import { fetchTxAlerts } from '../../../shared/modules/bridge-utils/security-alerts-api.util';
import { SlippageValue } from '../../pages/bridge/utils/slippage-service';
import { getTokenExchangeRate, toBridgeToken } from './utils';
import type { BridgeState, BridgeToken, TokenPayload } from './types';

const initialState: BridgeState = {
  fromToken: null,
  toToken: null,
  fromTokenInputValue: null,
  fromTokenExchangeRate: null,
  toTokenExchangeRate: null,
  toTokenUsdExchangeRate: null,
  fromTokenBalance: null,
  fromNativeBalance: null,
  sortOrder: SortOrder.COST_ASC,
  selectedQuote: null,
  wasTxDeclined: false,
  slippage: SlippageValue.BridgeDefault,
  txAlert: null,
};

export const setSrcTokenExchangeRates = createAsyncThunk(
  'bridge/setSrcTokenExchangeRates',
  getTokenExchangeRate,
);

export const setDestTokenExchangeRates = createAsyncThunk(
  'bridge/setDestTokenExchangeRates',
  getTokenExchangeRate,
);

export const setDestTokenUsdExchangeRates = createAsyncThunk(
  'bridge/setDestTokenUsdExchangeRates',
  getTokenExchangeRate,
);

export const setTxAlerts = createAsyncThunk(
  'bridge/setTxAlerts',
  fetchTxAlerts,
);

const bridgeSlice = createSlice({
  name: 'bridge',
  initialState: { ...initialState },
  reducers: {
    switchTokens: (
      state,
      {
        payload: { fromToken, toToken },
      }: { payload: { fromToken: BridgeToken; toToken: BridgeToken } },
    ) => {
      state.fromToken = toToken;
      state.toToken = fromToken;
      state.fromNativeBalance = null;
      state.fromTokenBalance = null;
    },
    setFromToken: (state, { payload }: TokenPayload) => {
      state.fromToken = payload ? toBridgeToken(payload) : null;
      state.fromTokenBalance = null;
      state.fromNativeBalance = null;
      state.fromTokenBalance = null;
      // Unset toToken if it's the same as the fromToken
      if (
        state.fromToken?.assetId &&
        state.toToken?.assetId &&
        state.fromToken.assetId?.toLowerCase() ===
          state.toToken.assetId?.toLowerCase()
      ) {
        state.toToken = null;
      }
    },
    setToToken: (state, { payload }: TokenPayload) => {
      const toToken = payload ? toBridgeToken(payload) : null;
      state.toToken = toToken
        ? {
            ...toToken,
            address:
              toToken.address ||
              getNativeAssetForChainId(toToken.chainId)?.address,
          }
        : toToken;
    },
    setFromTokenInputValue: (
      state,
      { payload }: { payload: string | null },
    ) => {
      state.fromTokenInputValue = payload;
    },
    resetInputFields: () => ({
      ...initialState,
    }),
    restoreQuoteRequestFromState: (
      state,
      { payload: quote }: { payload: QuoteResponse['quote'] },
    ) => {
      state.fromToken = toBridgeToken(quote.srcAsset);
      state.toToken = toBridgeToken(quote.destAsset);
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
    setEVMSrcTokenBalance: (
      state,
      action: {
        payload: {
          assetId: CaipAssetType;
          balance: BridgeState['fromTokenBalance'];
        };
      },
    ) => {
      const { assetId, balance } = action.payload;
      if (!state.fromToken || assetId === state.fromToken.assetId) {
        state.fromTokenBalance = balance;
      }
    },
    setEVMSrcNativeBalance: (
      state,
      action: {
        payload: {
          chainId: CaipChainId;
          balance: BridgeState['fromNativeBalance'];
        };
      },
    ) => {
      const { chainId, balance } = action.payload;
      if (!state.fromToken || chainId === state.fromToken.chainId) {
        state.fromNativeBalance = balance;
      }
    },
  },
  extraReducers: (builder) => {
    builder.addCase(setDestTokenExchangeRates.pending, (state) => {
      state.toTokenExchangeRate = null;
    });
    builder.addCase(setDestTokenUsdExchangeRates.pending, (state) => {
      state.toTokenUsdExchangeRate = null;
    });
    builder.addCase(setSrcTokenExchangeRates.pending, (state) => {
      state.fromTokenExchangeRate = null;
    });
    builder.addCase(setDestTokenExchangeRates.fulfilled, (state, action) => {
      state.toTokenExchangeRate = action.payload ?? null;
    });
    builder.addCase(setDestTokenUsdExchangeRates.fulfilled, (state, action) => {
      state.toTokenUsdExchangeRate = action.payload ?? null;
    });
    builder.addCase(setSrcTokenExchangeRates.fulfilled, (state, action) => {
      state.fromTokenExchangeRate = action.payload ?? null;
    });
    builder.addCase(setTxAlerts.pending, (state) => {
      state.txAlert = null;
    });
    builder.addCase(setTxAlerts.fulfilled, (state, action) => {
      state.txAlert = action.payload;
    });
    builder.addCase(setTxAlerts.rejected, (state) => {
      state.txAlert = null;
    });
  },
});

export { bridgeSlice };
export default bridgeSlice.reducer;
