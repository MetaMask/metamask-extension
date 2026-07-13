import {
  Box,
  BoxFlexDirection,
  FontWeight,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import type { CaipAssetType } from '@metamask/utils';
import React from 'react';

import { useI18nContext } from '../../../hooks/useI18nContext';
import { useFiatFormatter } from '../../../hooks/useFiatFormatter';
import { useSpendableBalance } from '../hooks/useSpendableBalance';

export type SpendableBalanceSectionProps = {
  accountId?: string;
  assetId: CaipAssetType;
  totalBalance: string;
  symbol: string;
  fiatValue: number | null;
};

/**
 * Spendable balance section: breakdown for a native asset (total, spendable, reserved, fiat value).
 *
 * @param params - Spendable balance section parameters
 * @param params.accountId - Optional account id override.
 * @param params.assetId - CAIP asset id for the native asset.
 * @param params.totalBalance - The total balance
 * @param params.symbol - The symbol of the asset
 * @param params.fiatValue - The fiat value
 */
export function SpendableBalanceSection({
  accountId,
  assetId,
  totalBalance,
  symbol,
  fiatValue,
}: SpendableBalanceSectionProps) {
  const t = useI18nContext();
  const formatFiat = useFiatFormatter();
  const { baseReserve, spendableBalance } = useSpendableBalance({
    accountId,
    assetId,
    totalBalance,
  });

  if (baseReserve === undefined || spendableBalance === undefined) {
    return null;
  }

  const totalDisplay = `${totalBalance} ${symbol}`;
  const spendableDisplay = `${spendableBalance} ${symbol}`;
  const reservedDisplay = `${baseReserve} ${symbol}`;
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
          <Text
            variant={TextVariant.BodyMd}
            fontWeight={FontWeight.Medium}
            data-testid="spendable-balance-total-balance"
          >
            {totalDisplay}
          </Text>
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
          <Text
            variant={TextVariant.BodyMd}
            data-testid="spendable-balance-fiat-value"
          >
            {fiatValueDisplay}
          </Text>
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
          <Text
            variant={TextVariant.BodyMd}
            color={TextColor.SuccessDefault}
            data-testid="spendable-balance-spendable-balance"
          >
            {spendableDisplay}
          </Text>
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
          <Text
            variant={TextVariant.BodyMd}
            color={TextColor.SuccessDefault}
            data-testid="spendable-balance-base-reserved"
          >
            {reservedDisplay}
          </Text>
        </Box>
      </Box>
    </Box>
  );
}

export default SpendableBalanceSection;
