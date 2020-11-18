import { createSlice } from '@reduxjs/toolkit'

import { ASSET_ROUTE, DEFAULT_ROUTE } from '../../helpers/constants/routes'

// Constants

const initialState = {
  mostRecentOverviewPage: DEFAULT_ROUTE,
}

const name = 'history'

// Slice (reducer plus auto-generated actions and action creators)

const slice = createSlice({
  name,
  initialState,
  reducers: {
    pageChanged: (state, action) => {
      const path = action.payload
      if (path === DEFAULT_ROUTE || path.startsWith(ASSET_ROUTE)) {
        state.mostRecentOverviewPage = path
      }
    },
  },
})

const { actions, reducer } = slice

export default reducer

// Selectors

export const getMostRecentOverviewPage = (state) =>
  state[name].mostRecentOverviewPage

// Actions / action-creators

export const { pageChanged } = actions
