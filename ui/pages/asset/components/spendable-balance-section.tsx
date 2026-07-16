import {
  Box,
  BoxFlexDirection,
  FontWeight,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import React, { useMemo } from 'react';
import { BigNumber } from 'bignumber.js';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useFiatFormatter } from '../../../hooks/useFiatFormatter';
import { computeSpendableBalance } from '../../../../shared/lib/multichain/spendable-balance';

export type SpendableBalanceSectionProps = {
  totalBalance: string;
  symbol: string;
  baseReserve: string;
  fiatValue: number | null;
};

/**
 * Spendable balance section: breakdown for a native asset (total, spendable, reserved, fiat value).
 *
 * @param params - Spendable balance section parameters
 * @param params.totalBalance - The total balance
 * @param params.symbol - The symbol of the asset
 * @param params.baseReserve - The base reserve
 * @param params.fiatValue - The fiat value
 */
export function SpendableBalanceSection({
  totalBalance,
  symbol,
  baseReserve,
  fiatValue,
}: SpendableBalanceSectionProps) {
  const t = useI18nContext();
  const formatFiat = useFiatFormatter();

  const { totalDisplay, spendableDisplay, reservedDisplay } = useMemo(() => {
    const spendable = computeSpendableBalance(totalBalance, baseReserve);

    return {
      totalDisplay: `${totalBalance} ${symbol}`,
      spendableDisplay: `${spendable} ${symbol}`,
      reservedDisplay: `${baseReserve} ${symbol}`,
    };
  }, [baseReserve, symbol, totalBalance]);

  const valueDisplay =
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
            {valueDisplay}
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
