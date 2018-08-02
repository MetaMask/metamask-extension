import extend from 'xtend'

// Actions
const SET_CUSTOM_GAS_PRICE = 'metamask/custom-gas/SET_CUSTOM_GAS_PRICE'
const SET_CUSTOM_GAS_LIMIT = 'metamask/custom-gas/SET_CUSTOM_GAS_LIMIT'
const SET_CUSTOM_GAS_ERRORS = 'metamask/custom-gas/SET_CUSTOM_GAS_ERRORS'
const RESET_CUSTOM_GAS_STATE = 'metamask/custom-gas/RESET_CUSTOM_GAS_STATE'

// TODO: determine if this approach to initState is consistent with conventional ducks pattern
const initState = {
  price: 0,
  limit: 21000,
  errors: {},
}

// Reducer
export default function reducer ({ customGas: customGasState = initState }, action = {}) {
  const newState = extend({}, customGasState)

  switch (action.type) {
    case SET_CUSTOM_GAS_PRICE:
      return extend(newState, {
        price: action.value,
      })
    case SET_CUSTOM_GAS_LIMIT:
      return extend(newState, {
        limit: action.value,
      })
    case SET_CUSTOM_GAS_ERRORS:
      return extend(newState, {
        errors: {
          ...newState.errors,
          ...action.value,
        },
      })
    case RESET_CUSTOM_GAS_STATE:
      return extend({}, initState)
    default:
      return newState
  }
}

// Action Creators
export function setCustomGasPrice (newPrice) {
  return {
    type: SET_CUSTOM_GAS_PRICE,
    value: newPrice,
  }
}

export function setCustomGasLimit (newLimit) {
  return {
    type: SET_CUSTOM_GAS_LIMIT,
    value: newLimit,
  }
}

export function setCustomGasErrors (newErrors) {
  return {
    type: SET_CUSTOM_GAS_ERRORS,
    value: newErrors,
  }
}

export function resetCustomGasState () {
  return { type: RESET_CUSTOM_GAS_STATE }
}
