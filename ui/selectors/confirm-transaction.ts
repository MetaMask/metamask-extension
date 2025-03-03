import { createSelector } from 'reselect';
import {
  TransactionEnvelopeType,
  TransactionMeta,
} from '@metamask/transaction-controller';
import { getKnownPropertyNames, Hex } from '@metamask/utils';
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
import { MetaMaskReduxState } from '../store/store';
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
  subtractHexes,
  sumHexes,
} from '../../shared/modules/conversion.utils';
import {
  getProviderConfig,
  getCurrentChainId,
} from '../../shared/modules/selectors/networks';
import { EtherDenomination } from '../../shared/constants/common';
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

export const unconfirmedTransactionsListSelector = createSelector(
  getCurrentChainId,
  getUnapprovedTransactions,
  unapprovedPersonalMsgsSelector,
  unapprovedDecryptMsgsSelector,
  unapprovedEncryptionPublicKeyMsgsSelector,
  unapprovedTypedMessagesSelector,
  (
    chainId,
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
      chainId,
    ) ?? [],
);

export const unconfirmedTransactionsHashSelector = createSelector(
  getCurrentChainId,
  getUnapprovedTransactions,
  unapprovedPersonalMsgsSelector,
  unapprovedDecryptMsgsSelector,
  unapprovedEncryptionPublicKeyMsgsSelector,
  unapprovedTypedMessagesSelector,
  (
    chainId,
    unapprovedTxs = {},
    unapprovedPersonalMsgs = {},
    unapprovedDecryptMsgs = {},
    unapprovedEncryptionPublicKeyMsgs = {},
    unapprovedTypedMessages = {},
  ) => {
    const filteredUnapprovedTxs = getKnownPropertyNames(unapprovedTxs).reduce<{
      [address: string]: TransactionMeta;
    }>((acc, address) => {
      const transactions = { ...acc };

      if (unapprovedTxs[address].chainId === chainId) {
        transactions[address] = unapprovedTxs[address];
      }

      return transactions;
    }, {});

    return {
      ...filteredUnapprovedTxs,
      ...unapprovedPersonalMsgs,
      ...unapprovedDecryptMsgs,
      ...unapprovedEncryptionPublicKeyMsgs,
      ...unapprovedTypedMessages,
    };
  },
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
export const use4ByteResolutionSelector = (state: MetaMaskReduxState) =>
  state.metamask.use4ByteResolution;
export const currentCurrencySelector = (state: MetaMaskReduxState) =>
  state.metamask.currentCurrency;
export const conversionRateSelector = (state: MetaMaskReduxState) =>
  state.metamask.currencyRates[getProviderConfig(state).ticker]?.conversionRate;
export const txDataSelector = (state: MetaMaskReduxState) =>
  state.confirmTransaction.txData;

const txParamsSelector = createSelector(
  txDataSelector,
  (txData) => txData?.txParams || {},
);

export const tokenAddressSelector = createSelector(
  txParamsSelector,
  (txParams) => txParams?.to,
);

export const transactionFeeSelector = createSelector(
  currentCurrencySelector,
  conversionRateSelector,
  getNativeCurrency,
  getGasFeeEstimates,
  getGasEstimateType,
  getAveragePriceEstimateInHexWEI,
  (
    state: Parameters<typeof checkNetworkAndAccountSupports1559>[0],
    txData: Partial<TransactionMeta>,
  ) => ({ state, txData }),
  (
    currentCurrency,
    conversionRate,
    nativeCurrency,
    gasFeeEstimates,
    gasEstimateType,
    averagePriceEstimateInHexWEI,
    { state, txData },
  ) => {
    const networkAndAccountSupportsEIP1559 =
      checkNetworkAndAccountSupports1559(state);

    const gasEstimationObject: Partial<TransactionMeta['txParams']> &
      Pick<TransactionMeta, 'baseFeePerGas'> = {
      gasLimit: txData.txParams?.gas ?? '0x0',
    };
    const gasPrice =
      'gasPrice' in gasFeeEstimates ? gasFeeEstimates.gasPrice : '0';

    if (networkAndAccountSupportsEIP1559) {
      const selectedGasEstimates =
        gasFeeEstimates[txData.userFeeLevel as keyof typeof gasFeeEstimates] ??
        {};
      if (txData.txParams?.type === TransactionEnvelopeType.legacy) {
        gasEstimationObject.gasPrice =
          txData.txParams?.gasPrice ?? decGWEIToHexWEI(gasPrice);
      } else {
        const { suggestedMaxPriorityFeePerGas, suggestedMaxFeePerGas } =
          selectedGasEstimates;
        gasEstimationObject.maxFeePerGas =
          txData.txParams?.maxFeePerGas &&
          (txData.userFeeLevel === CUSTOM_GAS_ESTIMATE ||
            !suggestedMaxFeePerGas)
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
        gasEstimationObject.baseFeePerGas =
          'estimatedBaseFee' in gasFeeEstimates
            ? (decGWEIToHexWEI(gasFeeEstimates.estimatedBaseFee) as Hex)
            : '0x0';
      }
    } else {
      switch (gasEstimateType) {
        case GasEstimateTypes.feeMarket:
        case GasEstimateTypes.none:
          gasEstimationObject.gasPrice = txData.txParams?.gasPrice ?? '0x0';
          break;
        case GasEstimateTypes.ethGasPrice:
          gasEstimationObject.gasPrice =
            txData.txParams?.gasPrice ?? decGWEIToHexWEI(gasPrice);
          break;
        case GasEstimateTypes.legacy:
          gasEstimationObject.gasPrice =
            txData.txParams?.gasPrice ?? averagePriceEstimateInHexWEI;
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
      fromCurrency: nativeCurrency ?? EtherDenomination.ETH,
      toCurrency: currentCurrency,
      numberOfDecimals: 2,
      conversionRate,
    });

    const fiatMaximumTransactionFee = getTransactionFee({
      value: hexMaximumTransactionFee,
      fromCurrency: nativeCurrency ?? EtherDenomination.ETH,
      toCurrency: currentCurrency,
      numberOfDecimals: 2,
      conversionRate,
    });

    const ethTransactionFee = getTransactionFee({
      value: hexMinimumTransactionFee,
      fromCurrency: nativeCurrency ?? EtherDenomination.ETH,
      toCurrency: nativeCurrency ?? EtherDenomination.ETH,
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
  },
);

export function selectTransactionFeeById(
  state: MetaMaskReduxState,
  transactionId: string,
) {
  const transactionMetadata = selectTransactionMetadata(state, transactionId);
  return transactionFeeSelector(state, transactionMetadata ?? {});
}

// Cannot use createSelector due to circular dependency caused by getMetaMaskAccounts.
export function selectTransactionAvailableBalance(
  state: MetaMaskReduxState,
  transactionId: string,
) {
  const accounts = getMetaMaskAccounts(state);
  const sender = selectTransactionSender(state, transactionId);

  return accounts[sender]?.balance;
}

export function selectIsMaxValueEnabled(
  state: MetaMaskReduxState,
  transactionId: string,
) {
  // TODO: Remove type assertion once `confirmTransaction` slice is converted to TypeScript
  return (
    (
      state.confirmTransaction.maxValueMode as {
        [transactionId: string]: boolean;
      }
    )?.[transactionId] ?? false
  );
}

export const selectMaxValue = createSelector(
  selectTransactionFeeById,
  selectTransactionAvailableBalance,
  (transactionFee, balance) =>
    balance && transactionFee?.hexMaximumTransactionFee
      ? subtractHexes(balance, transactionFee.hexMaximumTransactionFee)
      : undefined,
);

/** @type {state: any, transactionId: string => string} */
export const selectTransactionValue = createSelector(
  selectIsMaxValueEnabled,
  selectMaxValue,
  selectTransactionMetadata,
  (isMaxValueEnabled, maxValue, transactionMetadata) =>
    isMaxValueEnabled ? maxValue : transactionMetadata?.txParams?.value,
);

const maxValueModeSelector = (state: MetaMaskReduxState) =>
  state.confirmTransaction.maxValueMode;

export function selectMaxValueModeForTransaction(
  state: MetaMaskReduxState,
  transactionId: string,
) {
  const maxValueModes = maxValueModeSelector(state);
  return (
    // TODO: Remove type assertion once `confirmTransaction` slice is converted to TypeScript
    (
      maxValueModes as {
        [transactionId: string]: boolean;
      }
    )[transactionId]
  );
}
