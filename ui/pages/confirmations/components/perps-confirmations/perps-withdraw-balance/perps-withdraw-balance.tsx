import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { Box } from '../../../../../components/component-library/box/box';
import { Text } from '../../../../../components/component-library/text/text';
import { SensitiveText } from '../../../../../components/component-library/sensitive-text/sensitive-text';
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
import { usePerpsLiveAccount } from '../../../../../hooks/perps/stream/usePerpsLiveAccount';
import { getTradeableBalance } from '../../../../../hooks/perps/getTradeableBalance';
import { getPreferences } from '../../../../../../shared/lib/selectors/preferences';

export const PerpsWithdrawBalance = () => {
  const t = useI18nContext();
  const { formatCurrency } = useFormatters();
  const { account } = usePerpsLiveAccount();
  const { privacyMode } = useSelector(getPreferences);

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
        {t('perpsAvailableBalance')}
      </Text>
      <SensitiveText
        variant={TextVariant.bodyMdMedium}
        color={TextColor.textAlternative}
        isHidden={privacyMode}
        data-testid="perps-withdraw-balance-value"
      >
        {balanceFormatted}
      </SensitiveText>
    </Box>
  );
};
