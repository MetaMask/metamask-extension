import React from 'react';
import { Box, Text } from '../../../../../components/component-library';
import {
  AlignItems,
  Display,
  FlexDirection,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../../../helpers/constants/design-system';
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
      display={Display.Flex}
      flexDirection={FlexDirection.Row}
      justifyContent={JustifyContent.center}
      alignItems={AlignItems.center}
      data-testid="money-account-withdraw-balance"
    >
      <Text
        variant={TextVariant.bodyMdMedium}
        color={TextColor.textAlternative}
      >
        {`${t('moneyAccountAvailableBalance')}${withdrawableFiatFormatted}`}
      </Text>
    </Box>
  );
};

export default MoneyAccountWithdrawBalance;
