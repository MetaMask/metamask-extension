import { cloneDeep } from 'lodash';
import {
  RESET_CUSTOM_DATA,
  SET_CUSTOM_GAS_LIMIT,
  SET_CUSTOM_GAS_PRICE,
  SET_CUSTOM_MAX_FEE_PER_GAS,
  SET_CUSTOM_MAX_PRIORITY_FEE_PER_GAS,
  SET_ESTIMATE_LEVEL_TO_USE,
} from './gas-action-constants';

const initState = {
  customData: {
    price: null,
    limit: null,
    maxFeePerGas: null,
    maxPriorityFeePerGas: null,
    estimateLevelToUse: null,
  },
};

// Reducer
export default function reducer(state = initState, action) {
  switch (action.type) {
    case SET_CUSTOM_GAS_PRICE:
      return {
        ...state,
        customData: {
          ...state.customData,
          price: action.value,
        },
      };
    case SET_CUSTOM_GAS_LIMIT:
      return {
        ...state,
        customData: {
          ...state.customData,
          limit: action.value,
        },
      };
    case SET_CUSTOM_MAX_FEE_PER_GAS:
      return {
        ...state,
        customData: {
          ...state.customData,
          maxFeePerGas: action.value,
        },
      };
    case SET_CUSTOM_MAX_PRIORITY_FEE_PER_GAS:
      return {
        ...state,
        customData: {
          ...state.customData,
          maxPriorityFeePerGas: action.value,
        },
      };
    case SET_ESTIMATE_LEVEL_TO_USE:
      return {
        ...state,
        customData: {
          ...state.customData,
          estimateLevelToUse: action.value,
        },
      };
    case RESET_CUSTOM_DATA:
      return {
        ...state,
        customData: cloneDeep(initState.customData),
      };
    default:
      return state;
  }
}

// Action Creators
export function setCustomGasPrice(newPrice) {
  return {
    type: SET_CUSTOM_GAS_PRICE,
    value: newPrice,
  };
}

export function setCustomGasLimit(newLimit) {
  return {
    type: SET_CUSTOM_GAS_LIMIT,
    value: newLimit,
  };
}

export function setCustomMaxFeePerGas(newMaxFeePerGas) {
  return {
    type: SET_CUSTOM_MAX_FEE_PER_GAS,
    value: newMaxFeePerGas,
  };
}

export function setCustomMaxPriorityFeePerGas(newMaxPriorityFeePerGas) {
  return {
    type: SET_CUSTOM_MAX_PRIORITY_FEE_PER_GAS,
    value: newMaxPriorityFeePerGas,
  };
}

export function setEstimateLevelToUse(estimateLevel) {
  return {
    type: SET_ESTIMATE_LEVEL_TO_USE,
    value: estimateLevel,
  };
}

export function resetCustomData() {
  return { type: RESET_CUSTOM_DATA };
}
