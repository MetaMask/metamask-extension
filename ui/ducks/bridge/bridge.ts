import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import {
  SortOrder,
  type QuoteResponse,
  RequestStatus,
} from '@metamask/bridge-controller';
import { fetchTxAlerts } from '../../../shared/modules/bridge-utils/security-alerts-api.util';
import { SlippageValue } from '../../pages/bridge/utils/slippage-service';
import { getTokenExchangeRate, toBridgeToken } from './utils';
import type { BridgeState, TokenPayload } from './types';

const initialState: BridgeState = {
  fromToken: null,
  toToken: null,
  fromTokenInputValue: null,
  fromTokenExchangeRate: null,
  fromTokenBalance: null,
  fromNativeBalance: null,
  sortOrder: SortOrder.COST_ASC,
  selectedQuote: null,
  wasTxDeclined: false,
  slippage: SlippageValue.BridgeDefault,
  txAlert: null,
  txAlertStatus: RequestStatus.FETCHED,
};

export const setSrcTokenExchangeRates = createAsyncThunk(
  'bridge/setSrcTokenExchangeRates',
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
    setFromToken: (state, { payload }: { payload: TokenPayload }) => {
      const currentFromToken = state.fromToken;
      const newFromToken = toBridgeToken(payload);
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
    },
    setToToken: (state, { payload }: { payload: TokenPayload }) => {
      state.toToken = payload ? toBridgeToken(payload) : null;
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
    setEVMSrcTokenBalance: (state, action) => {
      if (
        state.fromToken
          ? action.payload.assetId.toLowerCase() ===
            state.fromToken.assetId.toLowerCase()
          : true
      ) {
        state.fromTokenBalance =
          action.payload.balance ?? initialState.fromTokenBalance;
      }
    },
    setEVMSrcNativeBalance: (state, action) => {
      if (
        state.fromToken?.chainId
          ? state.fromToken.chainId === action.payload.chainId
          : true
      ) {
        state.fromNativeBalance =
          action.payload.balance ?? initialState.fromNativeBalance;
      }
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
  },
});

export { bridgeSlice };
export default bridgeSlice.reducer;
