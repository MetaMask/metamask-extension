import { createSelector } from 'reselect';
import { TransactionEnvelopeType } from '@metamask/transaction-controller';
import { toChecksumHexAddress } from '@metamask/controller-utils';
import txHelper from '../helpers/utils/tx-helper';
import type { MetaMaskReduxState } from '../store/store';
import {
  getTransactionFee,
  addFiat,
  addEth,
} from '../helpers/utils/confirm-tx.util';
import {
  getAccountTrackerControllerAccountsByChainId,
  getCurrencyRateControllerCurrencyRates,
  getCurrencyRateControllerCurrentCurrency,
} from '../../shared/lib/selectors/assets-migration';
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
} from '../../shared/lib/gas.utils';
import {
  decGWEIToHexWEI,
  getValueFromWeiHex,
  sumHexes,
} from '../../shared/lib/conversion.utils';
import { getProviderConfig } from '../../shared/lib/selectors/networks';
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

const unapprovedTxsSelector = (state: MetaMaskReduxState) =>
  getUnapprovedTransactions(state);

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
export const getUse4ByteResolution = (state: MetaMaskReduxState) =>
  state.metamask.use4ByteResolution;
export const currentCurrencySelector = (state: MetaMaskReduxState) =>
  getCurrencyRateControllerCurrentCurrency(state);
export const conversionRateSelector = (state: MetaMaskReduxState) =>
  getCurrencyRateControllerCurrencyRates(state)[getProviderConfig(state).ticker]
    ?.conversionRate;
export const txDataSelector = (state: MetaMaskReduxState) =>
  state.confirmTransaction?.txData;

export const transactionFeeSelector = function (
  state: MetaMaskReduxState,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  txData: any,
) {
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

export function selectTransactionFeeById(
  state: MetaMaskReduxState,
  transactionId: string | number,
) {
  const transactionMetadata = selectTransactionMetadata(state, transactionId);
  return transactionFeeSelector(state, transactionMetadata ?? {});
}

// Cannot use createSelector due to circular dependency caused by getMetaMaskAccounts.
// chainId is optional parameter here
export function selectTransactionAvailableBalance(
  state: MetaMaskReduxState,
  transactionId: string | number,
  chainId?: string,
) {
  const sender = selectTransactionSender(state, transactionId);

  if (chainId && sender) {
    const checksummedSender = toChecksumHexAddress(sender);
    // Raw accountsByChainId contains balances for all chains regardless of
    // Network Manager enablement, preventing stale/zero balances on cross-chain sends.
    // When assets-unify is fully enabled raw state may be empty, so fall back to
    // the unified selector which derives balances from AssetsController.
    const chainBalance =
      state.metamask.accountsByChainId?.[chainId]?.[checksummedSender]
        ?.balance ??
      getAccountTrackerControllerAccountsByChainId(state)?.[chainId]?.[
        checksummedSender
      ]?.balance;
    if (chainBalance) {
      return chainBalance;
    }
  }

  const accounts = getMetaMaskAccounts(state, chainId);
  return accounts[sender]?.balance;
}
const maxValueModeSelector = (state: MetaMaskReduxState) =>
  state.confirmTransaction.maxValueMode;

export function selectMaxValueModeForTransaction(
  state: MetaMaskReduxState,
  transactionId: string | number,
) {
  const maxValueModes = maxValueModeSelector(state);
  return maxValueModes[transactionId];
}
