import type { AnyAction } from 'redux';
import {
  conversionRateSelector,
  currentCurrencySelector,
  unconfirmedTransactionsHashSelector,
} from '../../selectors';
import { getNativeCurrency, getTokens } from '../metamask/metamask';

import {
  getTransactionFee,
  getHexGasTotal,
  addFiat,
  addEth,
} from '../../helpers/utils/confirm-tx.util';

import {
  getValueFromWeiHex,
  hexToDecimal,
  sumHexes,
} from '../../../shared/lib/conversion.utils';
import { getAveragePriceEstimateInHexWEI } from '../../selectors/custom-gas';
import { isEqualCaseInsensitive } from '../../../shared/lib/string-utils';
import { parseStandardTokenTransactionData } from '../../../shared/lib/transaction.utils';

const createActionType = (action: string) =>
  `metamask/confirm-transaction/${action}`;

const UPDATE_TX_DATA = createActionType('UPDATE_TX_DATA');
const UPDATE_TOKEN_DATA = createActionType('UPDATE_TOKEN_DATA');
const UPDATE_TOKEN_PROPS = createActionType('UPDATE_TOKEN_PROPS');
const CLEAR_CONFIRM_TRANSACTION = createActionType('CLEAR_CONFIRM_TRANSACTION');
const UPDATE_TRANSACTION_AMOUNTS = createActionType(
  'UPDATE_TRANSACTION_AMOUNTS',
);
const UPDATE_TRANSACTION_FEES = createActionType('UPDATE_TRANSACTION_FEES');
const UPDATE_TRANSACTION_TOTALS = createActionType('UPDATE_TRANSACTION_TOTALS');
const UPDATE_NONCE = createActionType('UPDATE_NONCE');
const SET_MAX_VALUE_MODE = createActionType('SET_MAX_VALUE_MODE');

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Json = Record<string, any>;
type RootState = {
  metamask: Json;
  confirmTransaction?: {
    txData?: Json;
  };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Dispatch = (...args: any[]) => any;

export type ConfirmTransactionState = {
  txData: Json;
  tokenData: Json;
  tokenProps: Json;
  fiatTransactionAmount: string;
  fiatTransactionFee: string;
  fiatTransactionTotal: string;
  ethTransactionAmount: string;
  ethTransactionFee: string;
  ethTransactionTotal: string;
  hexTransactionAmount: string;
  hexTransactionFee: string;
  hexTransactionTotal: string;
  nonce: string | number;
  maxValueMode: Record<string, boolean>;
}

const initState: ConfirmTransactionState = {
  txData: {},
  tokenData: {},
  tokenProps: {},
  fiatTransactionAmount: '',
  fiatTransactionFee: '',
  fiatTransactionTotal: '',
  ethTransactionAmount: '',
  ethTransactionFee: '',
  ethTransactionTotal: '',
  hexTransactionAmount: '',
  hexTransactionFee: '',
  hexTransactionTotal: '',
  nonce: '',
  maxValueMode: {},
};

export default function reducer(
  state: ConfirmTransactionState = initState,
  action: AnyAction = {},
): ConfirmTransactionState {
  switch (action.type) {
    case UPDATE_TX_DATA:
      return {
        ...state,
        txData: {
          ...action.payload,
        },
      };
    case UPDATE_TOKEN_DATA:
      return {
        ...state,
        tokenData: {
          ...action.payload,
        },
      };
    case UPDATE_TOKEN_PROPS:
      return {
        ...state,
        tokenProps: {
          ...action.payload,
        },
      };
    case UPDATE_TRANSACTION_AMOUNTS: {
      const {
        fiatTransactionAmount,
        ethTransactionAmount,
        hexTransactionAmount,
      } = (action.payload ?? {}) as Partial<ConfirmTransactionState>;
      return {
        ...state,
        fiatTransactionAmount:
          fiatTransactionAmount || state.fiatTransactionAmount,
        ethTransactionAmount: ethTransactionAmount || state.ethTransactionAmount,
        hexTransactionAmount: hexTransactionAmount || state.hexTransactionAmount,
      };
    }
    case UPDATE_TRANSACTION_FEES: {
      const { fiatTransactionFee, ethTransactionFee, hexTransactionFee } =
        (action.payload ?? {}) as Partial<ConfirmTransactionState>;
      return {
        ...state,
        fiatTransactionFee: fiatTransactionFee || state.fiatTransactionFee,
        ethTransactionFee: ethTransactionFee || state.ethTransactionFee,
        hexTransactionFee: hexTransactionFee || state.hexTransactionFee,
      };
    }
    case UPDATE_TRANSACTION_TOTALS: {
      const { fiatTransactionTotal, ethTransactionTotal, hexTransactionTotal } =
        (action.payload ?? {}) as Partial<ConfirmTransactionState>;
      return {
        ...state,
        fiatTransactionTotal: fiatTransactionTotal || state.fiatTransactionTotal,
        ethTransactionTotal:
          ethTransactionTotal || state.ethTransactionTotal,
        hexTransactionTotal: hexTransactionTotal || state.hexTransactionTotal,
      };
    }
    case UPDATE_NONCE:
      return {
        ...state,
        nonce: action.payload as ConfirmTransactionState['nonce'],
      };
    case CLEAR_CONFIRM_TRANSACTION:
      return {
        ...initState,
        maxValueMode: state.maxValueMode,
      };
    case SET_MAX_VALUE_MODE:
      return {
        ...state,
        maxValueMode: {
          ...state.maxValueMode,
          [action.payload.transactionId]: action.payload.enabled,
        },
      };
    default:
      return state;
  }
}

export function updateTxData(txData: Json) {
  return {
    type: UPDATE_TX_DATA,
    payload: txData,
  };
}

export function updateTokenData(tokenData: Json) {
  return {
    type: UPDATE_TOKEN_DATA,
    payload: tokenData,
  };
}

export function updateTokenProps(tokenProps: Json) {
  return {
    type: UPDATE_TOKEN_PROPS,
    payload: tokenProps,
  };
}

export function updateTransactionAmounts(
  amounts: Partial<
    Pick<
      ConfirmTransactionState,
      | 'fiatTransactionAmount'
      | 'ethTransactionAmount'
      | 'hexTransactionAmount'
    >
  >,
) {
  return {
    type: UPDATE_TRANSACTION_AMOUNTS,
    payload: amounts,
  };
}

export function updateTransactionFees(
  fees: Partial<
    Pick<
      ConfirmTransactionState,
      'fiatTransactionFee' | 'ethTransactionFee' | 'hexTransactionFee'
    >
  >,
) {
  return {
    type: UPDATE_TRANSACTION_FEES,
    payload: fees,
  };
}

export function updateTransactionTotals(
  totals: Partial<
    Pick<
      ConfirmTransactionState,
      | 'fiatTransactionTotal'
      | 'ethTransactionTotal'
      | 'hexTransactionTotal'
    >
  >,
) {
  return {
    type: UPDATE_TRANSACTION_TOTALS,
    payload: totals,
  };
}

export function updateNonce(nonce: ConfirmTransactionState['nonce']) {
  return {
    type: UPDATE_NONCE,
    payload: nonce,
  };
}

export function updateTxDataAndCalculate(txData: Json) {
  return (dispatch: Dispatch, getState: () => RootState) => {
    const state = getState();
    const currentCurrency = currentCurrencySelector(state);
    const conversionRate = conversionRateSelector(state);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const nativeCurrency = getNativeCurrency(state as any);

    dispatch(updateTxData(txData));

    const { txParams: { value = '0x0', gas: gasLimit = '0x0' } = {} } = txData;

    let { txParams: { gasPrice } = {} } = txData;
    if (!gasPrice) {
      gasPrice = getAveragePriceEstimateInHexWEI(state) || '0x0';
    }

    const fiatTransactionAmount = getValueFromWeiHex({
      value,
      fromCurrency: nativeCurrency,
      toCurrency: currentCurrency,
      conversionRate,
      numberOfDecimals: 2,
    });
    const ethTransactionAmount = getValueFromWeiHex({
      value,
      fromCurrency: nativeCurrency,
      toCurrency: nativeCurrency,
      conversionRate,
      numberOfDecimals: 6,
    });

    dispatch(
      updateTransactionAmounts({
        fiatTransactionAmount,
        ethTransactionAmount,
        hexTransactionAmount: value,
      }),
    );

    const hexTransactionFee = getHexGasTotal({ gasLimit, gasPrice });

    const fiatTransactionFee = getTransactionFee({
      value: hexTransactionFee,
      fromCurrency: nativeCurrency,
      toCurrency: currentCurrency,
      numberOfDecimals: 2,
      conversionRate,
    });
    const ethTransactionFee = getTransactionFee({
      value: hexTransactionFee,
      fromCurrency: nativeCurrency,
      toCurrency: nativeCurrency,
      numberOfDecimals: 6,
      conversionRate,
    });

    dispatch(
      updateTransactionFees({
        fiatTransactionFee,
        ethTransactionFee,
        hexTransactionFee,
      }),
    );

    const fiatTransactionTotal = addFiat(
      fiatTransactionFee,
      fiatTransactionAmount,
    );
    const ethTransactionTotal = addEth(ethTransactionFee, ethTransactionAmount);
    const hexTransactionTotal = sumHexes(value, hexTransactionFee);

    dispatch(
      updateTransactionTotals({
        fiatTransactionTotal,
        ethTransactionTotal,
        hexTransactionTotal,
      }),
    );
  };
}

export function setTransactionToConfirm(transactionId: string | number) {
  return (dispatch: Dispatch, getState: () => RootState) => {
    const state = getState();
    const unconfirmedTransactionsHash =
      unconfirmedTransactionsHashSelector(state) ?? {};
    const transaction = unconfirmedTransactionsHash[transactionId];

    if (!transaction) {
      console.error(`Transaction with id ${transactionId} not found`);
      return;
    }

    if (transaction.txParams) {
      dispatch(updateTxDataAndCalculate(transaction));
      const { txParams } = transaction;

      if (txParams.data) {
        const { to: tokenAddress, data } = txParams;

        const tokenData = parseStandardTokenTransactionData(data);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const tokens = getTokens(state as any);
        const currentToken = tokens?.find(({ address }: { address: string }) =>
          isEqualCaseInsensitive(tokenAddress, address),
        );

        dispatch(
          updateTokenProps({
            decimals: currentToken?.decimals,
            symbol: currentToken?.symbol,
          }),
        );
        dispatch(updateTokenData(tokenData));
      }

      if (txParams.nonce) {
        const nonce = hexToDecimal(txParams.nonce);

        dispatch(updateNonce(nonce));
      }
    } else {
      dispatch(updateTxData(transaction));
    }
  };
}

export function clearConfirmTransaction() {
  return {
    type: CLEAR_CONFIRM_TRANSACTION,
  };
}

export function setMaxValueMode(
  transactionId: string,
  enabled: boolean,
) {
  return {
    type: SET_MAX_VALUE_MODE,
    payload: {
      transactionId,
      enabled,
    },
  };
}
