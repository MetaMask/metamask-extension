import { TransactionMeta } from '@metamask/transaction-controller';
import { useConfirmContext } from '../context/confirm';
import { useAsyncResult } from '../../../hooks/useAsync';
import { useInsufficientBalanceAlerts } from './alerts/transactions/useInsufficientBalanceAlerts';
import { useCallback, useState } from 'react';
import { updateSelectedGasFeeToken } from '../../../store/actions/transaction-controller';
import { useDispatch } from 'react-redux';
import { forceUpdateMetamaskState } from '../../../store/actions';

export function useAutomaticGasFeeTokenSelect() {
  const dispatch = useDispatch();
  const [isFirstLoad, setIsFirstLoad] = useState(true);

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
  }, [transactionId, firstGasFeeTokenAddress]);

  const shouldSelect =
    isFirstLoad &&
    hasInsufficientBalance &&
    !selectedGasFeeToken &&
    Boolean(firstGasFeeTokenAddress);

  useAsyncResult(async () => {
    setIsFirstLoad(false);

    if (!shouldSelect) {
      return;
    }

    await selectFirstToken();
  }, [firstGasFeeTokenAddress, selectFirstToken, shouldSelect]);
}
