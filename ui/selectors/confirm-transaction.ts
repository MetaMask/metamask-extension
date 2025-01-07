import { createSelector } from 'reselect';
import { getKnownPropertyNames, Hex } from '@metamask/utils';
import {
  TransactionEnvelopeType,
  TransactionMeta,
} from '@metamask/transaction-controller';
import txHelper from '../helpers/utils/tx-helper';
import {
  roundExponential,
  getTransactionFee,
  addFiat,
  addEth,
} from '../helpers/utils/confirm-tx.util';
import { MetaMaskReduxState } from '../store/store';
import {
  getGasEstimateType,
  getGasFeeEstimates,
  getNativeCurrency,
  MetaMaskSliceControllerState,
} from '../ducks/metamask/metamask';
import { createDeepEqualSelector } from '../../shared/modules/selectors/util';
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
  subtractHexes,
  sumHexes,
} from '../../shared/modules/conversion.utils';
import {
  getProviderConfig,
  getCurrentChainId,
} from '../../shared/modules/selectors/networks';
import { getAveragePriceEstimateInHexWEI } from './custom-gas';
import {
  checkNetworkAndAccountSupports1559,
  getMetaMaskAccounts,
  getTokenExchangeRates,
  rawStateSelector,
} from './selectors';
import {
  getUnapprovedTransactions,
  selectTransactionMetadata,
  selectTransactionSender,
  unapprovedDecryptMsgsSelector,
  unapprovedEncryptionPublicKeyMsgsSelector,
  unapprovedPersonalMsgsSelector,
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
export const use4ByteResolutionSelector = (
  state: MetaMaskSliceControllerState<'PreferencesController'>,
) => state.metamask.PreferencesController.use4ByteResolution;
export const currentCurrencySelector = (
  state: MetaMaskSliceControllerState<'CurrencyController'>,
) => state.metamask.CurrencyController.currentCurrency;
export const conversionRateSelector = createDeepEqualSelector(
  (state: MetaMaskSliceControllerState<'CurrencyController'>) =>
    state.metamask.CurrencyController.currencyRates,
  getProviderConfig,
  (currencyRates, providerConfig) =>
    currencyRates[providerConfig.ticker]?.conversionRate,
);
export const txDataSelector = (
  state: Pick<MetaMaskReduxState, 'confirmTransaction'>,
) => state.confirmTransaction.txData;
const tokenDataSelector = (
  state: Pick<MetaMaskReduxState, 'confirmTransaction'>,
) => state.confirmTransaction.tokenData;
const tokenPropsSelector = (
  state: Pick<MetaMaskReduxState, 'confirmTransaction'>,
) => state.confirmTransaction.tokenProps;

const tokenDecimalsSelector = createSelector(
  tokenPropsSelector,
  (tokenProps) => tokenProps?.decimals,
);

const tokenDataArgsSelector = createSelector(
  tokenDataSelector,
  (tokenData) => tokenData?.args ?? [],
);

const txParamsSelector = createSelector(
  txDataSelector,
  (txData) => txData?.txParams ?? {},
);

export const tokenAddressSelector = createSelector(
  txParamsSelector,
  (txParams) => txParams?.to,
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
    if (args?.length) {
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
  getTokenExchangeRates,
  tokenAddressSelector,
  (contractExchangeRates, tokenAddress) => {
    const address = getKnownPropertyNames(contractExchangeRates).find(
      (contractAddress) => {
        return isEqualCaseInsensitive(contractAddress, tokenAddress);
      },
    );
    return address ? contractExchangeRates[address] : undefined;
  },
);

export const transactionFeeSelector = createDeepEqualSelector(
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
  },
);

export const selectTransactionFeeById = createDeepEqualSelector(
  rawStateSelector<Parameters<typeof transactionFeeSelector>[0]>,
  selectTransactionMetadata,
  (state, transactionMetadata) => {
    return transactionFeeSelector(state, transactionMetadata ?? {});
  },
);

// Cannot use createSelector due to circular dependency caused by getMetaMaskAccounts.
export const selectTransactionAvailableBalance = createDeepEqualSelector(
  (state: Parameters<typeof selectTransactionSender>[0], transactionId) => ({
    state,
    transactionId,
  }),
  getMetaMaskAccounts,
  ({ state, transactionId }, accounts) => {
    const sender = selectTransactionSender(state, transactionId);

    return sender ? accounts[sender]?.balance : undefined;
  },
);

export function selectIsMaxValueEnabled(
  state: Pick<MetaMaskReduxState, 'confirmTransaction'>,
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
    balance && transactionFee.hexMaximumTransactionFee
      ? subtractHexes(balance, transactionFee.hexMaximumTransactionFee)
      : undefined,
);

export const selectTransactionValue = createSelector(
  selectIsMaxValueEnabled,
  selectMaxValue,
  selectTransactionMetadata,
  (isMaxValueEnabled, maxValue, transactionMetadata) =>
    isMaxValueEnabled ? maxValue : transactionMetadata?.txParams?.value,
);
