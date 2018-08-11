import extend from 'xtend'

// Actions
const OPEN_FROM_DROPDOWN = 'metamask/send/OPEN_FROM_DROPDOWN'
const CLOSE_FROM_DROPDOWN = 'metamask/send/CLOSE_FROM_DROPDOWN'
const OPEN_TO_DROPDOWN = 'metamask/send/OPEN_TO_DROPDOWN'
const CLOSE_TO_DROPDOWN = 'metamask/send/CLOSE_TO_DROPDOWN'
const UPDATE_SEND_ERRORS = 'metamask/send/UPDATE_SEND_ERRORS'
const RESET_SEND_STATE = 'metamask/send/RESET_SEND_STATE'

// TODO: determine if this approach to initState is consistent with conventional ducks pattern
const initState = {
  fromDropdownOpen: false,
  toDropdownOpen: false,
  errors: {},
}

// Reducer
export default function reducer ({ send: sendState = initState }, action = {}) {
  const newState = extend({}, sendState)

  switch (action.type) {
    case OPEN_FROM_DROPDOWN:
      return extend(newState, {
        fromDropdownOpen: true,
      })
    case CLOSE_FROM_DROPDOWN:
      return extend(newState, {
        fromDropdownOpen: false,
      })
    case OPEN_TO_DROPDOWN:
      return extend(newState, {
        toDropdownOpen: true,
      })
    case CLOSE_TO_DROPDOWN:
      return extend(newState, {
        toDropdownOpen: false,
      })
    case UPDATE_SEND_ERRORS:
      return extend(newState, {
        errors: {
          ...newState.errors,
          ...action.value,
        },
      })
    case RESET_SEND_STATE:
      return extend({}, initState)
    default:
      return newState
  }
}

// Action Creators
export function openFromDropdown () {
  return { type: OPEN_FROM_DROPDOWN }
}

export function closeFromDropdown () {
  return { type: CLOSE_FROM_DROPDOWN }
}

export function openToDropdown () {
  return { type: OPEN_TO_DROPDOWN }
}

export function closeToDropdown () {
  return { type: CLOSE_TO_DROPDOWN }
}

export function updateSendErrors (errorObject) {
  return {
    type: UPDATE_SEND_ERRORS,
    value: errorObject,
  }
}

export function resetSendState () {
  return { type: RESET_SEND_STATE }
}
