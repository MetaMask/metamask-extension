import { connect } from 'react-redux';
import { compose } from 'redux';
import { withRouter } from 'react-router-dom';
import {
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import { captureException } from '@sentry/browser';

///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
import { showCustodianDeepLink } from '@metamask-institutional/extension';
import { mmiActionsFactory } from '../../../store/institutional/institution-background';
import { CHAIN_ID_TO_RPC_URL_MAP } from '../../../../shared/constants/network';

///: END:ONLY_INCLUDE_IF
import { clearConfirmTransaction } from '../../../ducks/confirm-transaction/confirm-transaction.duck';

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
  updateTransaction,
  updateEditableParams,
  setSwapsFeatureFlags,
  fetchSmartTransactionsLiveness,
  setNextNonce,
} from '../../../store/actions';
import { isBalanceSufficient } from '../send/send.utils';
import { shortenAddress, valuesFor } from '../../../helpers/utils/util';
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
  doesAddressRequireLedgerHidConnection,
  getTokenList,
  getEnsResolutionByAddress,
  getUnapprovedTransaction,
  getFullTxData,
  getUseCurrencyRateCheck,
  getUnapprovedTransactions,
  getInternalAccountByAddress,
  getApprovedAndSignedTransactions,
  getSelectedNetworkClientId,
  getPrioritizedUnapprovedTemplatedConfirmations,
} from '../../../selectors';
import {
  getCurrentChainSupportsSmartTransactions,
  ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
  getSmartTransactionsEnabled,
  ///: END:ONLY_INCLUDE_IF
  getSmartTransactionsPreferenceEnabled,
} from '../../../../shared/modules/selectors';
import { getMostRecentOverviewPage } from '../../../ducks/history/history';
import {
  isAddressLedger,
  updateGasFees,
  getIsGasEstimatesLoading,
  getSendToAccounts,
  findKeyringForAddress,
} from '../../../ducks/metamask/metamask';
import {
  addHexPrefix,
  ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
  getEnvironmentType,
  ///: END:ONLY_INCLUDE_IF
  // TODO: Remove restricted import
  // eslint-disable-next-line import/no-restricted-paths
} from '../../../../app/scripts/lib/util';

import {
  parseStandardTokenTransactionData,
  txParamsAreDappSuggested,
} from '../../../../shared/modules/transaction.utils';
import { toChecksumHexAddress } from '../../../../shared/modules/hexstring-utils';

import { getGasLoadingAnimationIsShowing } from '../../../ducks/app/app';
import { isLegacyTransaction } from '../../../helpers/utils/transactions.util';
import { CUSTOM_GAS_ESTIMATE } from '../../../../shared/constants/gas';

// eslint-disable-next-line import/no-duplicates
import { getIsUsingPaymaster } from '../../../selectors/account-abstraction';

import {
  selectConversionRateByChainId,
  selectNetworkConfigurationByChainId,
  // eslint-disable-next-line import/no-duplicates
} from '../../../selectors/selectors';

///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
import {
  getAccountType,
  selectDefaultRpcEndpointByChainId,
  // eslint-disable-next-line import/no-duplicates
} from '../../../selectors/selectors';
// eslint-disable-next-line import/no-duplicates
import { ENVIRONMENT_TYPE_NOTIFICATION } from '../../../../shared/constants/app';
import {
  getIsNoteToTraderSupported,
  getIsCustodianPublishesTransactionSupported,
} from '../../../selectors/institutional/selectors';
import { showCustodyConfirmLink } from '../../../store/institutional/institution-actions';
///: END:ONLY_INCLUDE_IF
import { calcGasTotal } from '../../../../shared/lib/transactions-controller-utils';
import { subtractHexes } from '../../../../shared/modules/conversion.utils';
import { getIsNativeTokenBuyable } from '../../../ducks/ramps';
import ConfirmTransactionBase from './confirm-transaction-base.component';

let customNonceValue = '';
const customNonceMerge = (txData) => {
  return customNonceValue
    ? {
        ...txData,
        customNonceValue,
      }
    : txData;
};

function addressIsNew(toAccounts, newAddress) {
  const newAddressNormalized = newAddress.toLowerCase();
  const foundMatching = toAccounts.some(
    ({ address }) => address.toLowerCase() === newAddressNormalized,
  );
  return !foundMatching;
}

function getTokenToAddress(data, type) {
  if (
    ![
      TransactionType.tokenMethodTransferFrom,
      TransactionType.tokenMethodSafeTransferFrom,
      TransactionType.tokenMethodTransfer,
    ].includes(type)
  ) {
    return undefined;
  }

  const transactionData = parseStandardTokenTransactionData(data);

  const value = transactionData?.args?._to || transactionData?.args?.to;

  return value?.toString().toLowerCase();
}

const mapStateToProps = (state, ownProps) => {
  const {
    toAddress: propsToAddress,
    customTxParamsData,
    match: { params = {} },
  } = ownProps;
  const { id: paramsTransactionId } = params;
  const isMainnet = getIsMainnet(state);
  const selectedNetworkClientId = getSelectedNetworkClientId(state);

  ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
  const envType = getEnvironmentType();
  const isNotification = envType === ENVIRONMENT_TYPE_NOTIFICATION;
  ///: END:ONLY_INCLUDE_IF

  const isGasEstimatesLoading = getIsGasEstimatesLoading(state);
  const gasLoadingAnimationIsShowing = getGasLoadingAnimationIsShowing(state);
  const isBuyableChain = getIsNativeTokenBuyable(state);
  const { confirmTransaction, metamask } = state;
  const { addressBook, nextNonce } = metamask;
  const unapprovedTxs = getUnapprovedTransactions(state);

  const { tokenData, txData, tokenProps, nonce } = confirmTransaction;
  const { txParams = {}, id: transactionId, type } = txData;
  const txId = transactionId || paramsTransactionId;
  const transaction = getUnapprovedTransaction(state, txId) ?? {};
  const { chainId } = transaction;
  const conversionRate = selectConversionRateByChainId(state, chainId);

  const {
    from: fromAddress,
    to: txParamsToAddress,
    gasPrice,
    gas: gasLimit,
    data,
  } = (transaction && transaction.txParams) || txParams;

  const accounts = getMetaMaskAccounts(state);
  const smartTransactionsPreferenceEnabled =
    getSmartTransactionsPreferenceEnabled(state);
  const currentChainSupportsSmartTransactions =
    getCurrentChainSupportsSmartTransactions(state);

  if (!accounts[fromAddress]) {
    captureException(
      new Error(
        `ConfirmTransactionBase: Unexpected state - No account found for sender address. ` +
          `chainId: ${chainId}. fromAddress?: ${Boolean(fromAddress)}`,
      ),
    );
  }

  const { balance } = accounts[fromAddress] || { balance: '0x0' };
  const fromInternalAccount = getInternalAccountByAddress(state, fromAddress);
  const fromName = fromInternalAccount?.metadata.name;
  const keyring = findKeyringForAddress(state, fromAddress);

  const tokenToAddress = getTokenToAddress(data, type);
  const toAddress = propsToAddress || tokenToAddress || txParamsToAddress;

  const toAccounts = getSendToAccounts(state);

  const tokenList = getTokenList(state);

  const toName =
    getInternalAccountByAddress(state, toAddress)?.metadata.name ||
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
    hexTransactionAmount: initialHexTransactionAmount,
    hexMaximumTransactionFee,
    hexMinimumTransactionFee,
    gasEstimationObject,
  } = transactionFeeSelector(state, transaction);

  const useMaxValue = state.confirmTransaction.maxValueMode?.[txId] ?? false;
  const maxValue = subtractHexes(balance, hexMaximumTransactionFee);

  const hexTransactionAmount = useMaxValue
    ? maxValue
    : initialHexTransactionAmount;

  const currentNetworkUnapprovedTxs = Object.keys(unapprovedTxs)
    .filter((key) => unapprovedTxs[key].chainId === chainId)
    .reduce((acc, key) => ({ ...acc, [key]: unapprovedTxs[key] }), {});
  const unapprovedTxCount = valuesFor(currentNetworkUnapprovedTxs).length;

  const insufficientBalance = !isBalanceSufficient({
    hexTransactionAmount,
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
    hexTransactionAmount,
  );

  customNonceValue = getCustomNonceValue(state);
  const isEthGasPriceFetched = getIsEthGasPriceFetched(state);
  const noGasPrice = !supportsEIP1559 && getNoGasPriceFetched(state);
  const gasFeeIsCustom =
    fullTxData.userFeeLevel === CUSTOM_GAS_ESTIMATE ||
    txParamsAreDappSuggested(fullTxData);
  const fromAddressIsLedger = isAddressLedger(state, fromAddress);

  const { nativeCurrency } =
    selectNetworkConfigurationByChainId(state, chainId) ?? {};

  ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
  const accountType = getAccountType(state, fromAddress);
  const fromChecksumHexAddress = toChecksumHexAddress(fromAddress);
  const isNoteToTraderSupported = getIsNoteToTraderSupported(
    state,
    fromChecksumHexAddress,
  );
  const custodianPublishesTransaction =
    getIsCustodianPublishesTransactionSupported(state, fromChecksumHexAddress);
  const builtinRpcUrl = CHAIN_ID_TO_RPC_URL_MAP[chainId];

  const { url: customRpcUrl } =
    selectDefaultRpcEndpointByChainId(state, chainId) ?? {};

  const rpcUrl = customRpcUrl || builtinRpcUrl;

  ///: END:ONLY_INCLUDE_IF

  const hardwareWalletRequiresConnection =
    doesAddressRequireLedgerHidConnection(state, fromAddress);

  const isUsingPaymaster = getIsUsingPaymaster(state);

  let isSigningOrSubmitting = Boolean(
    getApprovedAndSignedTransactions(state).length,
  );

  ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
  isSigningOrSubmitting = false;
  ///: END:ONLY_INCLUDE_IF

  const isUserOpContractDeployError =
    fullTxData.isUserOperation && type === TransactionType.deployContract;

  const hasPriorityApprovalRequest = Boolean(
    getPrioritizedUnapprovedTemplatedConfirmations(state).length,
  );

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
    hexMinimumTransactionFee,
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
    selectedNetworkClientId,
    isEthGasPriceFetched,
    noGasPrice,
    supportsEIP1559,
    gasIsLoading: isGasEstimatesLoading || gasLoadingAnimationIsShowing,
    maxFeePerGas: gasEstimationObject.maxFeePerGas,
    maxPriorityFeePerGas: gasEstimationObject.maxPriorityFeePerGas,
    baseFeePerGas: gasEstimationObject.baseFeePerGas,
    gasFeeIsCustom,
    showLedgerSteps: fromAddressIsLedger,
    nativeCurrency,
    hardwareWalletRequiresConnection,
    chainId,
    isBuyableChain,
    useCurrencyRateCheck: getUseCurrencyRateCheck(state),
    keyringForAccount: keyring,
    ///: BEGIN:ONLY_INCLUDE_IF(keyring-snaps)
    fromInternalAccount,
    ///: END:ONLY_INCLUDE_IF
    isUsingPaymaster,
    isSigningOrSubmitting,
    isUserOpContractDeployError,
    useMaxValue,
    maxValue,
    smartTransactionsPreferenceEnabled,
    currentChainSupportsSmartTransactions,
    hasPriorityApprovalRequest,
    ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
    accountType,
    isNoteToTraderSupported,
    isNotification,
    custodianPublishesTransaction,
    rpcUrl,
    isSmartTransactionsEnabled: getSmartTransactionsEnabled(state),
    ///: END:ONLY_INCLUDE_IF
  };
};

export const mapDispatchToProps = (dispatch) => {
  ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
  const mmiActions = mmiActionsFactory();
  ///: END:ONLY_INCLUDE_IF
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
    sendTransaction: (
      txData,
      dontShowLoadingIndicator,
      loadingIndicatorMessage,
    ) =>
      dispatch(
        updateAndApproveTx(
          customNonceMerge(txData),
          dontShowLoadingIndicator,
          loadingIndicatorMessage,
        ),
      ),
    updateTransaction: (txMeta) => {
      dispatch(updateTransaction(txMeta, true));
    },
    updateTransactionValue: (id, value) => {
      dispatch(updateEditableParams(id, { value }));
    },
    setSwapsFeatureFlags: (swapsFeatureFlags) => {
      dispatch(setSwapsFeatureFlags(swapsFeatureFlags));
    },
    fetchSmartTransactionsLiveness: () => {
      dispatch(fetchSmartTransactionsLiveness());
    },
    getNextNonce: (address) => dispatch(getNextNonce(address)),
    setNextNonce: (val) => dispatch(setNextNonce(val)),
    setDefaultHomeActiveTabName: (tabName) =>
      dispatch(setDefaultHomeActiveTabName(tabName)),
    updateTransactionGasFees: (gasFees) => {
      dispatch(updateGasFees({ ...gasFees, expectHexWei: true }));
    },
    addToAddressBookIfNew: (newAddress, toAccounts, nickname = '') => {
      const hexPrefixedAddress = addHexPrefix(newAddress);
      if (addressIsNew(toAccounts, hexPrefixedAddress)) {
        dispatch(addToAddressBook(hexPrefixedAddress, nickname));
      }
    },
    ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
    getCustodianConfirmDeepLink: (id) =>
      dispatch(mmiActions.getCustodianConfirmDeepLink(id)),
    showTransactionsFailedModal: (errorMessage, closeNotification) =>
      dispatch(
        showModal({
          name: 'TRANSACTION_FAILED',
          errorMessage,
          closeNotification,
        }),
      ),
    showCustodianDeepLink: ({
      txId,
      fromAddress,
      closeNotification,
      onDeepLinkFetched,
      onDeepLinkShown,
    }) =>
      showCustodianDeepLink({
        dispatch,
        mmiActions,
        txId,
        fromAddress,
        closeNotification,
        onDeepLinkFetched,
        onDeepLinkShown,
        showCustodyConfirmLink,
      }),
    setWaitForConfirmDeepLinkDialog: (wait) =>
      dispatch(mmiActions.setWaitForConfirmDeepLinkDialog(wait)),
    ///: END:ONLY_INCLUDE_IF
  };
};

const mergeProps = (stateProps, dispatchProps, ownProps) => {
  const { txData, unapprovedTxs } = stateProps;

  const {
    cancelAllTransactions: dispatchCancelAllTransactions,
    updateTransactionGasFees: dispatchUpdateTransactionGasFees,
    ...otherDispatchProps
  } = dispatchProps;

  let isMainBetaFlask = ownProps.isMainBetaFlask || false;

  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
  if (ownProps.isMainBetaFlask === undefined) {
    isMainBetaFlask = true;
  }
  ///: END:ONLY_INCLUDE_IF

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
    isMainBetaFlask,
  };
};

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps, mergeProps),
)(ConfirmTransactionBase);
