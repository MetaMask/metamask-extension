import { createSlice } from '@reduxjs/toolkit'
import { captureException } from '@sentry/browser'

import { DATA_PERSISTENCE_FAILING } from '../../store/actionConstants'
import { ALERT_TYPES } from '../../../../shared/constants/alerts'
import { dismissDataPersistenceFailure } from '../../store/actions'
import { ALERT_STATE } from './enums'

// Constants

const name = ALERT_TYPES.dataPersistenceFailing

const initialState = {
  state: ALERT_STATE.CLOSED,
}

// Slice (reducer plus auto-generated actions and action creators)

const slice = createSlice({
  name,
  initialState,
  reducers: {
    dismissAlertFailed: (state) => {
      state.state = ALERT_STATE.ERROR
    },
    dismissAlertRequested: (state) => {
      state.state = ALERT_STATE.LOADING
    },
    dismissAlertSucceeded: (state) => {
      state.state = ALERT_STATE.CLOSED
    },
  },
  extraReducers: {
    [DATA_PERSISTENCE_FAILING]: (state) => {
      if (state.state === ALERT_STATE.CLOSED) {
        state.state = ALERT_STATE.OPEN
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
  dismissAlertFailed,
  dismissAlertRequested,
  dismissAlertSucceeded,
} = actions

async function dismissAlert() {
  return async (dispatch) => {
    try {
      dispatch(dismissAlertRequested())
      await dismissDataPersistenceFailure()
      dispatch(dismissAlertSucceeded())
    } catch (error) {
      console.error(error)
      captureException(error)
      dispatch(dismissAlertFailed())
    }
  }
}

export { dismissAlert }
