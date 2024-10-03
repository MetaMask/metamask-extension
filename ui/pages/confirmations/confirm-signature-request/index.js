import PropTypes from 'prop-types';
import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory, withRouter } from 'react-router-dom';
import log from 'loglevel';
import { cloneDeep } from 'lodash';
import { SubjectType } from '@metamask/permission-controller';
import { TransactionStatus } from '@metamask/transaction-controller';
import * as actions from '../../../store/actions';
import txHelper from '../../../helpers/utils/tx-helper';
import SignatureRequest from '../components/signature-request';
import SignatureRequestOriginal from '../components/signature-request-original';
import SignatureRequestSIWE from '../components/signature-request-siwe';
import Loading from '../../../components/ui/loading-screen';
import { useRouting } from '../hooks/useRouting';
import {
  getTotalUnapprovedSignatureRequestCount,
  ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
  getSelectedAccount,
  ///: END:ONLY_INCLUDE_IF
  getTargetSubjectMetadata,
  getCurrentNetworkTransactions,
  getUnapprovedTransactions,
  getInternalAccounts,
  getMemoizedUnapprovedPersonalMessages,
  getMemoizedUnapprovedTypedMessages,
  getMemoizedCurrentChainId,
  getMemoizedTxId,
} from '../../../selectors';
import { useInsightSnaps } from '../../../hooks/snaps/useInsightSnaps';
import { MESSAGE_TYPE } from '../../../../shared/constants/app';
import { getSendTo } from '../../../ducks/send';

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
  const internalAccounts = useSelector(getInternalAccounts);

  const { currentCurrency, blockGasLimit, signatureSecurityAlertResponses } =
    useSelector((state) => state.metamask);
  const unapprovedPersonalMsgs = useSelector(
    getMemoizedUnapprovedPersonalMessages,
  );
  const unapprovedTypedMessages = useSelector(
    getMemoizedUnapprovedTypedMessages,
  );

  const unapprovedTxs = useSelector(getUnapprovedTransactions);
  const currentNetworkTxList = useSelector(getCurrentNetworkTransactions);
  const chainId = useSelector(getMemoizedCurrentChainId);
  const index = useSelector(getMemoizedTxId);

  ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
  const selectedAccount = useSelector(getSelectedAccount);
  ///: END:ONLY_INCLUDE_IF

  const [prevValue, setPrevValues] = useState();
  const history = useHistory();

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

  const { params: { id: txIdFromPath } = {} } = match;

  const txData = useMemo(() => {
    const unconfTxList = txHelper(
      unapprovedTxs || {},
      unapprovedPersonalMsgs,
      {},
      {},
      unapprovedTypedMessages,
      chainId,
    );

    log.info(`rendering a combined ${unconfTxList.length} unconf msgs & txs`);

    const unconfirmedTx = txIdFromPath
      ? unconfTxList.find(({ id }) => `${id}` === txIdFromPath)
      : unconfTxList[index];
    return unconfirmedTx ? cloneDeep(unconfirmedTx) : {};
  }, [
    chainId,
    index,
    txIdFromPath,
    unapprovedPersonalMsgs,
    unapprovedTxs,
    unapprovedTypedMessages,
  ]);

  const { warnings } = useInsightSnaps(txData.id);
  const resolvedSecurityAlertResponse =
    signatureSecurityAlertResponses?.[
      txData.securityAlertResponse?.securityAlertId
    ];

  if (resolvedSecurityAlertResponse) {
    txData.securityAlertResponse = resolvedSecurityAlertResponse;
  }

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
      accounts={internalAccounts}
      currentCurrency={currentCurrency}
      blockGasLimit={blockGasLimit}
      ///: BEGIN:ONLY_INCLUDE_IF(build-mmi)
      selectedAccount={selectedAccount}
      ///: END:ONLY_INCLUDE_IF
      warnings={warnings}
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
