import extend from 'xtend'

// Actions
const OPEN_FROM_DROPDOWN = 'metamask/send/OPEN_FROM_DROPDOWN'
const CLOSE_FROM_DROPDOWN = 'metamask/send/CLOSE_FROM_DROPDOWN'
const OPEN_TO_DROPDOWN = 'metamask/send/OPEN_TO_DROPDOWN'
const CLOSE_TO_DROPDOWN = 'metamask/send/CLOSE_TO_DROPDOWN'

// TODO: determine if this approach to initState is consistent with conventional ducks pattern
const initState = {
  fromDropdownOpen: false,
  toDropdownOpen: false,
  errors: {},
}

// Reducer
export default function reducer ({ send: sendState = initState }, action = {}) {
  switch (action.type) {
    case OPEN_FROM_DROPDOWN:
      return extend(sendState, {
        fromDropdownOpen: true,
      })
    case CLOSE_FROM_DROPDOWN:
      return extend(sendState, {
        fromDropdownOpen: false,
      })
    case OPEN_TO_DROPDOWN:
      return extend(sendState, {
        toDropdownOpen: true,
      })
    case CLOSE_TO_DROPDOWN:
      return extend(sendState, {
        toDropdownOpen: false,
      })
    default:
      return sendState
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
