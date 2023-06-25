import PropTypes from 'prop-types';
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { withRouter } from 'react-router-dom';
import log from 'loglevel';
import { cloneDeep } from 'lodash';
import * as actions from '../../store/actions';
import txHelper from '../../helpers/utils/tx-helper';
import SignatureRequest from '../../components/app/signature-request';
import SignatureRequestSIWE from '../../components/app/signature-request-siwe';
import SignatureRequestOriginal from '../../components/app/signature-request-original';
import Loading from '../../components/ui/loading-screen';
import { useRouting } from '../../hooks/useRouting';
import {
  getTotalUnapprovedSignatureRequestCount,
  ///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
  getSelectedAccount,
  ///: END:ONLY_INCLUDE_IN
} from '../../selectors';
import { MESSAGE_TYPE } from '../../../shared/constants/app';
import { TransactionStatus } from '../../../shared/constants/transaction';
import { getSendTo } from '../../ducks/send';
import { getProviderConfig } from '../../ducks/metamask/metamask';

const signatureSelect = (txData) => {
  const {
    type,
    msgParams: { version, siwe },
  } = txData;

  // Temporarily direct only v3 and v4 requests to new code.
  if (
    type === MESSAGE_TYPE.ETH_SIGN_TYPED_DATA &&
    (version === 'V3' || version === 'V4')
  ) {
    return SignatureRequest;
  }

  if (siwe?.isSIWEMessage) {
    return SignatureRequestSIWE;
  }

  return SignatureRequestOriginal;
};

const ConfirmTxScreen = ({ match }) => {
  const dispatch = useDispatch();
  const { navigateToMostRecentOverviewPage } = useRouting();
  const unapprovedMessagesTotal = useSelector(
    getTotalUnapprovedSignatureRequestCount,
  );
  const sendTo = useSelector(getSendTo);
  const {
    unapprovedTxs,
    identities,
    currentNetworkTxList,
    currentCurrency,
    unapprovedMsgs,
    unapprovedPersonalMsgs,
    unapprovedTypedMessages,
    networkId,
    blockGasLimit,
  } = useSelector((state) => state.metamask);
  const { chainId } = useSelector(getProviderConfig);
  const { txId: index } = useSelector((state) => state.appState);

  ///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
  const selectedAccount = useSelector(getSelectedAccount);
  ///: END:ONLY_INCLUDE_IN

  const [prevValue, setPrevValues] = useState();

  useEffect(() => {
    const unconfTxList = txHelper(
      unapprovedTxs || {},
      {},
      {},
      {},
      networkId,
      chainId,
    );
    if (unconfTxList.length === 0 && !sendTo && unapprovedMessagesTotal === 0) {
      navigateToMostRecentOverviewPage();
    }
  }, []);

  useEffect(() => {
    if (!prevValue) {
      setPrevValues({ index, unapprovedTxs });
      return;
    }

    let prevTx;
    const { params: { id: transactionId } = {} } = match;
    if (transactionId) {
      prevTx = currentNetworkTxList.find(({ id }) => `${id}` === transactionId);
    } else {
      const { index: prevIndex, unapprovedTxs: prevUnapprovedTxs } = prevValue;
      const prevUnconfTxList = txHelper(
        prevUnapprovedTxs,
        {},
        {},
        {},
        networkId,
        chainId,
      );
      const prevTxData = prevUnconfTxList[prevIndex] || {};
      prevTx =
        currentNetworkTxList.find(({ id }) => id === prevTxData.id) || {};
    }

    const unconfTxList = txHelper(
      unapprovedTxs || {},
      {},
      {},
      {},
      networkId,
      chainId,
    );

    if (prevTx && prevTx.status === TransactionStatus.dropped) {
      dispatch(
        actions.showModal({
          name: 'TRANSACTION_CONFIRMED',
          onSubmit: () => navigateToMostRecentOverviewPage(),
        }),
      );
      return;
    }

    if (unconfTxList.length === 0 && !sendTo && unapprovedMessagesTotal === 0) {
      navigateToMostRecentOverviewPage();
    }

    setPrevValues({ index, unapprovedTxs });
  }, [
    chainId,
    currentNetworkTxList,
    match,
    networkId,
    sendTo,
    unapprovedMessagesTotal,
    unapprovedTxs,
  ]);

  const getTxData = () => {
    const { params: { id: transactionId } = {} } = match;

    const unconfTxList = txHelper(
      unapprovedTxs || {},
      unapprovedMsgs,
      unapprovedPersonalMsgs,
      unapprovedTypedMessages,
      networkId,
      chainId,
    );

    log.info(`rendering a combined ${unconfTxList.length} unconf msgs & txs`);

    const unconfirmedTx = transactionId
      ? unconfTxList.find(({ id }) => `${id}` === transactionId)
      : unconfTxList[index];
    return cloneDeep(unconfirmedTx);
  };

  const txData = getTxData() || {};

  const { msgParams } = txData;
  if (!msgParams) {
    return <Loading />;
  }

  const SigComponent = signatureSelect(txData);

  return (
    <SigComponent
      txData={txData}
      key={txData.id}
      identities={identities}
      currentCurrency={currentCurrency}
      blockGasLimit={blockGasLimit}
      ///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
      selectedAccount={selectedAccount}
      ///: END:ONLY_INCLUDE_IN
    />
  );
};

ConfirmTxScreen.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      id: PropTypes.string,
    }),
  }),
};

export default withRouter(ConfirmTxScreen);
