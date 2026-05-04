import { TransactionMeta } from '@metamask/transaction-controller';
import { useCallback, useState } from 'react';
import { useDispatch } from 'react-redux';

import { NATIVE_TOKEN_ADDRESS } from '../../../../shared/constants/transaction';
import { useAsyncResult } from '../../../hooks/useAsync';
import { forceUpdateMetamaskState } from '../../../store/actions';
import { updateSelectedGasFeeToken } from '../../../store/controller-actions/transaction-controller';
import { useConfirmContext } from '../context/confirm';
import { useIsGaslessSupported } from './gas/useIsGaslessSupported';
import { useHasInsufficientBalance } from './useHasInsufficientBalance';
import { useTransactionEventFragment } from './useTransactionEventFragment';

export function useAutomaticGasFeeTokenSelect() {
  const dispatch = useDispatch();
  const {
    isSupported: isGaslessSupported,
    isSmartTransaction,
    pending,
  } = useIsGaslessSupported();
  const [firstCheck, setFirstCheck] = useState(true);

  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();

  const { hasInsufficientBalance } = useHasInsufficientBalance();
  const { updateTransactionEventFragment } = useTransactionEventFragment();

  const {
    gasFeeTokens,
    id: transactionId,
    selectedGasFeeToken,
    excludeNativeTokenForFee,
  } = transactionMeta;

  let firstGasFeeTokenAddress = gasFeeTokens?.[0]?.tokenAddress;

  if (!isSmartTransaction && firstGasFeeTokenAddress === NATIVE_TOKEN_ADDRESS) {
    firstGasFeeTokenAddress = gasFeeTokens?.[1]?.tokenAddress;
  }

  const selectFirstToken = useCallback(async () => {
    await updateSelectedGasFeeToken(transactionId, firstGasFeeTokenAddress);
    await forceUpdateMetamaskState(dispatch);
  }, [dispatch, transactionId, firstGasFeeTokenAddress]);

  const isGaslessSupportedAndFinished = isGaslessSupported && !pending;

  /**
   * Selecting first gas fee token when `selectedGasFeeToken` is set but
   * actually doesn't exist in the gasFeeTokens list.
   * Since this logic is introduced with Tempo we use `excludeNativeTokenForFee`
   * (only be set for Tempo as of now) to reduce regression risks.
   */
  const hasSelectedGasFeeTokenNotInList =
    excludeNativeTokenForFee &&
    selectedGasFeeToken &&
    !gasFeeTokens?.find(
      ({ tokenAddress }) =>
        tokenAddress.toLocaleLowerCase() ===
        selectedGasFeeToken.toLocaleLowerCase(),
    );

  const shouldSelect =
    Boolean(firstGasFeeTokenAddress) &&
    ((isGaslessSupportedAndFinished &&
      hasInsufficientBalance &&
      !selectedGasFeeToken) ||
      hasSelectedGasFeeTokenNotInList);

  useAsyncResult(async () => {
    if (!gasFeeTokens || !transactionId || !firstCheck) {
      return;
    }

    if (shouldSelect) {
      await selectFirstToken();
      const automaticFeeTokenSelected = gasFeeTokens?.find(
        ({ tokenAddress }) => tokenAddress === firstGasFeeTokenAddress,
      )?.symbol;
      updateTransactionEventFragment(
        {
          properties: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            gas_payment_token_default: true,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            gas_payment_token_default_symbol: automaticFeeTokenSelected,
          },
        },
        transactionId,
      );
      setFirstCheck(false);
    }
  }, [
    shouldSelect,
    selectFirstToken,
    firstCheck,
    gasFeeTokens,
    transactionId,
    updateTransactionEventFragment,
    firstGasFeeTokenAddress,
  ]);
}
