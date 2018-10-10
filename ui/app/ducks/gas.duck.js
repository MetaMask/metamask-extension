import { mockGasEstimateData } from './mock-gas-estimate-data'
import { clone, uniqBy } from 'ramda'
import BigNumber from 'bignumber.js'

// Actions
const BASIC_GAS_ESTIMATE_LOADING_FINISHED = 'metamask/gas/BASIC_GAS_ESTIMATE_LOADING_FINISHED'
const BASIC_GAS_ESTIMATE_LOADING_STARTED = 'metamask/gas/BASIC_GAS_ESTIMATE_LOADING_STARTED'
const GAS_ESTIMATE_LOADING_FINISHED = 'metamask/gas/GAS_ESTIMATE_LOADING_FINISHED'
const GAS_ESTIMATE_LOADING_STARTED = 'metamask/gas/GAS_ESTIMATE_LOADING_STARTED'
const RESET_CUSTOM_GAS_STATE = 'metamask/gas/RESET_CUSTOM_GAS_STATE'
const RESET_CUSTOM_DATA = 'metamask/gas/RESET_CUSTOM_DATA'
const SET_BASIC_GAS_ESTIMATE_DATA = 'metamask/gas/SET_BASIC_GAS_ESTIMATE_DATA'
const SET_CUSTOM_GAS_ERRORS = 'metamask/gas/SET_CUSTOM_GAS_ERRORS'
const SET_CUSTOM_GAS_LIMIT = 'metamask/gas/SET_CUSTOM_GAS_LIMIT'
const SET_CUSTOM_GAS_PRICE = 'metamask/gas/SET_CUSTOM_GAS_PRICE'
const SET_CUSTOM_GAS_TOTAL = 'metamask/gas/SET_CUSTOM_GAS_TOTAL'
const SET_PRICE_AND_TIME_ESTIMATES = 'metamask/gas/SET_PRICE_AND_TIME_ESTIMATES'

// TODO: determine if this approach to initState is consistent with conventional ducks pattern
const initState = {
  customData: {
    price: null,
    limit: '0x5208',
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
  gasEstimatesLoading: true,
  priceAndTimeEstimates: [],
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
    case GAS_ESTIMATE_LOADING_STARTED:
      return {
        ...newState,
        gasEstimatesLoading: true,
      }
    case GAS_ESTIMATE_LOADING_FINISHED:
      return {
        ...newState,
        gasEstimatesLoading: false,
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
    case SET_PRICE_AND_TIME_ESTIMATES:
      return {
        ...newState,
        priceAndTimeEstimates: action.value,
      }
    case SET_CUSTOM_GAS_ERRORS:
      return {
        ...newState,
        errors: {
          ...newState.errors,
          ...action.value,
        },
      }
    case RESET_CUSTOM_DATA:
      return {
        ...newState,
        customData: clone(initState.customData),
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

export function gasEstimatesLoadingStarted () {
  return {
    type: GAS_ESTIMATE_LOADING_STARTED,
  }
}

export function gasEstimatesLoadingFinished () {
  return {
    type: GAS_ESTIMATE_LOADING_FINISHED,
  }
}

export function fetchBasicGasEstimates () {
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
        const basicEstimates = {
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
        }
        dispatch(setBasicGasEstimateData(basicEstimates))
        dispatch(basicGasEstimatesLoadingFinished())
        return basicEstimates
      })
  }
}

export function fetchGasEstimates (blockTime) {
  return (dispatch) => {
    dispatch(gasEstimatesLoadingStarted())

    // TODO: uncomment code when live api is ready
    // return fetch('https://ethgasstation.info/json/predictTable.json', {
    //   'headers': {},
    //   'referrer': 'http://ethgasstation.info/json/',
    //   'referrerPolicy': 'no-referrer-when-downgrade',
    //   'body': null,
    //   'method': 'GET',
    //   'mode': 'cors'}
    // )
    return new Promise(resolve => {
      resolve(mockGasEstimateData)
    })
      // .then(r => r.json())
      .then(r => {
        const estimatedPricesAndTimes = r.map(({ expectedTime, expectedWait, gasprice }) => ({ expectedTime, expectedWait, gasprice }))
        const estimatedTimeWithUniquePrices = uniqBy(({ expectedTime }) => expectedTime, estimatedPricesAndTimes)
        const timeMappedToSeconds = estimatedTimeWithUniquePrices.map(({ expectedWait, gasprice }) => {
          const expectedTime = (new BigNumber(expectedWait)).times(Number(blockTime), 10).toString(10)
          return {
            expectedTime,
            expectedWait,
            gasprice,
          }
        })
        dispatch(setPricesAndTimeEstimates(timeMappedToSeconds.slice(1)))
        dispatch(gasEstimatesLoadingFinished())
      })
  }
}

export function setBasicGasEstimateData (basicGasEstimateData) {
  return {
    type: SET_BASIC_GAS_ESTIMATE_DATA,
    value: basicGasEstimateData,
  }
}

export function setPricesAndTimeEstimates (estimatedPricesAndTimes) {
  return {
    type: SET_PRICE_AND_TIME_ESTIMATES,
    value: estimatedPricesAndTimes,
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

export function resetCustomData () {
  return { type: RESET_CUSTOM_DATA }
}
