import { clone } from 'ramda'

// Actions
const BASIC_GAS_ESTIMATE_LOADING_FINISHED = 'metamask/gas/BASIC_GAS_ESTIMATE_LOADING_FINISHED'
const BASIC_GAS_ESTIMATE_LOADING_STARTED = 'metamask/gas/BASIC_GAS_ESTIMATE_LOADING_STARTED'
const RESET_CUSTOM_GAS_STATE = 'metamask/gas/RESET_CUSTOM_GAS_STATE'
const SET_BASIC_GAS_ESTIMATE_DATA = 'metamask/gas/SET_BASIC_GAS_ESTIMATE_DATA'
const SET_CUSTOM_GAS_ERRORS = 'metamask/gas/SET_CUSTOM_GAS_ERRORS'
const SET_CUSTOM_GAS_LIMIT = 'metamask/gas/SET_CUSTOM_GAS_LIMIT'
const SET_CUSTOM_GAS_PRICE = 'metamask/gas/SET_CUSTOM_GAS_PRICE'
const SET_CUSTOM_GAS_TOTAL = 'metamask/gas/SET_CUSTOM_GAS_TOTAL'

// TODO: determine if this approach to initState is consistent with conventional ducks pattern
const initState = {
  customData: {
    price: 0,
    limit: 21000,
  },
  basicEstimates: {
    average: null,
    fastestWait: null,
    fastWait: null,
    fast: null,
    safeLowWait: null,
    blockNum: null,
    avgWait: null,
    blockTime: null,
    speed: null,
    fastest: null,
    safeLow: null,
  },
  basicEstimateIsLoading: true,
  errors: {},
}

// Reducer
export default function reducer ({ gas: gasState = initState }, action = {}) {
  const newState = clone(gasState)

  switch (action.type) {
    case BASIC_GAS_ESTIMATE_LOADING_STARTED:
      return {
        ...newState,
        basicEstimateIsLoading: true,
      }
    case BASIC_GAS_ESTIMATE_LOADING_FINISHED:
      return {
        ...newState,
        basicEstimateIsLoading: false,
      }
    case SET_BASIC_GAS_ESTIMATE_DATA:
      return {
        ...newState,
        basicEstimates: action.value,
      }
    case SET_CUSTOM_GAS_PRICE:
      return {
        ...newState,
        customData: {
          ...newState.customData,
          price: action.value,
        },
      }
    case SET_CUSTOM_GAS_LIMIT:
      return {
        ...newState,
        customData: {
          ...newState.customData,
          limit: action.value,
        },
      }
    case SET_CUSTOM_GAS_TOTAL:
      return {
        ...newState,
        customData: {
          ...newState.customData,
          total: action.value,
        },
      }
    case SET_CUSTOM_GAS_ERRORS:
      return {
        ...newState,
        errors: {
          ...newState.errors,
          ...action.value,
        },
      }
    case RESET_CUSTOM_GAS_STATE:
      return clone(initState)
    default:
      return newState
  }
}

// Action Creators
export function basicGasEstimatesLoadingStarted () {
  return {
    type: BASIC_GAS_ESTIMATE_LOADING_STARTED,
  }
}

export function basicGasEstimatesLoadingFinished () {
  return {
    type: BASIC_GAS_ESTIMATE_LOADING_FINISHED,
  }
}

export function fetchGasEstimates () {
  return (dispatch) => {
    dispatch(basicGasEstimatesLoadingStarted())

    return fetch('https://ethgasstation.info/json/ethgasAPI.json', {
      'headers': {},
      'referrer': 'http://ethgasstation.info/json/',
      'referrerPolicy': 'no-referrer-when-downgrade',
      'body': null,
      'method': 'GET',
      'mode': 'cors'}
    )
      .then(r => r.json())
      .then(({
        average,
        avgWait,
        block_time: blockTime,
        blockNum,
        fast,
        fastest,
        fastestWait,
        fastWait,
        safeLow,
        safeLowWait,
        speed,
      }) => {
        dispatch(setBasicGasEstimateData({
          average,
          avgWait,
          blockTime,
          blockNum,
          fast,
          fastest,
          fastestWait,
          fastWait,
          safeLow,
          safeLowWait,
          speed,
        }))
        dispatch(basicGasEstimatesLoadingFinished())
      })
  }
}

export function setBasicGasEstimateData (basicGasEstimateData) {
  return {
    type: SET_BASIC_GAS_ESTIMATE_DATA,
    value: basicGasEstimateData,
  }
}

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

export function setCustomGasTotal (newTotal) {
  return {
    type: SET_CUSTOM_GAS_TOTAL,
    value: newTotal,
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
