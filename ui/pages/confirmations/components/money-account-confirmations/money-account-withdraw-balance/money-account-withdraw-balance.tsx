import React from 'react';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
  FontWeight,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useMoneyAccountBalance } from '../../../../../hooks/money/useMoneyAccountBalance';

/**
 * "Available balance: $X.XX" under the Money Account withdraw amount input.
 *
 * Mirrors mobile's `MoneyAccountWithdrawBalance`. Callers must render this
 * under a route messenger that includes
 * `MoneyAccountAvailabilityService:getAvailability`.
 *
 * @returns The available-balance line, or nothing while the figure is unknown.
 */
export const MoneyAccountWithdrawBalance = () => {
  const t = useI18nContext();
  const { withdrawableFiatFormatted } = useMoneyAccountBalance();

  if (!withdrawableFiatFormatted) {
    return null;
  }

  return (
    <Box
      flexDirection={BoxFlexDirection.Row}
      justifyContent={BoxJustifyContent.Center}
      alignItems={BoxAlignItems.Center}
      data-testid="money-account-withdraw-balance"
    >
      <Text
        variant={TextVariant.BodyMd}
        fontWeight={FontWeight.Medium}
        color={TextColor.TextAlternative}
      >
        {`${t('moneyAccountAvailableBalance')}${withdrawableFiatFormatted}`}
      </Text>
    </Box>
  );
};

export default MoneyAccountWithdrawBalance;
