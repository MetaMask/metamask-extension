import React, { useCallback, useEffect, useMemo, useState } from 'react';
import classnames from 'classnames';
import {
  CRYPTO_PAYMENT_METHOD_ERRORS,
  PAYMENT_TYPES,
  Product,
  PRODUCT_TYPES,
  RECURRING_INTERVALS,
  SUBSCRIPTION_STATUSES,
  SubscriptionCryptoPaymentMethod,
  TokenPaymentInfo,
} from '@metamask/subscription-controller';
import { useLocation, useNavigate } from 'react-router-dom-v5-compat';
import { NameType } from '@metamask/name-controller';
import { useSelector } from 'react-redux';
import {
  BannerAlert,
  BannerAlertSeverity,
  Box,
  BoxProps,
  ButtonLink,
  Icon,
  IconName,
  IconSize,
  Tag,
  Text,
} from '../../../components/component-library';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  BorderRadius,
  BorderStyle,
  Display,
  FlexDirection,
  IconColor,
  JustifyContent,
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { Skeleton } from '../../../components/component-library/skeleton';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  useCancelSubscription,
  useOpenGetSubscriptionBillingPortal,
  useSubscriptionCryptoApprovalTransaction,
  useUnCancelSubscription,
  useUpdateSubscriptionCardPaymentMethod,
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
import Tooltip from '../../../components/ui/tooltip';
import { useFormatters } from '../../../hooks/useFormatters';
import LoadingScreen from '../../../components/ui/loading-screen';
import AddFundsModal from '../../../components/app/modals/add-funds-modal/add-funds-modal';
import {
  useSubscriptionPaymentMethods,
  useSubscriptionPricing,
} from '../../../hooks/subscription/useSubscriptionPricing';
import { getSubscriptionCryptoApprovalAmount } from '../../../store/actions';
import { ConfirmInfoRowAddress } from '../../../components/app/confirm/info/row';
import {
  getIsShieldSubscriptionEndingSoon,
  getIsShieldSubscriptionPaused,
} from '../../../../shared/lib/shield';
import { useAsyncResult } from '../../../hooks/useAsync';
import { useTimeout } from '../../../hooks/useTimeout';
import { MINUTE } from '../../../../shared/constants/time';
import Name from '../../../components/app/name';
import ShieldIllustrationAnimation from '../../../components/app/shield-entry-modal/shield-illustration-animation';
import { useSubscriptionMetrics } from '../../../hooks/shield/metrics/useSubscriptionMetrics';
import {
  ShieldCtaActionClickedEnum,
  ShieldCtaSourceEnum,
} from '../../../../shared/constants/subscriptions';
import { ThemeType } from '../../../../shared/constants/preferences';
import { getTheme } from '../../../selectors';
import CancelMembershipModal from './cancel-membership-modal';
import { isCryptoPaymentMethod } from './types';

const TransactionShield = () => {
  const t = useI18nContext();
  const navigate = useNavigate();
  const { search } = useLocation();
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
  const theme = useSelector(getTheme);
  const isLightTheme = theme === ThemeType.light;

  const {
    customerId,
    subscriptions,
    lastSubscription,
    loading: subscriptionsLoading,
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
  const displayedShieldSubscription =
    currentShieldSubscription ?? lastShieldSubscription;

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

  const { subscriptionPricing, loading: subscriptionPricingLoading } =
    useSubscriptionPricing({
      refetch: true, // need to refetch here in case user already subscribed and doesn't go through shield plan screen
    });
  const cryptoPaymentMethod = useSubscriptionPaymentMethods(
    PAYMENT_TYPES.byCrypto,
    subscriptionPricing,
  );

  const isCancelled =
    displayedShieldSubscription?.status === SUBSCRIPTION_STATUSES.canceled;
  const isPaused = getIsShieldSubscriptionPaused(subscriptions);
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
    useUnCancelSubscription({
      subscriptionId: currentShieldSubscription?.id,
    });

  const [
    executeOpenGetSubscriptionBillingPortal,
    openGetSubscriptionBillingPortalResult,
  ] = useOpenGetSubscriptionBillingPortal(displayedShieldSubscription);

  const [
    executeUpdateSubscriptionCardPaymentMethod,
    updateSubscriptionCardPaymentMethodResult,
  ] = useUpdateSubscriptionCardPaymentMethod({
    subscription: currentShieldSubscription,
    newRecurringInterval: currentShieldSubscription?.interval,
  });

  const isWaitingForSubscriptionCreation =
    shouldWaitForSubscriptionCreation && !currentShieldSubscription;

  const loading =
    cancelSubscriptionResult.pending ||
    unCancelSubscriptionResult.pending ||
    openGetSubscriptionBillingPortalResult.pending ||
    updateSubscriptionCardPaymentMethodResult.pending;

  const showSkeletonLoader =
    isWaitingForSubscriptionCreation ||
    subscriptionsLoading ||
    subscriptionPricingLoading;

  // redirect to shield plan page if user doesn't have a subscription
  useEffect(() => {
    if (!shouldWaitForSubscriptionCreation && !displayedShieldSubscription) {
      navigate(SHIELD_PLAN_ROUTE);
    }
  }, [
    shouldWaitForSubscriptionCreation,
    navigate,
    displayedShieldSubscription,
  ]);

  const [isCancelMembershipModalOpen, setIsCancelMembershipModalOpen] =
    useState(false);

  const [isAddFundsModalOpen, setIsAddFundsModalOpen] = useState(false);

  const shieldDetails = [
    {
      icon: IconName.ShieldLock,
      title: t('shieldTxDetails1Title'),
      description: t('shieldTxDetails1Description'),
    },
    {
      icon: IconName.Flash,
      title: t('shieldTxDetails2Title'),
      description: t('shieldTxDetails2Description'),
    },
  ];

  const rowsStyleProps: BoxProps<'div'> = {
    display: Display.Flex,
    backgroundColor: BackgroundColor.backgroundSection,
    padding: 4,
  };

  const currentToken = useMemo((): TokenPaymentInfo | undefined => {
    if (
      !displayedShieldSubscription ||
      !isCryptoPaymentMethod(displayedShieldSubscription.paymentMethod)
    ) {
      return undefined;
    }
    const chainPaymentInfo = cryptoPaymentMethod?.chains?.find(
      (chain) =>
        chain.chainId ===
        (
          displayedShieldSubscription.paymentMethod as SubscriptionCryptoPaymentMethod
        ).crypto.chainId,
    );

    const token = chainPaymentInfo?.tokens.find(
      (paymentToken) =>
        paymentToken.symbol ===
        (
          displayedShieldSubscription.paymentMethod as SubscriptionCryptoPaymentMethod
        ).crypto.tokenSymbol,
    );

    return token;
  }, [cryptoPaymentMethod, displayedShieldSubscription]);

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
            color={IconColor.iconAlternative}
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
          <Text variant={TextVariant.bodyMdMedium}>{value}</Text>
        )}
      </Box>
    );
  };
  const isInsufficientFundsCrypto =
    currentShieldSubscription &&
    isCryptoPaymentMethod(currentShieldSubscription.paymentMethod) &&
    currentShieldSubscription.paymentMethod.crypto.error ===
      'insufficient_balance';
  const isAllowanceNeededCrypto =
    currentShieldSubscription &&
    isCryptoPaymentMethod(currentShieldSubscription.paymentMethod) &&
    (currentShieldSubscription.paymentMethod.crypto.error ===
      CRYPTO_PAYMENT_METHOD_ERRORS.INSUFFICIENT_ALLOWANCE ||
      currentShieldSubscription?.paymentMethod.crypto.error ===
        CRYPTO_PAYMENT_METHOD_ERRORS.APPROVAL_TRANSACTION_TOO_OLD ||
      currentShieldSubscription?.paymentMethod.crypto.error ===
        CRYPTO_PAYMENT_METHOD_ERRORS.APPROVAL_TRANSACTION_REVERTED ||
      currentShieldSubscription?.paymentMethod.crypto.error ===
        CRYPTO_PAYMENT_METHOD_ERRORS.APPROVAL_TRANSACTION_MAX_VERIFICATION_ATTEMPTS_REACHED);

  const { value: subscriptionCryptoApprovalAmount } =
    useAsyncResult(async () => {
      if (
        !currentToken ||
        !displayedShieldSubscription ||
        !isCryptoPaymentMethod(displayedShieldSubscription.paymentMethod)
      ) {
        return undefined;
      }
      const amount = await getSubscriptionCryptoApprovalAmount({
        chainId: displayedShieldSubscription.paymentMethod.crypto.chainId,
        paymentTokenAddress: currentToken.address,
        productType: PRODUCT_TYPES.SHIELD,
        interval: displayedShieldSubscription.interval,
      });

      return amount;
    }, [currentToken, displayedShieldSubscription]);

  const paymentToken = useMemo(() => {
    if (
      !displayedShieldSubscription ||
      !currentToken ||
      !isCryptoPaymentMethod(displayedShieldSubscription.paymentMethod) ||
      !displayedShieldSubscription.endDate ||
      !productInfo ||
      !subscriptionCryptoApprovalAmount
    ) {
      return undefined;
    }

    return {
      chainId: displayedShieldSubscription.paymentMethod.crypto.chainId,
      address: currentToken.address,
      approvalAmount: {
        approveAmount: subscriptionCryptoApprovalAmount.approveAmount,
        chainId: displayedShieldSubscription.paymentMethod.crypto.chainId,
        paymentAddress:
          displayedShieldSubscription.paymentMethod.crypto.payerAddress,
        paymentTokenAddress: currentToken.address,
      },
    };
  }, [
    productInfo,
    currentToken,
    displayedShieldSubscription,
    subscriptionCryptoApprovalAmount,
  ]);

  const { execute: executeSubscriptionCryptoApprovalTransaction } =
    useSubscriptionCryptoApprovalTransaction(paymentToken);

  const handlePaymentError = useCallback(async () => {
    if (isCancelled) {
      // go to shield plan page to renew subscription for cancelled subscription
      navigate(SHIELD_PLAN_ROUTE);
    } else if (
      currentShieldSubscription &&
      isCryptoPaymentMethod(currentShieldSubscription.paymentMethod)
    ) {
      if (isInsufficientFundsCrypto) {
        // TODO: handle add funds crypto
        // then use subscription controller to trigger subscription check
        setIsAddFundsModalOpen(true);
        // await dispatch(updateSubscriptionCryptoPaymentMethod({
        //   ...params,
        //   rawTransaction: undefined // no raw transaction to trigger server to check for new funded balance
        // }))
      } else if (isAllowanceNeededCrypto) {
        await executeSubscriptionCryptoApprovalTransaction();
      } else {
        throw new Error('Unknown crypto error action');
      }
    } else {
      await executeUpdateSubscriptionCardPaymentMethod();
    }
  }, [
    isCancelled,
    navigate,
    currentShieldSubscription,
    isInsufficientFundsCrypto,
    isAllowanceNeededCrypto,
    executeUpdateSubscriptionCardPaymentMethod,
    setIsAddFundsModalOpen,
    executeSubscriptionCryptoApprovalTransaction,
  ]);

  const membershipErrorBanner = useMemo(() => {
    if (isPaused) {
      return (
        <BannerAlert
          description={t('shieldTxMembershipErrorPaused')}
          severity={BannerAlertSeverity.Danger}
          marginBottom={4}
          actionButtonLabel={t(
            isCryptoPayment && isInsufficientFundsCrypto
              ? 'shieldTxMembershipErrorAddFunds'
              : 'shieldTxMembershipErrorUpdatePayment',
          )}
          actionButtonOnClick={handlePaymentError}
        />
      );
    }
    if (isSubscriptionEndingSoon && currentShieldSubscription) {
      return (
        <BannerAlert
          description={t('shieldTxMembershipErrorInsufficientFunds', [
            getShortDateFormatterV2().format(
              new Date(currentShieldSubscription.currentPeriodEnd),
            ),
          ])}
          severity={BannerAlertSeverity.Warning}
          marginBottom={4}
          actionButtonLabel={
            isAllowanceNeededCrypto
              ? t('shieldTxMembershipRenew')
              : t('shieldTxMembershipErrorAddFunds')
          }
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
    isCryptoPayment,
    isInsufficientFundsCrypto,
    isAllowanceNeededCrypto,
    handlePaymentError,
  ]);

  const paymentMethod = useMemo(() => {
    if (!displayedShieldSubscription) {
      return '';
    }
    if (isPaused) {
      return (
        <Tooltip
          position="top"
          title={t(
            isCryptoPayment
              ? 'shieldTxMembershipErrorPausedCryptoTooltip'
              : 'shieldTxMembershipErrorPausedCardTooltip',
          )}
        >
          <ButtonLink
            startIconName={IconName.Danger}
            startIconProps={{
              size: IconSize.Md,
            }}
            onClick={handlePaymentError}
            danger
          >
            {t(
              isCryptoPayment
                ? 'shieldTxMembershipErrorInsufficientToken'
                : 'shieldTxMembershipErrorUpdateCard',
              [
                isCryptoPaymentMethod(
                  displayedShieldSubscription?.paymentMethod,
                )
                  ? displayedShieldSubscription.paymentMethod.crypto.tokenSymbol
                  : '',
              ],
            )}
          </ButtonLink>
        </Tooltip>
      );
    }
    if (isSubscriptionEndingSoon && displayedShieldSubscription) {
      return (
        <ButtonLink
          className="warning-button"
          startIconName={IconName.Danger}
          startIconProps={{
            size: IconSize.Md,
            color: IconColor.warningDefault,
          }}
          color={TextColor.warningDefault}
          onClick={handlePaymentError}
        >
          {isCryptoPaymentMethod(displayedShieldSubscription.paymentMethod)
            ? displayedShieldSubscription.paymentMethod.crypto.tokenSymbol
            : ''}
        </ButtonLink>
      );
    }

    if (isCryptoPaymentMethod(displayedShieldSubscription.paymentMethod)) {
      const tokenInfo = displayedShieldSubscription.paymentMethod.crypto;
      const tokenAddress = cryptoPaymentMethod?.chains
        ?.find((chain) => chain.chainId === tokenInfo.chainId)
        ?.tokens.find(
          (token) => token.symbol === tokenInfo.tokenSymbol,
        )?.address;

      if (!tokenAddress) {
        return tokenInfo.tokenSymbol;
      }
      return (
        <Name
          value={tokenAddress}
          type={NameType.ETHEREUM_ADDRESS}
          preferContractSymbol
          variation={tokenInfo.chainId}
          fallbackName={tokenInfo.tokenSymbol}
        />
      );
    }

    return `${displayedShieldSubscription.paymentMethod.card.brand.charAt(0).toUpperCase() + displayedShieldSubscription.paymentMethod.card.brand.slice(1)} - ${displayedShieldSubscription.paymentMethod.card.last4}`; // display card info for card payment method;
  }, [
    isPaused,
    displayedShieldSubscription,
    isCryptoPayment,
    isSubscriptionEndingSoon,
    t,
    handlePaymentError,
    cryptoPaymentMethod,
  ]);

  const handleViewFullBenefitsClicked = useCallback(() => {
    window.open(TRANSACTION_SHIELD_LINK, '_blank', 'noopener noreferrer');
    captureShieldCtaClickedEvent({
      source: ShieldCtaSourceEnum.Settings,
      ctaActionClicked: ShieldCtaActionClickedEnum.ViewFullBenefits,
      redirectToUrl: TRANSACTION_SHIELD_LINK,
    });
  }, [captureShieldCtaClickedEvent]);

  return (
    <Box
      className="transaction-shield-page"
      data-testid="transaction-shield-page"
      width={BlockSize.Full}
      flexDirection={FlexDirection.Column}
      padding={4}
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
        <Box
          className={classnames(
            'transaction-shield-page__row transaction-shield-page__membership',
            {
              'transaction-shield-page__membership--loading':
                showSkeletonLoader,
              'transaction-shield-page__membership--inactive':
                isMembershipInactive && !showSkeletonLoader,
              'transaction-shield-page__membership--active':
                !isMembershipInactive && !showSkeletonLoader,
              'transaction-shield-page__membership--inactive-light':
                isLightTheme && isMembershipInactive && !showSkeletonLoader,
            },
          )}
          {...rowsStyleProps}
          alignItems={AlignItems.center}
          justifyContent={JustifyContent.spaceBetween}
          paddingRight={2}
        >
          <Box
            width={BlockSize.Full}
            gap={showSkeletonLoader ? 2 : 0}
            display={Display.Flex}
            flexDirection={FlexDirection.Column}
          >
            {showSkeletonLoader ? (
              <Skeleton width="60%" height={20} />
            ) : (
              <Box
                display={Display.Flex}
                alignItems={AlignItems.center}
                gap={3}
              >
                <Text
                  variant={TextVariant.bodyMdBold}
                  className="transaction-shield-page__membership-text"
                  data-testid="shield-detail-membership-status"
                >
                  {isMembershipInactive
                    ? t('shieldTxMembershipInactive')
                    : t('shieldTxMembershipActive')}
                </Text>
                {currentShieldSubscription?.status ===
                  SUBSCRIPTION_STATUSES.trialing && (
                  <Tag
                    label={t('shieldTxMembershipFreeTrial')}
                    labelProps={{
                      variant: TextVariant.bodySmMedium,
                      color: TextColor.successDefault,
                    }}
                    borderStyle={BorderStyle.none}
                    borderRadius={BorderRadius.SM}
                    backgroundColor={BackgroundColor.successMuted}
                    data-testid="shield-detail-trial-tag"
                  />
                )}
                {isPaused && (
                  <Tag
                    label={t('shieldTxMembershipPaused')}
                    labelProps={{
                      variant: TextVariant.bodySmMedium,
                      color: TextColor.textAlternative,
                    }}
                    borderStyle={BorderStyle.none}
                    borderRadius={BorderRadius.SM}
                    backgroundColor={BackgroundColor.backgroundMuted}
                    data-testid="shield-detail-paused-tag"
                  />
                )}
              </Box>
            )}
            {showSkeletonLoader ? (
              <Skeleton width="60%" height={16} />
            ) : (
              <Text
                variant={TextVariant.bodyXs}
                className="transaction-shield-page__membership-text"
                data-testid="shield-detail-customer-id"
              >
                {t('shieldTxMembershipId')}: {customerId}
              </Text>
            )}
          </Box>
          {!showSkeletonLoader && (
            <ShieldIllustrationAnimation
              containerClassName="transaction-shield-page-shield-illustration__container"
              canvasClassName="transaction-shield-page-shield-illustration__canvas"
            />
          )}
        </Box>

        <Box
          className="transaction-shield-page__row"
          {...rowsStyleProps}
          flexDirection={FlexDirection.Column}
          paddingTop={2}
          paddingBottom={2}
        >
          {shieldDetails.map((detail, index) => (
            <Box
              key={index}
              display={Display.Flex}
              alignItems={AlignItems.center}
              gap={2}
              paddingTop={2}
              paddingBottom={2}
            >
              {showSkeletonLoader ? (
                <Skeleton
                  width={32}
                  height={32}
                  borderRadius={BorderRadius.full}
                  style={{ flexShrink: 0 }}
                />
              ) : (
                <Icon name={detail.icon} size={IconSize.Xl} />
              )}
              <Box
                width={BlockSize.Full}
                display={Display.Flex}
                flexDirection={FlexDirection.Column}
                gap={showSkeletonLoader ? 2 : 0}
              >
                {showSkeletonLoader ? (
                  <Skeleton width="100%" height={18} />
                ) : (
                  <Text variant={TextVariant.bodySmBold}>{detail.title}</Text>
                )}
                {showSkeletonLoader ? (
                  <Skeleton width="100%" height={18} />
                ) : (
                  <Text
                    variant={TextVariant.bodySm}
                    color={TextColor.textAlternative}
                  >
                    {detail.description}
                  </Text>
                )}
              </Box>
            </Box>
          ))}
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
              navigate(TRANSACTION_SHIELD_CLAIM_ROUTES.NEW.FULL);
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
                        maximumFractionDigits: 0,
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
                paymentMethod,
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
    </Box>
  );
};

export default TransactionShield;
