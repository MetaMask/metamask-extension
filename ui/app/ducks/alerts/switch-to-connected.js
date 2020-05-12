import { createSlice } from '@reduxjs/toolkit'
import { captureException } from '@sentry/browser'

import { ALERT_TYPES } from '../../../../app/scripts/controllers/alert'
import * as actionConstants from '../../store/actionConstants'
import { setAlertEnabledness, setSelectedAddress } from '../../store/actions'

// Constants

export const ALERT_STATE = {
  CLOSED: 'CLOSED',
  ERROR: 'ERROR',
  LOADING: 'LOADING',
  OPEN: 'OPEN',
}

const name = ALERT_TYPES.switchToConnected

const initialState = {
  state: ALERT_STATE.CLOSED,
}

// Slice (reducer plus auto-generated actions and action creators)

const slice = createSlice({
  name,
  initialState,
  reducers: {
    disableAlertFailed: (state) => {
      state.state = ALERT_STATE.ERROR
    },
    disableAlertRequested: (state) => {
      state.state = ALERT_STATE.LOADING
    },
    disableAlertSucceeded: (state) => {
      state.state = ALERT_STATE.CLOSED
    },
    dismissAlert: (state) => {
      state.state = ALERT_STATE.CLOSED
    },
    switchAccountFailed: (state) => {
      state.state = ALERT_STATE.ERROR
    },
    switchAccountRequested: (state) => {
      state.state = ALERT_STATE.LOADING
    },
    switchAccountSucceeded: (state) => {
      state.state = ALERT_STATE.CLOSED
    },
  },
  extraReducers: {
    [actionConstants.SELECTED_ADDRESS_CHANGED]: (state) => {
      // close the alert if the account is switched while it's open
      if (state.state === ALERT_STATE.OPEN) {
        state.state = ALERT_STATE.CLOSED
      }
    },
  },
})

const { actions, reducer } = slice

export default reducer

// Selectors

export const getAlertState = (state) => state[name].state

export const alertIsOpen = (state) => state[name].state !== ALERT_STATE.CLOSED

// Actions / action-creators

const {
  disableAlertFailed,
  disableAlertRequested,
  disableAlertSucceeded,
  dismissAlert,
  switchAccountFailed,
  switchAccountRequested,
  switchAccountSucceeded,
} = actions

export { dismissAlert }

export const dismissAndDisableAlert = () => {
  return async (dispatch) => {
    try {
      await dispatch(disableAlertRequested())
      await dispatch(setAlertEnabledness(name, false))
      await dispatch(disableAlertSucceeded())
    } catch (error) {
      console.error(error)
      captureException(error)
      await dispatch(disableAlertFailed())
    }
  }
}

export const switchToAccount = (address) => {
  return async (dispatch) => {
    try {
      await dispatch(switchAccountRequested())
      await dispatch(setSelectedAddress(address))
      await dispatch(switchAccountSucceeded())
    } catch (error) {
      console.error(error)
      captureException(error)
      await dispatch(switchAccountFailed())
    }
  }
}
