import { defaultBuyableChains } from './constants';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { getCurrentChainId } from '../../selectors';
import { AggregatorNetwork } from './types';
import RampAPI from '../../hooks/useRamps/rampAPI';
import { createSelector } from 'reselect';
import { hexToDecimal } from '../../../shared/modules/conversion.utils';

export const fetchBuyableChains = createAsyncThunk(
  'ramps/fetchBuyableChains',
  async () => {
    console.log('calling the ramps API');
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
      console.log('SETTING THE BUYABLE CHAINS! ', action.payload);
      state.buyableChains = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBuyableChains.fulfilled, (state, action) => {
        state.buyableChains = action.payload;
      })
      .addCase(fetchBuyableChains.rejected, (state, action) => {
        state.buyableChains = defaultBuyableChains;
      });
  },
});

const { actions, reducer } = rampsSlice;

export const getBuyableChains = (state: any) => state.ramps.buyableChains;

export const getIsNativeTokenBuyable = createSelector(
  [getCurrentChainId, getBuyableChains],
  (currentChainId, buyableChains) => {
    console.log('selectotr logic ', { currentChainId, buyableChains });

    return buyableChains.some(
      (network: AggregatorNetwork) =>
        String(network.chainId) === hexToDecimal(currentChainId),
    );
  },
);

export default reducer;
