import { connect } from 'react-redux';
import { compose } from 'redux';
import { withRouter } from 'react-router-dom';
import {
  goHome,
  showModal,
  resolvePendingApproval,
  rejectPendingApproval,
  rejectAllMessages,
  completedTx,
} from '../../../store/actions';
///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
// eslint-disable-next-line import/order
import { showCustodianDeepLink } from '@metamask-institutional/extension';
import {
  mmiActionsFactory,
  setPersonalMessageInProgress,
} from '../../../store/institutional/institution-background';
import { getEnvironmentType } from '../../../../app/scripts/lib/util';
import { showCustodyConfirmLink } from '../../../store/institutional/institution-actions';
import { ENVIRONMENT_TYPE_NOTIFICATION } from '../../../../shared/constants/app';
///: END:ONLY_INCLUDE_IF
import {
  accountsWithSendEtherInfoSelector,
  getSubjectMetadata,
  doesAddressRequireLedgerHidConnection,
  unconfirmedMessagesHashSelector,
  getTotalUnapprovedMessagesCount,
  ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
  getAccountType,
  getSelectedAccount,
  ///: END:ONLY_INCLUDE_IF
} from '../../../selectors';
import { getAccountByAddress, valuesFor } from '../../../helpers/utils/util';
import { clearConfirmTransaction } from '../../../ducks/confirm-transaction/confirm-transaction.duck';
import { getMostRecentOverviewPage } from '../../../ducks/history/history';
import { isAddressLedger } from '../../../ducks/metamask/metamask';
import SignatureRequestOriginal from './signature-request-original.component';

function mapStateToProps(state, ownProps) {
  const {
    msgParams: { from },
  } = ownProps.txData;

  ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
  const envType = getEnvironmentType();
  ///: END:ONLY_INCLUDE_IF

  const hardwareWalletRequiresConnection =
    doesAddressRequireLedgerHidConnection(state, from);
  const isLedgerWallet = isAddressLedger(state, from);
  const messagesList = unconfirmedMessagesHashSelector(state);
  const messagesCount = getTotalUnapprovedMessagesCount(state);

  return {
    requester: null,
    requesterAddress: null,
    mostRecentOverviewPage: getMostRecentOverviewPage(state),
    hardwareWalletRequiresConnection,
    isLedgerWallet,
    // not passed to component
    allAccounts: accountsWithSendEtherInfoSelector(state),
    subjectMetadata: getSubjectMetadata(state),
    messagesList,
    messagesCount,
    ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
    accountType: getAccountType(state),
    isNotification: envType === ENVIRONMENT_TYPE_NOTIFICATION,
    selectedAccount: getSelectedAccount(state),
    ///: END:ONLY_INCLUDE_IF
  };
}

let mapDispatchToProps = null;

mapDispatchToProps = function (dispatch) {
  return {
    goHome: () => dispatch(goHome()),
    clearConfirmTransaction: () => dispatch(clearConfirmTransaction()),
    showRejectTransactionsConfirmationModal: ({
      onSubmit,
      unapprovedTxCount: messagesCount,
    }) => {
      return dispatch(
        showModal({
          name: 'REJECT_TRANSACTIONS',
          onSubmit,
          unapprovedTxCount: messagesCount,
          isRequestType: true,
        }),
      );
    },
    completedTx: (txId) => dispatch(completedTx(txId)),
    resolvePendingApproval: (id) => {
      dispatch(resolvePendingApproval(id));
    },
    rejectPendingApproval: (id, error) =>
      dispatch(rejectPendingApproval(id, error)),
    cancelAllApprovals: (messagesList) => {
      dispatch(rejectAllMessages(messagesList));
    },
  };
};

///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
function mmiMapDispatchToProps(dispatch) {
  const mmiActions = mmiActionsFactory();
  return {
    setMsgInProgress: (msgId) => dispatch(setPersonalMessageInProgress(msgId)),
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
        showCustodyConfirmLink,
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
    clearConfirmTransaction: () => dispatch(clearConfirmTransaction()),
    showRejectTransactionsConfirmationModal: ({
      onSubmit,
      unapprovedTxCount: messagesCount,
    }) => {
      return dispatch(
        showModal({
          name: 'REJECT_TRANSACTIONS',
          onSubmit,
          unapprovedTxCount: messagesCount,
          isRequestType: true,
        }),
      );
    },
    completedTx: (txId) => dispatch(completedTx(txId)),
    resolvePendingApproval: (id) => {
      dispatch(resolvePendingApproval(id));
    },
    rejectPendingApproval: (id, error) =>
      dispatch(rejectPendingApproval(id, error)),
    cancelAllApprovals: (messagesList) => {
      dispatch(rejectAllMessages(messagesList));
    },
  };
}

mapDispatchToProps = mmiMapDispatchToProps;
///: END:ONLY_INCLUDE_IF

function mergeProps(stateProps, dispatchProps, ownProps) {
  const { txData } = ownProps;

  const {
    allAccounts,
    messagesList,
    ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
    accountType,
    isNotification,
    ///: END:ONLY_INCLUDE_IF
    ...otherStateProps
  } = stateProps;

  const {
    msgParams: { from },
  } = txData;

  const fromAccount = getAccountByAddress(allAccounts, from);

  const { cancelAllApprovals: dispatchCancelAllApprovals } = dispatchProps;

  ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
  const mmiOnSignCallback = async (_msgData) => {
    if (accountType === 'custody') {
      try {
        await dispatchProps.resolvePendingApproval(_msgData.id);
        dispatchProps.completedTx(_msgData.id);

        dispatchProps.showCustodianDeepLink({
          custodyId: null,
          fromAddress: fromAccount.address,
          closeNotification: isNotification,
          onDeepLinkFetched: () => undefined,
          onDeepLinkShown: () => undefined,
        });
        await dispatchProps.setWaitForConfirmDeepLinkDialog(true);
      } catch (err) {
        await dispatchProps.setWaitForConfirmDeepLinkDialog(true);
        await dispatchProps.showTransactionsFailedModal({
          errorMessage: err.message,
          closeNotification: true,
          operationFailed: true,
        });
      }
    } else {
      // Non Custody accounts follow normal flow
      await dispatchProps.resolvePendingApproval(_msgData.id);
      dispatchProps.completedTx(_msgData.id);
    }
  };
  ///: END:ONLY_INCLUDE_IF

  return {
    ...ownProps,
    ...otherStateProps,
    ...dispatchProps,
    fromAccount,
    txData,
    cancelAllApprovals: () =>
      dispatchCancelAllApprovals(valuesFor(messagesList)),
    ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
    mmiOnSignCallback,
    ///: END:ONLY_INCLUDE_IF
  };
}

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps, mergeProps),
)(SignatureRequestOriginal);
