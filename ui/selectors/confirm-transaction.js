import { createSelector } from 'reselect';
import { TransactionEnvelopeType } from '@metamask/transaction-controller';
import txHelper from '../helpers/utils/tx-helper';
import {
  roundExponential,
  getTransactionFee,
  addFiat,
  addEth,
} from '../helpers/utils/confirm-tx.util';
import {
  getGasEstimateType,
  getGasFeeEstimates,
  getNativeCurrency,
  getProviderConfig,
} from '../ducks/metamask/metamask';
import {
  GasEstimateTypes,
  CUSTOM_GAS_ESTIMATE,
} from '../../shared/constants/gas';
import {
  getMaximumGasTotalInHexWei,
  getMinimumGasTotalInHexWei,
} from '../../shared/modules/gas.utils';
import { isEqualCaseInsensitive } from '../../shared/modules/string-utils';
import { calcTokenAmount } from '../../shared/lib/transactions-controller-utils';
import {
  decGWEIToHexWEI,
  getValueFromWeiHex,
  sumHexes,
} from '../../shared/modules/conversion.utils';
import { getAveragePriceEstimateInHexWEI } from './custom-gas';
import { getCurrentChainId } from './selectors';
import {
  checkNetworkAndAccountSupports1559,
  getUnapprovedTransactions,
} from '.';

const unapprovedTxsSelector = (state) => getUnapprovedTransactions(state);
const unapprovedMsgsSelector = (state) => state.metamask.unapprovedMsgs;
const unapprovedPersonalMsgsSelector = (state) =>
  state.metamask.unapprovedPersonalMsgs;
const unapprovedDecryptMsgsSelector = (state) =>
  state.metamask.unapprovedDecryptMsgs;
const unapprovedEncryptionPublicKeyMsgsSelector = (state) =>
  state.metamask.unapprovedEncryptionPublicKeyMsgs;
const unapprovedTypedMessagesSelector = (state) =>
  state.metamask.unapprovedTypedMessages;

export const unconfirmedTransactionsListSelector = createSelector(
  unapprovedTxsSelector,
  unapprovedMsgsSelector,
  unapprovedPersonalMsgsSelector,
  unapprovedDecryptMsgsSelector,
  unapprovedEncryptionPublicKeyMsgsSelector,
  unapprovedTypedMessagesSelector,
  getCurrentChainId,
  (
    unapprovedTxs = {},
    unapprovedMsgs = {},
    unapprovedPersonalMsgs = {},
    unapprovedDecryptMsgs = {},
    unapprovedEncryptionPublicKeyMsgs = {},
    unapprovedTypedMessages = {},
    chainId,
  ) =>
    txHelper(
      unapprovedTxs,
      unapprovedMsgs,
      unapprovedPersonalMsgs,
      unapprovedDecryptMsgs,
      unapprovedEncryptionPublicKeyMsgs,
      unapprovedTypedMessages,
      chainId,
    ) || [],
);

export const unconfirmedTransactionsHashSelector = createSelector(
  unapprovedTxsSelector,
  unapprovedMsgsSelector,
  unapprovedPersonalMsgsSelector,
  unapprovedDecryptMsgsSelector,
  unapprovedEncryptionPublicKeyMsgsSelector,
  unapprovedTypedMessagesSelector,
  getCurrentChainId,
  (
    unapprovedTxs = {},
    unapprovedMsgs = {},
    unapprovedPersonalMsgs = {},
    unapprovedDecryptMsgs = {},
    unapprovedEncryptionPublicKeyMsgs = {},
    unapprovedTypedMessages = {},
    chainId,
  ) => {
    const filteredUnapprovedTxs = Object.keys(unapprovedTxs).reduce(
      (acc, address) => {
        const transactions = { ...acc };

        if (unapprovedTxs[address].chainId === chainId) {
          transactions[address] = unapprovedTxs[address];
        }

        return transactions;
      },
      {},
    );

    return {
      ...filteredUnapprovedTxs,
      ...unapprovedMsgs,
      ...unapprovedPersonalMsgs,
      ...unapprovedDecryptMsgs,
      ...unapprovedEncryptionPublicKeyMsgs,
      ...unapprovedTypedMessages,
    };
  },
);

export const unconfirmedMessagesHashSelector = createSelector(
  unapprovedMsgsSelector,
  unapprovedPersonalMsgsSelector,
  unapprovedDecryptMsgsSelector,
  unapprovedEncryptionPublicKeyMsgsSelector,
  unapprovedTypedMessagesSelector,
  (
    unapprovedMsgs = {},
    unapprovedPersonalMsgs = {},
    unapprovedDecryptMsgs = {},
    unapprovedEncryptionPublicKeyMsgs = {},
    unapprovedTypedMessages = {},
  ) => {
    return {
      ...unapprovedMsgs,
      ...unapprovedPersonalMsgs,
      ...unapprovedDecryptMsgs,
      ...unapprovedEncryptionPublicKeyMsgs,
      ...unapprovedTypedMessages,
    };
  },
);
export const use4ByteResolutionSelector = (state) =>
  state.metamask.use4ByteResolution;
export const currentCurrencySelector = (state) =>
  state.metamask.currentCurrency;
export const conversionRateSelector = (state) =>
  state.metamask.currencyRates[getProviderConfig(state).ticker]?.conversionRate;
export const txDataSelector = (state) => state.confirmTransaction.txData;
const tokenDataSelector = (state) => state.confirmTransaction.tokenData;
const tokenPropsSelector = (state) => state.confirmTransaction.tokenProps;

const contractExchangeRatesSelector = (state) =>
  state.metamask.contractExchangeRates;

const tokenDecimalsSelector = createSelector(
  tokenPropsSelector,
  (tokenProps) => tokenProps && tokenProps.decimals,
);

const tokenDataArgsSelector = createSelector(
  tokenDataSelector,
  (tokenData) => (tokenData && tokenData.args) || [],
);

const txParamsSelector = createSelector(
  txDataSelector,
  (txData) => (txData && txData.txParams) || {},
);

export const tokenAddressSelector = createSelector(
  txParamsSelector,
  (txParams) => txParams && txParams.to,
);

const TOKEN_PARAM_TO = '_to';
const TOKEN_PARAM_VALUE = '_value';

export const sendTokenTokenAmountAndToAddressSelector = createSelector(
  tokenDataArgsSelector,
  tokenDecimalsSelector,
  (args, tokenDecimals) => {
    let toAddress = '';
    let tokenAmount = '0';

    // Token params here are ethers BigNumbers, which have a different
    // interface than bignumber.js
    if (args && args.length) {
      toAddress = args[TOKEN_PARAM_TO];
      let value = args[TOKEN_PARAM_VALUE].toString();

      if (tokenDecimals) {
        // bignumber.js return value
        value = calcTokenAmount(value, tokenDecimals).toFixed();
      }

      tokenAmount = roundExponential(value);
    }

    return {
      toAddress,
      tokenAmount,
    };
  },
);

export const contractExchangeRateSelector = createSelector(
  contractExchangeRatesSelector,
  tokenAddressSelector,
  (contractExchangeRates, tokenAddress) =>
    contractExchangeRates[
      Object.keys(contractExchangeRates).find((address) =>
        isEqualCaseInsensitive(address, tokenAddress),
      )
    ],
);

export const transactionFeeSelector = function (state, txData) {
  const currentCurrency = currentCurrencySelector(state);
  const conversionRate = conversionRateSelector(state);
  const nativeCurrency = getNativeCurrency(state);
  const gasFeeEstimates = getGasFeeEstimates(state) || {};
  const gasEstimateType = getGasEstimateType(state);
  const networkAndAccountSupportsEIP1559 =
    checkNetworkAndAccountSupports1559(state);

  const gasEstimationObject = {
    gasLimit: txData.txParams?.gas ?? '0x0',
  };

  if (networkAndAccountSupportsEIP1559) {
    const { gasPrice = '0' } = gasFeeEstimates;
    const selectedGasEstimates = gasFeeEstimates[txData.userFeeLevel] || {};
    if (txData.txParams?.type === TransactionEnvelopeType.legacy) {
      gasEstimationObject.gasPrice =
        txData.txParams?.gasPrice ?? decGWEIToHexWEI(gasPrice);
    } else {
      const { suggestedMaxPriorityFeePerGas, suggestedMaxFeePerGas } =
        selectedGasEstimates;
      gasEstimationObject.maxFeePerGas =
        txData.txParams?.maxFeePerGas &&
        (txData.userFeeLevel === CUSTOM_GAS_ESTIMATE || !suggestedMaxFeePerGas)
          ? txData.txParams?.maxFeePerGas
          : decGWEIToHexWEI(suggestedMaxFeePerGas || gasPrice);
      gasEstimationObject.maxPriorityFeePerGas =
        txData.txParams?.maxPriorityFeePerGas &&
        (txData.userFeeLevel === CUSTOM_GAS_ESTIMATE ||
          !suggestedMaxPriorityFeePerGas)
          ? txData.txParams?.maxPriorityFeePerGas
          : (suggestedMaxPriorityFeePerGas &&
              decGWEIToHexWEI(suggestedMaxPriorityFeePerGas)) ||
            gasEstimationObject.maxFeePerGas;
      gasEstimationObject.baseFeePerGas = decGWEIToHexWEI(
        gasFeeEstimates.estimatedBaseFee,
      );
    }
  } else {
    switch (gasEstimateType) {
      case GasEstimateTypes.none:
        gasEstimationObject.gasPrice = txData.txParams?.gasPrice ?? '0x0';
        break;
      case GasEstimateTypes.ethGasPrice:
        gasEstimationObject.gasPrice =
          txData.txParams?.gasPrice ??
          decGWEIToHexWEI(gasFeeEstimates.gasPrice);
        break;
      case GasEstimateTypes.legacy:
        gasEstimationObject.gasPrice =
          txData.txParams?.gasPrice ?? getAveragePriceEstimateInHexWEI(state);
        break;
      case GasEstimateTypes.feeMarket:
        break;
      default:
        break;
    }
  }

  const { txParams: { value = '0x0' } = {} } = txData;

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

  const hexMinimumTransactionFee =
    getMinimumGasTotalInHexWei(gasEstimationObject);
  const hexMaximumTransactionFee =
    getMaximumGasTotalInHexWei(gasEstimationObject);

  const fiatMinimumTransactionFee = getTransactionFee({
    value: hexMinimumTransactionFee,
    fromCurrency: nativeCurrency,
    toCurrency: currentCurrency,
    numberOfDecimals: 2,
    conversionRate,
  });

  const fiatMaximumTransactionFee = getTransactionFee({
    value: hexMaximumTransactionFee,
    fromCurrency: nativeCurrency,
    toCurrency: currentCurrency,
    numberOfDecimals: 2,
    conversionRate,
  });

  const ethTransactionFee = getTransactionFee({
    value: hexMinimumTransactionFee,
    fromCurrency: nativeCurrency,
    toCurrency: nativeCurrency,
    numberOfDecimals: 6,
    conversionRate,
  });

  const fiatTransactionTotal = addFiat(
    fiatMinimumTransactionFee,
    fiatTransactionAmount,
  );
  const ethTransactionTotal = addEth(ethTransactionFee, ethTransactionAmount);
  const hexTransactionTotal = sumHexes(value, hexMinimumTransactionFee);

  return {
    hexTransactionAmount: value,
    fiatTransactionAmount,
    ethTransactionAmount,
    hexMinimumTransactionFee,
    fiatMinimumTransactionFee,
    hexMaximumTransactionFee,
    fiatMaximumTransactionFee,
    ethTransactionFee,
    fiatTransactionTotal,
    ethTransactionTotal,
    hexTransactionTotal,
    gasEstimationObject,
  };
};
