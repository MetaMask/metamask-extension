import { cloneDeep } from 'lodash'
import BigNumber from 'bignumber.js'

import fetchWithCache from '../../helpers/utils/fetch-with-cache'
import { decGWEIToHexWEI } from '../../helpers/utils/conversions.util'

// Actions
const BASIC_GAS_ESTIMATE_LOADING_FINISHED =
  'metamask/gas/BASIC_GAS_ESTIMATE_LOADING_FINISHED'
const BASIC_GAS_ESTIMATE_LOADING_STARTED =
  'metamask/gas/BASIC_GAS_ESTIMATE_LOADING_STARTED'
const RESET_CUSTOM_DATA = 'metamask/gas/RESET_CUSTOM_DATA'
const SET_BASIC_GAS_ESTIMATE_DATA = 'metamask/gas/SET_BASIC_GAS_ESTIMATE_DATA'
const SET_CUSTOM_GAS_LIMIT = 'metamask/gas/SET_CUSTOM_GAS_LIMIT'
const SET_CUSTOM_GAS_PRICE = 'metamask/gas/SET_CUSTOM_GAS_PRICE'

const initState = {
  customData: {
    price: null,
    limit: null,
  },
  basicEstimates: {
    safeLow: null,
    average: null,
    fast: null,
  },
  basicEstimateIsLoading: true,
}

// Reducer
export default function reducer(state = initState, action) {
  switch (action.type) {
    case BASIC_GAS_ESTIMATE_LOADING_STARTED:
      return {
        ...state,
        basicEstimateIsLoading: true,
      }
    case BASIC_GAS_ESTIMATE_LOADING_FINISHED:
      return {
        ...state,
        basicEstimateIsLoading: false,
      }
    case SET_BASIC_GAS_ESTIMATE_DATA:
      return {
        ...state,
        basicEstimates: action.value,
      }
    case SET_CUSTOM_GAS_PRICE:
      return {
        ...state,
        customData: {
          ...state.customData,
          price: action.value,
        },
      }
    case SET_CUSTOM_GAS_LIMIT:
      return {
        ...state,
        customData: {
          ...state.customData,
          limit: action.value,
        },
      }
    case RESET_CUSTOM_DATA:
      return {
        ...state,
        customData: cloneDeep(initState.customData),
      }
    default:
      return state
  }
}

// Action Creators
export function basicGasEstimatesLoadingStarted() {
  return {
    type: BASIC_GAS_ESTIMATE_LOADING_STARTED,
  }
}

export function basicGasEstimatesLoadingFinished() {
  return {
    type: BASIC_GAS_ESTIMATE_LOADING_FINISHED,
  }
}

async function basicGasPriceQuery() {
  const url = 'https://api.metaswap.codefi.network/gasPrices'
  const fetchOptions = {
    referrer: url,
    referrerPolicy: 'no-referrer-when-downgrade',
    method: 'GET',
    mode: 'cors',
  }
  const expirationOptions = { cacheRefreshTime: 75000 }

  const responseJson = await fetchWithCache(
    url,
    fetchOptions,
    expirationOptions,
  )
  return responseJson
}

export function fetchBasicGasEstimates() {
  return async (dispatch) => {
    dispatch(basicGasEstimatesLoadingStarted())
    const basicEstimates = await fetchExternalBasicGasEstimates(dispatch)
    dispatch(setBasicGasEstimateData(basicEstimates))
    dispatch(basicGasEstimatesLoadingFinished())

    return basicEstimates
  }
}

async function fetchExternalBasicGasEstimates() {
  const {
    SafeGasPrice,
    ProposeGasPrice,
    FastGasPrice,
  } = await basicGasPriceQuery()

  console.log(
    'await basicGasPriceQuery returns: ',
    SafeGasPrice,
    ProposeGasPrice,
    FastGasPrice,
  )

  const [safeLow, average, fast] = [
    SafeGasPrice,
    ProposeGasPrice,
    FastGasPrice,
  ].map((price) => {
    console.log('Price is: ', price)
    return new BigNumber(price, 10).toNumber()
  })

  const basicEstimates = {
    safeLow,
    average,
    fast,
  }

  return basicEstimates
}

export function setCustomGasPriceForRetry(newPrice) {
  return async (dispatch) => {
    if (newPrice === '0x0') {
      const { fast } = await fetchExternalBasicGasEstimates()
      dispatch(setCustomGasPrice(decGWEIToHexWEI(fast)))
    } else {
      dispatch(setCustomGasPrice(newPrice))
    }
  }
}

export function setBasicGasEstimateData(basicGasEstimateData) {
  return {
    type: SET_BASIC_GAS_ESTIMATE_DATA,
    value: basicGasEstimateData,
  }
}

export function setCustomGasPrice(newPrice) {
  return {
    type: SET_CUSTOM_GAS_PRICE,
    value: newPrice,
  }
}

export function setCustomGasLimit(newLimit) {
  return {
    type: SET_CUSTOM_GAS_LIMIT,
    value: newLimit,
  }
}

export function resetCustomData() {
  return { type: RESET_CUSTOM_DATA }
}
