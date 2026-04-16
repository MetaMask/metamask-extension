import { createSlice } from '@reduxjs/toolkit';

import { ASSET_ROUTE, DEFAULT_ROUTE } from '../../helpers/constants/routes';

// Constants

const initialState = {
  mostRecentOverviewPage: DEFAULT_ROUTE,
  redirectAfterDefaultPage: null, // { path: string, shouldRedirect: boolean, address?: string }
};

const name = 'history';

// Slice (reducer plus auto-generated actions and action creators)

const slice = createSlice({
  name,
  initialState,
  reducers: {
    pageChanged: (state, action) => {
      const path = action.payload;
      if (path === DEFAULT_ROUTE || path.startsWith(ASSET_ROUTE)) {
        state.mostRecentOverviewPage = path;

        // If we're going to the default page and have a redirect pending, clear it
        if (
          path === DEFAULT_ROUTE &&
          state.redirectAfterDefaultPage?.shouldRedirect
        ) {
          state.redirectAfterDefaultPage.shouldRedirect = false;
        }
      }
    },
    setRedirectAfterDefaultPage: (state, action) => {
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

// Selectors

export const getMostRecentOverviewPage = (state) =>
  state[name].mostRecentOverviewPage;

export const getRedirectAfterDefaultPage = (state) =>
  state[name].redirectAfterDefaultPage;

// Actions / action-creators

export const {
  pageChanged,
  setRedirectAfterDefaultPage,
  clearRedirectAfterDefaultPage,
} = actions;
