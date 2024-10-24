import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { Hex } from '@metamask/utils';
import { getAddress } from 'ethers/lib/utils';
import { zeroAddress } from 'ethereumjs-util';
import { swapsSlice } from '../swaps/swaps';
import { SwapsTokenObject } from '../../../shared/constants/swaps';
import { SwapsEthToken } from '../../selectors';
import { fetchTokenExchangeRates } from '../../helpers/utils/util';
import {
  QuoteMetadata,
  QuoteResponse,
  SortOrder,
} from '../../pages/bridge/types';

export type BridgeState = {
  toChainId: Hex | null;
  fromToken: SwapsTokenObject | SwapsEthToken | null;
  toToken: SwapsTokenObject | SwapsEthToken | null;
  fromTokenInputValue: string | null;
  fromTokenExchangeRate: number | null;
  fromNativeExchangeRate: number | null;
  toTokenExchangeRate: number | null;
  toNativeExchangeRate: number | null;
  sortOrder: SortOrder;
  selectedQuote: (QuoteResponse & QuoteMetadata) | null;
};

const initialState: BridgeState = {
  toChainId: null,
  fromToken: null,
  toToken: null,
  fromTokenInputValue: null,
  fromNativeExchangeRate: null,
  fromTokenExchangeRate: null,
  toNativeExchangeRate: null,
  toTokenExchangeRate: null,
  sortOrder: SortOrder.ADJUSTED_RETURN_DESC,
  selectedQuote: null,
};

export const setSrcTokenExchangeRates = createAsyncThunk(
  'bridge/setSrcTokenExchangeRates',
  async (request: { chainId: Hex; tokenAddress: string; currency: string }) => {
    const { chainId, tokenAddress, currency } = request;
    const exchangeRates = await fetchTokenExchangeRates(
      currency,
      [getAddress(tokenAddress)],
      chainId,
    );
    return {
      fromTokenExchangeRate:
        tokenAddress === zeroAddress()
          ? 1
          : exchangeRates?.[getAddress(tokenAddress)],
      fromNativeExchangeRate: exchangeRates?.[zeroAddress()] ?? 1,
    };
  },
);

export const setDestTokenExchangeRates = createAsyncThunk(
  'bridge/setDestTokenExchangeRates',
  async (request: { chainId: Hex; tokenAddress: string; currency: string }) => {
    const { chainId, tokenAddress, currency } = request;
    const exchangeRates = await fetchTokenExchangeRates(
      currency,
      [getAddress(tokenAddress)],
      chainId,
    );
    return {
      toTokenExchangeRate:
        tokenAddress === zeroAddress()
          ? 1
          : exchangeRates?.[getAddress(tokenAddress)],
      toNativeExchangeRate: exchangeRates?.[zeroAddress()] ?? 1,
    };
  },
);

const bridgeSlice = createSlice({
  name: 'bridge',
  initialState: { ...initialState },
  reducers: {
    ...swapsSlice.reducer,
    setToChainId: (state, action) => {
      state.toChainId = action.payload;
    },
    setFromToken: (state, action) => {
      state.fromToken = action.payload;
    },
    setToToken: (state, action) => {
      state.toToken = action.payload;
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
  },
  extraReducers: (builder) => {
    builder.addCase(setDestTokenExchangeRates.fulfilled, (state, action) => {
      state.toNativeExchangeRate = action.payload.toNativeExchangeRate ?? null;
      state.toTokenExchangeRate = action.payload.toTokenExchangeRate ?? null;
    });
    builder.addCase(setSrcTokenExchangeRates.fulfilled, (state, action) => {
      state.fromNativeExchangeRate =
        action.payload.fromNativeExchangeRate ?? null;
      state.fromTokenExchangeRate =
        action.payload.fromTokenExchangeRate ?? null;
    });
  },
});

export { bridgeSlice };
export default bridgeSlice.reducer;
