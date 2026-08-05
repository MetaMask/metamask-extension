import React from 'react';

import { useMoneyAccountDeposit } from '../../../../../hooks/money/useMoneyAccountDeposit';
import { useMoneyAccountInfo } from '../../../../../hooks/money/useMoneyAccountInfo';
import { DeveloperButton } from '../developer-button';

/**
 * Developer trigger for the real Money Account deposit flow: the placeholder
 * approve + deposit batch from the money account, re-encoded by Pay once an
 * amount is chosen. Hidden entirely — not disabled — when the money account
 * is unavailable, the same rule every production entry point follows.
 */
export const MoneyAccountDepositButton = () => {
  const { hasMoneyAccount } = useMoneyAccountInfo();
  const { initiateDeposit, isLoading } = useMoneyAccountDeposit();

  if (!hasMoneyAccount) {
    return null;
  }

  return (
    <DeveloperButton
      title="Money Account Deposit"
      onPress={() =>
        initiateDeposit().catch((error) =>
          console.error('Failed to initiate money account deposit', error),
        )
      }
      disabled={isLoading}
    />
  );
};
