import { useSelector } from 'react-redux';
import { GasFeeToken, TransactionMeta } from '@metamask/transaction-controller';
import { Hex } from '@metamask/utils';
import { getMoneyAccountFlow } from '../../../../../shared/lib/money/money-account-flow';
import { useConfirmContext } from '../../context/confirm';
import { getUseTransactionSimulations } from '../../../../selectors';
import { useHasInsufficientBalance } from '../useHasInsufficientBalance';
import { NATIVE_TOKEN_ADDRESS } from '../../../../../shared/constants/transaction';
import { useIsGaslessSupported } from './useIsGaslessSupported';
import { useIsGasFeeSponsored } from './useIsGasFeeSponsored';

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

  const { isGasFeeSponsored } = useIsGasFeeSponsored();

  const isSimulationEnabled = useSelector(getUseTransactionSimulations);

  const { hasInsufficientBalance } = useHasInsufficientBalance();

  const isGaslessSupportedFinished =
    !isGaslessSupportedPending && isGaslessSupported;

  const hasNoNativeTokenAvailable =
    excludeNativeTokenForFee || hasInsufficientBalance;

  // Sponsored transactions do not need gas fee tokens. Money Account batches
  // skip the initial gas estimate, so `gasFeeTokens` never arrives. Waiting on
  // them leaves the confirm button spinning after quotes (and "Paid by
  // MetaMask") are ready.
  const skipsGaslessTokenWait =
    isGasFeeSponsored || Boolean(getMoneyAccountFlow(transactionMeta));

  const isGaslessLoading = Boolean(
    !skipsGaslessTokenWait &&
    isSimulationEnabled &&
    hasNoNativeTokenAvailable &&
    (isGaslessSupportedPending || isGaslessSupportedFinished) &&
    (!gasFeeTokens ||
      (excludeNativeTokenForFee &&
        hasWrongSelectedGasFeeToken({ gasFeeTokens, selectedGasFeeToken }))),
  );

  return { isGaslessLoading };
}
