import React from 'react';

import { useMoneyAccountInfo } from '../../../../../hooks/money/useMoneyAccountInfo';
import { useMoneyAccountWithdrawal } from '../../../../../hooks/money/useMoneyAccountWithdrawal';
import { RouteMessengerProvider } from '../../../../../contexts/route-messenger';
import { DeveloperButton } from '../developer-button';
import { MONEY_ACCOUNT_WITHDRAW_BUTTON_ALLOWED_CAPABILITIES } from './messenger';

/**
 * Developer trigger for the real Money Account withdraw flow: the placeholder
 * withdraw + transfer batch from the money account, re-encoded once an amount
 * is chosen. Hidden entirely — not disabled — when the money account is
 * unavailable, the same rule every production entry point follows.
 */
const MoneyAccountWithdrawButtonContent = () => {
  const { hasMoneyAccount } = useMoneyAccountInfo();
  const { initiateWithdrawal, isLoading } = useMoneyAccountWithdrawal();

  if (!hasMoneyAccount) {
    return null;
  }

  return (
    <DeveloperButton
      title="Money Account Withdraw"
      onPress={() =>
        initiateWithdrawal().catch((error) =>
          console.error('Failed to initiate money account withdrawal', error),
        )
      }
      disabled={isLoading}
    />
  );
};

/**
 * {@link MoneyAccountWithdrawButtonContent}, wrapped in the route messenger it
 * needs to call `MoneyAccountAvailabilityService:getAvailability` via
 * `useMoneyAccountInfo`. This settings panel isn't behind a router route with
 * its own messenger, so it carries its own.
 */
export const MoneyAccountWithdrawButton = () => (
  <RouteMessengerProvider
    path="money-account-withdraw-button"
    capabilities={MONEY_ACCOUNT_WITHDRAW_BUTTON_ALLOWED_CAPABILITIES}
  >
    <MoneyAccountWithdrawButtonContent />
  </RouteMessengerProvider>
);
