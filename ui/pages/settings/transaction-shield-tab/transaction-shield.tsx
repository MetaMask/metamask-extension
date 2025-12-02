import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
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
import {
  Button,
  ButtonVariant,
  IconName as DsIconName,
} from '@metamask/design-system-react';
import {
  BannerAlert,
  BannerAlertSeverity,
  Box,
  BoxProps,
  ButtonLink,
  Icon,
  IconName,
  IconSize,
  Text,
} from '../../../components/component-library';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
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
  useHandleSubscriptionSupportAction,
  useSubscriptionCryptoApprovalTransaction,
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
  TRANSACTION_SHIELD_MANAGE_PLAN_ROUTE,
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
import {
  getIsShieldSubscriptionEndingSoon,
  getIsShieldSubscriptionPaused,
  getIsShieldSubscriptionTrialing,
} from '../../../../shared/lib/shield';
import { useAsyncResult } from '../../../hooks/useAsync';
import { useTimeout } from '../../../hooks/useTimeout';
import { MINUTE } from '../../../../shared/constants/time';
import Name from '../../../components/app/name';
import {
  useHandleShieldAddFundTrigger,
  useShieldSubscriptionCryptoSufficientBalanceCheck,
} from '../../../hooks/subscription/useAddFundTrigger';
import { useSubscriptionMetrics } from '../../../hooks/shield/metrics/useSubscriptionMetrics';
import {
  EntryModalSourceEnum,
  ShieldCtaActionClickedEnum,
  ShieldCtaSourceEnum,
  ShieldErrorStateActionClickedEnum,
  ShieldErrorStateLocationEnum,
  ShieldErrorStateViewEnum,
  ShieldUnexpectedErrorEventLocationEnum,
} from '../../../../shared/constants/subscriptions';
import ApiErrorHandler from '../../../components/app/api-error-handler';
import { shortenAddress } from '../../../helpers/utils/util';
import { getAccountName, getInternalAccounts } from '../../../selectors';
import { isCardPaymentMethod, isCryptoPaymentMethod } from './types';
import { ButtonRow, ButtonRowContainer, MembershipHeader } from './components';

const TransactionShield = () => {
  const t = useI18nContext();
  const navigate = useNavigate();
  const { search } = useLocation();
  const internalAccounts = useSelector(getInternalAccounts);
  const { captureShieldCtaClickedEvent, captureShieldErrorStateClickedEvent } =
    useSubscriptionMetrics();
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
  const displayedShieldSubscription =
    currentShieldSubscription ?? lastShieldSubscription;

  // watch handle add fund trigger server check subscription paused because of insufficient funds
  const {
    hasAvailableSelectedToken:
      hasAvailableSelectedTokenToTriggerCheckInsufficientFunds,
  } = useShieldSubscriptionCryptoSufficientBalanceCheck();
  const {
    handleTriggerSubscriptionCheck:
      handleTriggerSubscriptionCheckInsufficientFunds,
    result: resultTriggerSubscriptionCheckInsufficientFunds,
  } = useHandleShieldAddFundTrigger();

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
  const cryptoPaymentMethod = useSubscriptionPaymentMethods(
    PAYMENT_TYPES.byCrypto,
    subscriptionPricing,
  );

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

  const [
    executeUpdateSubscriptionCardPaymentMethod,
    updateSubscriptionCardPaymentMethodResult,
  ] = useUpdateSubscriptionCardPaymentMethod({
    subscription: currentShieldSubscription,
    newRecurringInterval: currentShieldSubscription?.interval,
  });

  const hasApiError =
    subscriptionsError ||
    subscriptionPricingError ||
    updateSubscriptionCardPaymentMethodResult.error;

  const isWaitingForSubscriptionCreation =
    shouldWaitForSubscriptionCreation && !currentShieldSubscription;

  const loading =
    resultTriggerSubscriptionCheckInsufficientFunds.pending ||
    updateSubscriptionCardPaymentMethodResult.pending;

  const showSkeletonLoader =
    isWaitingForSubscriptionCreation ||
    subscriptionsLoading ||
    subscriptionPricingLoading;

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

  const [isAddFundsModalOpen, setIsAddFundsModalOpen] = useState(false);

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

  const isCardPayment =
    currentShieldSubscription &&
    isCardPaymentMethod(currentShieldSubscription.paymentMethod);
  const isUnexpectedErrorCryptoPayment =
    currentShieldSubscription &&
    isPaused &&
    isCryptoPaymentMethod(currentShieldSubscription.paymentMethod) &&
    !currentShieldSubscription.paymentMethod.crypto.error;
  const isInsufficientFundsCrypto =
    currentShieldSubscription &&
    isCryptoPaymentMethod(currentShieldSubscription.paymentMethod) &&
    currentShieldSubscription.paymentMethod.crypto.error ===
      CRYPTO_PAYMENT_METHOD_ERRORS.INSUFFICIENT_BALANCE;
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

  const { handleClickContactSupport } = useHandleSubscriptionSupportAction();

  const handlePaymentError = useCallback(async () => {
    if (currentShieldSubscription) {
      // capture error state clicked event
      captureShieldErrorStateClickedEvent({
        subscriptionStatus: currentShieldSubscription.status,
        paymentType: currentShieldSubscription.paymentMethod.type,
        billingInterval: currentShieldSubscription.interval,
        errorCause: 'payment_error',
        actionClicked: ShieldErrorStateActionClickedEnum.Cta,
        location: ShieldErrorStateLocationEnum.Settings,
        view: ShieldErrorStateViewEnum.Banner,
      });
    }

    if (isUnexpectedErrorCryptoPayment) {
      // handle support action
      handleClickContactSupport();
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
    handleClickContactSupport,
    isUnexpectedErrorCryptoPayment,
    currentShieldSubscription,
    isInsufficientFundsCrypto,
    isAllowanceNeededCrypto,
    executeUpdateSubscriptionCardPaymentMethod,
    setIsAddFundsModalOpen,
    executeSubscriptionCryptoApprovalTransaction,
    captureShieldErrorStateClickedEvent,
  ]);

  // handle payment error for insufficient funds crypto payment
  // need separate handler to not mistake with handlePaymentError for membership error banner
  const handlePaymentErrorInsufficientFunds = useCallback(async () => {
    if (
      !isInsufficientFundsCrypto ||
      !hasAvailableSelectedTokenToTriggerCheckInsufficientFunds
    ) {
      return;
    }

    await handleTriggerSubscriptionCheckInsufficientFunds();
  }, [
    isInsufficientFundsCrypto,
    hasAvailableSelectedTokenToTriggerCheckInsufficientFunds,
    handleTriggerSubscriptionCheckInsufficientFunds,
  ]);

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

  const paymentMethod = useMemo(() => {
    if (!displayedShieldSubscription) {
      return '';
    }
    if (isPaused && !isUnexpectedErrorCryptoPayment) {
      let tooltipText = '';
      let buttonText = '';
      let buttonDisabled = false;
      let buttonOnClick = handlePaymentError;
      if (isCryptoPayment) {
        tooltipText = 'shieldTxMembershipErrorPausedCryptoTooltip';
        buttonText = 'shieldTxMembershipErrorInsufficientToken';
        if (isInsufficientFundsCrypto) {
          buttonOnClick = handlePaymentErrorInsufficientFunds;
          // disable button if insufficient funds and not enough token balance to trigger subscription check
          if (!hasAvailableSelectedTokenToTriggerCheckInsufficientFunds) {
            buttonDisabled = true;
          }
        }
      } else {
        // card payment error case
        tooltipText = 'shieldTxMembershipErrorPausedCardTooltip';
        buttonText = 'shieldTxMembershipErrorUpdateCard';
      }

      return (
        <Tooltip position="top" title={t(tooltipText)}>
          <ButtonLink
            startIconName={IconName.Danger}
            startIconProps={{
              size: IconSize.Md,
            }}
            onClick={buttonOnClick}
            disabled={buttonDisabled}
            danger
          >
            {t(buttonText, [
              isCryptoPaymentMethod(displayedShieldSubscription?.paymentMethod)
                ? displayedShieldSubscription.paymentMethod.crypto.tokenSymbol
                : '',
            ])}
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
    isUnexpectedErrorCryptoPayment,
    displayedShieldSubscription,
    isCryptoPayment,
    isInsufficientFundsCrypto,
    hasAvailableSelectedTokenToTriggerCheckInsufficientFunds,
    handlePaymentErrorInsufficientFunds,
    isSubscriptionEndingSoon,
    t,
    handlePaymentError,
    cryptoPaymentMethod,
  ]);

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

  const handleViewFullBenefitsClicked = useCallback(() => {
    window.open(TRANSACTION_SHIELD_LINK, '_blank', 'noopener noreferrer');
    captureShieldCtaClickedEvent({
      source: ShieldCtaSourceEnum.Settings,
      ctaActionClicked: ShieldCtaActionClickedEnum.ViewFullBenefits,
      redirectToUrl: TRANSACTION_SHIELD_LINK,
    });
  }, [captureShieldCtaClickedEvent]);

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
                <ButtonLink
                  className="neutral-button"
                  endIconName={IconName.ArrowRight}
                  endIconProps={{
                    size: IconSize.Sm,
                    color: IconColor.iconAlternative,
                  }}
                  color={TextColor.textAlternative}
                  onClick={() => {
                    navigate(TRANSACTION_SHIELD_MANAGE_PLAN_ROUTE);
                  }}
                >
                  {t('shieldTxDetailsManage')}
                </ButtonLink>
              )}
            </Box>
            <ButtonRowContainer>
              <ButtonRow
                startIconName={DsIconName.SecurityTick}
                title={t('shieldTxDetails1Title')}
                description={amountDetails}
                loading={showSkeletonLoader}
              />
              <ButtonRow
                startIconName={DsIconName.Calendar}
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
                startIconName={DsIconName.Card}
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
              <ButtonLink
                data-testid="shield-detail-view-benefits-button"
                className="neutral-button"
                endIconName={IconName.ArrowRight}
                endIconProps={{
                  size: IconSize.Sm,
                  color: IconColor.iconAlternative,
                }}
                color={TextColor.textAlternative}
                onClick={() => {
                  handleViewFullBenefitsClicked();
                }}
              >
                {t('shieldTxMembershipBenefitsViewAll')}
              </ButtonLink>
            )}
          </Box>
          <ButtonRowContainer>
            <ButtonRow
              startIconName={DsIconName.Cash}
              title={t('shieldTxMembershipBenefits1Title')}
              description={t('shieldTxMembershipBenefits1Description')}
              loading={showSkeletonLoader}
            />
            <ButtonRow
              startIconName={DsIconName.Sms}
              title={t('shieldTxMembershipBenefits2Title')}
              description={t('shieldTxMembershipBenefits2Description')}
              loading={showSkeletonLoader}
            />
            <ButtonRow
              startIconName={DsIconName.MetamaskFoxOutline}
              title={t('shieldTxMembershipBenefits3Title')}
              description={t('shieldTxMembershipBenefits3Description')}
              loading={showSkeletonLoader}
            />
          </ButtonRowContainer>
        </Box>

        {displayedShieldSubscription?.isEligibleForSupport && (
          <Button
            data-testid="shield-detail-submit-case-button"
            className="w-full mt-4"
            variant={ButtonVariant.Secondary}
            onClick={() => {
              navigate(TRANSACTION_SHIELD_CLAIM_ROUTES.NEW.FULL);
            }}
          >
            {t('shieldTxMembershipSubmitCase')}
          </Button>
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
                t('shieldTxMembershipBillingDetailsPaymentMethod'),
                paymentMethod,
                'shield-detail-payment-method',
              )}
            </>
          ) : (
            <Skeleton width="60%" height={24} />
          )}
        </Box>
      </Box>
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
