import { createSlice } from '@reduxjs/toolkit';
import { swapsSlice } from '../swaps/swaps';

// Only states that are not in swaps slice
type BridgeState = {
  toChain: string | null;
};

const initialState: BridgeState = {
  toChain: null,
};

const bridgeSlice = createSlice({
  name: 'bridge',
  initialState: { ...initialState },
  reducers: {
    ...swapsSlice.reducer,
    setToChain: (state, action) => {
      state.toChain = action.payload;
    },
  },
});

export { bridgeSlice };
export default bridgeSlice.reducer;
