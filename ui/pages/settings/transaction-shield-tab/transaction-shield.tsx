import React, { useEffect, useMemo, useState } from 'react';
import classnames from 'classnames';
import {
  Product,
  PRODUCT_TYPES,
  ProductType,
  SUBSCRIPTION_STATUSES,
} from '@metamask/subscription-controller';
import { useNavigate } from 'react-router-dom-v5-compat';
import {
  BannerAlert,
  BannerAlertSeverity,
  Box,
  BoxProps,
  Button,
  ButtonLink,
  ButtonSize,
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
  useGetSubscriptionBillingPortalUrl,
  useUnCancelSubscription,
  useUserSubscriptionByProduct,
  useUserSubscriptions,
} from '../../../hooks/subscription/useSubscription';
import { getShortDateFormatterV2 } from '../../asset/util';
import { SHIELD_PLAN_ROUTE } from '../../../helpers/constants/routes';
import { getProductPrice } from '../../shield-plan/utils';
import { getTabsAPI } from '../../../../shared/lib/oauth';
import Tooltip from '../../../components/ui/tooltip';
import CancelMembershipModal from './cancel-membership-modal';
import { isCryptoPaymentMethod } from './types';

const MEMBERSHIP_ERROR_STATES = {
  INSUFFICIENT_TOKEN_BALANCE: 'insufficient_token_balance',
  DECLINED_CARD_PAYMENT: 'declined_card_payment',
  INSUFFICIENT_FUNDS: 'insufficient_funds',
  MEMBERSHIP_ENDING: 'membership_ending',
} as const;

type MembershipErrorState =
  (typeof MEMBERSHIP_ERROR_STATES)[keyof typeof MEMBERSHIP_ERROR_STATES];

const TransactionShield = () => {
  const t = useI18nContext();
  const navigate = useNavigate();
  const { subscriptions, loading: subscriptionsLoading } =
    useUserSubscriptions();
  const shieldSubscription = useUserSubscriptionByProduct(
    'shield' as ProductType,
    subscriptions,
  );
  const isCancelled =
    shieldSubscription?.status === SUBSCRIPTION_STATUSES.canceled;
  const productInfo = useMemo(
    () =>
      shieldSubscription?.products.find((p) => p.name === PRODUCT_TYPES.SHIELD),
    [shieldSubscription],
  );
  const isCryptoPayment =
    shieldSubscription?.paymentMethod &&
    isCryptoPaymentMethod(shieldSubscription?.paymentMethod);

  const [executeCancelSubscription, cancelSubscriptionResult] =
    useCancelSubscription({
      subscriptionId: shieldSubscription?.id,
    });

  const [executeUnCancelSubscription, unCancelSubscriptionResult] =
    useUnCancelSubscription({
      subscriptionId: shieldSubscription?.id,
    });

  const [
    executeGetSubscriptionBillingPortalUrl,
    getSubscriptionBillingPortalUrlResult,
  ] = useGetSubscriptionBillingPortalUrl();

  useEffect(() => {
    if (
      !getSubscriptionBillingPortalUrlResult.pending &&
      getSubscriptionBillingPortalUrlResult.value
    ) {
      // handle open new billing portal tab after result is ready
      const { url } = getSubscriptionBillingPortalUrlResult.value;
      const tabsAPI = getTabsAPI();
      tabsAPI.create({ url });
    }
  }, [
    getSubscriptionBillingPortalUrlResult.pending,
    getSubscriptionBillingPortalUrlResult.value,
  ]);

  const loading =
    subscriptionsLoading ||
    cancelSubscriptionResult.pending ||
    unCancelSubscriptionResult.pending ||
    getSubscriptionBillingPortalUrlResult.pending;

  useEffect(() => {
    if (!loading && !shieldSubscription) {
      // redirect to shield plan page if user doesn't have a subscription
      navigate(SHIELD_PLAN_ROUTE);
    }
  }, [navigate, loading, shieldSubscription]);

  const [isCancelMembershipModalOpen, setIsCancelMembershipModalOpen] =
    useState(false);
  const [membershipErrorState] = useState<MembershipErrorState | null>(null);

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

  const membershipErrorDetails: Record<
    MembershipErrorState,
    {
      description: string;
      severity: BannerAlertSeverity;
    }
  > = {
    [MEMBERSHIP_ERROR_STATES.INSUFFICIENT_TOKEN_BALANCE]: {
      description: t('shieldTxMembershipErrorInsufficientTokenBalance', [
        <ButtonLink
          key="update-payment"
          onClick={() => {
            console.log('update payment');
          }}
        >
          {t('shieldTxMembershipErrorUpdatePayment')}
        </ButtonLink>,
      ]),
      severity: BannerAlertSeverity.Danger,
    },
    [MEMBERSHIP_ERROR_STATES.DECLINED_CARD_PAYMENT]: {
      description: t('shieldTxMembershipErrorDeclinedCard', [
        <ButtonLink
          key="update-payment"
          onClick={() => {
            console.log('update payment');
          }}
        >
          {t('shieldTxMembershipErrorUpdatePayment')}
        </ButtonLink>,
      ]),
      severity: BannerAlertSeverity.Danger,
    },
    [MEMBERSHIP_ERROR_STATES.INSUFFICIENT_FUNDS]: {
      description: t('shieldTxMembershipErrorInsufficientFunds', [
        'April 18',
        <ButtonLink
          key="update-payment"
          onClick={() => {
            console.log('update payment');
          }}
        >
          {t('shieldTxMembershipErrorUpdatePayment')}
        </ButtonLink>,
      ]),
      severity: BannerAlertSeverity.Warning,
    },
    [MEMBERSHIP_ERROR_STATES.MEMBERSHIP_ENDING]: {
      description: t('shieldTxMembershipErrorMembershipEnding', [
        'April 18',
        <ButtonLink
          key="renew-now"
          onClick={() => {
            console.log('renew now');
          }}
        >
          {t('shieldTxMembershipErrorRenewNow')}
        </ButtonLink>,
      ]),
      severity: BannerAlertSeverity.Warning,
    },
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
        {loading ? (
          <Skeleton width="50%" height={20} />
        ) : (
          <Text variant={TextVariant.bodyMdMedium}>{label}</Text>
        )}
        {loading ? (
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
        {loading ? (
          <Skeleton width="40%" height={24} />
        ) : (
          <Text variant={TextVariant.bodyMdMedium}>{key}</Text>
        )}
        {loading ? (
          <Skeleton width="30%" height={24} />
        ) : (
          <Text variant={TextVariant.bodyMdMedium}>{value}</Text>
        )}
      </Box>
    );
  };

  const paymentMethod = useMemo(() => {
    if (
      membershipErrorState ===
      MEMBERSHIP_ERROR_STATES.INSUFFICIENT_TOKEN_BALANCE
    ) {
      return (
        <Tooltip
          position="top"
          title={t('shieldTxMembershipErrorInsufficientTokenTooltip')}
        >
          <Box display={Display.Flex} alignItems={AlignItems.center} gap={1}>
            <Icon
              name={IconName.Danger}
              color={IconColor.errorDefault}
              size={IconSize.Md}
            />
            <Text
              variant={TextVariant.bodyMdMedium}
              color={TextColor.errorDefault}
              className="underline"
            >
              {t('shieldTxMembershipErrorInsufficientToken', ['USDT'])}
            </Text>
          </Box>
        </Tooltip>
      );
    }
    if (
      membershipErrorState === MEMBERSHIP_ERROR_STATES.DECLINED_CARD_PAYMENT
    ) {
      return (
        <Tooltip
          position="top"
          title={t('shieldTxMembershipErrorDeclinedCardTooltip')}
        >
          <Box display={Display.Flex} alignItems={AlignItems.center} gap={1}>
            <Icon
              name={IconName.Danger}
              color={IconColor.errorDefault}
              size={IconSize.Md}
            />
            <Text
              variant={TextVariant.bodyMdMedium}
              color={TextColor.errorDefault}
              className="underline"
            >
              {t('shieldTxMembershipErrorUpdateCardDetails')}
            </Text>
          </Box>
        </Tooltip>
      );
    }
    if (membershipErrorState === MEMBERSHIP_ERROR_STATES.INSUFFICIENT_FUNDS) {
      return (
        <Box display={Display.Flex} alignItems={AlignItems.center} gap={1}>
          <Icon
            name={IconName.Danger}
            color={IconColor.warningDefault}
            size={IconSize.Md}
          />
          <Text
            variant={TextVariant.bodyMdMedium}
            color={TextColor.warningDefault}
          >
            USDT
          </Text>
        </Box>
      );
    }
    if (membershipErrorState === MEMBERSHIP_ERROR_STATES.MEMBERSHIP_ENDING) {
      return (
        <Box display={Display.Flex} alignItems={AlignItems.center} gap={1}>
          <Icon
            name={IconName.Danger}
            color={IconColor.warningDefault}
            size={IconSize.Md}
          />
          <Text
            variant={TextVariant.bodyMdMedium}
            color={TextColor.warningDefault}
            className="underline"
          >
            {t('shieldTxMembershipErrorInsufficientToken', ['USDT'])}
          </Text>
        </Box>
      );
    }
    return shieldSubscription &&
      isCryptoPaymentMethod(shieldSubscription.paymentMethod)
      ? shieldSubscription.paymentMethod.crypto.tokenSymbol
      : productInfo?.currency.toUpperCase() || '';
  }, [membershipErrorState, productInfo?.currency, shieldSubscription, t]);

  return (
    <Box
      className="transaction-shield-page"
      data-testid="transaction-shield-page"
      width={BlockSize.Full}
      flexDirection={FlexDirection.Column}
      padding={4}
    >
      {membershipErrorState !== null && (
        <BannerAlert
          severity={membershipErrorDetails[membershipErrorState].severity}
          marginBottom={4}
          descriptionProps={{
            variant: TextVariant.bodySm,
          }}
        >
          {membershipErrorDetails[membershipErrorState].description}
        </BannerAlert>
      )}

      <Box className="transaction-shield-page__container" marginBottom={4}>
        <Box
          className={classnames(
            'transaction-shield-page__row transaction-shield-page__membership',
            {
              'transaction-shield-page__membership--loading': loading,
              'transaction-shield-page__membership--inactive':
                isCancelled && !loading,
              'transaction-shield-page__membership--active':
                !isCancelled && !loading,
            },
          )}
          {...rowsStyleProps}
          alignItems={AlignItems.center}
          justifyContent={JustifyContent.spaceBetween}
        >
          <Box
            width={BlockSize.Full}
            gap={loading ? 2 : 0}
            display={Display.Flex}
            flexDirection={FlexDirection.Column}
          >
            {loading ? (
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
                  {isCancelled
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
              </Box>
            )}
            {loading ? (
              <Skeleton width="60%" height={16} />
            ) : (
              <Text
                variant={TextVariant.bodyXs}
                className="transaction-shield-page__membership-text"
              >
                {t('shieldTxMembershipId')}: {shieldSubscription?.id}
              </Text>
            )}
          </Box>
          {isCancelled ||
            (shieldSubscription?.cancelAtPeriodEnd && (
              <Box>
                <Button
                  data-testid="shield-tx-membership-resubscribe-button"
                  size={ButtonSize.Sm}
                  onClick={() => {
                    executeUnCancelSubscription();
                  }}
                >
                  {t('shieldTxMembershipResubscribe')}
                </Button>
              </Box>
            ))}
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
              {loading ? (
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
                gap={loading ? 2 : 0}
              >
                {loading ? (
                  <Skeleton width="100%" height={18} />
                ) : (
                  <Text variant={TextVariant.bodySmBold}>{detail.title}</Text>
                )}
                {loading ? (
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
        {!isCancelled &&
          buttonRow(t('shieldTxMembershipSubmitCase'), () => {
            // todo: link to submit claim page
          })}
        {!isCancelled &&
          buttonRow(
            t('shieldTxMembershipCancel'),
            () => {
              setIsCancelMembershipModalOpen(true);
            },
            'shield-tx-membership-cancel-button',
          )}
      </Box>

      <Box className="transaction-shield-page__container">
        <Box
          className="transaction-shield-page__row"
          {...rowsStyleProps}
          flexDirection={FlexDirection.Column}
          gap={2}
        >
          {loading ? (
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
                `${getProductPrice(productInfo as Product)} ${productInfo?.currency.toUpperCase()}/${shieldSubscription.interval}`,
              )}
              {isCryptoPayment &&
                billingDetails(
                  t('shieldTxMembershipBillingDetailsBillingAccount'),
                  isCryptoPaymentMethod(shieldSubscription.paymentMethod)
                    ? shieldSubscription.paymentMethod.crypto.payerAddress // payer address for crypto payment method
                    : `${shieldSubscription.paymentMethod.card.brand} - ${shieldSubscription.paymentMethod.card.last4}`, // display card info for card payment method
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
          async () => {
            await executeGetSubscriptionBillingPortalUrl();
          },
        )}
      </Box>
      {isCancelMembershipModalOpen && (
        <CancelMembershipModal
          onClose={() => setIsCancelMembershipModalOpen(false)}
          onConfirm={async () => {
            await executeCancelSubscription();
            setIsCancelMembershipModalOpen(false);
          }}
        />
      )}
    </Box>
  );
};

export default TransactionShield;
