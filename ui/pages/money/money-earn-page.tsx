import React, { useCallback, useLayoutEffect, useMemo, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Button,
  ButtonIcon,
  ButtonSize,
  IconName,
  Skeleton,
  TextVariant,
} from '@metamask/design-system-react';
import {
  DEFAULT_ROUTE,
  MONEY_HOME_ROUTE,
} from '../../helpers/constants/routes';
import { useI18nContext } from '../../hooks/useI18nContext';
import { useMoneyAccountAvailability } from '../../hooks/money/use-money-account-availability';
import { useMoneyBackNavigation } from '../../hooks/money/use-money-back-navigation';
import { useMoneyAccountBalance } from '../../hooks/money/useMoneyAccountBalance';
import { useMoneyAddDepositToken } from '../../hooks/money/use-money-add-deposit-token';
import { useMoneyDepositTokens } from '../../hooks/money/use-money-deposit-tokens';
import { useMoneyAnalytics } from '../../hooks/money/useMoneyAnalytics';
import { useTrackOnce } from '../../hooks/useTrackOnce';
import { getPrivacyMode } from '../../selectors/selectors';
import {
  MoneyButtonIntent,
  MoneyButtonType,
  MoneyComponentName,
  MoneyScreenName,
} from './constants/money-events';
import { MoneyPotentialEarningsSummary } from './components/money-potential-earnings-summary';
import { MoneyPotentialEarningsTokenRow } from './components/money-potential-earnings-token-row';
import { resetOverflowAncestorScroll } from './utils/reset-overflow-ancestor-scroll';

export function MoneyEarnPage() {
  const t = useI18nContext();
  const privacyMode = useSelector(getPrivacyMode);
  const { availability, isLoading: isAvailabilityLoading } =
    useMoneyAccountAvailability();
  const { apyDecimal, apyPercent } = useMoneyAccountBalance({
    enabled: availability.isAvailable,
  });
  const { tokens, isNoFeeToken } = useMoneyDepositTokens();
  const eligibleTokens = useMemo(
    () => tokens.filter((token) => token.moneyFiatAmountUsd > 0),
    [tokens],
  );
  const { handleAddToken, initiateDeposit, isDepositLoading } =
    useMoneyAddDepositToken({
      screenName: MoneyScreenName.MoneyEarnOnCrypto,
    });
  const { trackButtonClicked, trackScreenViewed } = useMoneyAnalytics({
    screenName: MoneyScreenName.MoneyEarnOnCrypto,
  });
  const pageRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    resetOverflowAncestorScroll(pageRef.current);
  }, []);

  useTrackOnce(
    !isAvailabilityLoading && availability.isAvailable,
    trackScreenViewed,
  );

  const handleBack = useMoneyBackNavigation(MONEY_HOME_ROUTE);

  const handleConvert = useCallback(() => {
    trackButtonClicked({
      buttonType: MoneyButtonType.Text,
      buttonIntent: MoneyButtonIntent.AddMoney,
      componentName: MoneyComponentName.PotentialEarningsSectionFooter,
      labelKey: 'moneyConvertYourCrypto',
      redirectTarget: MoneyScreenName.MoneyDeposit,
    });
    initiateDeposit();
  }, [initiateDeposit, trackButtonClicked]);

  let body: React.ReactNode;
  if (isAvailabilityLoading) {
    body = (
      <div
        className="flex min-h-full flex-col gap-4 bg-background-default p-4"
        data-testid="money-earn-loading"
      >
        <Skeleton className="h-8 w-8" />
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-16 w-full" />
      </div>
    );
  } else if (availability.isAvailable) {
    body = (
      <main
        className="flex min-h-full flex-col bg-background-default"
        data-testid="money-earn-page"
      >
        <div className="flex items-center px-2 py-2">
          <ButtonIcon
            iconName={IconName.ArrowLeft}
            ariaLabel={t('back')}
            onClick={handleBack}
            data-testid="money-earn-back-button"
          />
        </div>

        <div className="flex-1 pb-5">
          <MoneyPotentialEarningsSummary
            tokens={eligibleTokens}
            apyDecimal={apyDecimal}
            apyPercent={apyPercent}
            privacyMode={privacyMode}
            headingVariant={TextVariant.HeadingLg}
          />

          {eligibleTokens.map((token, index) => (
            <MoneyPotentialEarningsTokenRow
              key={`${token.chainId}:${token.address}`}
              token={token}
              apyDecimal={apyDecimal ?? 0}
              hasNoFee={isNoFeeToken(token)}
              privacyMode={privacyMode}
              onAddClick={() =>
                handleAddToken(token, index, eligibleTokens.length)
              }
              isAddDisabled={isDepositLoading}
            />
          ))}
        </div>

        <div className="sticky bottom-0 bg-background-default px-4 py-4">
          <Button
            size={ButtonSize.Lg}
            isLoading={isDepositLoading}
            onClick={handleConvert}
            className="w-full"
            data-testid="money-earn-convert-cta"
          >
            {t('moneyConvertYourCrypto')}
          </Button>
        </div>
      </main>
    );
  } else {
    body = <Navigate to={DEFAULT_ROUTE} replace />;
  }

  return (
    <div ref={pageRef} className="contents">
      {body}
    </div>
  );
}

export default MoneyEarnPage;
