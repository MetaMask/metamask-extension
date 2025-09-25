import React, { useEffect, useMemo, useState } from 'react';
import classnames from 'classnames';
import {
  Product,
  PRODUCT_TYPES,
  ProductType,
  RECURRING_INTERVALS,
  SUBSCRIPTION_STATUSES,
  SubscriptionStatus,
} from '@metamask/subscription-controller';
import { useNavigate } from 'react-router-dom-v5-compat';
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
  useUnCancelSubscription,
  useUpdateSubscriptionCardPaymentMethod,
  useUserSubscriptionByProduct,
  useUserSubscriptions,
} from '../../../hooks/subscription/useSubscription';
import { getShortDateFormatterV2 } from '../../asset/util';
import { SHIELD_PLAN_ROUTE } from '../../../helpers/constants/routes';
import { getProductPrice } from '../../shield-plan/utils';
import Tooltip from '../../../components/ui/tooltip';
import { ThemeType } from '../../../../shared/constants/preferences';
import { useFormatters } from '../../../helpers/formatters';
import { DAY } from '../../../../shared/constants/time';
import LoadingScreen from '../../../components/ui/loading-screen';
import CancelMembershipModal from './cancel-membership-modal';
import { isCryptoPaymentMethod } from './types';

const SUBSCRIPTION_ENDING_SOON_DAYS = DAY;

const TransactionShield = () => {
  const t = useI18nContext();
  const navigate = useNavigate();
  const { formatCurrency } = useFormatters();

  const {
    customerId,
    subscriptions,
    loading: subscriptionsLoading,
  } = useUserSubscriptions();
  const shieldSubscription = useUserSubscriptionByProduct(
    'shield' as ProductType,
    subscriptions,
  );
  const isCancelled =
    shieldSubscription?.status === SUBSCRIPTION_STATUSES.canceled;
  const isPaused = Boolean(
    shieldSubscription &&
      (
        [
          SUBSCRIPTION_STATUSES.paused,
          SUBSCRIPTION_STATUSES.pastDue,
          SUBSCRIPTION_STATUSES.unpaid,
        ] as SubscriptionStatus[]
      ).includes(shieldSubscription.status),
  );
  const isMembershipInactive = isCancelled || isPaused;
  const isSubscriptionEndingSoon = useMemo(() => {
    // show subscription ending soon for crypto payment only with endDate (next billing cycle) for user to send new approve transaction
    if (!shieldSubscription?.endDate) {
      return false;
    }
    return (
      new Date(shieldSubscription.endDate).getTime() - Date.now() <
      SUBSCRIPTION_ENDING_SOON_DAYS
    );
  }, [shieldSubscription]);

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

  const showSkeletonLoader = subscriptionsLoading;

  useEffect(() => {
    if (!shieldSubscription) {
      // redirect to shield plan page if user doesn't have a subscription
      navigate(SHIELD_PLAN_ROUTE);
    }
  }, [navigate, shieldSubscription]);

  const [isCancelMembershipModalOpen, setIsCancelMembershipModalOpen] =
    useState(false);

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
            color={IconColor.iconAlternativeSoft}
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

  const membershipErrorBanner = useMemo(() => {
    if (isPaused) {
      return (
        <BannerAlert
          description={t('shieldTxMembershipErrorPaused')}
          severity={BannerAlertSeverity.Danger}
          marginBottom={4}
          actionButtonLabel={t(
            isCryptoPayment
              ? 'shieldTxMembershipErrorAddFunds'
              : 'shieldTxMembershipErrorUpdatePayment',
          )}
          actionButtonOnClick={async () => {
            if (isCryptoPayment) {
              // TODO: handle add funds crypto
              console.log('add funds');
            } else {
              await executeUpdateSubscriptionCardPaymentMethod();
            }
          }}
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
          actionButtonLabel={t('shieldTxMembershipErrorAddFunds')}
          actionButtonOnClick={() => {
            console.log('add funds');
          }}
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
    executeUpdateSubscriptionCardPaymentMethod,
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
            onClick={async () => {
              if (isCryptoPayment) {
                // TODO: handle add funds crypto
                console.log('add funds');
              } else {
                await executeUpdateSubscriptionCardPaymentMethod();
              }
            }}
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
          onClick={() => {
            console.log('add funds');
          }}
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
    executeUpdateSubscriptionCardPaymentMethod,
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
            data-theme={ThemeType.dark}
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
                      color: TextColor.textAlternativeSoft,
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
                      color: TextColor.textAlternativeSoft,
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
            // todo: link to submit claim page
          })}
        {(!isMembershipInactive || shieldSubscription?.cancelAtPeriodEnd) &&
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
                  isCryptoPaymentMethod(shieldSubscription.paymentMethod)
                    ? shieldSubscription.paymentMethod.crypto.payerAddress // TODO: will change to account name
                    : '',
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
        {buttonRow(
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
    </Box>
  );
};

export default TransactionShield;
