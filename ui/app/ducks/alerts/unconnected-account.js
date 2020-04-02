import { createSlice } from '@reduxjs/toolkit'
import { captureException } from '@sentry/browser'

import actionConstants from '../../store/actionConstants'
import { addPermittedAccount } from '../../store/actions'
import { getOriginOfCurrentTab } from '../../selectors/selectors'

// Constants

export const ALERT_STATE = {
  CLOSED: 'CLOSED',
  ERROR: 'ERROR',
  LOADING: 'LOADING',
  OPEN: 'OPEN',
}

const name = 'unconnectedAccount'

const initialState = {
  state: ALERT_STATE.CLOSED,
  address: null,
}

// Slice (reducer plus auto-generated actions and action creators)

const slice = createSlice({
  name,
  initialState,
  reducers: {
    connectAccountFailed: (state) => {
      state.state = ALERT_STATE.ERROR
    },
    connectAccountRequested: (state) => {
      state.state = ALERT_STATE.LOADING
    },
    connectAccountSucceeded: (state) => {
      state.state = ALERT_STATE.CLOSED
      state.address = null
    },
    dismissAlert: (state) => {
      state.state = ALERT_STATE.CLOSED
      state.address = null
    },
    switchedToUnconnectedAccount: (state, action) => {
      state.state = ALERT_STATE.OPEN
      state.address = action.payload
    },
  },
  extraReducers: {
    [actionConstants.UPDATE_METAMASK_STATE]: (state, action) => {
      // close the alert if the account is switched while it's open
      if (
        state.state === ALERT_STATE.OPEN &&
        state.address !== action.value.selectedAddress
      ) {
        state.state = ALERT_STATE.CLOSED
        state.address = null
      }
    },
  },
})

const { actions, reducer } = slice

export default reducer

// Selectors

export const getAlertState = (state) => state[name].state

export const getAlertAccountAddress = (state) => state[name].address

export const alertIsOpen = (state) => state[name].state !== ALERT_STATE.CLOSED


// Actions / action-creators

export const {
  connectAccountFailed,
  connectAccountRequested,
  connectAccountSucceeded,
  dismissAlert,
  switchedToUnconnectedAccount,
} = actions

export const connectAccount = () => {
  return async (dispatch, getState) => {
    const state = getState()
    const address = getAlertAccountAddress(state)
    const origin = getOriginOfCurrentTab(state)
    try {
      await dispatch(connectAccountRequested())
      await dispatch(addPermittedAccount(origin, address))
      await dispatch(connectAccountSucceeded())
    } catch (error) {
      console.error(error)
      captureException(error)
      await dispatch(connectAccountFailed())
    }
  }
}
