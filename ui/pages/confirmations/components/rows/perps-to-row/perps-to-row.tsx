import React from 'react';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  Icon,
  IconColor,
  IconName,
  IconSize,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import {
  ConfirmInfoRow,
  ConfirmInfoRowSize,
} from '../../../../../components/app/confirm/info/row/row';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useIsMoneyAccountPerpsNavigation } from '../../../hooks/pay/useIsMoneyAccountPerpsNavigation';

/**
 * Destination row shown on token-funded Perps deposits:
 * `To: [Infinity icon] Perps balance`.
 *
 * Hidden on Money Account → Perps deposits, which use `PerpsAccountPickerRow`
 * as their `To` row.
 */
export function PerpsToRow() {
  const t = useI18nContext();
  const isMoneyAccountPerpsDeposit = useIsMoneyAccountPerpsNavigation();

  if (isMoneyAccountPerpsDeposit) {
    return null;
  }

  return (
    <ConfirmInfoRow
      data-testid="perps-to-row"
      label={t('to')}
      rowVariant={ConfirmInfoRowSize.Small}
    >
      <Box
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Center}
        gap={1}
      >
        <Icon
          name={IconName.Infinity}
          size={IconSize.Md}
          color={IconColor.IconDefault}
          className="shrink-0"
          data-testid="perps-to-icon"
        />
        <Text
          variant={TextVariant.BodyMd}
          color={TextColor.TextDefault}
          data-testid="perps-to-label"
        >
          {t('perpsBalance')}
        </Text>
      </Box>
    </ConfirmInfoRow>
  );
}
