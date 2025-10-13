import { connect } from 'react-redux';
import { compose } from 'redux';
import withRouterHooks from '../../helpers/higher-order-components/with-router-hooks/with-router-hooks';

import {
  goHome,
  encryptionPublicKeyMsg,
  cancelEncryptionPublicKeyMsg,
} from '../../store/actions';

import {
  unconfirmedTransactionsListSelector,
  getTargetAccountWithSendEtherInfo,
} from '../../selectors';

import { clearConfirmTransaction } from '../../ducks/confirm-transaction/confirm-transaction.duck';
import { getMostRecentOverviewPage } from '../../ducks/history/history';
import { getNativeCurrency } from '../../ducks/metamask/metamask';
import ConfirmEncryptionPublicKey from './confirm-encryption-public-key.component';

function mapStateToProps(state, ownProps) {
  const {
    metamask: { subjectMetadata = {} },
  } = state;

  const unconfirmedTransactions = unconfirmedTransactionsListSelector(state);

  const { params: { id: approvalId } = {}, transactionId: transactionIdProp } =
    ownProps;

  // Use transactionId prop if provided (from conditional rendering), otherwise use params
  const effectiveApprovalId = transactionIdProp || approvalId;

  const txData = unconfirmedTransactions.find(
    (tx) => tx.id === effectiveApprovalId,
  );

  const fromAccount = getTargetAccountWithSendEtherInfo(
    state,
    txData?.msgParams,
  );

  return {
    txData,
    subjectMetadata,
    fromAccount,
    requester: null,
    requesterAddress: null,
    mostRecentOverviewPage: getMostRecentOverviewPage(state),
    nativeCurrency: getNativeCurrency(state),
  };
}

function mapDispatchToProps(dispatch) {
  return {
    goHome: () => dispatch(goHome()),
    clearConfirmTransaction: () => dispatch(clearConfirmTransaction()),
    encryptionPublicKey: (msgData, event) => {
      const params = { data: msgData.msgParams, metamaskId: msgData.id };
      event.stopPropagation();
      return dispatch(encryptionPublicKeyMsg(params));
    },
    cancelEncryptionPublicKey: (msgData, event) => {
      event.stopPropagation();
      return dispatch(cancelEncryptionPublicKeyMsg(msgData));
    },
  };
}

export default compose(
  withRouterHooks,
  connect(mapStateToProps, mapDispatchToProps),
)(ConfirmEncryptionPublicKey);
