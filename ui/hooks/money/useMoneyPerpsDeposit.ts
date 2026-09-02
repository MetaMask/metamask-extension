import { useCallback } from 'react';
import { useSelector } from 'react-redux';
import { TransactionType } from '@metamask/transaction-controller';
import { usePerpsDepositConfirmation } from '../../components/app/perps/hooks/usePerpsDepositConfirmation';
import { usePerpsEligibility } from '../perps/usePerpsEligibility';
import { selectIsMoneyAccountTransactionEnabled } from '../../pages/confirmations/selectors/feature-flags';
import { PayWithOption } from '../../pages/confirmations/hooks/useConfirmationNavigation';

/**
 * Money home entry for sending funds to a Perps account: opens the Perps
 * deposit confirmation with Money Account locked as the funding source
 * (`payWithOption=money_account`), matching mobile `useMoneyPerpsDeposit`.
 *
 * Destination account selection on the confirmation updates `txParams.from`
 * via {@link PerpsAccountPickerRow}.
 *
 * @returns Whether the entry is enabled, the initiator, and loading state.
 */
export function useMoneyPerpsDeposit() {
  const { isEligible } = usePerpsEligibility();
  const isFlagEnabled = useSelector((state) =>
    selectIsMoneyAccountTransactionEnabled(state, TransactionType.perpsDeposit),
  );
  const { trigger, isLoading } = usePerpsDepositConfirmation({
    payWithOption: PayWithOption.MoneyAccount,
  });

  const initiatePerpsDeposit = useCallback(async () => {
    try {
      await trigger();
    } catch (error) {
      console.error(
        '[MoneyPerpsDeposit] Perps deposit initiation failed',
        error,
      );
    }
  }, [trigger]);

  return {
    isEnabled: Boolean(isEligible && isFlagEnabled),
    isEligible,
    initiatePerpsDeposit,
    isLoading,
  };
}
