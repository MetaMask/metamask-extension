import log from 'loglevel';
import { estimateGas } from '../../store/actions';
import { setCustomGasLimit } from '../gas/gas.duck';
import {
  estimateGasForSend,
  calcTokenBalance,
} from '../../pages/send/send.utils';

// Actions
const OPEN_TO_DROPDOWN = 'metamask/send/OPEN_TO_DROPDOWN';
const CLOSE_TO_DROPDOWN = 'metamask/send/CLOSE_TO_DROPDOWN';
const UPDATE_SEND_ERRORS = 'metamask/send/UPDATE_SEND_ERRORS';
const RESET_SEND_STATE = 'metamask/send/RESET_SEND_STATE';
const SHOW_GAS_BUTTON_GROUP = 'metamask/send/SHOW_GAS_BUTTON_GROUP';
const HIDE_GAS_BUTTON_GROUP = 'metamask/send/HIDE_GAS_BUTTON_GROUP';
const UPDATE_GAS_LIMIT = 'UPDATE_GAS_LIMIT';
const UPDATE_GAS_PRICE = 'UPDATE_GAS_PRICE';
const UPDATE_GAS_TOTAL = 'UPDATE_GAS_TOTAL';
const UPDATE_SEND_HEX_DATA = 'UPDATE_SEND_HEX_DATA';
const UPDATE_SEND_TOKEN_BALANCE = 'UPDATE_SEND_TOKEN_BALANCE';
const UPDATE_SEND_TO = 'UPDATE_SEND_TO';
const UPDATE_SEND_AMOUNT = 'UPDATE_SEND_AMOUNT';
const UPDATE_MAX_MODE = 'UPDATE_MAX_MODE';
const UPDATE_SEND = 'UPDATE_SEND';
const UPDATE_SEND_TOKEN = 'UPDATE_SEND_TOKEN';
const CLEAR_SEND = 'CLEAR_SEND';
const GAS_LOADING_STARTED = 'GAS_LOADING_STARTED';
const GAS_LOADING_FINISHED = 'GAS_LOADING_FINISHED';
const UPDATE_SEND_ENS_RESOLUTION = 'UPDATE_SEND_ENS_RESOLUTION';
const UPDATE_SEND_ENS_RESOLUTION_ERROR = 'UPDATE_SEND_ENS_RESOLUTION_ERROR';

const initState = {
  toDropdownOpen: false,
  gasButtonGroupShown: true,
  errors: {},
  gasLimit: null,
  gasPrice: null,
  gasTotal: null,
  tokenBalance: '0x0',
  from: '',
  to: '',
  amount: '0',
  memo: '',
  maxModeOn: false,
  editingTransactionId: null,
  toNickname: '',
  ensResolution: null,
  ensResolutionError: '',
  gasIsLoading: false,
};

// Reducer
export default function reducer(state = initState, action) {
  switch (action.type) {
    case OPEN_TO_DROPDOWN:
      return {
        ...state,
        toDropdownOpen: true,
      };
    case CLOSE_TO_DROPDOWN:
      return {
        ...state,
        toDropdownOpen: false,
      };
    case UPDATE_SEND_ERRORS:
      return {
        ...state,
        errors: {
          ...state.errors,
          ...action.value,
        },
      };
    case SHOW_GAS_BUTTON_GROUP:
      return {
        ...state,
        gasButtonGroupShown: true,
      };
    case HIDE_GAS_BUTTON_GROUP:
      return {
        ...state,
        gasButtonGroupShown: false,
      };
    case UPDATE_GAS_LIMIT:
      return {
        ...state,
        gasLimit: action.value,
      };
    case UPDATE_GAS_PRICE:
      return {
        ...state,
        gasPrice: action.value,
      };
    case RESET_SEND_STATE:
      return { ...initState };
    case UPDATE_GAS_TOTAL:
      return {
        ...state,
        gasTotal: action.value,
      };
    case UPDATE_SEND_TOKEN_BALANCE:
      return {
        ...state,
        tokenBalance: action.value,
      };
    case UPDATE_SEND_HEX_DATA:
      return {
        ...state,
        data: action.value,
      };
    case UPDATE_SEND_TO:
      return {
        ...state,
        to: action.value.to,
        toNickname: action.value.nickname,
      };
    case UPDATE_SEND_AMOUNT:
      return {
        ...state,
        amount: action.value,
      };
    case UPDATE_MAX_MODE:
      return {
        ...state,
        maxModeOn: action.value,
      };
    case UPDATE_SEND:
      return Object.assign(state, action.value);
    case UPDATE_SEND_TOKEN: {
      const newSend = {
        ...state,
        token: action.value,
      };
      // erase token-related state when switching back to native currency
      if (newSend.editingTransactionId && !newSend.token) {
        const unapprovedTx =
          newSend?.unapprovedTxs?.[newSend.editingTransactionId] || {};
        const txParams = unapprovedTx.txParams || {};
        Object.assign(newSend, {
          tokenBalance: null,
          balance: '0',
          from: unapprovedTx.from || '',
          unapprovedTxs: {
            ...newSend.unapprovedTxs,
            [newSend.editingTransactionId]: {
              ...unapprovedTx,
              txParams: {
                ...txParams,
                data: '',
              },
            },
          },
        });
      }
      return Object.assign(state, newSend);
    }
    case UPDATE_SEND_ENS_RESOLUTION:
      return {
        ...state,
        ensResolution: action.payload,
        ensResolutionError: '',
      };
    case UPDATE_SEND_ENS_RESOLUTION_ERROR:
      return {
        ...state,
        ensResolution: null,
        ensResolutionError: action.payload,
      };
    case CLEAR_SEND:
      return {
        ...state,
        gasLimit: null,
        gasPrice: null,
        gasTotal: null,
        tokenBalance: null,
        from: '',
        to: '',
        amount: '0x0',
        memo: '',
        errors: {},
        maxModeOn: false,
        editingTransactionId: null,
        toNickname: '',
      };
    case GAS_LOADING_STARTED:
      return {
        ...state,
        gasIsLoading: true,
      };

    case GAS_LOADING_FINISHED:
      return {
        ...state,
        gasIsLoading: false,
      };
    default:
      return state;
  }
}

// Action Creators
export function openToDropdown() {
  return { type: OPEN_TO_DROPDOWN };
}

export function closeToDropdown() {
  return { type: CLOSE_TO_DROPDOWN };
}

export function showGasButtonGroup() {
  return { type: SHOW_GAS_BUTTON_GROUP };
}

export function hideGasButtonGroup() {
  return { type: HIDE_GAS_BUTTON_GROUP };
}

export function updateSendErrors(errorObject) {
  return {
    type: UPDATE_SEND_ERRORS,
    value: errorObject,
  };
}

export function resetSendState() {
  return { type: RESET_SEND_STATE };
}

export function setGasLimit(gasLimit) {
  return {
    type: UPDATE_GAS_LIMIT,
    value: gasLimit,
  };
}

export function setGasPrice(gasPrice) {
  return {
    type: UPDATE_GAS_PRICE,
    value: gasPrice,
  };
}

export function setGasTotal(gasTotal) {
  return {
    type: UPDATE_GAS_TOTAL,
    value: gasTotal,
  };
}

export function updateGasData({
  gasPrice,
  blockGasLimit,
  selectedAddress,
  sendToken,
  to,
  value,
  data,
}) {
  return (dispatch) => {
    dispatch(gasLoadingStarted());
    return estimateGasForSend({
      estimateGasMethod: estimateGas,
      blockGasLimit,
      selectedAddress,
      sendToken,
      to,
      value,
      estimateGasPrice: gasPrice,
      data,
    })
      .then((gas) => {
        dispatch(setGasLimit(gas));
        dispatch(setCustomGasLimit(gas));
        dispatch(updateSendErrors({ gasLoadingError: null }));
        dispatch(gasLoadingFinished());
      })
      .catch((err) => {
        log.error(err);
        dispatch(updateSendErrors({ gasLoadingError: 'gasLoadingError' }));
        dispatch(gasLoadingFinished());
      });
  };
}

export function gasLoadingStarted() {
  return {
    type: GAS_LOADING_STARTED,
  };
}

export function gasLoadingFinished() {
  return {
    type: GAS_LOADING_FINISHED,
  };
}

export function updateSendTokenBalance({ sendToken, tokenContract, address }) {
  return (dispatch) => {
    const tokenBalancePromise = tokenContract
      ? tokenContract.balanceOf(address)
      : Promise.resolve();
    return tokenBalancePromise
      .then((usersToken) => {
        if (usersToken) {
          const newTokenBalance = calcTokenBalance({ sendToken, usersToken });
          dispatch(setSendTokenBalance(newTokenBalance));
        }
      })
      .catch((err) => {
        log.error(err);
        updateSendErrors({ tokenBalance: 'tokenBalanceError' });
      });
  };
}

export function setSendTokenBalance(tokenBalance) {
  return {
    type: UPDATE_SEND_TOKEN_BALANCE,
    value: tokenBalance,
  };
}

export function updateSendHexData(value) {
  return {
    type: UPDATE_SEND_HEX_DATA,
    value,
  };
}

export function updateSendTo(to, nickname = '') {
  return {
    type: UPDATE_SEND_TO,
    value: { to, nickname },
  };
}

export function updateSendAmount(amount) {
  return {
    type: UPDATE_SEND_AMOUNT,
    value: amount,
  };
}

export function setMaxModeTo(bool) {
  return {
    type: UPDATE_MAX_MODE,
    value: bool,
  };
}

export function updateSend(newSend) {
  return {
    type: UPDATE_SEND,
    value: newSend,
  };
}

export function updateSendToken(token) {
  return {
    type: UPDATE_SEND_TOKEN,
    value: token,
  };
}

export function clearSend() {
  return {
    type: CLEAR_SEND,
  };
}

export function updateSendEnsResolution(ensResolution) {
  return {
    type: UPDATE_SEND_ENS_RESOLUTION,
    payload: ensResolution,
  };
}

export function updateSendEnsResolutionError(errorMessage) {
  return {
    type: UPDATE_SEND_ENS_RESOLUTION_ERROR,
    payload: errorMessage,
  };
}
