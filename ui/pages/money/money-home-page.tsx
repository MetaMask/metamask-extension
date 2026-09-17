import React, { useCallback, useMemo, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import BigNumber from 'bignumber.js';
import {
  BannerAlert,
  BannerAlertSeverity,
  Button,
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
import {
  DEFAULT_ROUTE,
  MONEY_ACTIVITY_ROUTE,
  MONEY_EARN_ROUTE,
  MONEY_HOW_IT_WORKS_ROUTE,
} from '../../helpers/constants/routes';
import { useI18nContext } from '../../hooks/useI18nContext';
import { useMoneyAccountAvailability } from '../../hooks/money/use-money-account-availability';
import { useUpgradeMoneyAccount } from '../../hooks/money/use-upgrade-money-account';
import { useMoneyDepositTokens } from '../../hooks/money/use-money-deposit-tokens';
import { useMoneyAccountBalance } from '../../hooks/money/useMoneyAccountBalance';
import { useMoneyAddDepositToken } from '../../hooks/money/use-money-add-deposit-token';
import { useMoneyAccountInterest } from '../../hooks/money/useMoneyAccountInterest';
import { useMoneyAccountWithdrawal } from '../../hooks/money/useMoneyAccountWithdrawal';
import { useMoneyActivityItems } from '../../hooks/money/use-money-activity-items';
import { useMoneyActivityItemClick } from '../../hooks/money/use-money-activity-item-click';
import { useMoneyAnalytics } from '../../hooks/money/useMoneyAnalytics';
import { useTrackOnce } from '../../hooks/useTrackOnce';
import { moneyFormatUsd } from '../../helpers/money/format';
import { selectMoneyEarningSectionEnabled } from '../../selectors/money/money-account-feature-flags';
import { getPrivacyMode } from '../../selectors/selectors';
import { reportMoneyError } from '../../helpers/money/report-money-error';
import {
  MONEY_URLS,
  MoneyBottomSheetName,
  MoneyButtonIntent,
  MoneyButtonType,
  MoneyComponentName,
  MoneyScreenName,
} from './constants/money-events';
import {
  MoneyActivityList,
  MAX_PREVIEW_ITEMS,
} from './components/money-activity-list';
import { MoneyCondensedInfoCards } from './components/money-condensed-info-cards';
import { MoneyMoreMenu } from './components/money-more-menu';
import { MoneyPotentialEarnings } from './components/money-potential-earnings';
import { MoneyPositionPlaceholder } from './components/money-position-placeholder';
import { MoneySectionDivider } from './components/money-section-divider';
import { MoneyActivityFilter } from './utils/money-activity-filters';
import { MoneyTransferSheet } from './components/money-transfer-sheet';

/**
 * Whether Send on Money home opens the "Send funds to" sheet.
 *
 * Off for now: External address and Bank account have not shipped, so the
 * sheet offers a single real destination and Send goes straight to the
 * withdrawal confirmation instead. Flip back to `true` to reinstate the menu
 * once those destinations ship — the sheet itself is left untouched.
 */
const IS_MONEY_TRANSFER_SHEET_ENABLED: boolean = false;

const MONEY_FUNDED_BALANCE_THRESHOLD = 0.01;
const ACTION_BUTTON_ROW_BUTTON_COUNT = 2;
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
  onClick?: () => void;
  disabled?: boolean;
  testId?: string;
};

const MoneyActionCard = ({
  icon,
  label,
  onClick,
  disabled,
  testId,
}: ActionCardProps) => {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      data-testid={testId}
      className="flex h-[76px] flex-1 flex-col items-center justify-center gap-0.5 rounded-xl bg-background-muted disabled:cursor-default disabled:opacity-100"
    >
      <Icon name={icon} size={IconSize.Lg} color={IconColor.IconDefault} />
      <Text variant={TextVariant.BodySm} fontWeight={FontWeight.Medium}>
        {label}
      </Text>
    </button>
  );
};

export function MoneyHomePage() {
  const t = useI18nContext();
  const navigate = useNavigate();
  const [isTransferSheetOpen, setIsTransferSheetOpen] = useState(false);
  const { availability, isLoading: isAvailabilityLoading } =
    useMoneyAccountAvailability();
  useUpgradeMoneyAccount();
  const {
    apyDecimal,
    apyPercentFormatted,
    isBalanceFetchError,
    isBalanceLoading,
    lastKnownTotalFiatFormatted,
    refetchBalance,
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
    last30DaysQuery.isLoading ||
    (formatInterestEarned(last30DaysQuery.data?.interest_earned_usd) ===
      undefined &&
      (vaultApyQuery.isLoading || isBalanceLoading));
  const isLifetimeEarningsLoading = sinceInceptionQuery.isLoading;
  const { tokens: depositTokens, isNoFeeToken } = useMoneyDepositTokens();
  const privacyMode = useSelector(getPrivacyMode);
  const {
    items: activityItems,
    hasMore: hasMoreActivity,
    isSettling: isActivitySettling,
  } = useMoneyActivityItems({
    fill: { bucket: MoneyActivityFilter.All, count: MAX_PREVIEW_ITEMS },
  });
  const handleActivityItemClick = useMoneyActivityItemClick({
    screenName: MoneyScreenName.MoneyHome,
  });
  const { handleAddToken, initiateDeposit, isDepositLoading } =
    useMoneyAddDepositToken({
      screenName: MoneyScreenName.MoneyHome,
    });
  const { initiateWithdrawal, isLoading: isWithdrawLoading } =
    useMoneyAccountWithdrawal();
  const { trackButtonClicked, trackScreenViewed } = useMoneyAnalytics({
    screenName: MoneyScreenName.MoneyHome,
  });
  const isPageLoading =
    isAvailabilityLoading || (availability.isAvailable && isBalanceLoading);

  useTrackOnce(!isPageLoading && availability.isAvailable, trackScreenViewed);

  const handleViewAllActivity = useCallback(() => {
    trackButtonClicked({
      buttonType: MoneyButtonType.Text,
      buttonIntent: MoneyButtonIntent.ViewAll,
      componentName: MoneyComponentName.ActivitySection,
      labelKey: 'moneyActivityViewAll',
      redirectTarget: MoneyScreenName.MoneyActivity,
    });
    navigate(MONEY_ACTIVITY_ROUTE);
  }, [navigate, trackButtonClicked]);
  const handleViewAllEarnTokens = useCallback(() => {
    trackButtonClicked({
      buttonType: MoneyButtonType.Text,
      buttonIntent: MoneyButtonIntent.ViewAll,
      componentName: MoneyComponentName.PotentialEarningsSection,
      labelKey: 'viewAll',
      redirectTarget: MoneyScreenName.MoneyEarnOnCrypto,
    });
    navigate(MONEY_EARN_ROUTE);
  }, [navigate, trackButtonClicked]);
  const handleAddFundsFromActionRow = useCallback(() => {
    trackButtonClicked({
      buttonType: MoneyButtonType.Text,
      buttonIntent: MoneyButtonIntent.AddMoney,
      componentName: MoneyComponentName.ActionButtonRow,
      labelKey: 'moneyAdd',
      redirectTarget: MoneyScreenName.MoneyDeposit,
      buttonPosition: 1,
      buttonRowButtonCount: ACTION_BUTTON_ROW_BUTTON_COUNT,
    });
    initiateDeposit();
  }, [initiateDeposit, trackButtonClicked]);
  const handleAddFundsFromFundCard = useCallback(() => {
    trackButtonClicked({
      buttonType: MoneyButtonType.Text,
      buttonIntent: MoneyButtonIntent.AddMoney,
      componentName: MoneyComponentName.OnboardingCard,
      labelKey: 'addFunds',
      redirectTarget: MoneyScreenName.MoneyDeposit,
    });
    initiateDeposit();
  }, [initiateDeposit, trackButtonClicked]);
  const handleLearnMore = useCallback(() => {
    trackButtonClicked({
      buttonType: MoneyButtonType.Text,
      buttonIntent: MoneyButtonIntent.LearnMore,
      componentName: MoneyComponentName.WhatYouGetSection,
      labelKey: 'moneyLearnMore',
      redirectTarget: MONEY_URLS.MONEY_LANDING,
    });
    global.platform.openTab({ url: MONEY_URLS.MONEY_LANDING });
  }, [trackButtonClicked]);
  const handleSend = useCallback(() => {
    trackButtonClicked({
      buttonType: MoneyButtonType.Text,
      buttonIntent: MoneyButtonIntent.TransferMoney,
      componentName: MoneyComponentName.ActionButtonRow,
      labelKey: 'moneySend',
      redirectTarget: IS_MONEY_TRANSFER_SHEET_ENABLED
        ? MoneyBottomSheetName.TransferMoneySheet
        : MoneyScreenName.MoneyTransfer,
      buttonPosition: 2,
      buttonRowButtonCount: ACTION_BUTTON_ROW_BUTTON_COUNT,
    });

    if (IS_MONEY_TRANSFER_SHEET_ENABLED) {
      setIsTransferSheetOpen(true);
      return;
    }

    initiateWithdrawal().catch((error: unknown) => {
      console.error('[MoneyHomePage] Withdrawal initiation failed', error);
    });
  }, [initiateWithdrawal, trackButtonClicked]);
  const handleCloseTransferSheet = useCallback(() => {
    setIsTransferSheetOpen(false);
  }, []);

  if (isPageLoading) {
    return (
      <div
        className="flex min-h-full flex-col gap-4 p-4"
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

  const isLastKnownBalance =
    totalFiatFormatted === undefined &&
    lastKnownTotalFiatFormatted !== undefined;
  const showFundedLayout = isFunded || isLastKnownBalance;
  const balanceDisplay =
    totalFiatFormatted ??
    lastKnownTotalFiatFormatted ??
    t('moneyBalanceUnavailable');
  const apyDisplay = apyPercentFormatted;

  const earnOnYourCryptoSection =
    depositTokens.length > 0 ? (
      <>
        <MoneyPotentialEarnings
          tokens={depositTokens}
          apyDecimal={apyDecimal}
          isNoFeeToken={isNoFeeToken}
          privacyMode={privacyMode}
          onAddToken={handleAddToken}
          onViewAll={handleViewAllEarnTokens}
          isAddDisabled={isDepositLoading}
        />
        <MoneySectionDivider />
      </>
    ) : null;
  const activitySection =
    activityItems.length > 0 || isActivitySettling ? (
      <>
        <MoneyActivityList
          items={activityItems}
          privacyMode={privacyMode}
          onViewAll={handleViewAllActivity}
          onItemClick={handleActivityItemClick}
          hasMore={hasMoreActivity}
          isSettling={isActivitySettling}
        />
        <MoneySectionDivider />
      </>
    ) : null;

  return (
    <>
      <div className="min-h-full pb-5" data-testid="money-home-page">
        <header className="flex h-14 items-center justify-between px-4">
          <Text variant={TextVariant.HeadingLg} fontWeight={FontWeight.Bold}>
            {t('money')}
          </Text>
          <MoneyMoreMenu />
        </header>

        {isBalanceFetchError ? (
          <div className="px-4 pt-2">
            <BannerAlert
              severity={BannerAlertSeverity.Warning}
              title={t('moneyBalanceUnavailable')}
              description={t('moneyBalanceUnavailableBannerDescription')}
              actionButtonLabel={t('moneyBalanceRetry')}
              actionButtonOnClick={() => {
                refetchBalance().catch((error) => {
                  reportMoneyError(
                    '[Money Account] Balance retry failed',
                    error,
                    { query: 'fetchBalanceWithFallback' },
                  );
                });
              }}
              data-testid="money-balance-unavailable-banner"
            />
          </div>
        ) : null}

        <div className="flex flex-col items-center gap-2 px-4 pt-2">
          <div className="flex w-full max-w-[784px] flex-col gap-1 sm:items-center">
            <Text
              variant={TextVariant.DisplayLg}
              fontWeight={FontWeight.Medium}
              data-testid="money-balance"
            >
              {balanceDisplay}
            </Text>
            {isLastKnownBalance ? (
              <Text
                variant={TextVariant.BodyXs}
                color={TextColor.TextAlternative}
                data-testid="money-home-last-known"
              >
                {t('moneyBalanceLastKnown')}
              </Text>
            ) : null}
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
            <MoneyActionCard
              icon={IconName.Add}
              label={t('moneyAdd')}
              onClick={handleAddFundsFromActionRow}
              disabled={isDepositLoading}
              testId="money-add-button"
            />
            <MoneyActionCard
              icon={IconName.Arrow2UpRight}
              label={t('moneySend')}
              onClick={handleSend}
              disabled={!IS_MONEY_TRANSFER_SHEET_ENABLED && isWithdrawLoading}
              testId="money-send-button"
            />
          </div>

          {showFundedLayout ? null : (
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
              <Button
                className="w-full"
                isLoading={isDepositLoading}
                onClick={handleAddFundsFromFundCard}
              >
                {t('addFunds')}
              </Button>
            </section>
          )}
        </div>

        <div
          className={`mx-auto w-full max-w-[816px] ${showFundedLayout ? '' : 'mt-3'}`}
        >
          {showFundedLayout ? (
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
              {activitySection}
              {earnOnYourCryptoSection}
              <MoneyCondensedInfoCards />
            </>
          ) : (
            <>
              <section className="px-4 py-3">
                <Link
                  to={MONEY_HOW_IT_WORKS_ROUTE}
                  className="flex items-center gap-1 text-left no-underline text-inherit"
                  data-testid="money-how-it-works-header"
                >
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
                </Link>
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
              {activitySection}
              {earnOnYourCryptoSection}

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
                      ? t('moneyBenefitAutoEarnWithApy', [
                          <span key="apy" className="text-success-default">
                            {`~${t('moneyApy', [apyDisplay])}`}
                          </span>,
                        ])
                      : t('moneyBenefitAutoEarn'),
                    t('moneyBenefitStablecoin'),
                    t('moneyBenefitLiquidity'),
                    t('moneyBenefitSend'),
                  ].map((benefit, index) => (
                    <li
                      key={
                        typeof benefit === 'string'
                          ? benefit
                          : `benefit-${index}`
                      }
                      className="flex items-start gap-3"
                    >
                      <Icon
                        name={IconName.Check}
                        size={IconSize.Md}
                        color={IconColor.SuccessDefault}
                        className="mt-0.5 shrink-0"
                      />
                      <Text
                        variant={TextVariant.BodyMd}
                        data-testid={
                          index === 0 ? 'money-benefit-auto-earn' : undefined
                        }
                      >
                        {benefit}
                      </Text>
                    </li>
                  ))}
                </ul>
                <Button
                  variant={ButtonVariant.Secondary}
                  className="mt-4 w-full"
                  onClick={handleLearnMore}
                  data-testid="money-learn-more"
                >
                  {t('moneyLearnMore')}
                </Button>
              </section>
            </>
          )}
        </div>
      </div>
      {isTransferSheetOpen ? (
        <MoneyTransferSheet
          isOpen={isTransferSheetOpen}
          onClose={handleCloseTransferSheet}
        />
      ) : null}
    </>
  );
}

export default MoneyHomePage;
