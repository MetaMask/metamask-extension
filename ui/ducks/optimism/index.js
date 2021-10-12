import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { BN } from 'ethereumjs-util';
import {
  OPTIMISM_CHAIN_ID,
  OPTIMISM_TESTNET_CHAIN_ID,
} from '../../../shared/constants/network';
import { getCurrentChainId } from '../../selectors';
import fetchEstimatedL1Fee from './fetchEstimatedL1Fee';

const name = 'optimism';

// Thunks

export const fetchEstimatedOptimismL1Fee = createAsyncThunk(
  'optimism/fetchEstimatedOptimismL1Fee',
  (txMeta) => {
    return fetchEstimatedL1Fee(global.eth, txMeta);
  },
);

// Reducer

const { reducer } = createSlice({
  name,
  initialState: { estimatedL1Fee: new BN('0') },
  extraReducers: (builder) => {
    builder.addCase(fetchEstimatedOptimismL1Fee.fulfilled, (state, action) => {
      state.estimatedL1Fee = action.payload;
    });
  },
});

export { reducer };

// Selectors

const selectors = {
  getEstimatedOptimismL1Fee(state) {
    return state[name].estimatedL1Fee;
  },

  getIsOptimism(state) {
    return selectors.getIsOptimismTestnet(state);
  },

  getIsOptimismMainnet(state) {
    return getCurrentChainId(state) === OPTIMISM_CHAIN_ID;
  },

  getIsOptimismTestnet(state) {
    return getCurrentChainId(state) === OPTIMISM_TESTNET_CHAIN_ID;
  },
};

const {
  getEstimatedOptimismL1Fee,
  getIsOptimism,
  getIsOptimismMainnet,
  getIsOptimismTestnet,
} = selectors;

export {
  getEstimatedOptimismL1Fee,
  getIsOptimism,
  getIsOptimismMainnet,
  getIsOptimismTestnet,
};
