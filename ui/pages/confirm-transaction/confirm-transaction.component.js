import React, { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { Switch, Route } from 'react-router-dom';
import Loading from '../../components/ui/loading-screen';
import ConfirmTransactionSwitch from '../confirm-transaction-switch';
import ConfirmContractInteraction from '../confirm-contract-interaction';
import ConfirmSendEther from '../confirm-send-ether';
import ConfirmDeployContract from '../confirm-deploy-contract';
import ConfirmDecryptMessage from '../confirm-decrypt-message';
import ConfirmEncryptionPublicKey from '../confirm-encryption-public-key';

import { ORIGIN_METAMASK } from '../../../shared/constants/app';

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
import { usePrevious } from '../../hooks/usePrevious';
import {
  disconnectGasFeeEstimatePoller,
  getGasFeeEstimatesAndStartPolling,
  addPollingTokenToAppState,
  removePollingTokenFromAppState,
} from '../../store/actions';
import ConfirmTokenTransactionSwitch from './confirm-token-transaction-switch';
import ConfTx from './conf-tx';

const ConfirmTransaction = (props) => {
  const {
    history,
    totalUnapprovedCount = 0,
    sendTo,
    setTransactionToConfirm,
    clearConfirmTransaction,
    mostRecentOverviewPage,
    transaction = {},
    getContractMethodData,
    transactionId,
    paramsTransactionId,
    isTokenMethodAction,
    setDefaultHomeActiveTabName,
  } = props;

  const [isMounted, setIsMounted] = useState(false);
  const [pollingToken, setPollingToken] = useState();

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
        getContractMethodData(data);
      }

      const txId = transactionId || paramsTransactionId;
      if (txId) {
        setTransactionToConfirm(txId);
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
      clearConfirmTransaction();
      setTransactionToConfirm(paramsTransactionId);
      if (origin !== 'metamask') {
        getContractMethodData(data);
      }
    } else if (prevTransactionId && !transactionId && !totalUnapprovedCount) {
      setDefaultHomeActiveTabName('activity').then(() => {
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
    setTransactionToConfirm,
    transaction,
    clearConfirmTransaction,
    getContractMethodData,
    paramsTransactionId,
    transactionId,
    history,
    mostRecentOverviewPage,
    prevParamsTransactionId,
    prevTransactionId,
    totalUnapprovedCount,
    setDefaultHomeActiveTabName,
  ]);

  const validTransactionId =
    transactionId &&
    (!paramsTransactionId || paramsTransactionId === transactionId);

  if (isTokenMethodAction && validTransactionId) {
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
        component={ConfTx}
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

ConfirmTransaction.propTypes = {
  history: PropTypes.object.isRequired,
  totalUnapprovedCount: PropTypes.number.isRequired,
  sendTo: PropTypes.string,
  setTransactionToConfirm: PropTypes.func,
  clearConfirmTransaction: PropTypes.func,
  mostRecentOverviewPage: PropTypes.string.isRequired,
  transaction: PropTypes.object,
  getContractMethodData: PropTypes.func,
  transactionId: PropTypes.string,
  paramsTransactionId: PropTypes.string,
  isTokenMethodAction: PropTypes.bool,
  setDefaultHomeActiveTabName: PropTypes.func,
};

export default ConfirmTransaction;
