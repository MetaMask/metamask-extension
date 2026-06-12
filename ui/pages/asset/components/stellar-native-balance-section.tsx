import {
  Box,
  BoxFlexDirection,
  FontWeight,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import React, { useMemo } from 'react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { useFiatFormatter } from '../../../hooks/useFiatFormatter';

export type StellarNativeBalanceSectionProps = {
  totalBalance: string;
  symbol: string;
  baseReserve: string;
  fiatValue: number | null;
  showFiat: boolean;
};

function formatDisplayAmount(value: number): string {
  if (!Number.isFinite(value)) {
    return '0.00';
  }
  return value.toFixed(2);
}

/**
 * Balance breakdown for native Stellar XLM (total, spendable, reserved, fiat value).
 * @param options0
 * @param options0.totalBalance
 * @param options0.symbol
 * @param options0.baseReserve
 * @param options0.fiatValue
 * @param options0.showFiat
 */
export function StellarNativeBalanceSection({
  totalBalance,
  symbol,
  baseReserve,
  fiatValue,
  showFiat,
}: StellarNativeBalanceSectionProps) {
  const t = useI18nContext();
  const formatFiat = useFiatFormatter();

  const { totalDisplay, spendableDisplay, reservedDisplay } = useMemo(() => {
    const total = Number.parseFloat(totalBalance);
    const reserved = Number.parseFloat(baseReserve);
    const spendable = Math.max(
      0,
      (Number.isFinite(total) ? total : 0) -
        (Number.isFinite(reserved) ? reserved : 0),
    );

    return {
      totalDisplay: `${formatDisplayAmount(
        Number.isFinite(total) ? total : 0,
      )} ${symbol}`,
      spendableDisplay: `${formatDisplayAmount(spendable)} ${symbol}`,
      reservedDisplay: `${formatDisplayAmount(
        Number.isFinite(reserved) ? reserved : 0,
      )} ${symbol}`,
    };
  }, [baseReserve, symbol, totalBalance]);

  const valueDisplay =
    showFiat && fiatValue !== null && Number.isFinite(fiatValue)
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
      data-testid="stellar-native-balance-section"
    >
      <Text variant={TextVariant.HeadingSm}>
        {t('stellarNativeBalanceTitle')}
      </Text>
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
            {t('stellarNativeTotalBalance')}
          </Text>
          <Text
            variant={TextVariant.BodyMd}
            fontWeight={FontWeight.Medium}
            data-testid="stellar-native-total-balance"
          >
            {totalDisplay}
          </Text>
        </Box>
        {showFiat ? (
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
              {t('stellarNativeValue')}
            </Text>
            <Text
              variant={TextVariant.BodyMd}
              data-testid="stellar-native-fiat-value"
            >
              {valueDisplay}
            </Text>
          </Box>
        ) : null}
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
            {t('stellarNativeSpendableBalance')}
          </Text>
          <Text
            variant={TextVariant.BodyMd}
            color={TextColor.SuccessDefault}
            data-testid="stellar-native-spendable-balance"
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
            {t('stellarNativeReservedBalance')}
          </Text>
          <Text
            variant={TextVariant.BodyMd}
            color={TextColor.SuccessDefault}
            data-testid="stellar-native-reserved-balance"
          >
            {reservedDisplay}
          </Text>
        </Box>
      </Box>
    </Box>
  );
}

export default StellarNativeBalanceSection;
