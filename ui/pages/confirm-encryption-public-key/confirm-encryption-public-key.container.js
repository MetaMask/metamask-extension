import React from 'react';
import { connect } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
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
import { useShallowEqualityCheck } from '../../hooks/useShallowEqualityCheck';
import ConfirmEncryptionPublicKey from './confirm-encryption-public-key.component';

function mapStateToProps(state, ownProps) {
  const {
    metamask: { subjectMetadata = {} },
  } = state;

  const unconfirmedTransactions = unconfirmedTransactionsListSelector(state);

  const approvalId = ownProps.params?.id;

  const txData = unconfirmedTransactions.find((tx) => tx.id === approvalId);

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

const ConnectedConfirmEncryptionPublicKey = connect(
  mapStateToProps,
  mapDispatchToProps,
)(ConfirmEncryptionPublicKey);

export default function ConfirmEncryptionPublicKeyContainer(props) {
  const navigate = useNavigate();
  const rawParams = useParams();
  const params = useShallowEqualityCheck(rawParams);
  return (
    <ConnectedConfirmEncryptionPublicKey
      {...props}
      navigate={navigate}
      params={params}
    />
  );
}
