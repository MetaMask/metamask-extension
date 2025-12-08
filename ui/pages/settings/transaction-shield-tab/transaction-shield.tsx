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
  Button,
  ButtonSize,
  ButtonVariant,
  Icon,
  IconColor,
  IconName,
  IconSize,
  TextButton,
} from '@metamask/design-system-react';
import { useDispatch, useSelector } from 'react-redux';
import log from 'loglevel';
import {
  BannerAlert,
  BannerAlertSeverity,
  Box,
  BoxProps,
  Text,
} from '../../../components/component-library';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  BorderRadius,
  Display,
  FlexDirection,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { Skeleton } from '../../../components/component-library/skeleton';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  useCancelSubscription,
  useOpenGetSubscriptionBillingPortal,
  useShieldRewards,
  useUnCancelSubscription,
  useUserLastSubscriptionByProduct,
  useUserSubscriptionByProduct,
  useUserSubscriptions,
} from '../../../hooks/subscription/useSubscription';
import { getShortDateFormatterV2 } from '../../asset/util';
import {
  DEFAULT_ROUTE,
  SHIELD_PLAN_ROUTE,
  TRANSACTION_SHIELD_CLAIM_ROUTES,
} from '../../../helpers/constants/routes';
import { TRANSACTION_SHIELD_LINK } from '../../../helpers/constants/common';
import { getProductPrice } from '../../shield-plan/utils';
import { useFormatters } from '../../../hooks/useFormatters';
import LoadingScreen from '../../../components/ui/loading-screen';
import AddFundsModal from '../../../components/app/modals/add-funds-modal/add-funds-modal';
import { useSubscriptionPricing } from '../../../hooks/subscription/useSubscriptionPricing';
import { ConfirmInfoRowAddress } from '../../../components/app/confirm/info/row';
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
import { PaymentMethodRow } from './payment-method-row';
import { ButtonRow, ButtonRowContainer, MembershipHeader } from './components';

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

  // user can cancel subscription if not canceled and current subscription not cancel at period end
  const canCancel =
    !isCancelled && !currentShieldSubscription?.cancelAtPeriodEnd;

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

  const [executeUnCancelSubscription, unCancelSubscriptionResult] =
    useUnCancelSubscription(currentShieldSubscription);

  const [
    executeOpenGetSubscriptionBillingPortal,
    openGetSubscriptionBillingPortalResult,
  ] = useOpenGetSubscriptionBillingPortal(displayedShieldSubscription);

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

  const amountDetails = useMemo(() => {
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

    const priceDetails = t('shieldTxDetails1Description', [price, interval]);

    return isTrialing
      ? t('shieldTxDetails1DescriptionTrial', [trialDaysLeft, priceDetails])
      : priceDetails;
  }, [
    displayedShieldSubscription,
    formatCurrency,
    isTrialing,
    productInfo,
    t,
    trialDaysLeft,
  ]);

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

  const rowsStyleProps: BoxProps<'div'> = {
    display: Display.Flex,
    backgroundColor: BackgroundColor.backgroundSection,
    padding: 4,
  };

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

  const buttonRow = (label: string, onClick: () => void, id?: string) => {
    return (
      <Box
        as="button"
        data-testid={id}
        className="transaction-shield-page__row"
        {...rowsStyleProps}
        justifyContent={JustifyContent.spaceBetween}
        alignItems={AlignItems.center}
        width={BlockSize.Full}
        onClick={onClick}
      >
        {showSkeletonLoader ? (
          <Skeleton width="50%" height={20} />
        ) : (
          <Text variant={TextVariant.bodyMdMedium}>{label}</Text>
        )}
        {showSkeletonLoader ? (
          <Skeleton width={24} height={24} borderRadius={BorderRadius.full} />
        ) : (
          <Icon
            name={IconName.ArrowRight}
            size={IconSize.Lg}
            color={IconColor.IconAlternative}
          />
        )}
      </Box>
    );
  };

  const billingDetails = (
    key: string,
    value: string | React.ReactNode,
    testId?: string,
  ) => {
    return (
      <Box
        display={Display.Flex}
        alignItems={AlignItems.center}
        gap={2}
        justifyContent={JustifyContent.spaceBetween}
        data-testid={testId}
      >
        {showSkeletonLoader ? (
          <Skeleton width="40%" height={24} />
        ) : (
          <Text
            variant={TextVariant.bodyMdMedium}
            color={TextColor.textAlternative}
          >
            {key}
          </Text>
        )}
        {showSkeletonLoader ? (
          <Skeleton width="30%" height={24} />
        ) : (
          <Text variant={TextVariant.bodyMdMedium} className="flex-shrink-0">
            {value}
          </Text>
        )}
      </Box>
    );
  };

  const isCardPayment =
    currentShieldSubscription &&
    isCardPaymentMethod(currentShieldSubscription.paymentMethod);

  const {
    handlePaymentError,
    handlePaymentErrorInsufficientFunds,
    handlePaymentMethodChange,
    isUnexpectedErrorCryptoPayment,
    hasAvailableSelectedTokenToTriggerCheckInsufficientFunds,
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
    unCancelSubscriptionResult.error ||
    openGetSubscriptionBillingPortalResult.error ||
    updateSubscriptionCardPaymentMethodResult.error ||
    updateSubscriptionCryptoPaymentMethodResult.error ||
    resultTriggerSubscriptionCheckInsufficientFunds.error;

  const loading =
    cancelSubscriptionResult.pending ||
    unCancelSubscriptionResult.pending ||
    openGetSubscriptionBillingPortalResult.pending ||
    updateSubscriptionCardPaymentMethodResult.pending ||
    updateSubscriptionCryptoPaymentMethodResult.pending ||
    resultTriggerSubscriptionCheckInsufficientFunds.pending;

  const membershipErrorBanner = useMemo(() => {
    // This is the number of hours it might takes for the payment to be updated
    const PAYMENT_UPDATE_HOURS = 24;
    if (isPaused) {
      // default text to unexpected error case
      let descriptionText = 'shieldTxMembershipErrorPausedUnexpected';
      let actionButtonLabel = 'shieldTxMembershipErrorPausedUnexpectedAction';
      if (isCryptoPayment) {
        descriptionText =
          'shieldTxMembershipErrorPausedCryptoInsufficientFunds';
        actionButtonLabel =
          'shieldTxMembershipErrorPausedCryptoInsufficientFundsAction';
      } else if (isCardPayment) {
        descriptionText = 'shieldTxMembershipErrorPausedCard';
        actionButtonLabel = 'shieldTxMembershipErrorPausedCardAction';
      }
      return (
        <BannerAlert
          description={t(descriptionText, [PAYMENT_UPDATE_HOURS])}
          severity={BannerAlertSeverity.Danger}
          marginBottom={4}
          actionButtonLabel={t(actionButtonLabel)}
          actionButtonOnClick={handlePaymentError}
        />
      );
    }
    if (currentShieldSubscription && isSubscriptionEndingSoon) {
      return (
        <BannerAlert
          description={t('shieldTxMembershipErrorInsufficientFunds', [
            getShortDateFormatterV2().format(
              new Date(currentShieldSubscription.currentPeriodEnd),
            ),
          ])}
          severity={BannerAlertSeverity.Warning}
          marginBottom={4}
          actionButtonLabel={t('shieldTxMembershipRenew')}
          actionButtonOnClick={handlePaymentError}
        />
      );
    }

    return null;
  }, [
    isPaused,
    isSubscriptionEndingSoon,
    currentShieldSubscription,
    t,
    isCardPayment,
    isCryptoPayment,
    handlePaymentError,
  ]);

  const handleViewFullBenefitsClicked = useCallback(() => {
    window.open(TRANSACTION_SHIELD_LINK, '_blank', 'noopener noreferrer');
    captureShieldCtaClickedEvent({
      source: ShieldCtaSourceEnum.Settings,
      ctaActionClicked: ShieldCtaActionClickedEnum.ViewFullBenefits,
      redirectToUrl: TRANSACTION_SHIELD_LINK,
    });
  }, [captureShieldCtaClickedEvent]);

  const rewardsButton = useMemo(() => {
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
        className="transaction-shield-page"
        data-testid="transaction-shield-page"
        width={BlockSize.Full}
        padding={4}
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
      className="transaction-shield-page"
      data-testid="transaction-shield-page"
      width={BlockSize.Full}
      flexDirection={FlexDirection.Column}
    >
      {currentShieldSubscription?.cancelAtPeriodEnd && (
        <Box
          className="transaction-shield-page__notification-banner"
          backgroundColor={BackgroundColor.warningMuted}
          paddingTop={1}
          paddingBottom={1}
          paddingInline={4}
          display={Display.Flex}
          alignItems={AlignItems.center}
          gap={2}
          marginBottom={4}
        >
          <Icon name={IconName.Info} size={IconSize.Lg} />
          <Text variant={TextVariant.bodySm}>
            {t('shieldTxMembershipCancelNotification', [
              getShortDateFormatterV2().format(
                new Date(currentShieldSubscription.currentPeriodEnd),
              ),
            ])}
          </Text>
        </Box>
      )}
      {membershipErrorBanner}
      <Box className="transaction-shield-page__container" marginBottom={4}>
        <MembershipHeader
          isInactive={isMembershipInactive}
          showSkeletonLoader={showSkeletonLoader}
          isTrialing={isTrialing}
          isPaused={isPaused}
          customerId={customerId}
          startDate={displayedShieldSubscription?.currentPeriodStart}
          endDate={displayedShieldSubscription?.currentPeriodEnd}
          trialDaysLeft={trialDaysLeft}
        />
        {displayedShieldSubscription && (
          <Box className="mt-4">
            <Box
              display={Display.Flex}
              justifyContent={JustifyContent.spaceBetween}
              alignItems={AlignItems.center}
              gap={2}
              paddingInline={4}
              marginBottom={2}
            >
              {showSkeletonLoader ? (
                <Skeleton width="40%" height={20} />
              ) : (
                <Text variant={TextVariant.headingSm}>
                  {t('shieldTxDetailsTitle')}
                </Text>
              )}
              {showSkeletonLoader ? (
                <Skeleton width="30%" height={20} />
              ) : (
                <TextButton
                  data-testid="shield-detail-manage-plan-button"
                  className="text-text-alternative hover:text-text-alternative hover:decoration-text-alternative"
                  endIconName={IconName.ArrowRight}
                  endIconProps={{
                    size: IconSize.Sm,
                    color: IconColor.IconAlternative,
                  }}
                  onClick={() => {
                    // navigate(TRANSACTION_SHIELD_MANAGE_PLAN_ROUTE);
                    console.log('navigate to manage plan');
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
        )}
        <Box className="border-t border-muted my-4 w-full h-px" />
        <Box>
          <Box
            display={Display.Flex}
            justifyContent={JustifyContent.spaceBetween}
            alignItems={AlignItems.center}
            gap={2}
            paddingInline={4}
            marginBottom={2}
          >
            {showSkeletonLoader ? (
              <Skeleton width="40%" height={20} />
            ) : (
              <Text variant={TextVariant.headingSm}>
                {t('shieldTxMembershipBenefits')}
              </Text>
            )}
            {showSkeletonLoader ? (
              <Skeleton width="30%" height={20} />
            ) : (
              <TextButton
                data-testid="shield-detail-view-benefits-button"
                className="text-text-alternative hover:text-text-alternative hover:decoration-text-alternative"
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
              description={t('shieldTxMembershipBenefits3Description', [
                formattedRewardsPoints,
                displayedShieldSubscription?.interval,
              ])}
              loading={showSkeletonLoader}
              endAccessory={rewardsButton}
            />
          </ButtonRowContainer>
        </Box>
        {buttonRow(
          t('shieldTxMembershipViewFullBenefits'),
          handleViewFullBenefitsClicked,
          'shield-detail-view-benefits-button',
        )}
        {displayedShieldSubscription?.isEligibleForSupport &&
          buttonRow(
            t('shieldTxMembershipSubmitCase'),
            () => {
              navigate(TRANSACTION_SHIELD_CLAIM_ROUTES.BASE);
            },
            'shield-detail-submit-case-button',
          )}
        {!isMembershipInactive &&
          currentShieldSubscription?.cancelAtPeriodEnd &&
          buttonRow(
            t('shieldTxMembershipResubscribe'),
            () => {
              executeUnCancelSubscription();
            },
            'shield-tx-membership-uncancel-button',
          )}
        {canCancel &&
          buttonRow(
            t('shieldTxMembershipCancel'),
            () => {
              setIsCancelMembershipModalOpen(true);
            },
            'shield-tx-membership-cancel-button',
          )}
        {isCancelled &&
          buttonRow(
            t('shieldTxMembershipRenew'),
            handlePaymentError,
            'shield-detail-renew-button',
          )}
      </Box>

      <Box className="transaction-shield-page__container">
        <Box
          className="transaction-shield-page__row"
          {...rowsStyleProps}
          flexDirection={FlexDirection.Column}
          gap={2}
        >
          {showSkeletonLoader ? (
            <Skeleton width="60%" height={24} />
          ) : (
            <Text
              variant={TextVariant.headingSm}
              data-testid="shield-detail-billing-details-title"
            >
              {t('shieldTxMembershipBillingDetails')}
            </Text>
          )}
          {displayedShieldSubscription ? (
            <>
              {billingDetails(
                t('shieldTxMembershipBillingDetailsNextBilling'),
                isCancelled || displayedShieldSubscription?.cancelAtPeriodEnd
                  ? '-'
                  : getShortDateFormatterV2().format(
                      new Date(displayedShieldSubscription.currentPeriodEnd),
                    ),
                'shield-detail-next-billing',
              )}
              {billingDetails(
                t('shieldTxMembershipBillingDetailsCharges'),
                isCryptoPaymentMethod(displayedShieldSubscription.paymentMethod)
                  ? `${getProductPrice(productInfo as Product)} ${displayedShieldSubscription.paymentMethod.crypto.tokenSymbol.toUpperCase()} (${displayedShieldSubscription.interval === RECURRING_INTERVALS.year ? t('shieldPlanAnnual') : t('shieldPlanMonthly')})`
                  : `${formatCurrency(
                      getProductPrice(productInfo as Product),
                      productInfo?.currency.toUpperCase(),
                      {
                        maximumFractionDigits: 2,
                        minimumFractionDigits: 0,
                      },
                    )} (${displayedShieldSubscription.interval === RECURRING_INTERVALS.year ? t('shieldPlanAnnual') : t('shieldPlanMonthly')})`,
                'shield-detail-charges',
              )}
              {isCryptoPayment &&
                billingDetails(
                  t('shieldTxMembershipBillingDetailsBillingAccount'),
                  isCryptoPaymentMethod(
                    displayedShieldSubscription.paymentMethod,
                  ) ? (
                    <ConfirmInfoRowAddress
                      address={
                        displayedShieldSubscription.paymentMethod.crypto
                          .payerAddress
                      }
                      chainId={
                        displayedShieldSubscription.paymentMethod.crypto.chainId
                      }
                      showFullName
                    />
                  ) : (
                    ''
                  ),
                  'shield-detail-billing-account',
                )}
              {billingDetails(
                t('shieldTxMembershipBillingDetailsPaymentMethod'),
                <PaymentMethodRow
                  displayedShieldSubscription={displayedShieldSubscription}
                  subscriptionPricing={subscriptionPricing}
                  onPaymentMethodChange={handlePaymentMethodChange}
                  showSkeletonLoader={showSkeletonLoader}
                  isCheckSubscriptionInsufficientFundsDisabled={
                    !hasAvailableSelectedTokenToTriggerCheckInsufficientFunds
                  }
                  handlePaymentErrorInsufficientFunds={
                    handlePaymentErrorInsufficientFunds
                  }
                  isPaused={isPaused}
                  isUnexpectedErrorCryptoPayment={
                    isUnexpectedErrorCryptoPayment
                  }
                  handlePaymentError={handlePaymentError}
                />,
                'shield-detail-payment-method',
              )}
            </>
          ) : (
            <Skeleton width="60%" height={24} />
          )}
        </Box>
        {displayedShieldSubscription?.status !==
          SUBSCRIPTION_STATUSES.provisional &&
          buttonRow(
            t('shieldTxMembershipBillingDetailsViewBillingHistory'),
            executeOpenGetSubscriptionBillingPortal,
            'shield-detail-view-billing-history-button',
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
