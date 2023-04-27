import { connect } from 'react-redux';
import { compose } from 'redux';
import { withRouter } from 'react-router-dom';

import { clearConfirmTransaction } from '../../ducks/confirm-transaction/confirm-transaction.duck';

import {
  updateCustomNonce,
  cancelTx,
  cancelTxs,
  updateAndApproveTx,
  showModal,
  getNextNonce,
  tryReverseResolveAddress,
  setDefaultHomeActiveTabName,
  addToAddressBook,
} from '../../store/actions';
import { isBalanceSufficient } from '../send/send.utils';
import { shortenAddress, valuesFor } from '../../helpers/utils/util';
import {
  getAdvancedInlineGasShown,
  getCustomNonceValue,
  getIsMainnet,
  getKnownMethodData,
  getMetaMaskAccounts,
  getUseNonceField,
  transactionFeeSelector,
  getNoGasPriceFetched,
  getIsEthGasPriceFetched,
  getShouldShowFiat,
  checkNetworkAndAccountSupports1559,
  getPreferences,
  doesAddressRequireLedgerHidConnection,
  getTokenList,
  getIsMultiLayerFeeNetwork,
  getEnsResolutionByAddress,
  getUnapprovedTransaction,
  getFullTxData,
  getUseCurrencyRateCheck,
} from '../../selectors';
import { getMostRecentOverviewPage } from '../../ducks/history/history';
import {
  isAddressLedger,
  updateGasFees,
  getIsGasEstimatesLoading,
  getNativeCurrency,
  getSendToAccounts,
  getProviderConfig,
} from '../../ducks/metamask/metamask';
import { addHexPrefix } from '../../../app/scripts/lib/util';

import {
  parseStandardTokenTransactionData,
  transactionMatchesNetwork,
  txParamsAreDappSuggested,
} from '../../../shared/modules/transaction.utils';
import { toChecksumHexAddress } from '../../../shared/modules/hexstring-utils';

import { getGasLoadingAnimationIsShowing } from '../../ducks/app/app';
import { isLegacyTransaction } from '../../helpers/utils/transactions.util';
import { CUSTOM_GAS_ESTIMATE } from '../../../shared/constants/gas';
import {
  TransactionStatus,
  TransactionType,
} from '../../../shared/constants/transaction';
import { getTokenAddressParam } from '../../helpers/utils/token-util';
import { calcGasTotal } from '../../../shared/lib/transactions-controller-utils';
import { withUseRamps } from '../../hooks/experiences/useRamps';
import ConfirmTransactionBase from './confirm-transaction-base.component';

let customNonceValue = '';
const customNonceMerge = (txData) =>
  customNonceValue
    ? {
        ...txData,
        customNonceValue,
      }
    : txData;

function addressIsNew(toAccounts, newAddress) {
  const newAddressNormalized = newAddress.toLowerCase();
  const foundMatching = toAccounts.some(
    ({ address }) => address.toLowerCase() === newAddressNormalized,
  );
  return !foundMatching;
}

const mapStateToProps = (state, ownProps) => {
  const {
    toAddress: propsToAddress,
    customTxParamsData,
    match: { params = {} },
  } = ownProps;
  const { id: paramsTransactionId } = params;
  const isMainnet = getIsMainnet(state);

  const isGasEstimatesLoading = getIsGasEstimatesLoading(state);
  const gasLoadingAnimationIsShowing = getGasLoadingAnimationIsShowing(state);
  const { confirmTransaction, metamask } = state;
  const {
    conversionRate,
    identities,
    addressBook,
    networkId,
    unapprovedTxs,
    nextNonce,
  } = metamask;
  const { chainId } = getProviderConfig(state);
  const { tokenData, txData, tokenProps, nonce } = confirmTransaction;
  const { txParams = {}, id: transactionId, type } = txData;
  const txId = transactionId || Number(paramsTransactionId);
  const transaction = getUnapprovedTransaction(state, txId);
  const {
    from: fromAddress,
    to: txParamsToAddress,
    gasPrice,
    gas: gasLimit,
    value: amount,
    data,
  } = (transaction && transaction.txParams) || txParams;
  const accounts = getMetaMaskAccounts(state);

  const transactionData = parseStandardTokenTransactionData(data);
  const tokenToAddress = getTokenAddressParam(transactionData);

  const { balance } = accounts[fromAddress];
  const { name: fromName } = identities[fromAddress];
  let toAddress = txParamsToAddress;
  if (type !== TransactionType.simpleSend) {
    toAddress = propsToAddress || tokenToAddress || txParamsToAddress;
  }

  const toAccounts = getSendToAccounts(state);

  const tokenList = getTokenList(state);

  const toName =
    identities[toAddress]?.name ||
    tokenList[toAddress?.toLowerCase()]?.name ||
    shortenAddress(toChecksumHexAddress(toAddress));

  const checksummedAddress = toChecksumHexAddress(toAddress);
  const addressBookObject =
    addressBook &&
    addressBook[chainId] &&
    addressBook[chainId][checksummedAddress];
  const toEns = getEnsResolutionByAddress(state, checksummedAddress);
  const toNickname = addressBookObject ? addressBookObject.name : '';
  const transactionStatus = transaction ? transaction.status : '';
  const supportsEIP1559 =
    checkNetworkAndAccountSupports1559(state) && !isLegacyTransaction(txParams);

  const {
    hexTransactionAmount,
    hexMaximumTransactionFee,
    hexTransactionTotal,
    gasEstimationObject,
  } = transactionFeeSelector(state, transaction);

  const currentNetworkUnapprovedTxs = Object.keys(unapprovedTxs)
    .filter((key) =>
      transactionMatchesNetwork(unapprovedTxs[key], chainId, networkId),
    )
    .reduce((acc, key) => ({ ...acc, [key]: unapprovedTxs[key] }), {});
  const unapprovedTxCount = valuesFor(currentNetworkUnapprovedTxs).length;

  const insufficientBalance = !isBalanceSufficient({
    amount,
    gasTotal: calcGasTotal(gasLimit, gasPrice),
    balance,
    conversionRate,
  });

  const methodData = getKnownMethodData(state, data) || {};

  const fullTxData = getFullTxData(
    state,
    txId,
    TransactionStatus.unapproved,
    customTxParamsData,
  );

  customNonceValue = getCustomNonceValue(state);
  const isEthGasPrice = getIsEthGasPriceFetched(state);
  const noGasPrice = !supportsEIP1559 && getNoGasPriceFetched(state);
  const { useNativeCurrencyAsPrimaryCurrency } = getPreferences(state);
  const gasFeeIsCustom =
    fullTxData.userFeeLevel === CUSTOM_GAS_ESTIMATE ||
    txParamsAreDappSuggested(fullTxData);
  const fromAddressIsLedger = isAddressLedger(state, fromAddress);
  const nativeCurrency = getNativeCurrency(state);

  const hardwareWalletRequiresConnection =
    doesAddressRequireLedgerHidConnection(state, fromAddress);

  const isMultiLayerFeeNetwork = getIsMultiLayerFeeNetwork(state);

  return {
    balance,
    fromAddress,
    fromName,
    toAccounts,
    toAddress,
    toEns,
    toName,
    toNickname,
    hexTransactionAmount,
    hexMaximumTransactionFee,
    hexTransactionTotal,
    txData: fullTxData,
    tokenData,
    methodData,
    tokenProps,
    conversionRate,
    transactionStatus,
    nonce,
    unapprovedTxs,
    unapprovedTxCount,
    customGas: {
      gasLimit,
      gasPrice,
    },
    advancedInlineGasShown: getAdvancedInlineGasShown(state),
    useNonceField: getUseNonceField(state),
    customNonceValue,
    insufficientBalance,
    hideFiatConversion: !getShouldShowFiat(state),
    type,
    nextNonce,
    mostRecentOverviewPage: getMostRecentOverviewPage(state),
    isMainnet,
    isEthGasPrice,
    noGasPrice,
    supportsEIP1559,
    gasIsLoading: isGasEstimatesLoading || gasLoadingAnimationIsShowing,
    useNativeCurrencyAsPrimaryCurrency,
    maxFeePerGas: gasEstimationObject.maxFeePerGas,
    maxPriorityFeePerGas: gasEstimationObject.maxPriorityFeePerGas,
    baseFeePerGas: gasEstimationObject.baseFeePerGas,
    gasFeeIsCustom,
    showLedgerSteps: fromAddressIsLedger,
    nativeCurrency,
    hardwareWalletRequiresConnection,
    isMultiLayerFeeNetwork,
    chainId,
    useCurrencyRateCheck: getUseCurrencyRateCheck(state),
  };
};

export const mapDispatchToProps = (dispatch) => {
  return {
    tryReverseResolveAddress: (address) => {
      return dispatch(tryReverseResolveAddress(address));
    },
    updateCustomNonce: (value) => {
      customNonceValue = value;
      dispatch(updateCustomNonce(value));
    },
    clearConfirmTransaction: () => dispatch(clearConfirmTransaction()),
    showTransactionConfirmedModal: ({ onSubmit }) => {
      return dispatch(showModal({ name: 'TRANSACTION_CONFIRMED', onSubmit }));
    },
    showRejectTransactionsConfirmationModal: ({
      onSubmit,
      unapprovedTxCount,
    }) => {
      return dispatch(
        showModal({ name: 'REJECT_TRANSACTIONS', onSubmit, unapprovedTxCount }),
      );
    },
    cancelTransaction: ({ id }) => dispatch(cancelTx({ id })),
    cancelAllTransactions: (txList) => dispatch(cancelTxs(txList)),
    sendTransaction: (txData) =>
      dispatch(updateAndApproveTx(customNonceMerge(txData))),
    getNextNonce: () => dispatch(getNextNonce()),
    setDefaultHomeActiveTabName: (tabName) =>
      dispatch(setDefaultHomeActiveTabName(tabName)),
    updateTransactionGasFees: (gasFees) => {
      dispatch(updateGasFees({ ...gasFees, expectHexWei: true }));
    },
    showBuyModal: () => dispatch(showModal({ name: 'DEPOSIT_ETHER' })),
    addToAddressBookIfNew: (newAddress, toAccounts, nickname = '') => {
      const hexPrefixedAddress = addHexPrefix(newAddress);
      if (addressIsNew(toAccounts, hexPrefixedAddress)) {
        dispatch(addToAddressBook(hexPrefixedAddress, nickname));
      }
    },
  };
};

const mergeProps = (stateProps, dispatchProps, ownProps) => {
  const { txData, unapprovedTxs } = stateProps;

  const {
    cancelAllTransactions: dispatchCancelAllTransactions,
    updateTransactionGasFees: dispatchUpdateTransactionGasFees,
    ...otherDispatchProps
  } = dispatchProps;

  return {
    ...stateProps,
    ...otherDispatchProps,
    ...ownProps,
    cancelAllTransactions: () =>
      dispatchCancelAllTransactions(valuesFor(unapprovedTxs)),
    updateGasAndCalculate: ({ gasLimit, gasPrice }) => {
      dispatchUpdateTransactionGasFees({
        gasLimit,
        gasPrice,
        transaction: txData,
      });
    },
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps, mergeProps),
)(withUseRamps(ConfirmTransactionBase));
