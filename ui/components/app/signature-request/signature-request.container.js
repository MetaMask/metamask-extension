import { connect } from 'react-redux';
import { ethErrors, serializeError } from 'eth-rpc-errors';
import {
  accountsWithSendEtherInfoSelector,
  doesAddressRequireLedgerHidConnection,
  getCurrentChainId,
  getRpcPrefsForCurrentProvider,
  getSubjectMetadata,
  unconfirmedMessagesHashSelector,
  getTotalUnapprovedMessagesCount,
  getCurrentCurrency,
  getPreferences,
  conversionRateSelector,
  ///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
  getAccountType,
  getSelectedAccount,
  unapprovedTypedMessagesSelector,
  ///: END:ONLY_INCLUDE_IN
} from '../../../selectors';
import {
  isAddressLedger,
  getNativeCurrency,
  getProviderConfig,
} from '../../../ducks/metamask/metamask';
import { getAccountByAddress, valuesFor } from '../../../helpers/utils/util';
///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
// eslint-disable-next-line import/order
import { showCustodianDeepLink } from '@metamask-institutional/extension';
import {
  mmiActionsFactory,
  setTypedMessageInProgress,
} from '../../../store/institutional/institution-background';
import { getEnvironmentType } from '../../../../app/scripts/lib/util';
import { checkForUnapprovedTypedMessages } from '../../../store/institutional/institution-actions';
///: END:ONLY_INCLUDE_IN
import {
  ///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
  ENVIRONMENT_TYPE_NOTIFICATION,
  ///: END:ONLY_INCLUDE_IN
} from '../../../../shared/constants/app';

import {
  showModal,
  resolvePendingApproval,
  rejectPendingApproval,
  ///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
  goHome,
  ///: END:ONLY_INCLUDE_IN
} from '../../../store/actions';
import { getMostRecentOverviewPage } from '../../../ducks/history/history';
import { clearConfirmTransaction } from '../../../ducks/confirm-transaction/confirm-transaction.duck';
import SignatureRequest from './signature-request.component';

function mapStateToProps(state, ownProps) {
  const { txData } = ownProps;

  ///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
  const envType = getEnvironmentType();
  ///: END:ONLY_INCLUDE_IN

  const {
    msgParams: { from },
  } = txData;
  const providerConfig = getProviderConfig(state);

  const hardwareWalletRequiresConnection =
    doesAddressRequireLedgerHidConnection(state, from);
  const isLedgerWallet = isAddressLedger(state, from);
  const chainId = getCurrentChainId(state);
  const rpcPrefs = getRpcPrefsForCurrentProvider(state);
  const unconfirmedMessagesList = unconfirmedMessagesHashSelector(state);
  const unapprovedMessagesCount = getTotalUnapprovedMessagesCount(state);
  const { useNativeCurrencyAsPrimaryCurrency } = getPreferences(state);

  return {
    providerConfig,
    isLedgerWallet,
    hardwareWalletRequiresConnection,
    chainId,
    rpcPrefs,
    unconfirmedMessagesList,
    unapprovedMessagesCount,
    mostRecentOverviewPage: getMostRecentOverviewPage(state),
    nativeCurrency: getNativeCurrency(state),
    currentCurrency: getCurrentCurrency(state),
    conversionRate: useNativeCurrencyAsPrimaryCurrency
      ? null
      : conversionRateSelector(state),
    subjectMetadata: getSubjectMetadata(state),
    // not forwarded to component
    allAccounts: accountsWithSendEtherInfoSelector(state),
    ///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
    accountType: getAccountType(state),
    isNotification: envType === ENVIRONMENT_TYPE_NOTIFICATION,
    selectedAccount: getSelectedAccount(state),
    unapprovedTypedMessages: unapprovedTypedMessagesSelector(state),
    ///: END:ONLY_INCLUDE_IN
  };
}

let mapDispatchToProps = null;

///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
function mmiMapDispatchToProps(dispatch) {
  const mmiActions = mmiActionsFactory();
  return {
    clearConfirmTransaction: () => dispatch(clearConfirmTransaction()),
    setMsgInProgress: (msgId) => dispatch(setTypedMessageInProgress(msgId)),
    showCustodianDeepLink: ({
      custodyId,
      fromAddress,
      closeNotification,
      onDeepLinkFetched,
      onDeepLinkShown,
    }) =>
      showCustodianDeepLink({
        dispatch,
        mmiActions,
        txId: undefined,
        fromAddress,
        custodyId,
        isSignature: true,
        closeNotification,
        onDeepLinkFetched,
        onDeepLinkShown,
      }),
    showTransactionsFailedModal: ({
      errorMessage,
      closeNotification,
      operationFailed,
    }) =>
      dispatch(
        showModal({
          name: 'TRANSACTION_FAILED',
          errorMessage,
          closeNotification,
          operationFailed,
        }),
      ),
    setWaitForConfirmDeepLinkDialog: (wait) =>
      dispatch(mmiActions.setWaitForConfirmDeepLinkDialog(wait)),
    goHome: () => dispatch(goHome()),
  };
}

mapDispatchToProps = mmiMapDispatchToProps;
///: END:ONLY_INCLUDE_IN

mapDispatchToProps = function (dispatch) {
  return {
    resolvePendingApproval: (id) => dispatch(resolvePendingApproval(id)),
    rejectPendingApproval: (id, error) =>
      dispatch(rejectPendingApproval(id, error)),
    clearConfirmTransaction: () => dispatch(clearConfirmTransaction()),
    showRejectTransactionsConfirmationModal: ({
      onSubmit,
      unapprovedTxCount: unapprovedMessagesCount,
    }) => {
      return dispatch(
        showModal({
          name: 'REJECT_TRANSACTIONS',
          onSubmit,
          unapprovedTxCount: unapprovedMessagesCount,
          isRequestType: true,
        }),
      );
    },
    cancelAllApprovals: (unconfirmedMessagesList) => {
      return Promise.all(
        unconfirmedMessagesList.map(
          async ({ id }) =>
            await dispatch(
              rejectPendingApproval(
                id,
                serializeError(ethErrors.provider.userRejectedRequest()),
              ),
            ),
        ),
      );
    },
  };
};

function mergeProps(stateProps, dispatchProps, ownProps) {
  const {
    allAccounts,
    isLedgerWallet,
    hardwareWalletRequiresConnection,
    chainId,
    rpcPrefs,
    nativeCurrency,
    currentCurrency,
    conversionRate,
    providerConfig,
    subjectMetadata,
    unconfirmedMessagesList,
    unapprovedMessagesCount,
    mostRecentOverviewPage,
    ///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
    accountType,
    isNotification,
    unapprovedTypedMessages,
    ///: END:ONLY_INCLUDE_IN
  } = stateProps;
  const { txData } = ownProps;

  const {
    cancelAll: dispatchCancelAll,
    cancelAllApprovals: dispatchCancelAllApprovals,
  } = dispatchProps;

  const {
    msgParams: { from },
  } = txData;

  const fromAccount = getAccountByAddress(allAccounts, from);

  ///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
  const mmiOnSignCallback = async (_msgData) => {
    if (accountType === 'custody') {
      try {
        let msgData = _msgData;
        let id = _msgData.custodyId;
        if (!_msgData.custodyId) {
          msgData = checkForUnapprovedTypedMessages(
            _msgData,
            unapprovedTypedMessages,
          );
          id = msgData.custodyId;
        }
        dispatchProps.showCustodianDeepLink({
          custodyId: id,
          fromAddress: fromAccount.address,
          closeNotification: isNotification,
          onDeepLinkFetched: () => undefined,
          onDeepLinkShown: () => undefined,
        });
        await dispatchProps.setMsgInProgress(msgData.metamaskId);
        await dispatchProps.setWaitForConfirmDeepLinkDialog(true);
        await goHome();
      } catch (err) {
        await dispatchProps.setWaitForConfirmDeepLinkDialog(true);
        await dispatchProps.showTransactionsFailedModal({
          errorMessage: err.message,
          closeNotification: true,
          operationFailed: true,
        });
      }
    }
  };
  ///: END:ONLY_INCLUDE_IN

  return {
    ...ownProps,
    ...dispatchProps,
    fromAccount,
    txData,
    isLedgerWallet,
    hardwareWalletRequiresConnection,
    chainId,
    rpcPrefs,
    nativeCurrency,
    currentCurrency,
    conversionRate,
    providerConfig,
    subjectMetadata,
    unapprovedMessagesCount,
    mostRecentOverviewPage,
    cancelAll: () => dispatchCancelAll(valuesFor(unconfirmedMessagesList)),
    cancelAllApprovals: () =>
      dispatchCancelAllApprovals(valuesFor(unconfirmedMessagesList)),
    ///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
    mmiOnSignCallback,
    ///: END:ONLY_INCLUDE_IN
  };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
  mergeProps,
)(SignatureRequest);
