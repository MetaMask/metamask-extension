import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
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
import { useNavigate } from 'react-router-dom-v5-compat';
import { useDispatch, useSelector } from 'react-redux';
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
  useUserSubscriptionByProduct,
  useUserSubscriptions,
} from '../../../hooks/subscription/useSubscription';
import { getShortDateFormatterV2 } from '../../asset/util';
import {
  SHIELD_PLAN_ROUTE,
  TRANSACTION_SHIELD_CLAIM_ROUTE,
} from '../../../helpers/constants/routes';
import { getProductPrice } from '../../shield-plan/utils';
import Tooltip from '../../../components/ui/tooltip';
import { ThemeType } from '../../../../shared/constants/preferences';
import { useFormatters } from '../../../hooks/useFormatters';
import LoadingScreen from '../../../components/ui/loading-screen';
import AddFundsModal from '../../../components/app/modals/add-funds-modal/add-funds-modal';
import {
  useSubscriptionPaymentMethods,
  useSubscriptionPricing,
} from '../../../hooks/subscription/useSubscriptionPricing';
import {
  getSubscriptionCryptoApprovalAmount,
  setSecurityAlertsEnabled,
  setUsePhishDetect,
  setUseTransactionSimulations,
} from '../../../store/actions';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  getIsSecurityAlertsEnabled,
  getUsePhishDetect,
  getUseTransactionSimulations,
} from '../../../selectors/selectors';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { ConfirmInfoRowAddress } from '../../../components/app/confirm/info/row';
import {
  getIsShieldSubscriptionEndingSoon,
  getIsShieldSubscriptionPaused,
} from '../../../../shared/lib/shield';
import { useAsyncResult } from '../../../hooks/useAsync';
import CancelMembershipModal from './cancel-membership-modal';
import { isCryptoPaymentMethod } from './types';

const TransactionShield = () => {
  const t = useI18nContext();
  const navigate = useNavigate();
  const { formatCurrency } = useFormatters();

  const trackEvent = useContext(MetaMetricsContext);

  const securityAlertsEnabled = useSelector(getIsSecurityAlertsEnabled);
  const usePhishDetect = useSelector(getUsePhishDetect);
  const useTransactionSimulations = useSelector(getUseTransactionSimulations);

  const dispatch = useDispatch();

  const {
    customerId,
    subscriptions,
    loading: subscriptionsLoading,
  } = useUserSubscriptions({
    refetch: true, // always fetch latest subscriptions state in settings screen
  });
  const shieldSubscription = useUserSubscriptionByProduct(
    PRODUCT_TYPES.SHIELD,
    subscriptions,
  );

  const { subscriptionPricing, loading: subscriptionPricingLoading } =
    useSubscriptionPricing({
      refetch: true, // need to refetch here in case user already subscribed and doesn't go through shield plan screen
    });
  const cryptoPaymentMethod = useSubscriptionPaymentMethods(
    PAYMENT_TYPES.byCrypto,
    subscriptionPricing,
  );

  const isCancelled =
    shieldSubscription?.status === SUBSCRIPTION_STATUSES.canceled;
  const isPaused = getIsShieldSubscriptionPaused(subscriptions);
  const isMembershipInactive = isCancelled || isPaused;
  const isSubscriptionEndingSoon =
    getIsShieldSubscriptionEndingSoon(subscriptions);

  // user can cancel subscription if not canceled and not cancel at period end
  const canCancel = !isCancelled && !shieldSubscription?.cancelAtPeriodEnd;

  const isCryptoPayment =
    shieldSubscription?.paymentMethod &&
    isCryptoPaymentMethod(shieldSubscription?.paymentMethod);

  const productInfo = useMemo(
    () =>
      shieldSubscription?.products.find((p) => p.name === PRODUCT_TYPES.SHIELD),
    [shieldSubscription],
  );

  const [executeCancelSubscription, cancelSubscriptionResult] =
    useCancelSubscription({
      subscriptionId: shieldSubscription?.id,
    });

  const [executeUnCancelSubscription, unCancelSubscriptionResult] =
    useUnCancelSubscription({
      subscriptionId: shieldSubscription?.id,
    });

  const [
    executeOpenGetSubscriptionBillingPortal,
    openGetSubscriptionBillingPortalResult,
  ] = useOpenGetSubscriptionBillingPortal();

  const [
    executeUpdateSubscriptionCardPaymentMethod,
    updateSubscriptionCardPaymentMethodResult,
  ] = useUpdateSubscriptionCardPaymentMethod({
    subscriptionId: shieldSubscription?.id,
    recurringInterval: shieldSubscription?.interval,
  });

  const loading =
    cancelSubscriptionResult.pending ||
    unCancelSubscriptionResult.pending ||
    openGetSubscriptionBillingPortalResult.pending ||
    updateSubscriptionCardPaymentMethodResult.pending;

  const showSkeletonLoader = subscriptionsLoading || subscriptionPricingLoading;

  useEffect(() => {
    if (shieldSubscription) {
      // set security alerts enabled to true
      if (!securityAlertsEnabled) {
        trackEvent({
          category: MetaMetricsEventCategory.Settings,
          event: MetaMetricsEventName.SettingsUpdated,
          properties: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            blockaid_alerts_enabled: true,
          },
        });
        setSecurityAlertsEnabled(true);
      }

      // set phishing detection to true
      if (!usePhishDetect) {
        dispatch(setUsePhishDetect(true));
      }

      // set transaction simulations to true
      if (!useTransactionSimulations) {
        setUseTransactionSimulations(true);
      }
    } else {
      // redirect to shield plan page if user doesn't have a subscription
      navigate(SHIELD_PLAN_ROUTE);
    }
  }, [
    navigate,
    shieldSubscription,
    securityAlertsEnabled,
    usePhishDetect,
    useTransactionSimulations,
    dispatch,
    trackEvent,
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
      !shieldSubscription ||
      !isCryptoPaymentMethod(shieldSubscription.paymentMethod)
    ) {
      return undefined;
    }
    const chainPaymentInfo = cryptoPaymentMethod?.chains?.find(
      (chain) =>
        chain.chainId ===
        (shieldSubscription.paymentMethod as SubscriptionCryptoPaymentMethod)
          .crypto.chainId,
    );

    const token = chainPaymentInfo?.tokens.find(
      (paymentToken) =>
        paymentToken.symbol ===
        (shieldSubscription.paymentMethod as SubscriptionCryptoPaymentMethod)
          .crypto.tokenSymbol,
    );

    return token;
  }, [cryptoPaymentMethod, shieldSubscription]);

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

  const billingDetails = (key: string, value: string | React.ReactNode) => {
    return (
      <Box
        display={Display.Flex}
        alignItems={AlignItems.center}
        gap={2}
        justifyContent={JustifyContent.spaceBetween}
      >
        {showSkeletonLoader ? (
          <Skeleton width="40%" height={24} />
        ) : (
          <Text variant={TextVariant.bodyMdMedium}>{key}</Text>
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
    shieldSubscription &&
    isCryptoPaymentMethod(shieldSubscription.paymentMethod) &&
    shieldSubscription.paymentMethod.crypto.error === 'insufficient_balance';
  const isAllowanceNeededCrypto =
    shieldSubscription &&
    isCryptoPaymentMethod(shieldSubscription.paymentMethod) &&
    (shieldSubscription.paymentMethod.crypto.error ===
      CRYPTO_PAYMENT_METHOD_ERRORS.INSUFFICIENT_ALLOWANCE ||
      shieldSubscription?.paymentMethod.crypto.error ===
        CRYPTO_PAYMENT_METHOD_ERRORS.APPROVAL_TRANSACTION_TOO_OLD ||
      shieldSubscription?.paymentMethod.crypto.error ===
        CRYPTO_PAYMENT_METHOD_ERRORS.APPROVAL_TRANSACTION_REVERTED ||
      shieldSubscription?.paymentMethod.crypto.error ===
        CRYPTO_PAYMENT_METHOD_ERRORS.APPROVAL_TRANSACTION_MAX_VERIFICATION_ATTEMPTS_REACHED);

  const { value: subscriptionCryptoApprovalAmount } =
    useAsyncResult(async () => {
      if (
        !currentToken ||
        !shieldSubscription ||
        !isCryptoPaymentMethod(shieldSubscription.paymentMethod)
      ) {
        return undefined;
      }
      const amount = await getSubscriptionCryptoApprovalAmount({
        chainId: shieldSubscription.paymentMethod.crypto.chainId,
        paymentTokenAddress: currentToken.address,
        productType: PRODUCT_TYPES.SHIELD,
        interval: shieldSubscription.interval,
      });

      return amount;
    }, [currentToken, shieldSubscription]);

  const paymentToken = useMemo(() => {
    if (
      !shieldSubscription ||
      !currentToken ||
      !isCryptoPaymentMethod(shieldSubscription.paymentMethod) ||
      !shieldSubscription.endDate ||
      !productInfo ||
      !subscriptionCryptoApprovalAmount
    ) {
      return undefined;
    }

    return {
      chainId: shieldSubscription.paymentMethod.crypto.chainId,
      address: currentToken.address,
      approvalAmount: {
        approveAmount: subscriptionCryptoApprovalAmount.approveAmount,
        chainId: shieldSubscription.paymentMethod.crypto.chainId,
        paymentAddress: shieldSubscription.paymentMethod.crypto.payerAddress,
        paymentTokenAddress: currentToken.address,
      },
    };
  }, [
    productInfo,
    currentToken,
    shieldSubscription,
    subscriptionCryptoApprovalAmount,
  ]);

  const { execute: executeSubscriptionCryptoApprovalTransaction } =
    useSubscriptionCryptoApprovalTransaction(paymentToken);

  const handlePaymentError = useCallback(async () => {
    if (
      shieldSubscription &&
      isCryptoPaymentMethod(shieldSubscription.paymentMethod)
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
    shieldSubscription,
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
    if (isSubscriptionEndingSoon && shieldSubscription) {
      return (
        <BannerAlert
          description={t('shieldTxMembershipErrorInsufficientFunds', [
            getShortDateFormatterV2().format(
              new Date(shieldSubscription.currentPeriodEnd),
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
    shieldSubscription,
    t,
    isCryptoPayment,
    isInsufficientFundsCrypto,
    isAllowanceNeededCrypto,
    handlePaymentError,
  ]);

  const paymentMethod = useMemo(() => {
    if (!shieldSubscription) {
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
                isCryptoPaymentMethod(shieldSubscription?.paymentMethod)
                  ? shieldSubscription.paymentMethod.crypto.tokenSymbol
                  : '',
              ],
            )}
          </ButtonLink>
        </Tooltip>
      );
    }
    if (isSubscriptionEndingSoon && shieldSubscription) {
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
          {isCryptoPaymentMethod(shieldSubscription.paymentMethod)
            ? shieldSubscription.paymentMethod.crypto.tokenSymbol
            : ''}
        </ButtonLink>
      );
    }
    return isCryptoPaymentMethod(shieldSubscription.paymentMethod)
      ? shieldSubscription.paymentMethod.crypto.tokenSymbol
      : `${shieldSubscription.paymentMethod.card.brand.charAt(0).toUpperCase() + shieldSubscription.paymentMethod.card.brand.slice(1)} - ${shieldSubscription.paymentMethod.card.last4}`; // display card info for card payment method;
  }, [
    isPaused,
    shieldSubscription,
    isCryptoPayment,
    isSubscriptionEndingSoon,
    t,
    handlePaymentError,
  ]);

  return (
    <Box
      className="transaction-shield-page"
      data-testid="transaction-shield-page"
      width={BlockSize.Full}
      flexDirection={FlexDirection.Column}
      padding={4}
    >
      {shieldSubscription?.cancelAtPeriodEnd && (
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
                new Date(shieldSubscription.currentPeriodEnd),
              ),
            ])}
          </Text>
        </Box>
      )}
      {membershipErrorBanner}
      <Box className="transaction-shield-page__container" marginBottom={4}>
        <Box
          data-theme={ThemeType.dark}
          className={classnames(
            'transaction-shield-page__row transaction-shield-page__membership',
            {
              'transaction-shield-page__membership--loading':
                showSkeletonLoader,
              'transaction-shield-page__membership--inactive':
                isMembershipInactive && !showSkeletonLoader,
              'transaction-shield-page__membership--active':
                !isMembershipInactive && !showSkeletonLoader,
            },
          )}
          {...rowsStyleProps}
          alignItems={AlignItems.center}
          justifyContent={JustifyContent.spaceBetween}
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
                >
                  {isMembershipInactive
                    ? t('shieldTxMembershipInactive')
                    : t('shieldTxMembershipActive')}
                </Text>
                {shieldSubscription?.status ===
                  SUBSCRIPTION_STATUSES.trialing && (
                  <Tag
                    label={t('shieldTxMembershipFreeTrial')}
                    labelProps={{
                      variant: TextVariant.bodySmMedium,
                      color: TextColor.textAlternative,
                    }}
                    borderStyle={BorderStyle.none}
                    borderRadius={BorderRadius.SM}
                    backgroundColor={BackgroundColor.backgroundMuted}
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
              >
                {t('shieldTxMembershipId')}: {customerId}
              </Text>
            )}
          </Box>
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
        {buttonRow(t('shieldTxMembershipViewFullBenefits'), () => {
          // todo: link to benefits page
        })}
        {/* TODO: implement logic to allow submitting case until after 21 days of last active subscription */}
        {!isCancelled &&
          buttonRow(t('shieldTxMembershipSubmitCase'), () => {
            navigate(TRANSACTION_SHIELD_CLAIM_ROUTE);
          })}
        {!isMembershipInactive &&
          shieldSubscription?.cancelAtPeriodEnd &&
          buttonRow(t('shieldTxMembershipResubscribe'), () => {
            executeUnCancelSubscription();
          })}
        {canCancel &&
          buttonRow(
            t('shieldTxMembershipCancel'),
            () => {
              setIsCancelMembershipModalOpen(true);
            },
            'shield-tx-membership-cancel-button',
          )}
        {isCancelled &&
          buttonRow(t('shieldTxMembershipRenew'), async () => {
            if (isCryptoPayment) {
              // TODO: handle renew membership crypto
              console.log('renew membership');
            } else {
              await executeUpdateSubscriptionCardPaymentMethod();
            }
          })}
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
            <Text variant={TextVariant.headingSm}>
              {t('shieldTxMembershipBillingDetails')}
            </Text>
          )}
          {shieldSubscription ? (
            <>
              {billingDetails(
                t('shieldTxMembershipBillingDetailsNextBilling'),
                shieldSubscription?.cancelAtPeriodEnd
                  ? '-'
                  : getShortDateFormatterV2().format(
                      new Date(shieldSubscription.currentPeriodEnd),
                    ),
              )}
              {billingDetails(
                t('shieldTxMembershipBillingDetailsCharges'),
                isCryptoPayment
                  ? `${getProductPrice(productInfo as Product)} ${productInfo?.currency.toUpperCase()} (${shieldSubscription.interval === RECURRING_INTERVALS.year ? t('shieldPlanAnnual') : t('shieldPlanMonthly')})`
                  : `${formatCurrency(
                      getProductPrice(productInfo as Product),
                      productInfo?.currency.toUpperCase(),
                      {
                        maximumFractionDigits: 0,
                      },
                    )} (${shieldSubscription.interval === RECURRING_INTERVALS.year ? t('shieldPlanAnnual') : t('shieldPlanMonthly')})`,
              )}
              {isCryptoPayment &&
                billingDetails(
                  t('shieldTxMembershipBillingDetailsBillingAccount'),
                  isCryptoPaymentMethod(shieldSubscription.paymentMethod) ? (
                    <ConfirmInfoRowAddress
                      address={
                        shieldSubscription.paymentMethod.crypto.payerAddress
                      }
                      chainId={shieldSubscription.paymentMethod.crypto.chainId}
                    />
                  ) : (
                    ''
                  ),
                )}
              {billingDetails(
                t('shieldTxMembershipBillingDetailsPaymentMethod'),
                paymentMethod,
              )}
            </>
          ) : (
            <Skeleton width="60%" height={24} />
          )}
        </Box>
        {shieldSubscription?.status !== SUBSCRIPTION_STATUSES.provisional &&
          buttonRow(
            t('shieldTxMembershipBillingDetailsViewBillingHistory'),
            executeOpenGetSubscriptionBillingPortal,
          )}
      </Box>
      {shieldSubscription && isCancelMembershipModalOpen && (
        <CancelMembershipModal
          onClose={() => setIsCancelMembershipModalOpen(false)}
          onConfirm={async () => {
            setIsCancelMembershipModalOpen(false);
            await executeCancelSubscription();
          }}
          subscription={shieldSubscription}
        />
      )}
      {loading && <LoadingScreen />}
      {currentToken &&
        isAddFundsModalOpen &&
        shieldSubscription &&
        isCryptoPaymentMethod(shieldSubscription.paymentMethod) && (
          <AddFundsModal
            onClose={() => {
              setIsAddFundsModalOpen(false);
            }}
            token={currentToken}
            chainId={shieldSubscription.paymentMethod.crypto.chainId}
            payerAddress={shieldSubscription.paymentMethod.crypto.payerAddress}
          />
        )}
    </Box>
  );
};

export default TransactionShield;
