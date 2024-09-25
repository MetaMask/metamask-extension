import { createSlice } from '@reduxjs/toolkit';

import { swapsSlice } from '../swaps/swaps';
import { SwapsTokenObject } from '../../../shared/constants/swaps';
import { SwapsEthToken } from '../../selectors';
import { MultichainProviderConfig } from '../../../shared/constants/multichain/networks';

export type BridgeState = {
  toChain: MultichainProviderConfig | null;
  fromToken: SwapsTokenObject | SwapsEthToken | null;
  toToken: SwapsTokenObject | SwapsEthToken | null;
  fromTokenInputValue: string | null;
};

const initialState: BridgeState = {
  toChain: null,
  fromToken: null,
  toToken: null,
  fromTokenInputValue: null,
};

const bridgeSlice = createSlice({
  name: 'bridge',
  initialState: { ...initialState },
  reducers: {
    ...swapsSlice.reducer,
    setToChain: (state, action) => {
      state.toChain = action.payload;
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
  },
});

export { bridgeSlice };
export default bridgeSlice.reducer;
