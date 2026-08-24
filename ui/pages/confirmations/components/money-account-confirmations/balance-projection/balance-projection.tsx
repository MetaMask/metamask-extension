import React, { useMemo } from 'react';
import BigNumber from 'bignumber.js';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
  ButtonIconSize,
  IconColor,
  Skeleton,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../../../hooks/useI18nContext';
import { useMoneyAccountBalance } from '../../../../../hooks/money/useMoneyAccountBalance';
import { moneyFormatUsd } from '../../../../../helpers/money/format';
import { RouteMessengerProvider } from '../../../../../contexts/route-messenger';
import { MONEY_ACCOUNT_BALANCE_ALLOWED_CAPABILITIES } from '../messenger';
import { InfoPopoverTooltip } from '../../info-popover-tooltip';

export type BalanceProjectionProps = {
  amountFiat: string;
  projectedYears: number;
};

/**
 * True for a finite number that is zero or positive. Used to reject missing,
 * negative, or NaN APY values — those must not produce a projection.
 *
 * @param value - Candidate APY decimal or percent.
 * @returns Whether the value can be used in a projection.
 */
function isPositiveNumberOrZero(value: number | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0;
}

/**
 * Amount-screen subtitle for a Money Account deposit: the APY pitch at $0,
 * or a compounded projected balance once the user types an amount.
 *
 * Ported from mobile `BalanceProjection`. Info icons open a popover rather
 * than a full-screen sheet — the extension has no Money modal stack yet.
 *
 * @param props - Component props.
 * @param props.amountFiat - Fiat amount currently in the custom-amount input.
 * @param props.projectedYears - Compounding horizon, typically 1.
 * @returns The subtitle, a loading skeleton, or nothing.
 */
const BalanceProjectionContent = ({
  amountFiat,
  projectedYears,
}: BalanceProjectionProps) => {
  const t = useI18nContext();
  const { vaultApyQuery, apyDecimal, apyPercent } = useMoneyAccountBalance();

  const amount = useMemo(() => {
    try {
      const value = new BigNumber(amountFiat || '0');
      return value.isFinite() ? value : null;
    } catch {
      // bignumber.js@4 throws on non-numeric input instead of producing NaN.
      return null;
    }
  }, [amountFiat]);

  const projected = useMemo(() => {
    if (amount === null || !isPositiveNumberOrZero(apyDecimal)) {
      return null;
    }

    // `plus` is given a string for the same reason the constructor is: in
    // `bignumber.js@4` both reject a number with more than 15 significant
    // digits, which a live APY routinely has.
    return amount.times(
      new BigNumber(1).plus(String(apyDecimal)).pow(projectedYears),
    );
  }, [amount, apyDecimal, projectedYears]);

  if (vaultApyQuery.isLoading) {
    return (
      <Box data-testid="balance-projection-skeleton">
        <Skeleton height={20} width={160} />
      </Box>
    );
  }

  if (
    amount === null ||
    !isPositiveNumberOrZero(apyDecimal) ||
    !isPositiveNumberOrZero(apyPercent)
  ) {
    return null;
  }

  if (amount.gt(0) && projected !== null) {
    return (
      <Box
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Center}
        justifyContent={BoxJustifyContent.Center}
        gap={1}
        data-testid="balance-projection"
      >
        <Text variant={TextVariant.BodyMd} color={TextColor.TextAlternative}>
          {t('moneyAccountProjectedBalance', [String(projectedYears)])}
        </Text>
        <Text variant={TextVariant.BodyMd} color={TextColor.SuccessDefault}>
          {moneyFormatUsd(projected)}
        </Text>
        <InfoPopoverTooltip
          iconSize={ButtonIconSize.Sm}
          iconColor={IconColor.IconAlternative}
          ariaLabel={t('moneyAccountProjectedBalanceInfo')}
          data-testid="balance-projection-info"
        >
          {t('moneyAccountProjectedBalanceTooltip', [String(apyPercent)])}
        </InfoPopoverTooltip>
      </Box>
    );
  }

  return (
    <Box
      flexDirection={BoxFlexDirection.Row}
      alignItems={BoxAlignItems.Center}
      justifyContent={BoxJustifyContent.Center}
      data-testid="balance-projection-apy-pitch"
    >
      <Text variant={TextVariant.BodyMd} color={TextColor.TextAlternative}>
        {t('moneyAccountApyPitch', [String(apyPercent)])}
      </Text>
      <InfoPopoverTooltip
        iconSize={ButtonIconSize.Sm}
        iconColor={IconColor.IconAlternative}
        ariaLabel={t('moneyAccountApyPitchInfo')}
        data-testid="balance-projection-apy-pitch-info"
      >
        {t('moneyAccountApyTooltip')}
      </InfoPopoverTooltip>
    </Box>
  );
};

/**
 * {@link BalanceProjectionContent} wrapped in the route messenger that
 * `useMoneyAccountBalance` needs for the availability gate.
 *
 * @param props - See {@link BalanceProjectionProps}.
 * @returns The subtitle, or nothing.
 */
export const BalanceProjection = (props: BalanceProjectionProps) => (
  <RouteMessengerProvider
    path="money-account-balance-projection"
    capabilities={MONEY_ACCOUNT_BALANCE_ALLOWED_CAPABILITIES}
  >
    <BalanceProjectionContent {...props} />
  </RouteMessengerProvider>
);

export default BalanceProjection;
