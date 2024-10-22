import { createSlice } from '@reduxjs/toolkit';

import { Hex } from '@metamask/utils';
import { swapsSlice } from '../swaps/swaps';
import { SwapsTokenObject } from '../../../shared/constants/swaps';
import { SwapsEthToken } from '../../selectors';
import { SortOrder } from '../../pages/bridge/types';

export type BridgeState = {
  toChainId: Hex | null;
  fromToken: SwapsTokenObject | SwapsEthToken | null;
  toToken: SwapsTokenObject | SwapsEthToken | null;
  fromTokenInputValue: string | null;
  toTokenExchangeRate: number | null;
  toNativeExchangeRate: number | null;
  sortOrder: SortOrder;
};

const initialState: BridgeState = {
  toChainId: null,
  fromToken: null,
  toToken: null,
  fromTokenInputValue: null,
  toNativeExchangeRate: null,
  toTokenExchangeRate: null,
  sortOrder: SortOrder.ADJUSTED_RETURN_DESC,
};

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
    setToExchangeRates: (state, action) => {
      state.toNativeExchangeRate = action.payload.toNativeExchangeRate;
      state.toTokenExchangeRate = action.payload.toTokenExchangeRate;
    },
    setSortOrder: (state, action) => {
      state.sortOrder = action.payload;
    },
  },
});

export { bridgeSlice };
export default bridgeSlice.reducer;
