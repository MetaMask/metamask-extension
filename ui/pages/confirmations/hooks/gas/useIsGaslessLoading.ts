import { useSelector } from 'react-redux';
import { GasFeeToken, TransactionMeta } from '@metamask/transaction-controller';
import { Hex } from '@metamask/utils';
import { useConfirmContext } from '../../context/confirm';
import { getUseTransactionSimulations } from '../../../../selectors';
import { useHasInsufficientBalance } from '../useHasInsufficientBalance';
import { NATIVE_TOKEN_ADDRESS } from '../../../../../shared/constants/transaction';
import { useIsGaslessSupported } from './useIsGaslessSupported';

// Chains with no native may have selectedGasFeeToken inconsistent with gasFeeTokens
function hasWrongSelectedGasFeeToken({
  gasFeeTokens,
  selectedGasFeeToken,
}: {
  gasFeeTokens: GasFeeToken[];
  selectedGasFeeToken?: Hex;
}) {
  return (
    gasFeeTokens.length &&
    selectedGasFeeToken &&
    selectedGasFeeToken !== NATIVE_TOKEN_ADDRESS &&
    !gasFeeTokens.some(
      ({ tokenAddress }) =>
        tokenAddress?.toLocaleLowerCase() ===
        selectedGasFeeToken?.toLocaleLowerCase(),
    )
  );
}

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

  const isGaslessSupportedFinished =
    !isGaslessSupportedPending && isGaslessSupported;

  const hasNoNativeTokenAvailable =
    excludeNativeTokenForFee || hasInsufficientBalance;

  const isGaslessLoading = Boolean(
    isSimulationEnabled &&
    hasNoNativeTokenAvailable &&
    (isGaslessSupportedPending || isGaslessSupportedFinished) &&
    (!gasFeeTokens ||
      (excludeNativeTokenForFee &&
        hasWrongSelectedGasFeeToken({ gasFeeTokens, selectedGasFeeToken }))),
  );

  return { isGaslessLoading };
}
