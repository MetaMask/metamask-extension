import { useDispatch, useSelector } from 'react-redux';
import { useEffect } from 'react';
import { TransactionMeta } from '@metamask/transaction-controller';
import log from 'loglevel';
import {
  getChainSupportsSmartTransactions,
  getSmartTransactionsFeatureFlagsForChain,
  getSmartTransactionsPreferenceEnabled,
} from '../../../../shared/modules/selectors';
import { fetchSwapsFeatureFlags } from '../../swaps/swaps.util';
import {
  fetchSmartTransactionsLiveness,
  setSwapsFeatureFlags,
  setSmartTransactionsRefreshInterval,
} from '../../../store/actions';
import { useConfirmContext } from '../context/confirm';

export function useSmartTransactionFeatureFlags() {
  const dispatch = useDispatch();
  const { currentConfirmation } = useConfirmContext<TransactionMeta>();
  const {
    id: transactionId,
    txParams,
    networkClientId,
    chainId,
  } = currentConfirmation ?? {};
  const isTransaction = Boolean(txParams);

  const smartTransactionsPreferenceEnabled = useSelector(
    getSmartTransactionsPreferenceEnabled,
  );

  // TODO: Replace. Currently, this checks an hardcoded list in the client.
  const currentChainSupportsSmartTransactions = useSelector(
    getChainSupportsSmartTransactions,
  );

  const featureFlags = useSelector((state) =>
    getSmartTransactionsFeatureFlagsForChain(state, chainId),
  );

  useEffect(() => {
    if (
      !isTransaction ||
      !transactionId ||
      !smartTransactionsPreferenceEnabled ||
      !currentChainSupportsSmartTransactions
    ) {
      return;
    }

    Promise.all([
      // TODO: check if this is still needed.
      fetchSwapsFeatureFlags(),
      fetchSmartTransactionsLiveness({ networkClientId })(),
    ])
      .then(([swapsFeatureFlags]) => {
        // TODO: check if this is still needed.
        dispatch(setSwapsFeatureFlags(swapsFeatureFlags));
        dispatch(
          setSmartTransactionsRefreshInterval(
            featureFlags?.batchStatusPollingInterval ?? 1000,
          ),
        );
      })
      .catch((error) => {
        log.debug('Error updating smart transaction feature flags', error);
      });
  }, [
    isTransaction,
    transactionId,
    smartTransactionsPreferenceEnabled,
    currentChainSupportsSmartTransactions,
    networkClientId,
  ]);
}
