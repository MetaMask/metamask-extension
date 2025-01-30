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
} from '../../../../store/actions';

import {
  accountsWithSendEtherInfoSelector,
  getSubjectMetadata,
  doesAddressRequireLedgerHidConnection,
  unconfirmedMessagesHashSelector,
  getTotalUnapprovedMessagesCount,
} from '../../../../selectors';
import { getAccountByAddress, valuesFor } from '../../../../helpers/utils/util';
import { clearConfirmTransaction } from '../../../../ducks/confirm-transaction/confirm-transaction.duck';
import { getMostRecentOverviewPage } from '../../../../ducks/history/history';
import { isAddressLedger } from '../../../../ducks/metamask/metamask';
import SignatureRequestOriginal from './signature-request-original.component';

function mapStateToProps(state, ownProps) {
  const {
    msgParams: { from },
  } = ownProps.txData;

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

function mergeProps(stateProps, dispatchProps, ownProps) {
  const { txData } = ownProps;

  const { allAccounts, messagesList, ...otherStateProps } = stateProps;

  const {
    msgParams: { from },
  } = txData;

  const fromAccount = getAccountByAddress(allAccounts, from);

  const { cancelAllApprovals: dispatchCancelAllApprovals } = dispatchProps;

  return {
    ...ownProps,
    ...otherStateProps,
    ...dispatchProps,
    fromAccount,
    txData,
    cancelAllApprovals: () =>
      dispatchCancelAllApprovals(valuesFor(messagesList)),
  };
}

export default compose(
  withRouter,
  connect(mapStateToProps, mapDispatchToProps, mergeProps),
)(SignatureRequestOriginal);
