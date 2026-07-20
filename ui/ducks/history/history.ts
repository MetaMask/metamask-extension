import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { ASSET_ROUTE, DEFAULT_ROUTE } from '../../helpers/constants/routes';
import type { MetaMaskReduxState } from '../../store/store';

type RedirectAfterDefaultPage = {
  path: string;
  shouldRedirect: boolean;
  address?: string;
};

type HistoryState = {
  mostRecentOverviewPage: string;
  redirectAfterDefaultPage: RedirectAfterDefaultPage | null;
};

const initialState: HistoryState = {
  mostRecentOverviewPage: DEFAULT_ROUTE,
  redirectAfterDefaultPage: null,
};

const name = 'history';

const slice = createSlice({
  name,
  initialState,
  reducers: {
    pageChanged: (state, action: PayloadAction<string>) => {
      const path = action.payload;
      if (path === DEFAULT_ROUTE || path.startsWith(ASSET_ROUTE)) {
        state.mostRecentOverviewPage = path;

        if (
          path === DEFAULT_ROUTE &&
          state.redirectAfterDefaultPage?.shouldRedirect
        ) {
          state.redirectAfterDefaultPage.shouldRedirect = false;
        }
      }
    },
    setRedirectAfterDefaultPage: (
      state,
      action: PayloadAction<{ path: string; address?: string }>,
    ) => {
      const { path, address } = action.payload;
      state.redirectAfterDefaultPage = {
        path,
        shouldRedirect: true,
        address,
      };
    },
    clearRedirectAfterDefaultPage: (state) => {
      state.redirectAfterDefaultPage = null;
    },
  },
});

const { actions, reducer } = slice;

export default reducer;

export const getMostRecentOverviewPage = (state: MetaMaskReduxState): string =>
  state[name].mostRecentOverviewPage;

export const getRedirectAfterDefaultPage = (
  state: MetaMaskReduxState,
): HistoryState['redirectAfterDefaultPage'] => state[name].redirectAfterDefaultPage;

export const {
  pageChanged,
  setRedirectAfterDefaultPage,
  clearRedirectAfterDefaultPage,
} = actions;
