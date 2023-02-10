import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Switch, Route, useHistory, useParams } from 'react-router-dom';
import Loading from '../../components/ui/loading-screen';
import ConfirmTransactionSwitch from '../confirm-transaction-switch';
import ConfirmContractInteraction from '../confirm-contract-interaction';
import ConfirmSendEther from '../confirm-send-ether';
import ConfirmDeployContract from '../confirm-deploy-contract';
import ConfirmDecryptMessage from '../confirm-decrypt-message';
import ConfirmEncryptionPublicKey from '../confirm-encryption-public-key';

import { ORIGIN_METAMASK } from '../../../shared/constants/app';

import {
  clearConfirmTransaction,
  setTransactionToConfirm,
} from '../../ducks/confirm-transaction/confirm-transaction.duck';
import { getMostRecentOverviewPage } from '../../ducks/history/history';
import { getSendTo } from '../../ducks/send';
import {
  CONFIRM_TRANSACTION_ROUTE,
  CONFIRM_DEPLOY_CONTRACT_PATH,
  CONFIRM_SEND_ETHER_PATH,
  CONFIRM_TOKEN_METHOD_PATH,
  SIGNATURE_REQUEST_PATH,
  DECRYPT_MESSAGE_REQUEST_PATH,
  ENCRYPTION_PUBLIC_KEY_REQUEST_PATH,
  DEFAULT_ROUTE,
} from '../../helpers/constants/routes';
import { isTokenMethodAction } from '../../helpers/utils/transactions.util';
import { usePrevious } from '../../hooks/usePrevious';
import {
  getUnapprovedTransactions,
  unconfirmedTransactionsListSelector,
  unconfirmedTransactionsHashSelector,
} from '../../selectors';
import {
  disconnectGasFeeEstimatePoller,
  getContractMethodData,
  getGasFeeEstimatesAndStartPolling,
  addPollingTokenToAppState,
  removePollingTokenFromAppState,
  setDefaultHomeActiveTabName,
} from '../../store/actions';
import ConfirmSignatureRequest from '../confirm-signature-request';
import ConfirmTokenTransactionSwitch from './confirm-token-transaction-switch';

const ConfirmTransaction = () => {
  const dispatch = useDispatch();
  const history = useHistory();
  const { id: paramsTransactionId } = useParams();

  const [isMounted, setIsMounted] = useState(false);
  const [pollingToken, setPollingToken] = useState();

  const mostRecentOverviewPage = useSelector(getMostRecentOverviewPage);
  const sendTo = useSelector(getSendTo);
  const unapprovedTxs = useSelector(getUnapprovedTransactions);
  const unconfirmedTransactions = useSelector(
    unconfirmedTransactionsListSelector,
  );
  const unconfirmedMessages = useSelector(unconfirmedTransactionsHashSelector);

  const totalUnapprovedCount = unconfirmedTransactions.length || 0;
  const transaction = useMemo(() => {
    return totalUnapprovedCount
      ? unapprovedTxs[paramsTransactionId] ||
          unconfirmedMessages[paramsTransactionId] ||
          unconfirmedTransactions[0]
      : {};
  }, [
    paramsTransactionId,
    totalUnapprovedCount,
    unapprovedTxs,
    unconfirmedMessages,
    unconfirmedTransactions,
  ]);

  const { id, type } = transaction;
  const transactionId = id && String(id);
  const isValidERC20TokenMethod = isTokenMethodAction(type);

  const prevParamsTransactionId = usePrevious(paramsTransactionId);
  const prevTransactionId = usePrevious(transactionId);

  const _beforeUnload = useCallback(() => {
    setIsMounted(false);

    if (pollingToken) {
      disconnectGasFeeEstimatePoller(pollingToken);
      removePollingTokenFromAppState(pollingToken);
    }
  }, [pollingToken]);

  useEffect(() => {
    setIsMounted(true);

    const { txParams: { data } = {}, origin } = transaction;

    getGasFeeEstimatesAndStartPolling().then((_pollingToken) => {
      if (isMounted) {
        setPollingToken(_pollingToken);
        addPollingTokenToAppState(_pollingToken);
      } else {
        disconnectGasFeeEstimatePoller(_pollingToken);
        removePollingTokenFromAppState(_pollingToken);
      }
    });

    window.addEventListener('beforeunload', _beforeUnload);

    if (!totalUnapprovedCount && !sendTo) {
      history.replace(mostRecentOverviewPage);
    } else {
      if (origin !== ORIGIN_METAMASK) {
        dispatch(getContractMethodData(data));
      }

      const txId = transactionId || paramsTransactionId;
      if (txId) {
        dispatch(setTransactionToConfirm(txId));
      }
    }

    return () => {
      _beforeUnload();
      window.removeEventListener('beforeunload', _beforeUnload);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const { txData: { txParams: { data } = {}, origin } = {} } = transaction;

    if (
      paramsTransactionId &&
      transactionId &&
      prevParamsTransactionId !== paramsTransactionId
    ) {
      dispatch(clearConfirmTransaction());
      dispatch(setTransactionToConfirm(paramsTransactionId));
      if (origin !== ORIGIN_METAMASK) {
        dispatch(getContractMethodData(data));
      }
    } else if (prevTransactionId && !transactionId && !totalUnapprovedCount) {
      dispatch(setDefaultHomeActiveTabName('activity')).then(() => {
        history.replace(DEFAULT_ROUTE);
      });
    } else if (
      prevTransactionId &&
      transactionId &&
      prevTransactionId !== transactionId
    ) {
      history.replace(mostRecentOverviewPage);
    }
  }, [
    dispatch,
    transaction,
    paramsTransactionId,
    transactionId,
    history,
    mostRecentOverviewPage,
    prevParamsTransactionId,
    prevTransactionId,
    totalUnapprovedCount,
  ]);

  const validTransactionId =
    transactionId &&
    (!paramsTransactionId || paramsTransactionId === transactionId);

  if (isValidERC20TokenMethod && validTransactionId) {
    return <ConfirmTokenTransactionSwitch transaction={transaction} />;
  }
  // Show routes when state.confirmTransaction has been set and when either the ID in the params
  // isn't specified or is specified and matches the ID in state.confirmTransaction in order to
  // support URLs of /confirm-transaction or /confirm-transaction/<transactionId>
  return validTransactionId ? (
    <Switch>
      <Route
        exact
        path={`${CONFIRM_TRANSACTION_ROUTE}/:id?${CONFIRM_DEPLOY_CONTRACT_PATH}`}
        component={ConfirmDeployContract}
      />
      <Route
        exact
        path={`${CONFIRM_TRANSACTION_ROUTE}/:id?${CONFIRM_SEND_ETHER_PATH}`}
        component={ConfirmSendEther}
      />
      <Route
        exact
        path={`${CONFIRM_TRANSACTION_ROUTE}/:id?${CONFIRM_TOKEN_METHOD_PATH}`}
        component={ConfirmContractInteraction}
      />
      <Route
        exact
        path={`${CONFIRM_TRANSACTION_ROUTE}/:id?${SIGNATURE_REQUEST_PATH}`}
        component={ConfirmSignatureRequest}
      />
      <Route
        exact
        path={`${CONFIRM_TRANSACTION_ROUTE}/:id?${DECRYPT_MESSAGE_REQUEST_PATH}`}
        component={ConfirmDecryptMessage}
      />
      <Route
        exact
        path={`${CONFIRM_TRANSACTION_ROUTE}/:id?${ENCRYPTION_PUBLIC_KEY_REQUEST_PATH}`}
        component={ConfirmEncryptionPublicKey}
      />
      <Route path="*" component={ConfirmTransactionSwitch} />
    </Switch>
  ) : (
    <Loading />
  );
};

export default ConfirmTransaction;
