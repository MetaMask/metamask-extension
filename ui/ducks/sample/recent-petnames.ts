import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { useSelector, useDispatch } from 'react-redux';
import type { Hex } from '@metamask/utils';
import { createSelector } from 'reselect';
import type { MetaMaskReduxDispatch } from '../../store/store';

// Types

export type RecentPetName = {
  address: Hex;
  name: string;
  chainId: Hex;
};

type RecentPetNamesState = {
  recentPetNames: RecentPetName[];
};

// Initial State
const INITIAL_STATE: RecentPetNamesState = {
  recentPetNames: [],
};

const MAX_RECENT_PET_NAMES = 5; // Or any other reasonable limit

// Slice
const recentPetNamesSlice = createSlice({
  name: 'recentPetNames',
  initialState: INITIAL_STATE,
  reducers: {
    addRecentPetName: (state, action: PayloadAction<RecentPetName>) => {
      // Remove existing entry if it exists to avoid duplicates.
      const existingIndex = state.recentPetNames.findIndex(
        (item) =>
          item.address === action.payload.address &&
          item.chainId === action.payload.chainId,
      );
      if (existingIndex > -1) {
        state.recentPetNames.splice(existingIndex, 1);
      }

      // Add to the beginning of the array
      state.recentPetNames.unshift(action.payload);

      // Trim the array if it exceeds the max length
      if (state.recentPetNames.length > MAX_RECENT_PET_NAMES) {
        state.recentPetNames.pop(); // Remove the last element (oldest)
      }
    },
    clearRecentPetNames: (state) => {
      state.recentPetNames = [];
    },
  },
});

export const { addRecentPetName, clearRecentPetNames } =
  recentPetNamesSlice.actions;

// Selectors
const selectRecentPetNamesState = (state: {
  recentPetNames: RecentPetNamesState;
}) => state.recentPetNames;

export const selectRecentPetNames = createSelector(
  selectRecentPetNamesState,
  (state) => state.recentPetNames,
);

// Hook
export function useRecentPetNames() {
  const dispatch = useDispatch<MetaMaskReduxDispatch>();
  const recentPetNames = useSelector(selectRecentPetNames);

  return {
    recentPetNames,
    addRecentPetName: (petName: RecentPetName) =>
      dispatch(addRecentPetName(petName)),
    clearRecentPetNames: () => dispatch(clearRecentPetNames()),
  };
}

export default recentPetNamesSlice.reducer;
