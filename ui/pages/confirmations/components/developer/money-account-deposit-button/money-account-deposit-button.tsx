import React from 'react';

import { useMoneyAccountDeposit } from '../../../../../hooks/money/useMoneyAccountDeposit';
import { useMoneyAccountInfo } from '../../../../../hooks/money/useMoneyAccountInfo';
import { RouteWithMessenger } from '../../../../../layouts/route-with-messenger';
import { DeveloperButton } from '../developer-button';
import { MONEY_ACCOUNT_DEPOSIT_BUTTON_ALLOWED_CAPABILITIES } from './messenger';

/**
 * Developer trigger for the real Money Account deposit flow: the placeholder
 * approve + deposit batch from the money account, re-encoded by Pay once an
 * amount is chosen. Hidden entirely — not disabled — when the money account
 * is unavailable, the same rule every production entry point follows.
 */
const MoneyAccountDepositButtonContent = () => {
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

/**
 * {@link MoneyAccountDepositButtonContent}, wrapped in the route messenger it
 * needs to call `MoneyAccountAvailabilityService:getAvailability` via
 * `useMoneyAccountInfo`. This settings panel isn't behind a router route with
 * its own messenger, so it carries its own.
 */
export const MoneyAccountDepositButton = () => (
  <RouteWithMessenger
    path="money-account-deposit-button"
    capabilities={MONEY_ACCOUNT_DEPOSIT_BUTTON_ALLOWED_CAPABILITIES}
  >
    <MoneyAccountDepositButtonContent />
  </RouteWithMessenger>
);
