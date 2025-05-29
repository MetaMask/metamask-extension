import { TransactionMeta } from '@metamask/transaction-controller';
import { useCallback, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useAsyncResult } from '../../../hooks/useAsync';
import { forceUpdateMetamaskState } from '../../../store/actions';
import { updateSelectedGasFeeToken } from '../../../store/controller-actions/transaction-controller';
import { useConfirmContext } from '../context/confirm';
import { NATIVE_TOKEN_ADDRESS } from '../components/confirm/info/hooks/useGasFeeToken';
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

    setFirstCheck(false);

    if (shouldSelect) {
      await selectFirstToken();
    }
  }, [shouldSelect, selectFirstToken, firstCheck, gasFeeTokens, transactionId]);
}
