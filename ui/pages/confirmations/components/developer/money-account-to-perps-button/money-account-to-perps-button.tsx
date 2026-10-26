import React from 'react';

import { usePerpsDepositConfirmation } from '../../../../../components/app/perps/hooks/usePerpsDepositConfirmation';
import { useMoneyAccountInfo } from '../../../../../hooks/money/useMoneyAccountInfo';
import { RouteMessengerProvider } from '../../../../../contexts/route-messenger';
import { PayWithOption } from '../../../hooks/useConfirmationNavigation';
import { DeveloperButton } from '../developer-button';
import { MONEY_ACCOUNT_TO_PERPS_BUTTON_ALLOWED_CAPABILITIES } from './messenger';

/**
 * Developer trigger for the Money Account → Perps send flow: opens the perps
 * deposit confirmation with the money account locked as the source of funds.
 * Hidden when the money account is unavailable.
 */
const MoneyAccountToPerpsButtonContent = () => {
  const { hasMoneyAccount } = useMoneyAccountInfo();
  const { trigger, isLoading } = usePerpsDepositConfirmation({
    payWithOption: PayWithOption.MoneyAccount,
  });

  if (!hasMoneyAccount) {
    return null;
  }

  return (
    <DeveloperButton
      title="Send from Money Account to Perps"
      onPress={() =>
        trigger().catch((error) =>
          console.error(
            'Failed to initiate money account to perps deposit',
            error,
          ),
        )
      }
      disabled={isLoading}
    />
  );
};

/**
 * {@link MoneyAccountToPerpsButtonContent}, wrapped in the route messenger it
 * needs to call `MoneyAccountAvailabilityService:getAvailability` via
 * `useMoneyAccountInfo`.
 */
export const MoneyAccountToPerpsButton = () => (
  <RouteMessengerProvider
    path="money-account-to-perps-button"
    capabilities={MONEY_ACCOUNT_TO_PERPS_BUTTON_ALLOWED_CAPABILITIES}
  >
    <MoneyAccountToPerpsButtonContent />
  </RouteMessengerProvider>
);
