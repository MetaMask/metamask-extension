import { cloneDeep } from 'lodash';
import {
  RESET_CUSTOM_DATA,
  SET_CUSTOM_GAS_LIMIT,
  SET_CUSTOM_GAS_PRICE,
} from './gas-action-constants';

const initState = {
  customData: {
    price: null,
    limit: null,
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
    case RESET_CUSTOM_DATA:
      return {
        ...state,
        customData: cloneDeep(initState.customData),
      };
    default:
      return state;
  }
}

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
