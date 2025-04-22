import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { type Hex, type CaipChainId } from '@metamask/utils';
import {
  type BridgeToken,
  ChainId,
  type QuoteMetadata,
  type QuoteResponse,
  SortOrder,
  BRIDGE_DEFAULT_SLIPPAGE,
  formatChainIdToCaip,
  getNativeAssetForChainId,
} from '@metamask/bridge-controller';
import { getTokenExchangeRate } from './utils';

export type BridgeState = {
  toChainId: CaipChainId | null;
  fromToken: BridgeToken | null;
  toToken: BridgeToken | null;
  fromTokenInputValue: string | null;
  fromTokenExchangeRate: number | null; // Exchange rate from selected token to the default currency (can be fiat or crypto)
  toTokenExchangeRate: number | null; // Exchange rate from the selected token to the default currency (can be fiat or crypto)
  toTokenUsdExchangeRate: number | null; // Exchange rate from the selected token to the USD. This is needed for metrics
  sortOrder: SortOrder;
  selectedQuote: (QuoteResponse & QuoteMetadata) | null; // Alternate quote selected by user. When quotes refresh, the best match will be activated.
  wasTxDeclined: boolean; // Whether the user declined the transaction. Relevant for hardware wallets.
  slippage?: number;
};

type ChainIdPayload = { payload: number | Hex | CaipChainId | null };
type TokenPayload = {
  payload: {
    address: string;
    symbol: string;
    image: string;
    decimals: number;
    chainId: number | Hex | ChainId | CaipChainId;
    balance?: string;
    string?: string | undefined;
    tokenFiatAmount?: number | null;
  } | null;
};

const initialState: BridgeState = {
  toChainId: null,
  fromToken: null,
  toToken: null,
  fromTokenInputValue: null,
  fromTokenExchangeRate: null,
  toTokenExchangeRate: null,
  toTokenUsdExchangeRate: null,
  sortOrder: SortOrder.COST_ASC,
  selectedQuote: null,
  wasTxDeclined: false,
  slippage: BRIDGE_DEFAULT_SLIPPAGE,
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

const bridgeSlice = createSlice({
  name: 'bridge',
  initialState: { ...initialState },
  reducers: {
    setToChainId: (state, { payload }: ChainIdPayload) => {
      state.toChainId = payload ? formatChainIdToCaip(payload) : null;
    },
    setFromToken: (state, { payload }: TokenPayload) => {
      if (payload) {
        state.fromToken = {
          ...payload,
          balance: payload.balance ?? '0',
          string: payload.string ?? '0',
          chainId: payload.chainId,
        };
      } else {
        state.fromToken = payload;
      }
    },
    setToToken: (state, { payload }: TokenPayload) => {
      if (payload) {
        state.toToken = {
          ...payload,
          balance: payload.balance ?? '0',
          string: payload.string ?? '0',
          chainId: payload.chainId,
          address:
            payload.address ||
            getNativeAssetForChainId(payload.chainId).address,
        };
      } else {
        state.toToken = payload;
      }
    },
    setFromTokenInputValue: (state, action) => {
      state.fromTokenInputValue = action.payload;
    },
    resetInputFields: () => ({
      ...initialState,
    }),
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
  },
});

export { bridgeSlice };
export default bridgeSlice.reducer;
