import { useSelector } from 'react-redux';
import { TransactionMeta } from '@metamask/transaction-controller';
import { useMemo } from 'react';
import { useConfirmContext } from '../../context/confirm';
import { getUseTransactionSimulations } from '../../../../selectors';
import { useHasInsufficientBalance } from '../useHasInsufficientBalance';
import { NATIVE_TOKEN_ADDRESS } from '../../../../../shared/constants/transaction';
import { useIsGaslessSupported } from './useIsGaslessSupported';

export function useIsGaslessLoading() {
  const { currentConfirmation: transactionMeta } =
    useConfirmContext<TransactionMeta>();

  const { gasFeeTokens, excludeNativeTokenForFee, selectedGasFeeToken } =
    transactionMeta ?? {};

  const {
    isSupported: isGaslessSupported,
    pending: isGaslessSupportedPending,
  } = useIsGaslessSupported();

  const isSimulationEnabled = useSelector(getUseTransactionSimulations);

  const { hasInsufficientBalance } = useHasInsufficientBalance();

  const isGaslessLoading = useMemo(() => {
    if (!isSimulationEnabled) {
      return false;
    }
    // No need for waiting if user doesn't have insufficient balance, unless native is excluded.
    if (!excludeNativeTokenForFee && !hasInsufficientBalance) {
      return false;
    }
    if (isGaslessSupportedPending) {
      return true;
    }
    if (!isGaslessSupported) {
      return false;
    }
    /*
     * Sometimes useAutomaticGasFeeTokenSelect needs to have time to run
     * for the correct available fee token to be assigned.
     * This is the case on Tempo when we 'suggest' a default fee token
     * but this is not one of the available token.
     * Not doing this would fallback on using the native token, which makes it
     * less painful on other chains, but means tx failure on Tempo.
     * By using `excludeNativeTokenForFee` as guard, we limit regression risks on
     * other networks/flows while solving this issue for Tempo.
     * Without this, clicking too fast on "confirm" while the tx is building would
     * be possible and would cause a tx failure.
     */
    if (excludeNativeTokenForFee) {
      // `excludeNativeTokenForFee` assumes no native, so we expect gasFeeTokens (empty array [] OK).
      if (!gasFeeTokens) {
        return true;
      }
      // Empty gasFeeTokens means we finished loading - tx won't be submittable.
      if (gasFeeTokens.length === 0) {
        return false;
      }
      // If no gas fee token is selected, there might just be none available.
      if (!selectedGasFeeToken) {
        return false;
      }
      // If a non-native gas fee token is selected but doesn't match the gasFeeTokens list,
      // then we are in this "wait" situation where useAutomaticGasFeeTokenSelect logic
      // will execute, auto-selecting the first gas fee token available.
      // In the meantime we want consider that the state is loading so user won't hit "confirm".
      const hasSelectedGasFeeTokenInconsistentWithAvailableGasFeeTokens =
        selectedGasFeeToken !== NATIVE_TOKEN_ADDRESS &&
        !gasFeeTokens.some(
          ({ tokenAddress }) =>
            tokenAddress?.toLocaleLowerCase() ===
            selectedGasFeeToken?.toLocaleLowerCase(),
        );
      return hasSelectedGasFeeTokenInconsistentWithAvailableGasFeeTokens;
    }
    // Nominal case: Loading if waiting for gasFeeTokens list while not enough native.
    return !gasFeeTokens;
  }, [
    isGaslessSupportedPending,
    isGaslessSupported,
    isSimulationEnabled,
    hasInsufficientBalance,
    gasFeeTokens,
    selectedGasFeeToken,
    excludeNativeTokenForFee,
  ]);
  return { isGaslessLoading };
}
