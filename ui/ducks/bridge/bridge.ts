import { createSlice } from '@reduxjs/toolkit';

import { Hex } from '@metamask/utils';
import { swapsSlice } from '../swaps/swaps';
import {
  AssetWithDisplayData,
  ERC20Asset,
  NativeAsset,
} from '../../components/multichain/asset-picker-amount/asset-picker-modal/types';

export type BridgeState = {
  toChainId: Hex | null;
  fromToken: AssetWithDisplayData<ERC20Asset | NativeAsset> | null;
  toToken: AssetWithDisplayData<ERC20Asset | NativeAsset> | null;
  fromTokenInputValue: string | null;
};

const initialState: BridgeState = {
  toChainId: null,
  fromToken: null,
  toToken: null,
  fromTokenInputValue: null,
};

const bridgeSlice = createSlice({
  name: 'bridge',
  initialState: { ...initialState },
  reducers: {
    ...swapsSlice.reducer,
    setToChainId: (state, action) => {
      state.toChainId = action.payload;
      state.toToken = null;
    },
    setFromToken: (state, action) => {
      state.fromToken = action.payload;
      state.fromTokenInputValue = null;
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
  },
});

export { bridgeSlice };
export default bridgeSlice.reducer;
