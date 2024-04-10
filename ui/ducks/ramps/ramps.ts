import { createSelector } from 'reselect';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { getCurrentChainId } from '../../selectors';
import RampAPI from '../../hooks/useRamps/rampAPI';
import { hexToDecimal } from '../../../shared/modules/conversion.utils';
import { defaultBuyableChains } from './constants';
import { AggregatorNetwork } from './types';

export const fetchBuyableChains = createAsyncThunk(
  'ramps/fetchBuyableChains',
  async () => {
    return await RampAPI.getNetworks();
  },
);

const rampsSlice = createSlice({
  name: 'ramps',
  initialState: {
    buyableChains: defaultBuyableChains,
  },
  reducers: {
    setBuyableChains: (state, action) => {
      state.buyableChains = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBuyableChains.fulfilled, (state, action) => {
        const networks = action.payload;
        if (networks && networks.length > 0) {
          state.buyableChains = action.payload;
        }
      })
      .addCase(fetchBuyableChains.rejected, (state) => {
        state.buyableChains = defaultBuyableChains;
      });
  },
});

const { actions, reducer } = rampsSlice;

export const getBuyableChains = (state: any) => state.ramps.buyableChains;

export const getIsNativeTokenBuyable = createSelector(
  [getCurrentChainId, getBuyableChains],
  (currentChainId, buyableChains) => {
    return buyableChains.some(
      (network: AggregatorNetwork) =>
        String(network.chainId) === hexToDecimal(currentChainId),
    );
  },
);

export default reducer;
