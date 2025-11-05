import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
  SortOrder,
  formatChainIdToCaip,
  getNativeAssetForChainId,
  type QuoteResponse,
  isBitcoinChainId,
} from '@metamask/bridge-controller';
import { fetchTxAlerts } from '../../../shared/modules/bridge-utils/security-alerts-api.util';
import { SlippageValue } from '../../pages/bridge/utils/slippage-service';
import { getTokenExchangeRate, toBridgeToken } from './utils';
import type { BridgeState, ChainIdPayload, TokenPayload } from './types';

const initialState: BridgeState = {
  fromChainId: null,
  toChainId: null,
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
    setFromChainId: (state, { payload }: ChainIdPayload) => {
      state.fromChainId = payload ? formatChainIdToCaip(payload) : null;
      state.fromToken = null;
    },
    setToChainId: (state, { payload }: ChainIdPayload) => {
      state.toChainId = payload ? formatChainIdToCaip(payload) : null;
      state.toToken = null;
    },
    setFromToken: (state, { payload }: TokenPayload) => {
      state.fromToken = payload ? toBridgeToken(payload) : null;
      state.fromTokenBalance = null;
      // Unset toToken if it's the same as the fromToken
      if (
        state.fromToken?.assetId &&
        state.toToken?.assetId &&
        // TODO: determine if this is necessary.
        state.fromToken.assetId?.toLowerCase() ===
          state.toToken.assetId?.toLowerCase()
      ) {
        state.toToken = null;
      }
      // if new fromToken is BTC, and toToken is BTC, unset toChain and toToken
      if (
        state.fromToken?.chainId &&
        isBitcoinChainId(state.fromToken.chainId) &&
        state.toChainId &&
        isBitcoinChainId(state.toChainId)
      ) {
        state.toChainId = null;
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
      // Update toChainId if it's different from the toToken chainId
      if (
        toToken?.chainId &&
        (state.toChainId
          ? formatChainIdToCaip(toToken.chainId) !==
            formatChainIdToCaip(state.toChainId)
          : true)
      ) {
        state.toChainId = formatChainIdToCaip(toToken.chainId);
      }
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
      state.toChainId = formatChainIdToCaip(quote.destChainId);
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
    setEVMSrcTokenBalance: (state, action) => {
      if (
        !state.fromToken ||
        action.payload.assetId === state.fromToken.assetId
      ) {
        state.fromTokenBalance = action.payload.balance ?? null;
      }
    },
    setEVMSrcNativeBalance: (state, action) => {
      state.fromNativeBalance = action.payload.balance ?? null;
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
