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

      // `redirectAfterDefaultPage` is a one-shot instruction. Stop it once we
      // are back on the default page or have reached the target.
      // Compare pathnames only as the target may carry a query
      // string that gets stripped once the destination prefills from it.
      if (
        state.redirectAfterDefaultPage?.shouldRedirect &&
        (path === DEFAULT_ROUTE ||
          state.redirectAfterDefaultPage.path?.split('?')[0] === path)
      ) {
        state.redirectAfterDefaultPage = null;
      }

      if (path === DEFAULT_ROUTE || path.startsWith(ASSET_ROUTE)) {
        state.mostRecentOverviewPage = path;
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
