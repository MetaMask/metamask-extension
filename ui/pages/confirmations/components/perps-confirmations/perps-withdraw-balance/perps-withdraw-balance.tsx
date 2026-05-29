import React, { useMemo } from 'react';

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
import { useFormatters } from '../../../../../hooks/useFormatters';
import { usePerpsLiveAccount } from '../../../../../hooks/perps/stream';
import { getTradeableBalance } from '../../../../../hooks/perps/getTradeableBalance';

export const PerpsWithdrawBalance = () => {
  const t = useI18nContext();
  const { formatCurrency } = useFormatters();
  const { account } = usePerpsLiveAccount();

  const balanceFormatted = useMemo(() => {
    const value = parseFloat(getTradeableBalance(account)) || 0;
    return formatCurrency(value, 'USD');
  }, [account, formatCurrency]);

  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Row}
      justifyContent={JustifyContent.center}
      alignItems={AlignItems.center}
      paddingBottom={2}
    >
      <Text
        variant={TextVariant.bodyMdMedium}
        color={TextColor.textAlternative}
      >
        {`${t('perpsAvailableBalance')}${balanceFormatted}`}
      </Text>
    </Box>
  );
};
