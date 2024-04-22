import { createSelector } from 'reselect';
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { getCurrentChainId } from '../../selectors';
import RampAPI from '../../helpers/ramps/rampApi/rampAPI';
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
      if (
        Array.isArray(action.payload) &&
        action.payload.length > 0 &&
        action.payload.every((network) => network?.chainId)
      ) {
        state.buyableChains = action.payload;
      } else {
        state.buyableChains = defaultBuyableChains;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchBuyableChains.fulfilled, (state, action) => {
        const networks = action.payload;
        if (networks && networks.length > 0) {
          state.buyableChains = networks;
        } else {
          state.buyableChains = defaultBuyableChains;
        }
      })
      .addCase(fetchBuyableChains.rejected, (state) => {
        state.buyableChains = defaultBuyableChains;
      });
  },
});

const { reducer } = rampsSlice;

// Can be typed to RootState if/when the interface is defined
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const getBuyableChains = (state: any) =>
  state.ramps?.buyableChains ?? defaultBuyableChains;

export const getIsNativeTokenBuyable = createSelector(
  [getCurrentChainId, getBuyableChains],
  (currentChainId, buyableChains) => {
    try {
      return buyableChains
        .filter(Boolean)
        .some(
          (network: AggregatorNetwork) =>
            String(network.chainId) === hexToDecimal(currentChainId),
        );
    } catch (e) {
      return false;
    }
  },
);

export default reducer;
