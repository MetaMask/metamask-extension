import { TransactionMeta } from '@metamask/transaction-controller';
import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useConfirmContext } from '../context/confirm';
import { useAsyncResult } from '../../../hooks/useAsync';
import { updateSelectedGasFeeToken } from '../../../store/controller-actions/transaction-controller';
import { forceUpdateMetamaskState } from '../../../store/actions';
import { getIsSmartTransaction } from '../../../../shared/modules/selectors';
import { useInsufficientBalanceAlerts } from './alerts/transactions/useInsufficientBalanceAlerts';

export function useAutomaticGasFeeTokenSelect() {
  const dispatch = useDispatch();
  const isSmartTransaction = useSelector(getIsSmartTransaction);

  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();

  const hasInsufficientBalance = Boolean(
    useInsufficientBalanceAlerts()?.length,
  );

  const {
    gasFeeTokens,
    id: transactionId,
    selectedGasFeeToken,
  } = transactionMeta;

  const firstGasFeeTokenAddress = gasFeeTokens?.[0]?.tokenAddress;

  const selectFirstToken = useCallback(async () => {
    await updateSelectedGasFeeToken(transactionId, firstGasFeeTokenAddress);
    await forceUpdateMetamaskState(dispatch);
  }, [dispatch, transactionId, firstGasFeeTokenAddress]);

  const shouldSelect =
    isSmartTransaction &&
    hasInsufficientBalance &&
    !selectedGasFeeToken &&
    Boolean(firstGasFeeTokenAddress);

  useAsyncResult(async () => {
    if (!shouldSelect) {
      return;
    }

    await selectFirstToken();
  }, []);
}
