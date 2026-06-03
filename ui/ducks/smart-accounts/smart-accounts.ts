import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { MetaMaskReduxState } from '../../store/store';

// State interface
type SmartAccountsState = {
  // User toggle intents during transactions (address -> chainId -> intent)
  toggleStates: Record<string, Record<string, boolean | null>>;
};

// Initial state
const initialState: SmartAccountsState = {
  toggleStates: {},
};

// Redux slice
const smartAccountsSlice = createSlice({
  name: 'smartAccounts',
  initialState,
  reducers: {
    // Set pending toggle state for a specific address/chainId
    setToggleState: (
      state,
      action: PayloadAction<{
        address: string;
        chainId: string;
        value: boolean | null;
      }>,
    ) => {
      const { address, chainId, value } = action.payload;

      if (!state.toggleStates[address]) {
        state.toggleStates[address] = {};
      }

      if (value === null) {
        delete state.toggleStates[address][chainId];
        // Clean up empty address entries
        if (Object.keys(state.toggleStates[address]).length === 0) {
          delete state.toggleStates[address];
        }
      } else {
        state.toggleStates[address][chainId] = value;
      }
    },
  },
});

// Export actions
export const { setToggleState } = smartAccountsSlice.actions;

// Selectors
export const selectToggleState = (
  state: MetaMaskReduxState,
  address: string,
  chainId: string,
) => {
  return state.smartAccounts.toggleStates[address]?.[chainId] ?? null;
};

// Export reducer
export default smartAccountsSlice.reducer;
