import { clone } from 'ramda'

const SET_CUSTOM_GAS_AND_COLLATERAL_TOTAL =
  'metamask/gas_and_collateral/SET_CUSTOM_GAS_AND_COLLATERAL_TOTAL'
const SET_CUSTOM_GAS_AND_COLLATERAL_ERRORS =
  'metamask/gas_and_collateral/SET_CUSTOM_GAS_AND_COLLATERAL_ERRORS'
const RESET_CUSTOM_GAS_AND_COLLATERAL_STATE =
  'metamask/gas_and_collateral/RESET_CUSTOM_GAS_AND_COLLATERAL_STATE'
const RESET_CUSTOM_GAS_AND_COLLATERAL_DATA =
  'metamask/gas_and_collateral/RESET_CUSTOM_GAS_AND_COLLATERAL_DATA'

// state.gasAndCollateral
const initState = {
  customData: {
    total: null,
  },
  errors: {},
}

export default function reducer (state = initState, action) {
  switch (action.type) {
    case SET_CUSTOM_GAS_AND_COLLATERAL_TOTAL:
      return {
        ...state,
        customData: {
          ...state.customData,
          total: action.value,
        },
      }
    case SET_CUSTOM_GAS_AND_COLLATERAL_ERRORS:
      return {
        ...state,
        errors: {
          ...state.errors,
          ...action.value,
        },
      }
    case RESET_CUSTOM_GAS_AND_COLLATERAL_DATA:
      return {
        ...state,
        customData: clone(initState.customData),
      }
    case RESET_CUSTOM_GAS_AND_COLLATERAL_STATE:
      return clone(initState)
    default:
      return state
  }
}

export function setCustomGasAndCollateralTotal (newTotal) {
  return {
    type: SET_CUSTOM_GAS_AND_COLLATERAL_TOTAL,
    value: newTotal,
  }
}

export function setCustomGasAndCollateralErrors (newErrors) {
  return {
    type: SET_CUSTOM_GAS_AND_COLLATERAL_ERRORS,
    value: newErrors,
  }
}

export function resetCustomGasAndCollateralState () {
  return { type: RESET_CUSTOM_GAS_AND_COLLATERAL_STATE }
}

export function resetCustomGasAndCollateralData () {
  return { type: RESET_CUSTOM_GAS_AND_COLLATERAL_DATA }
}
