import { clone } from 'ramda'

const SET_CUSTOM_STORAGE_LIMIT = 'metamask/storageLimit/SET_CUSTOM_STORAGE_LIMIT'
const SET_CUSTOM_STORAGE_TOTAL = 'metamask/storageLimit/SET_CUSTOM_STORAGE_TOTAL'
const SET_CUSTOM_STORAGE_ERRORS = 'metamask/storageLimit/SET_CUSTOM_STORAGE_ERRORS'
const RESET_CUSTOM_STORAGE_STATE = 'metamask/storageLimit/RESET_CUSTOM_STORAGE_STATE'
const RESET_CUSTOM_STORAGE_DATA = 'metamask/storageLimit/RESET_CUSTOM_STORAGE_DATA'

// state.storage
const initState = {
  customData: {
    limit: null,
    total: null,
  },
  errors: {},
}

export default function reducer (state = initState, action) {
  switch (action.type) {
    case SET_CUSTOM_STORAGE_LIMIT:
      return {
        ...state,
        customData: {
          ...state.customData,
          limit: action.value,
        },
      }
    case SET_CUSTOM_STORAGE_TOTAL:
      return {
        ...state,
        customData: {
          ...state.customData,
          total: action.value,
        },
      }
    case SET_CUSTOM_STORAGE_ERRORS:
      return {
        ...state,
        errors: {
          ...state.errors,
          ...action.value,
        },
      }
    case RESET_CUSTOM_STORAGE_DATA:
      return {
        ...state,
        customData: clone(initState.customData),
      }
    case RESET_CUSTOM_STORAGE_STATE:
      return clone(initState)
    default:
      return state
  }
}

export function setCustomStorageLimit (newLimit) {
  return {
    type: SET_CUSTOM_STORAGE_LIMIT,
    value: newLimit,
  }
}

export function setCustomStorageTotal (newTotal) {
  return {
    type: SET_CUSTOM_STORAGE_TOTAL,
    value: newTotal,
  }
}

export function setCustomStorageErrors (newErrors) {
  return {
    type: SET_CUSTOM_STORAGE_ERRORS,
    value: newErrors,
  }
}

export function resetCustomStorageState () {
  return { type: RESET_CUSTOM_STORAGE_STATE }
}

export function resetCustomStorageData () {
  return { type: RESET_CUSTOM_STORAGE_DATA }
}
