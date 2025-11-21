import React from 'react';
import { connect } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom-v5-compat';

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

  const { id: approvalId } = ownProps;

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

function mapDispatchToProps(dispatch, ownProps) {
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
    navigate: ownProps.navigate,
  };
}

const ConnectedConfirmEncryptionPublicKey = connect(
  mapStateToProps,
  mapDispatchToProps,
)(ConfirmEncryptionPublicKey);

const ConfirmEncryptionPublicKeyContainer = () => {
  const params = useParams();
  const id = params?.id;
  const navigate = useNavigate();
  return <ConnectedConfirmEncryptionPublicKey id={id} navigate={navigate} />;
};

export default ConfirmEncryptionPublicKeyContainer;
