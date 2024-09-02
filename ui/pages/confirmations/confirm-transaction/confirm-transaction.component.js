import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Route, Switch, useHistory, useParams } from 'react-router-dom';
import {
  ENVIRONMENT_TYPE_NOTIFICATION,
  ORIGIN_METAMASK,
} from '../../../../shared/constants/app';
import Loading from '../../../components/ui/loading-screen';
import {
  clearConfirmTransaction,
  setTransactionToConfirm,
} from '../../../ducks/confirm-transaction/confirm-transaction.duck';
import { getMostRecentOverviewPage } from '../../../ducks/history/history';
import { getSendTo } from '../../../ducks/send';
import {
  CONFIRM_DEPLOY_CONTRACT_PATH,
  CONFIRM_SEND_ETHER_PATH,
  CONFIRM_TOKEN_METHOD_PATH,
  CONFIRM_TRANSACTION_ROUTE,
  DECRYPT_MESSAGE_REQUEST_PATH,
  DEFAULT_ROUTE,
  ENCRYPTION_PUBLIC_KEY_REQUEST_PATH,
  SIGNATURE_REQUEST_PATH,
} from '../../../helpers/constants/routes';
import { isTokenMethodAction } from '../../../helpers/utils/transactions.util';
import usePolling from '../../../hooks/usePolling';
import { usePrevious } from '../../../hooks/usePrevious';
import {
  getSelectedNetworkClientId,
  unconfirmedTransactionsHashSelector,
  unconfirmedTransactionsListSelector,
  use4ByteResolutionSelector,
} from '../../../selectors';
import {
  endBackgroundTrace,
  gasFeeStartPollingByNetworkClientId,
  gasFeeStopPollingByPollingToken,
  getContractMethodData,
  setDefaultHomeActiveTabName,
} from '../../../store/actions';
import ConfirmDecryptMessage from '../../confirm-decrypt-message';
import ConfirmEncryptionPublicKey from '../../confirm-encryption-public-key';
import ConfirmContractInteraction from '../confirm-contract-interaction';
import ConfirmDeployContract from '../confirm-deploy-contract';
import ConfirmSendEther from '../confirm-send-ether';
import ConfirmSignatureRequest from '../confirm-signature-request';
import ConfirmTransactionSwitch from '../confirm-transaction-switch';
import Confirm from '../confirm/confirm';
import useCurrentConfirmation from '../hooks/useCurrentConfirmation';
import { getEnvironmentType } from '../../../../app/scripts/lib/util';
import { useAsyncResult } from '../../../hooks/useAsyncResult';
import { TraceName } from '../../../../shared/lib/trace';
import ConfirmTokenTransactionSwitch from './confirm-token-transaction-switch';

const ConfirmTransaction = () => {
  const dispatch = useDispatch();
  const history = useHistory();
  const { id: paramsTransactionId } = useParams();

  const mostRecentOverviewPage = useSelector(getMostRecentOverviewPage);
  const sendTo = useSelector(getSendTo);

  const unconfirmedTxsSorted = useSelector(unconfirmedTransactionsListSelector);
  const unconfirmedTxs = useSelector(unconfirmedTransactionsHashSelector);
  const networkClientId = useSelector(getSelectedNetworkClientId);

  const totalUnapproved = unconfirmedTxsSorted.length || 0;
  const getTransaction = useCallback(() => {
    return totalUnapproved
      ? unconfirmedTxs[paramsTransactionId] || unconfirmedTxsSorted[0]
      : {};
  }, [
    paramsTransactionId,
    totalUnapproved,
    unconfirmedTxs,
    unconfirmedTxsSorted,
  ]);
  const [transaction, setTransaction] = useState(getTransaction);
  const use4ByteResolution = useSelector(use4ByteResolutionSelector);
  const { currentConfirmation } = useCurrentConfirmation();

  useEffect(() => {
    const tx = getTransaction();
    setTransaction(tx);
    if (tx?.id) {
      dispatch(setTransactionToConfirm(tx.id));
    }
  }, [
    dispatch,
    getTransaction,
    paramsTransactionId,
    totalUnapproved,
    unconfirmedTxs,
    unconfirmedTxsSorted,
  ]);

  const { id, type } = transaction;

  const isNotification = getEnvironmentType() === ENVIRONMENT_TYPE_NOTIFICATION;

  useAsyncResult(async () => {
    if (!isNotification) {
      return undefined;
    }

    return await endBackgroundTrace({
      name: TraceName.NotificationDisplay,
      id,
    });
  }, [id, isNotification]);

  const transactionId = id;
  const isValidTokenMethod = isTokenMethodAction(type);
  const isValidTransactionId =
    transactionId &&
    (!paramsTransactionId || paramsTransactionId === transactionId);

  const prevParamsTransactionId = usePrevious(paramsTransactionId);
  const prevTransactionId = usePrevious(transactionId);

  usePolling({
    startPollingByNetworkClientId: gasFeeStartPollingByNetworkClientId,
    stopPollingByPollingToken: gasFeeStopPollingByPollingToken,
    networkClientId: transaction.networkClientId ?? networkClientId,
  });

  useEffect(() => {
    if (!totalUnapproved && !sendTo) {
      history.replace(mostRecentOverviewPage);
    } else {
      const { txParams: { data } = {}, origin } = transaction;

      if (origin !== ORIGIN_METAMASK) {
        dispatch(getContractMethodData(data, use4ByteResolution));
      }

      const txId = transactionId || paramsTransactionId;
      if (txId) {
        dispatch(setTransactionToConfirm(txId));
      }
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (
      paramsTransactionId &&
      transactionId &&
      prevParamsTransactionId !== paramsTransactionId
    ) {
      const { txData: { txParams: { data } = {}, origin } = {} } = transaction;

      dispatch(clearConfirmTransaction());
      dispatch(setTransactionToConfirm(paramsTransactionId));
      if (origin !== ORIGIN_METAMASK) {
        dispatch(getContractMethodData(data, use4ByteResolution));
      }
    } else if (prevTransactionId && !transactionId && !totalUnapproved) {
      dispatch(setDefaultHomeActiveTabName('activity')).then(() => {
        history.replace(DEFAULT_ROUTE);
      });
    } else if (
      prevTransactionId &&
      transactionId &&
      prevTransactionId !== transactionId &&
      paramsTransactionId !== transactionId
    ) {
      history.replace(mostRecentOverviewPage);
    }
  }, [
    dispatch,
    history,
    mostRecentOverviewPage,
    paramsTransactionId,
    prevParamsTransactionId,
    prevTransactionId,
    totalUnapproved,
    transaction,
    transactionId,
    use4ByteResolution,
  ]);

  // Code below is required as we need to support both new and old confirmation pages,
  // It takes care to render <Confirm /> component for confirmations of type Personal Sign.
  // Once we migrate all confirmations to new designs we can get rid of this code
  // and render <Confirm /> component for all confirmation requests.
  if (currentConfirmation) {
    return <Confirm />;
  }

  if (isValidTokenMethod && isValidTransactionId) {
    return <ConfirmTokenTransactionSwitch transaction={transaction} />;
  }
  // Show routes when state.confirmTransaction has been set and when either the ID in the params
  // isn't specified or is specified and matches the ID in state.confirmTransaction in order to
  // support URLs of /confirm-transaction or /confirm-transaction/<transactionId>
  return isValidTransactionId ? (
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
