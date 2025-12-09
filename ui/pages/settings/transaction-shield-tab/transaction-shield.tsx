import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Product,
  PRODUCT_TYPES,
  RECURRING_INTERVALS,
  Subscription,
  SUBSCRIPTION_STATUSES,
} from '@metamask/subscription-controller';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  BoxBackgroundColor,
  Button,
  ButtonSize,
  ButtonVariant,
  Icon,
  IconColor,
  IconName,
  IconSize,
  Text,
  TextButton,
  TextVariant,
} from '@metamask/design-system-react';
import { useDispatch, useSelector } from 'react-redux';
import log from 'loglevel';
import { Skeleton } from '../../../components/component-library/skeleton';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  useCancelSubscription,
  useShieldRewards,
  useUserLastSubscriptionByProduct,
  useUserSubscriptionByProduct,
  useUserSubscriptions,
} from '../../../hooks/subscription/useSubscription';
import { getShortDateFormatterV2 } from '../../asset/util';
import {
  DEFAULT_ROUTE,
  SHIELD_PLAN_ROUTE,
  TRANSACTION_SHIELD_CLAIM_ROUTES,
  TRANSACTION_SHIELD_MANAGE_PLAN_ROUTE,
} from '../../../helpers/constants/routes';
import { TRANSACTION_SHIELD_LINK } from '../../../helpers/constants/common';
import { getProductPrice } from '../../shield-plan/utils';
import { useFormatters } from '../../../hooks/useFormatters';
import LoadingScreen from '../../../components/ui/loading-screen';
import AddFundsModal from '../../../components/app/modals/add-funds-modal/add-funds-modal';
import { useSubscriptionPricing } from '../../../hooks/subscription/useSubscriptionPricing';
import RewardsOnboardingModal from '../../../components/app/rewards/onboarding/OnboardingModal';
import {
  getIsShieldSubscriptionEndingSoon,
  getIsShieldSubscriptionPaused,
  getIsShieldSubscriptionTrialing,
} from '../../../../shared/lib/shield';
import { useTimeout } from '../../../hooks/useTimeout';
import { MINUTE } from '../../../../shared/constants/time';
import { useSubscriptionMetrics } from '../../../hooks/shield/metrics/useSubscriptionMetrics';
import {
  EntryModalSourceEnum,
  ShieldCtaActionClickedEnum,
  ShieldCtaSourceEnum,
  ShieldUnexpectedErrorEventLocationEnum,
} from '../../../../shared/constants/subscriptions';
import ApiErrorHandler from '../../../components/app/api-error-handler';
import { useHandlePayment } from '../../../hooks/subscription/useHandlePayment';
import { MetaMaskReduxDispatch } from '../../../store/store';
import { setOnboardingModalOpen } from '../../../ducks/rewards';
import { getIntlLocale } from '../../../ducks/locale/locale';
import { linkRewardToShieldSubscription } from '../../../store/actions';
import { getAccountName, getInternalAccounts } from '../../../selectors';
import { shortenAddress } from '../../../helpers/utils/util';
import CancelMembershipModal from './cancel-membership-modal';
import { isCardPaymentMethod, isCryptoPaymentMethod } from './types';
import {
  ButtonRow,
  ButtonRowContainer,
  MembershipErrorBanner,
  MembershipHeader,
} from './components';

const TransactionShield = () => {
  const t = useI18nContext();
  const locale = useSelector(getIntlLocale);
  const dispatch = useDispatch<MetaMaskReduxDispatch>();
  const navigate = useNavigate();
  const { search } = useLocation();
  const internalAccounts = useSelector(getInternalAccounts);
  const { captureShieldCtaClickedEvent } = useSubscriptionMetrics();
  const shouldWaitForSubscriptionCreation = useMemo(() => {
    const searchParams = new URLSearchParams(search);
    // param to wait for subscription creation happen in the background
    const waitForSubscriptionCreation = searchParams.get(
      'waitForSubscriptionCreation',
    );
    return waitForSubscriptionCreation === 'true';
  }, [search]);

  const { formatCurrency } = useFormatters();

  const {
    customerId,
    subscriptions,
    lastSubscription,
    loading: subscriptionsLoading,
    error: subscriptionsError,
  } = useUserSubscriptions({
    refetch: !shouldWaitForSubscriptionCreation, // always fetch latest subscriptions state in settings screen unless we are waiting for subscription creation (subscription is refetch in background)
  });
  const currentShieldSubscription = useUserSubscriptionByProduct(
    PRODUCT_TYPES.SHIELD,
    subscriptions,
  );
  const lastShieldSubscription = useUserLastSubscriptionByProduct(
    PRODUCT_TYPES.SHIELD,
    lastSubscription,
  );
  // show current active shield subscription or last subscription if no active subscription
  const displayedShieldSubscription:
    | (Subscription & { rewardAccountId?: string }) // TODO: fix this type once we have controller released.
    | undefined = currentShieldSubscription ?? lastShieldSubscription;

  const [timeoutCancelled, setTimeoutCancelled] = useState(false);
  useEffect(() => {
    // cancel timeout when component unmounts
    return () => {
      setTimeoutCancelled(true);
    };
  }, []);
  useEffect(() => {
    // cancel timeout when subscription is created
    if (currentShieldSubscription) {
      setTimeoutCancelled(true);
    }
  }, [currentShieldSubscription]);

  const startSubscriptionCreationTimeout = useTimeout(
    () => {
      if (timeoutCancelled) {
        return;
      }

      // nav back home after timeout and no subscription created
      navigate(DEFAULT_ROUTE);
    },
    MINUTE,
    false,
  );
  // trigger wait for subscription creation timeout
  useEffect(() => {
    if (shouldWaitForSubscriptionCreation) {
      startSubscriptionCreationTimeout?.();
    }
  }, [shouldWaitForSubscriptionCreation, startSubscriptionCreationTimeout]);

  const {
    subscriptionPricing,
    loading: subscriptionPricingLoading,
    error: subscriptionPricingError,
  } = useSubscriptionPricing({
    refetch: true, // need to refetch here in case user already subscribed and doesn't go through shield plan screen
  });

  const isCancelled =
    displayedShieldSubscription?.status === SUBSCRIPTION_STATUSES.canceled;
  const isPaused = getIsShieldSubscriptionPaused(subscriptions);
  const isTrialing = getIsShieldSubscriptionTrialing(subscriptions);
  const isMembershipInactive = isCancelled || isPaused;
  const isSubscriptionEndingSoon =
    getIsShieldSubscriptionEndingSoon(subscriptions);

  const isCryptoPayment =
    displayedShieldSubscription?.paymentMethod &&
    isCryptoPaymentMethod(displayedShieldSubscription?.paymentMethod);

  const productInfo = useMemo(
    () =>
      displayedShieldSubscription?.products.find(
        (p) => p.name === PRODUCT_TYPES.SHIELD,
      ),
    [displayedShieldSubscription],
  );

  const [executeCancelSubscription, cancelSubscriptionResult] =
    useCancelSubscription(currentShieldSubscription);

  const {
    pointsMonthly,
    pointsYearly,
    isRewardsSeason,
    hasAccountOptedIn: hasOptedIntoRewards,
    pending: pendingShieldRewards,
  } = useShieldRewards();

  const isWaitingForSubscriptionCreation =
    shouldWaitForSubscriptionCreation && !currentShieldSubscription;

  const showSkeletonLoader =
    isWaitingForSubscriptionCreation ||
    subscriptionsLoading ||
    subscriptionPricingLoading ||
    pendingShieldRewards;

  // redirect to shield plan page if user doesn't have a subscription
  useEffect(() => {
    if (!shouldWaitForSubscriptionCreation && !displayedShieldSubscription) {
      navigate({
        pathname: SHIELD_PLAN_ROUTE,
        search: `?source=${EntryModalSourceEnum.Settings}`,
      });
    }
  }, [
    shouldWaitForSubscriptionCreation,
    navigate,
    displayedShieldSubscription,
  ]);

  const [isCancelMembershipModalOpen, setIsCancelMembershipModalOpen] =
    useState(false);

  const [isAddFundsModalOpen, setIsAddFundsModalOpen] = useState(false);

  const openRewardsOnboardingModal = useCallback(() => {
    dispatch(setOnboardingModalOpen(true));
  }, [dispatch]);

  const claimedRewardsPoints = useMemo(() => {
    const points =
      displayedShieldSubscription?.interval === RECURRING_INTERVALS.year
        ? pointsYearly
        : pointsMonthly;
    return points;
  }, [pointsYearly, pointsMonthly, displayedShieldSubscription?.interval]);

  const formattedRewardsPoints = useMemo(() => {
    if (!claimedRewardsPoints || !isRewardsSeason) {
      return '';
    }

    return new Intl.NumberFormat(locale).format(claimedRewardsPoints);
  }, [claimedRewardsPoints, isRewardsSeason, locale]);

  const trialDaysLeft = useMemo(() => {
    if (!isTrialing || !displayedShieldSubscription?.trialEnd) {
      return '';
    }
    const today = new Date();
    const trialEndDateDate = new Date(displayedShieldSubscription.trialEnd);
    const diffTime = Math.abs(trialEndDateDate.getTime() - today.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays.toString();
  }, [displayedShieldSubscription, isTrialing]);

  const priceDetails = useMemo(() => {
    if (!displayedShieldSubscription) {
      return '';
    }
    const interval =
      displayedShieldSubscription.interval === RECURRING_INTERVALS.year
        ? t('year')
        : t('month');
    const price = isCryptoPaymentMethod(
      displayedShieldSubscription.paymentMethod,
    )
      ? `${getProductPrice(productInfo as Product)} ${displayedShieldSubscription.paymentMethod.crypto.tokenSymbol.toUpperCase()}`
      : formatCurrency(
          getProductPrice(productInfo as Product),
          productInfo?.currency.toUpperCase(),
          {
            maximumFractionDigits: 2,
            minimumFractionDigits: 0,
          },
        );
    return t('shieldTxDetails1Description', [price, interval]);
  }, [displayedShieldSubscription, productInfo, t, formatCurrency]);

  const amountDetails = useMemo(() => {
    if (!displayedShieldSubscription) {
      return '';
    }

    return isTrialing
      ? t('shieldTxDetails1DescriptionTrial', [trialDaysLeft, priceDetails])
      : priceDetails;
  }, [displayedShieldSubscription, isTrialing, t, trialDaysLeft, priceDetails]);

  const payerAccountName = useMemo(() => {
    if (
      !displayedShieldSubscription ||
      !isCryptoPaymentMethod(displayedShieldSubscription.paymentMethod)
    ) {
      return '';
    }
    return (
      getAccountName(
        internalAccounts,
        displayedShieldSubscription.paymentMethod.crypto.payerAddress,
      ) || ''
    );
  }, [displayedShieldSubscription, internalAccounts]);

  const paymentMethodDetails = useMemo(() => {
    if (!displayedShieldSubscription) {
      return '';
    }
    if (isCryptoPaymentMethod(displayedShieldSubscription.paymentMethod)) {
      const { payerAddress } = displayedShieldSubscription.paymentMethod.crypto;
      const displayName = payerAccountName || shortenAddress(payerAddress);
      return t('shieldTxDetails3DescriptionCrypto', [
        displayedShieldSubscription.paymentMethod.crypto.tokenSymbol.toUpperCase(),
        displayName,
      ]);
    }
    return t('shieldPlanCard');
  }, [displayedShieldSubscription, payerAccountName, t]);

  const handleLinkRewardToShieldSubscription = useCallback(
    async (subscriptionId: string, rewardPoints: number) => {
      // link to shield only coz already opted in to rewards
      try {
        await dispatch(
          linkRewardToShieldSubscription(subscriptionId, rewardPoints),
        );
      } catch (error) {
        log.warn('Failed to link reward to shield subscription', error);
      }
    },
    [dispatch],
  );

  const isCardPayment =
    currentShieldSubscription &&
    isCardPaymentMethod(currentShieldSubscription.paymentMethod);

  const {
    handlePaymentError,
    resultTriggerSubscriptionCheckInsufficientFunds,
    updateSubscriptionCardPaymentMethodResult,
    updateSubscriptionCryptoPaymentMethodResult,
    currentToken,
  } = useHandlePayment({
    currentShieldSubscription,
    displayedShieldSubscription,
    subscriptions,
    isCancelled: isCancelled ?? false,
    subscriptionPricing,
    onOpenAddFundsModal: () => setIsAddFundsModalOpen(true),
  });

  const hasApiError =
    subscriptionsError ||
    subscriptionPricingError ||
    cancelSubscriptionResult.error ||
    updateSubscriptionCardPaymentMethodResult.error ||
    updateSubscriptionCryptoPaymentMethodResult.error ||
    resultTriggerSubscriptionCheckInsufficientFunds.error;

  const loading =
    cancelSubscriptionResult.pending ||
    updateSubscriptionCardPaymentMethodResult.pending ||
    updateSubscriptionCryptoPaymentMethodResult.pending ||
    resultTriggerSubscriptionCheckInsufficientFunds.pending;

  const handleViewFullBenefitsClicked = useCallback(() => {
    window.open(TRANSACTION_SHIELD_LINK, '_blank', 'noopener noreferrer');
    captureShieldCtaClickedEvent({
      source: ShieldCtaSourceEnum.Settings,
      ctaActionClicked: ShieldCtaActionClickedEnum.ViewFullBenefits,
      redirectToUrl: TRANSACTION_SHIELD_LINK,
    });
  }, [captureShieldCtaClickedEvent]);

  const rewardsButton = useMemo(() => {
    if (isCancelled) {
      return null;
    }
    if (showSkeletonLoader) {
      return <Skeleton width={80} height={40} />;
    }

    if (!hasOptedIntoRewards) {
      return (
        <Button
          variant={ButtonVariant.Secondary}
          size={ButtonSize.Md}
          onClick={() => {
            openRewardsOnboardingModal();
          }}
        >
          {t('shieldTxMembershipBenefits3SignUp')}
        </Button>
      );
    }
    if (
      displayedShieldSubscription?.id &&
      claimedRewardsPoints &&
      !displayedShieldSubscription?.rewardAccountId
    ) {
      return (
        <Button
          variant={ButtonVariant.Secondary}
          size={ButtonSize.Md}
          onClick={async () =>
            handleLinkRewardToShieldSubscription(
              displayedShieldSubscription?.id,
              claimedRewardsPoints,
            )
          }
        >
          {t('shieldTxMembershipBenefits3LinkRewards')}
        </Button>
      );
    }
    return null;
  }, [
    isCancelled,
    showSkeletonLoader,
    hasOptedIntoRewards,
    displayedShieldSubscription?.id,
    displayedShieldSubscription?.rewardAccountId,
    claimedRewardsPoints,
    t,
    openRewardsOnboardingModal,
    handleLinkRewardToShieldSubscription,
  ]);

  if (!loading && hasApiError) {
    return (
      <Box
        className="transaction-shield-page w-full"
        data-testid="transaction-shield-page"
      >
        <ApiErrorHandler
          className="transaction-shield-page__error-content mx-auto"
          error={hasApiError}
          location={ShieldUnexpectedErrorEventLocationEnum.TransactionShieldTab}
        />
      </Box>
    );
  }

  return (
    <Box
      className="transaction-shield-page flex flex-col w-full"
      data-testid="transaction-shield-page"
    >
      {currentShieldSubscription?.cancelAtPeriodEnd && (
        <Box
          className="transaction-shield-page__notification-banner flex items-center px-4 py-1 gap-2 mb-4"
          backgroundColor={BoxBackgroundColor.WarningMuted}
        >
          <Icon name={IconName.Info} size={IconSize.Lg} />
          <Text variant={TextVariant.BodySm}>
            {t('shieldTxMembershipCancelNotification', [
              getShortDateFormatterV2().format(
                new Date(currentShieldSubscription.currentPeriodEnd),
              ),
            ])}
          </Text>
        </Box>
      )}
      <MembershipErrorBanner
        isPaused={isPaused}
        isCryptoPayment={isCryptoPayment ?? false}
        isCardPayment={isCardPayment ?? false}
        isSubscriptionEndingSoon={isSubscriptionEndingSoon}
        currentShieldSubscription={currentShieldSubscription}
        onActionButtonClick={handlePaymentError}
      />
      <Box className="transaction-shield-page__container mb-4">
        <MembershipHeader
          className="mb-4"
          showSkeletonLoader={showSkeletonLoader}
          isTrialing={isTrialing}
          isPaused={isPaused}
          isCancelled={isCancelled}
          customerId={customerId}
          startDate={displayedShieldSubscription?.currentPeriodStart}
          endDate={displayedShieldSubscription?.currentPeriodEnd}
          trialDaysLeft={trialDaysLeft}
          cancelledDate={displayedShieldSubscription?.canceledAt}
        />
        {/* TODO: verify if we need to hide on all inactive states */}
        {displayedShieldSubscription && !isCancelled && (
          <>
            <Box>
              <Box className="flex items-center justify-between gap-2 px-4 mb-2">
                {showSkeletonLoader ? (
                  <Skeleton width="40%" height={20} />
                ) : (
                  <Text variant={TextVariant.HeadingSm}>
                    {t('shieldTxDetailsTitle')}
                  </Text>
                )}
                {showSkeletonLoader ? (
                  <Skeleton width="30%" height={20} />
                ) : (
                  <TextButton
                    data-testid="shield-detail-manage-plan-button"
                    className="text-text-alternative hover:text-text-alternative hover:decoration-text-alternative hover:bg-transparent"
                    endIconName={IconName.ArrowRight}
                    endIconProps={{
                      size: IconSize.Sm,
                      color: IconColor.IconAlternative,
                    }}
                    onClick={() => {
                      navigate(TRANSACTION_SHIELD_MANAGE_PLAN_ROUTE);
                    }}
                  >
                    {t('shieldTxDetailsManage')}
                  </TextButton>
                )}
              </Box>
              <ButtonRowContainer>
                <ButtonRow
                  startIconName={IconName.SecurityTick}
                  title={t('shieldTxDetails1Title')}
                  description={amountDetails}
                  loading={showSkeletonLoader}
                />
                <ButtonRow
                  startIconName={IconName.Calendar}
                  title={t('shieldTxDetails2Title')}
                  description={t('shieldTxDetails2Description', [
                    displayedShieldSubscription?.interval ===
                    RECURRING_INTERVALS.year
                      ? t('shieldPlanAnnual')
                      : t('shieldPlanMonthly'),
                    getShortDateFormatterV2().format(
                      new Date(displayedShieldSubscription?.currentPeriodEnd),
                    ),
                  ])}
                  loading={showSkeletonLoader}
                />
                <ButtonRow
                  startIconName={IconName.Card}
                  title={t('shieldTxDetails3Title')}
                  description={paymentMethodDetails}
                  loading={showSkeletonLoader}
                />
              </ButtonRowContainer>
            </Box>
            <Box className="border-t border-muted my-4 w-full h-px" />
          </>
        )}

        <Box>
          <Box className="flex items-center justify-between gap-2 px-4 mb-2">
            {showSkeletonLoader ? (
              <Skeleton width="40%" height={20} />
            ) : (
              <Text variant={TextVariant.HeadingSm}>
                {isMembershipInactive
                  ? t('shieldTxMembershipBenefitsInactive')
                  : t('shieldTxMembershipBenefits')}
              </Text>
            )}
            {showSkeletonLoader ? (
              <Skeleton width="30%" height={20} />
            ) : (
              <TextButton
                data-testid="shield-detail-view-benefits-button"
                className="text-text-alternative hover:text-text-alternative hover:decoration-text-alternative hover:bg-transparent"
                endIconName={IconName.ArrowRight}
                endIconProps={{
                  size: IconSize.Sm,
                  color: IconColor.IconAlternative,
                }}
                onClick={() => {
                  handleViewFullBenefitsClicked();
                }}
              >
                {t('shieldTxMembershipBenefitsViewAll')}
              </TextButton>
            )}
          </Box>
          <ButtonRowContainer>
            <ButtonRow
              startIconName={IconName.Cash}
              title={t('shieldTxMembershipBenefits1Title', ['$10,000'])}
              description={t('shieldTxMembershipBenefits1Description')}
              loading={showSkeletonLoader}
            />
            <ButtonRow
              startIconName={IconName.Sms}
              title={t('shieldTxMembershipBenefits2Title')}
              description={t('shieldTxMembershipBenefits2Description')}
              loading={showSkeletonLoader}
            />
            <ButtonRow
              startIconName={IconName.MetamaskFoxOutline}
              title={t('shieldTxMembershipBenefits3Title')}
              description={t(
                isMembershipInactive
                  ? 'shieldTxMembershipBenefits3DescriptionInactive'
                  : 'shieldTxMembershipBenefits3Description',
                [formattedRewardsPoints, displayedShieldSubscription?.interval],
              )}
              loading={showSkeletonLoader}
              endAccessory={rewardsButton}
            />
          </ButtonRowContainer>
        </Box>
        {displayedShieldSubscription?.isEligibleForSupport && (
          <Box className="px-4 mt-4">
            {showSkeletonLoader ? (
              <Skeleton width="100%" height={40} />
            ) : (
              <Button
                data-testid="shield-detail-submit-case-button"
                className="w-full"
                variant={ButtonVariant.Secondary}
                onClick={() => {
                  navigate(TRANSACTION_SHIELD_CLAIM_ROUTES.BASE);
                }}
              >
                {t('shieldTxMembershipSubmitCase')}
              </Button>
            )}
          </Box>
        )}
        {isCancelled && (
          <Box className="px-4 mt-4">
            {showSkeletonLoader ? (
              <Skeleton width="100%" height={40} />
            ) : (
              <Button
                data-testid="shield-detail-renew-button"
                className="w-full"
                variant={ButtonVariant.Secondary}
                onClick={() => {
                  handlePaymentError();
                }}
              >
                {t('shieldTxMembershipRenewDescription', [priceDetails])}
              </Button>
            )}
          </Box>
        )}
      </Box>

      {currentShieldSubscription && isCancelMembershipModalOpen && (
        <CancelMembershipModal
          onClose={() => setIsCancelMembershipModalOpen(false)}
          onConfirm={async () => {
            setIsCancelMembershipModalOpen(false);
            await executeCancelSubscription();
          }}
          subscription={currentShieldSubscription}
        />
      )}
      {loading && <LoadingScreen />}
      {currentToken &&
        isAddFundsModalOpen &&
        currentShieldSubscription &&
        isCryptoPaymentMethod(currentShieldSubscription.paymentMethod) && (
          <AddFundsModal
            onClose={() => {
              setIsAddFundsModalOpen(false);
            }}
            token={currentToken}
            chainId={currentShieldSubscription.paymentMethod.crypto.chainId}
            payerAddress={
              currentShieldSubscription.paymentMethod.crypto.payerAddress
            }
          />
        )}
      <RewardsOnboardingModal
        rewardPoints={claimedRewardsPoints ?? undefined}
        shieldSubscriptionId={displayedShieldSubscription?.id}
      />
    </Box>
  );
};

export default TransactionShield;
