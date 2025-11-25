import React, { useCallback, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import {
  Routes,
  Route,
  useNavigate,
  useParams,
  useLocation,
} from 'react-router-dom-v5-compat';
import {
  ENVIRONMENT_TYPE_NOTIFICATION,
  ORIGIN_METAMASK,
  TRACE_ENABLED_SIGN_METHODS,
} from '../../../../shared/constants/app';
import Loading from '../../../components/ui/loading-screen';
import {
  clearConfirmTransaction,
  setTransactionToConfirm,
} from '../../../ducks/confirm-transaction/confirm-transaction.duck';
import { getMostRecentOverviewPage } from '../../../ducks/history/history';
import { getSendTo } from '../../../ducks/send';
import { getSelectedNetworkClientId } from '../../../../shared/modules/selectors/networks';
import {
  CONFIRM_TRANSACTION_ROUTE,
  DECRYPT_MESSAGE_REQUEST_PATH,
  DEFAULT_ROUTE,
  ENCRYPTION_PUBLIC_KEY_REQUEST_PATH,
} from '../../../helpers/constants/routes';
import { isTokenMethodAction } from '../../../helpers/utils/transactions.util';
import usePolling from '../../../hooks/usePolling';
import { usePrevious } from '../../../hooks/usePrevious';
import {
  unconfirmedTransactionsHashSelector,
  unconfirmedTransactionsListSelector,
  getUse4ByteResolution,
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
import ConfirmTransactionSwitch from '../confirm-transaction-switch';
import Confirm from '../confirm/confirm';
import useCurrentConfirmation from '../hooks/useCurrentConfirmation';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { getEnvironmentType } from '../../../../app/scripts/lib/util';
import { useAsyncResult } from '../../../hooks/useAsync';
import { TraceName } from '../../../../shared/lib/trace';
import ConfirmTokenTransactionSwitch from './confirm-token-transaction-switch';

const ConfirmTransaction = ({
  params: routeParams,
  location: routeLocation,
} = {}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const urlParams = useParams();
  const hookLocation = useLocation();

  // Use params from props (v5 route) if available, otherwise fall back to useParams (v6)
  const { id: paramsTransactionId } = routeParams || urlParams;

  // Use location from props (v5 route) if available, otherwise fall back to useLocation (v6)
  const location = routeLocation || hookLocation;

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

  const use4ByteResolution = useSelector(getUse4ByteResolution);
  // Pass the transaction ID from route params so useCurrentConfirmation can find the approval
  const { currentConfirmation } = useCurrentConfirmation(paramsTransactionId);

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

    const traceId = TRACE_ENABLED_SIGN_METHODS.includes(type)
      ? transaction.msgParams?.requestId?.toString()
      : id;

    return await endBackgroundTrace({
      name: TraceName.NotificationDisplay,
      id: traceId,
    });
  }, [id, isNotification, type, transaction.msgParams]);

  const transactionId = id;
  const isValidTokenMethod = isTokenMethodAction(type);
  const isValidTransactionId =
    transactionId &&
    (!paramsTransactionId || paramsTransactionId === transactionId);

  const prevParamsTransactionId = usePrevious(paramsTransactionId);
  const prevTransactionId = usePrevious(transactionId);

  usePolling({
    startPolling: (input) =>
      gasFeeStartPollingByNetworkClientId(input.networkClientId),
    stopPollingByPollingToken: gasFeeStopPollingByPollingToken,
    input: { networkClientId: transaction.networkClientId ?? networkClientId },
  });

  useEffect(() => {
    if (totalUnapproved || sendTo) {
      const { txParams: { data } = {}, origin } = transaction;

      if (origin !== ORIGIN_METAMASK) {
        dispatch(getContractMethodData(data, use4ByteResolution));
      }

      const txId = transactionId || paramsTransactionId;
      if (txId) {
        dispatch(setTransactionToConfirm(txId));
      }
    }
  }, []);

  useEffect(() => {
    const handleNavigation = async () => {
      if (
        paramsTransactionId &&
        transactionId &&
        prevParamsTransactionId !== paramsTransactionId
      ) {
        const { txData: { txParams: { data } = {}, origin } = {} } =
          transaction;

        dispatch(clearConfirmTransaction());
        dispatch(setTransactionToConfirm(paramsTransactionId));
        if (origin !== ORIGIN_METAMASK) {
          dispatch(getContractMethodData(data, use4ByteResolution));
        }
      } else if (prevTransactionId && !transactionId && !totalUnapproved) {
        await dispatch(setDefaultHomeActiveTabName('activity'));
        navigate(DEFAULT_ROUTE, { replace: true });
      } else if (
        prevTransactionId &&
        transactionId &&
        prevTransactionId !== transactionId &&
        paramsTransactionId !== transactionId
      ) {
        navigate(mostRecentOverviewPage, { replace: true });
      }
    };

    handleNavigation();
  }, [
    dispatch,
    navigate,
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
    return <Confirm confirmationId={paramsTransactionId} />;
  }

  if (isValidTokenMethod && isValidTransactionId) {
    return <ConfirmTokenTransactionSwitch transaction={transaction} />;
  }
  // Show routes when state.confirmTransaction has been set and when either the ID in the params
  // isn't specified or is specified and matches the ID in state.confirmTransaction in order to
  // support URLs of /confirm-transaction or /confirm-transaction/<transactionId>
  if (isValidTransactionId) {
    return (
      <Routes location={location}>
        <Route
          path={`${CONFIRM_TRANSACTION_ROUTE}/:id?${DECRYPT_MESSAGE_REQUEST_PATH}`}
          element={<ConfirmDecryptMessage />}
        />
        <Route
          path={`${CONFIRM_TRANSACTION_ROUTE}/:id?${ENCRYPTION_PUBLIC_KEY_REQUEST_PATH}`}
          element={<ConfirmEncryptionPublicKey />}
        />
        <Route path="*" element={<ConfirmTransactionSwitch />} />
      </Routes>
    );
  }

  return <Loading />;
};

ConfirmTransaction.propTypes = {
  params: PropTypes.shape({
    id: PropTypes.string,
  }),
  location: PropTypes.shape({
    pathname: PropTypes.string,
    search: PropTypes.string,
    hash: PropTypes.string,
    state: PropTypes.object,
    key: PropTypes.string,
  }),
};

export default ConfirmTransaction;
