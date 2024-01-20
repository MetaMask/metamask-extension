import PropTypes from 'prop-types';
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory, withRouter } from 'react-router-dom';
import log from 'loglevel';
import { cloneDeep } from 'lodash';
import { SubjectType } from '@metamask/permission-controller';
import { TransactionStatus } from '@metamask/transaction-controller';
///: BEGIN:ONLY_INCLUDE_IF(build-flask)
import { SeverityLevel } from '@metamask/snaps-sdk';
///: END:ONLY_INCLUDE_IF
import * as actions from '../../store/actions';
import txHelper from '../../helpers/utils/tx-helper';
import SignatureRequest from '../../components/app/signature-request';
import SignatureRequestSIWE from '../../components/app/signature-request-siwe';
import SignatureRequestOriginal from '../../components/app/signature-request-original';
import Loading from '../../components/ui/loading-screen';
import { useRouting } from '../../hooks/useRouting';
import {
  getTotalUnapprovedSignatureRequestCount,
  ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
  getSelectedAccount,
  ///: END:ONLY_INCLUDE_IF
  getTargetSubjectMetadata,
  getCurrentNetworkTransactions,
  getUnapprovedTransactions,
} from '../../selectors';
import { MESSAGE_TYPE } from '../../../shared/constants/app';
import { getSendTo } from '../../ducks/send';
import { getProviderConfig } from '../../ducks/metamask/metamask';
///: BEGIN:ONLY_INCLUDE_IF(build-flask)
import { useSignatureInsights } from '../../hooks/useSignatureInsights';
///: END:ONLY_INCLUDE_IF

const signatureSelect = (txData, targetSubjectMetadata) => {
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

  if (siwe?.isSIWEMessage && targetSubjectMetadata !== SubjectType.Snap) {
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
    identities,
    currentCurrency,
    unapprovedMsgs,
    unapprovedPersonalMsgs,
    unapprovedTypedMessages,
    blockGasLimit,
  } = useSelector((state) => state.metamask);
  const unapprovedTxs = useSelector(getUnapprovedTransactions);
  const currentNetworkTxList = useSelector(getCurrentNetworkTransactions);
  const { chainId } = useSelector(getProviderConfig);
  const { txId: index } = useSelector((state) => state.appState);

  ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
  const selectedAccount = useSelector(getSelectedAccount);
  ///: END:ONLY_INCLUDE_IF

  const [prevValue, setPrevValues] = useState();
  const history = useHistory();

  const getTxData = useCallback(() => {
    const { params: { id: transactionId } = {} } = match;

    const unconfTxList = txHelper(
      unapprovedTxs || {},
      unapprovedMsgs,
      unapprovedPersonalMsgs,
      {},
      {},
      unapprovedTypedMessages,
      chainId,
    );

    log.info(`rendering a combined ${unconfTxList.length} unconf msgs & txs`);

    const unconfirmedTx = transactionId
      ? unconfTxList.find(({ id }) => `${id}` === transactionId)
      : unconfTxList[index];
    return cloneDeep(unconfirmedTx);
  }, [
    chainId,
    index,
    match,
    unapprovedMsgs,
    unapprovedPersonalMsgs,
    unapprovedTxs,
    unapprovedTypedMessages,
  ]);

  const txData = useMemo(() => getTxData() || {}, [getTxData]);

  ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
  const { data } = useSignatureInsights({ txData });

  const warnings = data?.reduce((warningsArr, promise) => {
    if (promise.response?.severity === SeverityLevel.Critical) {
      const {
        snapId,
        response: { content },
      } = promise;
      warningsArr.push({ snapId, content });
    }
    return warningsArr;
  }, []);
  ///: END:ONLY_INCLUDE_IF

  useEffect(() => {
    const unconfTxList = txHelper(
      unapprovedTxs || {},
      {},
      {},
      {},
      {},
      {},
      chainId,
    );
    if (unconfTxList.length === 0 && !sendTo && unapprovedMessagesTotal === 0) {
      navigateToMostRecentOverviewPage();
    }
  }, [
    chainId,
    navigateToMostRecentOverviewPage,
    sendTo,
    unapprovedMessagesTotal,
    unapprovedTxs,
  ]);

  useEffect(
    () => {
      if (!prevValue) {
        setPrevValues({ index, unapprovedTxs });
        return;
      }

      let prevTx;
      const { params: { id: transactionId } = {} } = match;
      if (transactionId) {
        prevTx = currentNetworkTxList.find(
          ({ id }) => `${id}` === transactionId,
        );
      } else {
        const { index: prevIndex, unapprovedTxs: prevUnapprovedTxs } =
          prevValue;
        const prevUnconfTxList = txHelper(
          prevUnapprovedTxs,
          {},
          {},
          {},
          {},
          {},
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
        {},
        {},
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

      if (
        unconfTxList.length === 0 &&
        !sendTo &&
        unapprovedMessagesTotal === 0
      ) {
        navigateToMostRecentOverviewPage();
      }

      setPrevValues({ index, unapprovedTxs });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const targetSubjectMetadata = useSelector((state) =>
    getTargetSubjectMetadata(state, txData.msgParams?.origin),
  );

  if (!txData.msgParams) {
    return <Loading />;
  }

  const SigComponent = signatureSelect(txData, targetSubjectMetadata);

  return (
    <SigComponent
      history={history}
      txData={txData}
      key={txData.id}
      identities={identities}
      currentCurrency={currentCurrency}
      blockGasLimit={blockGasLimit}
      ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
      selectedAccount={selectedAccount}
      ///: END:ONLY_INCLUDE_IF
      ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
      warnings={warnings}
      ///: END:ONLY_INCLUDE_IF
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
