import { useDispatch, useSelector } from 'react-redux';
import { useEffect } from 'react';
import { TransactionMeta } from '@metamask/transaction-controller';
import log from 'loglevel';
import { getAllowedSmartTransactionsChainIds } from '../../../../shared/constants/smartTransactions';
import {
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
    chainId: transactionChainId,
  } = currentConfirmation ?? {};
  const isTransaction = Boolean(txParams);

  const smartTransactionsPreferenceEnabled = useSelector(
    getSmartTransactionsPreferenceEnabled,
  );

  // TODO: replace with the new feature flags when we have them.
  const chainSupportsSTX =
    transactionChainId &&
    getAllowedSmartTransactionsChainIds().includes(transactionChainId);

  const featureFlags = useSelector((state) =>
    transactionChainId
      ? getSmartTransactionsFeatureFlagsForChain(state, transactionChainId)
      : undefined,
  );

  useEffect(() => {
    if (
      !isTransaction ||
      !transactionId ||
      !smartTransactionsPreferenceEnabled ||
      !chainSupportsSTX
    ) {
      return;
    }

    Promise.all([
      // TODO: remove this when swaps feature flags are removed.
      fetchSwapsFeatureFlags(),
      fetchSmartTransactionsLiveness({ chainId: transactionChainId })(),
    ])
      .then(([swapsFeatureFlags]) => {
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
    chainSupportsSTX,
    transactionChainId,
    featureFlags,
    dispatch,
  ]);
}
