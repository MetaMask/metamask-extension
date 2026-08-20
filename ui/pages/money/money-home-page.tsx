import React, { useMemo } from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import BigNumber from 'bignumber.js';
import {
  Button,
  ButtonIcon,
  ButtonVariant,
  FontWeight,
  Icon,
  IconColor,
  IconName,
  IconSize,
  Skeleton,
  Text,
  TextColor,
  TextVariant,
} from '@metamask/design-system-react';
import { DEFAULT_ROUTE } from '../../helpers/constants/routes';
import { useI18nContext } from '../../hooks/useI18nContext';
import { useMoneyAccountAvailability } from '../../hooks/money/use-money-account-availability';
import { useMoneyDepositTokens } from '../../hooks/money/use-money-deposit-tokens';
import { useMoneyAccountBalance } from '../../hooks/money/useMoneyAccountBalance';
import { useMoneyAccountInterest } from '../../hooks/money/useMoneyAccountInterest';
import { moneyFormatUsd } from '../../helpers/money/format';
import { selectMoneyEarningSectionEnabled } from '../../selectors/money/money-account-feature-flags';
import { getPrivacyMode } from '../../selectors/selectors';
import { MoneyActivityPlaceholder } from './components/money-activity-placeholder';
import { MoneyCondensedInfoCards } from './components/money-condensed-info-cards';
import { MoneyPotentialEarnings } from './components/money-potential-earnings';
import { MoneyPositionPlaceholder } from './components/money-position-placeholder';

const MONEY_FUNDED_BALANCE_THRESHOLD = 0.01;
const MONEY_ONBOARDING_ARTWORK = './images/money-onboarding-stepper-step-1.png';
const FORMATTED_ZERO = moneyFormatUsd(new BigNumber(0));

const formatInterestEarned = (value: string | undefined) => {
  if (value === undefined) {
    return undefined;
  }

  let earnings: BigNumber;
  try {
    earnings = new BigNumber(value);
  } catch {
    return undefined;
  }

  if (earnings.isNaN() || !earnings.isFinite()) {
    return undefined;
  }

  const formatted = moneyFormatUsd(earnings.abs());
  if (formatted === FORMATTED_ZERO) {
    return formatted;
  }
  if (earnings.greaterThan(0)) {
    return `+${formatted}`;
  }
  return earnings.lessThan(0) ? `-${formatted}` : formatted;
};

type ActionCardProps = {
  icon: IconName;
  label: string;
};

const MoneyActionCard = ({ icon, label }: ActionCardProps) => {
  return (
    <button
      type="button"
      disabled
      className="flex h-[76px] flex-1 flex-col items-center justify-center gap-0.5 rounded-xl bg-background-muted disabled:cursor-default disabled:opacity-100"
    >
      <Icon name={icon} size={IconSize.Lg} color={IconColor.IconDefault} />
      <Text variant={TextVariant.BodySm} fontWeight={FontWeight.Medium}>
        {label}
      </Text>
    </button>
  );
};

const MoneySectionDivider = () => {
  return <div className="my-5 h-px w-full bg-border-muted" />;
};

export function MoneyHomePage() {
  const t = useI18nContext();
  const { availability, isLoading: isAvailabilityLoading } =
    useMoneyAccountAvailability();
  const {
    apyDecimal,
    apyPercentFormatted,
    isBalanceFetchError,
    isBalanceLoading,
    tokenTotal,
    totalFiatFormatted,
    totalFiatRaw,
    vaultApyQuery,
  } = useMoneyAccountBalance({ enabled: availability.isAvailable });
  const isMoneyEarningSectionEnabled = useSelector(
    selectMoneyEarningSectionEnabled,
  );
  const isFunded =
    tokenTotal?.abs().gte(MONEY_FUNDED_BALANCE_THRESHOLD) === true;
  const { last30DaysQuery, sinceInceptionQuery } = useMoneyAccountInterest({
    enabled:
      availability.isAvailable && isMoneyEarningSectionEnabled && isFunded,
  });
  const projectedMonthlyEarnings = useMemo(() => {
    if (totalFiatRaw === undefined || apyDecimal === undefined) {
      return FORMATTED_ZERO;
    }

    const earnings = new BigNumber(totalFiatRaw)
      .times(apyDecimal.toString())
      .dividedBy(12);
    if (earnings.isNaN() || !earnings.isFinite()) {
      return FORMATTED_ZERO;
    }

    const formatted = moneyFormatUsd(earnings);
    return formatted === FORMATTED_ZERO ? formatted : `+${formatted}`;
  }, [apyDecimal, totalFiatRaw]);
  const monthlyEarnings =
    formatInterestEarned(last30DaysQuery.data?.interest_earned_usd) ??
    projectedMonthlyEarnings;
  const lifetimeEarnings =
    formatInterestEarned(sinceInceptionQuery.data?.interest_earned_usd) ??
    FORMATTED_ZERO;
  const isMonthlyEarningsLoading =
    last30DaysQuery.isInitialLoading ||
    (formatInterestEarned(last30DaysQuery.data?.interest_earned_usd) ===
      undefined &&
      (vaultApyQuery.isLoading || isBalanceLoading));
  const isLifetimeEarningsLoading = sinceInceptionQuery.isInitialLoading;
  const { tokens: depositTokens, isNoFeeToken } = useMoneyDepositTokens();
  const privacyMode = useSelector(getPrivacyMode);

  if (isAvailabilityLoading || (availability.isAvailable && isBalanceLoading)) {
    return (
      <div
        className="flex min-h-full flex-col gap-4 bg-background-default p-4"
        data-testid="money-home-loading"
      >
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-12 w-36" />
        <Skeleton className="h-20 w-full rounded-xl" />
        <Skeleton className="h-80 w-full rounded-2xl" />
      </div>
    );
  }

  if (!availability.isAvailable) {
    return <Navigate to={DEFAULT_ROUTE} replace />;
  }

  const balanceDisplay =
    isBalanceFetchError || totalFiatFormatted === undefined
      ? t('moneyBalanceUnavailable')
      : totalFiatFormatted;
  const apyDisplay = apyPercentFormatted;

  return (
    <main
      className="min-h-full bg-background-default pb-5"
      data-testid="money-home-page"
    >
      <header className="flex h-14 items-center justify-between px-4">
        <Text variant={TextVariant.HeadingLg} fontWeight={FontWeight.Bold}>
          {t('money')}
        </Text>
        <ButtonIcon
          iconName={IconName.MoreVertical}
          ariaLabel={t('moneyMoreOptions')}
          disabled
        />
      </header>

      <div className="flex flex-col gap-2 px-4 pt-2 sm:items-center">
        <div className="flex w-full max-w-[784px] flex-col gap-1 sm:items-center">
          <Text
            variant={TextVariant.DisplayLg}
            fontWeight={FontWeight.Medium}
            data-testid="money-balance"
          >
            {balanceDisplay}
          </Text>
          <div className="flex h-6 items-center gap-1">
            {vaultApyQuery.isLoading && !apyDisplay ? (
              <Skeleton className="h-4 w-24" />
            ) : (
              <>
                {apyDisplay ? (
                  <Text
                    variant={TextVariant.BodyMd}
                    className="text-success-default"
                  >
                    {t('moneyApy', [apyDisplay])}
                  </Text>
                ) : null}
                <Text
                  variant={TextVariant.BodyMd}
                  color={TextColor.TextAlternative}
                >
                  {apyDisplay ? `• ${t('moneyMusd')}` : t('moneyMusd')}
                </Text>
                <Icon
                  name={IconName.Info}
                  size={IconSize.Sm}
                  color={IconColor.IconAlternative}
                />
              </>
            )}
          </div>
        </div>

        <div className="mt-2 flex w-full max-w-[389px] gap-2 py-2">
          <MoneyActionCard icon={IconName.Add} label={t('moneyAdd')} />
          <MoneyActionCard
            icon={IconName.Arrow2UpRight}
            label={t('moneySend')}
          />
        </div>

        {isFunded ? null : (
          <section className="mt-1 flex w-full max-w-[389px] flex-col gap-4 overflow-hidden rounded-2xl bg-background-muted p-4">
            <img
              src={MONEY_ONBOARDING_ARTWORK}
              alt=""
              className="h-[185px] w-full rounded-[14px] object-cover"
            />
            <div>
              <Text
                variant={TextVariant.HeadingLg}
                fontWeight={FontWeight.Bold}
              >
                {apyDisplay
                  ? t('moneyEarnApyTitle', [apyDisplay])
                  : t('moneyEarnTitle')}
              </Text>
              <Text
                variant={TextVariant.BodyMd}
                color={TextColor.TextAlternative}
                className="mt-1"
              >
                {apyDisplay
                  ? t('moneyFundDescriptionWithApy', [apyDisplay])
                  : t('moneyFundDescription')}
              </Text>
            </div>
            <Button disabled className="w-full">
              {t('addFunds')}
            </Button>
          </section>
        )}
      </div>

      <div className={`mx-auto w-full max-w-[816px] ${isFunded ? '' : 'mt-3'}`}>
        {isFunded ? (
          <>
            {isMoneyEarningSectionEnabled ? (
              <>
                <MoneyPositionPlaceholder
                  monthlyEarnings={monthlyEarnings}
                  lifetimeEarnings={lifetimeEarnings}
                  isMonthlyLoading={isMonthlyEarningsLoading}
                  isLifetimeLoading={isLifetimeEarningsLoading}
                />
                <MoneySectionDivider />
              </>
            ) : null}
            <MoneyActivityPlaceholder />
            <MoneySectionDivider />
            <MoneyCondensedInfoCards />
          </>
        ) : (
          <>
            <section className="px-4 py-3">
              <div className="flex items-center gap-1">
                <Text
                  variant={TextVariant.HeadingMd}
                  fontWeight={FontWeight.Bold}
                >
                  {t('moneyHowItWorks')}
                </Text>
                <Icon
                  name={IconName.ArrowRight}
                  size={IconSize.Md}
                  color={IconColor.IconAlternative}
                />
              </div>
              <Text
                variant={TextVariant.BodyMd}
                color={TextColor.TextAlternative}
                className="mt-2"
                data-testid="money-how-it-works-description"
              >
                {apyDisplay
                  ? t('moneyHowItWorksDescriptionWithApy', [
                      <span key="apy" className="text-success-default">
                        {t('moneyApy', [apyDisplay])}
                      </span>,
                    ])
                  : t('moneyHowItWorksDescription')}
              </Text>
            </section>

            <MoneySectionDivider />
            <MoneyActivityPlaceholder />

            <MoneySectionDivider />
            <MoneyPotentialEarnings
              tokens={depositTokens}
              apyDecimal={apyDecimal}
              isNoFeeToken={isNoFeeToken}
              privacyMode={privacyMode}
            />

            <MoneySectionDivider />
            <section className="px-4 py-3">
              <Text
                variant={TextVariant.HeadingMd}
                fontWeight={FontWeight.Bold}
              >
                {t('moneyBenefits')}
              </Text>
              <ul className="mt-3 flex flex-col gap-3">
                {[
                  apyDisplay
                    ? t('moneyBenefitAutoEarnWithApy', [apyDisplay])
                    : t('moneyBenefitAutoEarn'),
                  t('moneyBenefitStablecoin'),
                  t('moneyBenefitLiquidity'),
                  t('moneyBenefitSend'),
                ].map((benefit) => (
                  <li key={benefit} className="flex items-start gap-3">
                    <Icon
                      name={IconName.Check}
                      size={IconSize.Md}
                      color={IconColor.SuccessDefault}
                      className="mt-0.5 shrink-0"
                    />
                    <Text variant={TextVariant.BodyMd}>{benefit}</Text>
                  </li>
                ))}
              </ul>
              <Button
                variant={ButtonVariant.Secondary}
                disabled
                className="mt-4 w-full"
              >
                {t('moneyLearnMore')}
              </Button>
            </section>
          </>
        )}
      </div>
    </main>
  );
}

export default MoneyHomePage;
