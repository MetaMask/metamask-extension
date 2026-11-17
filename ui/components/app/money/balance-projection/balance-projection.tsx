import React, { useCallback, useMemo, useState } from 'react';
import BigNumber from 'bignumber.js';
import {
  Box,
  BoxAlignItems,
  BoxFlexDirection,
  BoxJustifyContent,
  FontWeight,
  Skeleton,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../../hooks/useI18nContext';
import { useMoneyAccountBalance } from '../../../../hooks/money/useMoneyAccountBalance';
import { useMoneyAnalytics } from '../../../../hooks/money/useMoneyAnalytics';
import {
  MoneyComponentName,
  MoneyScreenName,
  MoneyTooltipName,
  MoneyTooltipType,
} from '../../../../pages/money/constants/money-events';
import { moneyFormatUsd } from '../../../../helpers/money/format';
import { RouteMessengerProvider } from '../../../../contexts/route-messenger';
import { MONEY_ACCOUNT_BALANCE_ALLOWED_CAPABILITIES } from '../messenger';
import {
  DottedTrigger,
  MoneyApyDialog,
  MoneyEstimatedBalanceDialog,
} from '../money-deposit-dialogs';

const PROJECTED_YEARS = 1;

export type BalanceProjectionProps = {
  amountFiat: string;
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
 * or a compounded estimated balance once the user types an amount.
 *
 * Activating the dotted underline opens the corresponding info dialog
 * (APY or Estimated balance).
 *
 * @param props - Component props.
 * @param props.amountFiat - Fiat amount currently in the custom-amount input.
 * @returns The subtitle, a loading skeleton, or nothing.
 */
const BalanceProjectionContent = ({ amountFiat }: BalanceProjectionProps) => {
  const t = useI18nContext();
  const { apyDecimal, apyPercent, apyPercentFormatted, vaultApyQuery } =
    useMoneyAccountBalance();
  const { trackTooltipClicked } = useMoneyAnalytics({
    screenName: MoneyScreenName.MoneyDeposit,
  });
  const [isEstBalanceDialogOpen, setIsEstBalanceDialogOpen] = useState(false);
  const [isApyDialogOpen, setIsApyDialogOpen] = useState(false);

  const hasUsableApy =
    isPositiveNumberOrZero(apyDecimal) && isPositiveNumberOrZero(apyPercent);

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
      new BigNumber(1).plus(String(apyDecimal)).pow(PROJECTED_YEARS),
    );
  }, [amount, apyDecimal]);

  const handleOpenEstBalanceDialog = useCallback(() => {
    trackTooltipClicked({
      tooltipName: MoneyTooltipName.EarnOnYourCrypto,
      tooltipType: MoneyTooltipType.Info,
      componentName: MoneyComponentName.BalanceProjection,
    });
    setIsEstBalanceDialogOpen(true);
  }, [trackTooltipClicked]);

  const handleCloseEstBalanceDialog = useCallback(() => {
    setIsEstBalanceDialogOpen(false);
  }, []);

  const handleOpenApyDialog = useCallback(() => {
    trackTooltipClicked({
      tooltipName: MoneyTooltipName.Apy,
      tooltipType: MoneyTooltipType.Info,
    });
    setIsApyDialogOpen(true);
  }, [trackTooltipClicked]);

  const handleCloseApyDialog = useCallback(() => {
    setIsApyDialogOpen(false);
  }, []);

  if (vaultApyQuery.isLoading && !hasUsableApy) {
    return (
      <Box data-testid="balance-projection-skeleton">
        <Skeleton height={20} width={160} />
      </Box>
    );
  }

  if (amount === null || !hasUsableApy) {
    return null;
  }

  const apyFormatted = apyPercentFormatted ?? `${apyPercent}%`;

  if (amount.gt(0) && projected !== null) {
    const projectedFormatted = moneyFormatUsd(projected);

    return (
      <>
        <Box
          flexDirection={BoxFlexDirection.Row}
          alignItems={BoxAlignItems.Center}
          justifyContent={BoxJustifyContent.Center}
          gap={1}
          data-testid="balance-projection"
        >
          <Text variant={TextVariant.BodyMd} color={TextColor.TextAlternative}>
            {t('moneyAccountProjectedBalance')}
          </Text>
          <DottedTrigger
            text={projectedFormatted}
            variant={TextVariant.BodyMd}
            fontWeight={FontWeight.Medium}
            color={TextColor.SuccessDefault}
            data-testid="balance-projection-info-trigger"
            onClick={handleOpenEstBalanceDialog}
          />
        </Box>
        <MoneyEstimatedBalanceDialog
          isOpen={isEstBalanceDialogOpen}
          onClose={handleCloseEstBalanceDialog}
          depositAmount={amount}
          projectedBalanceFormatted={projectedFormatted}
          apyPercentFormatted={apyFormatted}
        />
      </>
    );
  }

  return (
    <>
      <Box
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Center}
        justifyContent={BoxJustifyContent.Center}
        data-testid="balance-projection-apy-pitch"
      >
        <Text variant={TextVariant.BodyMd} color={TextColor.TextAlternative}>
          {t('moneyAccountApyPitchEarn', [
            <DottedTrigger
              key="apy"
              variant={TextVariant.BodyMd}
              color={TextColor.TextAlternative}
              data-testid="balance-projection-apy-pitch-info-trigger"
              text={t('moneyAccountApyPitchApy', [String(apyPercent)])}
              onClick={handleOpenApyDialog}
            />,
          ])}
        </Text>
      </Box>
      <MoneyApyDialog
        isOpen={isApyDialogOpen}
        onClose={handleCloseApyDialog}
        apyPercentFormatted={apyFormatted}
      />
    </>
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
