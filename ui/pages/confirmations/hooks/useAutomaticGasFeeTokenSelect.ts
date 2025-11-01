import { TransactionMeta } from '@metamask/transaction-controller';
import { useCallback, useState } from 'react';
import { useDispatch } from 'react-redux';

import { NATIVE_TOKEN_ADDRESS } from '../../../../shared/constants/transaction';
import { useAsyncResult } from '../../../hooks/useAsync';
import { forceUpdateMetamaskState } from '../../../store/actions';
import { updateSelectedGasFeeToken } from '../../../store/controller-actions/transaction-controller';
import { useConfirmContext } from '../context/confirm';
import { useInsufficientBalanceAlerts } from './alerts/transactions/useInsufficientBalanceAlerts';
import { useIsGaslessSupported } from './gas/useIsGaslessSupported';

export function useAutomaticGasFeeTokenSelect() {
  const dispatch = useDispatch();
  const { isSupported: isGaslessSupported, isSmartTransaction } =
    useIsGaslessSupported();
  const [firstCheck, setFirstCheck] = useState(true);

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

  let firstGasFeeTokenAddress = gasFeeTokens?.[0]?.tokenAddress;

  if (!isSmartTransaction && firstGasFeeTokenAddress === NATIVE_TOKEN_ADDRESS) {
    firstGasFeeTokenAddress = gasFeeTokens?.[1]?.tokenAddress;
  }

  const selectFirstToken = useCallback(async () => {
    await updateSelectedGasFeeToken(transactionId, firstGasFeeTokenAddress);
    await forceUpdateMetamaskState(dispatch);
  }, [dispatch, transactionId, firstGasFeeTokenAddress]);

  const shouldSelect =
    isGaslessSupported &&
    hasInsufficientBalance &&
    !selectedGasFeeToken &&
    Boolean(firstGasFeeTokenAddress);

  useAsyncResult(async () => {
    if (!gasFeeTokens || !transactionId || !firstCheck) {
      return;
    }

    if (shouldSelect) {
      await selectFirstToken();
      setFirstCheck(false);
    }
  }, [shouldSelect, selectFirstToken, firstCheck, gasFeeTokens, transactionId]);
}
