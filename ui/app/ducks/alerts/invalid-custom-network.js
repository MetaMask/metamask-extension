import { createSlice } from '@reduxjs/toolkit'

import { ALERT_TYPES } from '../../../../app/scripts/controllers/alert'
import { ALERT_STATE } from './enums'

// Constants

const name = ALERT_TYPES.invalidCustomNetwork

const initialState = {
  state: ALERT_STATE.CLOSED,
  networkName: '',
}

// Slice (reducer plus auto-generated actions and action creators)

const slice = createSlice({
  name,
  initialState,
  reducers: {
    openAlert: (state, action) => {
      state.state = ALERT_STATE.OPEN
      state.networkName = action.payload
    },
    dismissAlert: (state) => {
      state.state = ALERT_STATE.CLOSED
      state.networkName = ''
    },
  },
})

const { actions, reducer } = slice

export default reducer

// Selectors

export const getAlertState = (state) => state[name].state

export const getNetworkName = (state) => state[name].networkName

export const alertIsOpen = (state) => state[name].state !== ALERT_STATE.CLOSED

// Actions / action-creators

const { openAlert, dismissAlert } = actions

export { openAlert, dismissAlert }
