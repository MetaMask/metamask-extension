import {
  Box,
  BoxFlexDirection,
  FontWeight,
  SensitiveText,
  Text,
  TextColor,
  TextVariant,
  SensitiveTextLength,
} from '@metamask/design-system-react';
import React from 'react';
import { useSelector } from 'react-redux';

import { getPreferences } from '../../../../shared/lib/selectors/preferences';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useFiatFormatter } from '../../../hooks/useFiatFormatter';

export type SpendableBalanceSectionProps = {
  spendableBalance: string;
  minimumReserveBalance: string;
  totalBalance: string;
  symbol: string;
  fiatValue: number | null;
};

/**
 * Spendable balance section: breakdown for a native asset (total, spendable, reserved, fiat value).
 *
 * @param params - Spendable balance section parameters
 * @param params.minimumReserveBalance - minimum reserve balance.
 * @param params.spendableBalance - spendable balance.
 * @param params.totalBalance - The total balance
 * @param params.symbol - The symbol of the asset
 * @param params.fiatValue - The fiat value
 */
export function SpendableBalanceSection({
  minimumReserveBalance,
  spendableBalance,
  totalBalance,
  symbol,
  fiatValue,
}: SpendableBalanceSectionProps) {
  const t = useI18nContext();
  const formatFiat = useFiatFormatter();
  const { privacyMode } = useSelector(getPreferences);

  const totalDisplay = `${totalBalance} ${symbol}`;
  const spendableDisplay = `${spendableBalance} ${symbol}`;
  const reservedDisplay = `${minimumReserveBalance} ${symbol}`;
  const fiatValueDisplay =
    fiatValue !== null && Number.isFinite(fiatValue)
      ? formatFiat(fiatValue)
      : '—';

  return (
    <Box
      flexDirection={BoxFlexDirection.Column}
      paddingLeft={4}
      paddingRight={4}
      paddingTop={3}
      paddingBottom={3}
      gap={3}
      data-testid="spendable-balance-section"
    >
      <Text variant={TextVariant.HeadingSm}>{t('balance')}</Text>
      <Box flexDirection={BoxFlexDirection.Row} gap={3}>
        <Box
          flexDirection={BoxFlexDirection.Column}
          gap={1}
          style={{ flex: 1 }}
        >
          <Text
            variant={TextVariant.BodySm}
            fontWeight={FontWeight.Medium}
            color={TextColor.TextAlternative}
          >
            {t('spendableBalanceTotalBalance')}
          </Text>
          <SensitiveText
            variant={TextVariant.BodyMd}
            data-testid="spendable-balance-total-balance"
            isHidden={privacyMode}
            length={SensitiveTextLength.Medium}
          >
            {totalDisplay}
          </SensitiveText>
        </Box>
        <Box
          flexDirection={BoxFlexDirection.Column}
          gap={1}
          style={{ flex: 1 }}
        >
          <Text
            variant={TextVariant.BodySm}
            fontWeight={FontWeight.Medium}
            color={TextColor.TextAlternative}
          >
            {t('spendableBalanceFiatValue')}
          </Text>
          <SensitiveText
            variant={TextVariant.BodyMd}
            data-testid="spendable-balance-fiat-value"
            isHidden={privacyMode}
            length={SensitiveTextLength.Medium}
          >
            {fiatValueDisplay}
          </SensitiveText>
        </Box>
      </Box>
      <Box flexDirection={BoxFlexDirection.Row} gap={3}>
        <Box
          flexDirection={BoxFlexDirection.Column}
          gap={1}
          style={{ flex: 1 }}
        >
          <Text
            variant={TextVariant.BodySm}
            fontWeight={FontWeight.Medium}
            color={TextColor.TextAlternative}
          >
            {t('spendableBalance')}
          </Text>
          <SensitiveText
            variant={TextVariant.BodyMd}
            color={TextColor.SuccessDefault}
            data-testid="spendable-balance-spendable-balance"
            isHidden={privacyMode}
            length={SensitiveTextLength.Medium}
          >
            {spendableDisplay}
          </SensitiveText>
        </Box>
        <Box
          flexDirection={BoxFlexDirection.Column}
          gap={1}
          style={{ flex: 1 }}
        >
          <Text
            variant={TextVariant.BodySm}
            fontWeight={FontWeight.Medium}
            color={TextColor.TextAlternative}
          >
            {t('spendableBalanceBaseReserved')}
          </Text>
          <SensitiveText
            variant={TextVariant.BodyMd}
            color={TextColor.SuccessDefault}
            data-testid="spendable-balance-base-reserved"
            isHidden={privacyMode}
            length={SensitiveTextLength.Medium}
          >
            {reservedDisplay}
          </SensitiveText>
        </Box>
      </Box>
    </Box>
  );
}

export default SpendableBalanceSection;
