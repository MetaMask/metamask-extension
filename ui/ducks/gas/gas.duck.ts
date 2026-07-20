import { cloneDeep } from 'lodash';
import type { AnyAction } from 'redux';
import {
  RESET_CUSTOM_DATA,
  SET_CUSTOM_GAS_LIMIT,
  SET_CUSTOM_GAS_PRICE,
} from './gas-action-constants';

export type GasCustomValue = string | number | null;

export type GasState = {
  customData: {
    price: GasCustomValue;
    limit: GasCustomValue;
  };
}

const initState: GasState = {
  customData: {
    price: null,
    limit: null,
  },
};

export default function reducer(
  // eslint-disable-next-line @typescript-eslint/default-param-last
  state: GasState = initState,
  action: AnyAction,
): GasState {
  switch (action.type) {
    case SET_CUSTOM_GAS_PRICE:
      return {
        ...state,
        customData: {
          ...state.customData,
          price: action.value as GasCustomValue,
        },
      };
    case SET_CUSTOM_GAS_LIMIT:
      return {
        ...state,
        customData: {
          ...state.customData,
          limit: action.value as GasCustomValue,
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

export function setCustomGasPrice(newPrice: GasCustomValue) {
  return {
    type: SET_CUSTOM_GAS_PRICE,
    value: newPrice,
  };
}

export function setCustomGasLimit(newLimit: GasCustomValue) {
  return {
    type: SET_CUSTOM_GAS_LIMIT,
    value: newLimit,
  };
}
