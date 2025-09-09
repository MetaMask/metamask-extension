import { createSelector } from 'reselect';
import { TransactionEnvelopeType } from '@metamask/transaction-controller';
import txHelper from '../helpers/utils/tx-helper';
import {
  getTransactionFee,
  addFiat,
  addEth,
} from '../helpers/utils/confirm-tx.util';
import {
  getGasEstimateType,
  getGasFeeEstimates,
  getNativeCurrency,
} from '../ducks/metamask/metamask';
import {
  GasEstimateTypes,
  CUSTOM_GAS_ESTIMATE,
} from '../../shared/constants/gas';
import {
  getMaximumGasTotalInHexWei,
  getMinimumGasTotalInHexWei,
} from '../../shared/modules/gas.utils';
import {
  decGWEIToHexWEI,
  getValueFromWeiHex,
  sumHexes,
} from '../../shared/modules/conversion.utils';
import { getProviderConfig } from '../../shared/modules/selectors/networks';
import { getAveragePriceEstimateInHexWEI } from './custom-gas';
import {
  checkNetworkAndAccountSupports1559,
  getMetaMaskAccounts,
} from './selectors';
import {
  getUnapprovedTransactions,
  selectTransactionMetadata,
  selectTransactionSender,
  unapprovedPersonalMsgsSelector,
  unapprovedDecryptMsgsSelector,
  unapprovedEncryptionPublicKeyMsgsSelector,
  unapprovedTypedMessagesSelector,
} from './transactions';

const unapprovedTxsSelector = (state) => getUnapprovedTransactions(state);

export const unconfirmedTransactionsListSelector = createSelector(
  unapprovedTxsSelector,
  unapprovedPersonalMsgsSelector,
  unapprovedDecryptMsgsSelector,
  unapprovedEncryptionPublicKeyMsgsSelector,
  unapprovedTypedMessagesSelector,
  (
    unapprovedTxs = {},
    unapprovedPersonalMsgs = {},
    unapprovedDecryptMsgs = {},
    unapprovedEncryptionPublicKeyMsgs = {},
    unapprovedTypedMessages = {},
  ) =>
    txHelper(
      unapprovedTxs,
      unapprovedPersonalMsgs,
      unapprovedDecryptMsgs,
      unapprovedEncryptionPublicKeyMsgs,
      unapprovedTypedMessages,
    ) || [],
);

export const unconfirmedTransactionsHashSelector = createSelector(
  unapprovedTxsSelector,
  unapprovedPersonalMsgsSelector,
  unapprovedDecryptMsgsSelector,
  unapprovedEncryptionPublicKeyMsgsSelector,
  unapprovedTypedMessagesSelector,
  (
    unapprovedTxs = {},
    unapprovedPersonalMsgs = {},
    unapprovedDecryptMsgs = {},
    unapprovedEncryptionPublicKeyMsgs = {},
    unapprovedTypedMessages = {},
  ) => ({
    ...unapprovedTxs,
    ...unapprovedPersonalMsgs,
    ...unapprovedDecryptMsgs,
    ...unapprovedEncryptionPublicKeyMsgs,
    ...unapprovedTypedMessages,
  }),
);

export const unconfirmedMessagesHashSelector = createSelector(
  unapprovedPersonalMsgsSelector,
  unapprovedDecryptMsgsSelector,
  unapprovedEncryptionPublicKeyMsgsSelector,
  unapprovedTypedMessagesSelector,
  (
    unapprovedPersonalMsgs = {},
    unapprovedDecryptMsgs = {},
    unapprovedEncryptionPublicKeyMsgs = {},
    unapprovedTypedMessages = {},
  ) => {
    return {
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

const txParamsSelector = createSelector(
  txDataSelector,
  (txData) => (txData && txData.txParams) || {},
);

export const tokenAddressSelector = createSelector(
  txParamsSelector,
  (txParams) => txParams && txParams.to,
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
    gasLimitNoBuffer: txData.gasLimitNoBuffer,
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
      case GasEstimateTypes.feeMarket:
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

export function selectTransactionFeeById(state, transactionId) {
  const transactionMetadata = selectTransactionMetadata(state, transactionId);
  return transactionFeeSelector(state, transactionMetadata ?? {});
}

// Cannot use createSelector due to circular dependency caused by getMetaMaskAccounts.
// chainId is optional parameter here
export function selectTransactionAvailableBalance(
  state,
  transactionId,
  chainId,
) {
  const accounts = getMetaMaskAccounts(state, chainId);
  const sender = selectTransactionSender(state, transactionId);

  return accounts[sender]?.balance;
}

export function selectIsMaxValueEnabled(state, transactionId) {
  return state.confirmTransaction.maxValueMode?.[transactionId] ?? false;
}

const maxValueModeSelector = (state) => state.confirmTransaction.maxValueMode;

export function selectMaxValueModeForTransaction(state, transactionId) {
  const maxValueModes = maxValueModeSelector(state);
  return maxValueModes[transactionId];
}
