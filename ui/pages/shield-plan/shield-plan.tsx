import React, { useEffect, useMemo, useState } from 'react';
import classnames from 'classnames';
import {
  PAYMENT_TYPES,
  PaymentType,
  PRODUCT_TYPES,
  RECURRING_INTERVALS,
  RecurringInterval,
} from '@metamask/subscription-controller';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom-v5-compat';
import { Checkbox, TextVariant } from '@metamask/design-system-react';
import {
  CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP,
  NETWORK_TO_NAME_MAP,
} from '../../../shared/constants/network';
import {
  AvatarNetwork,
  AvatarNetworkSize,
  AvatarToken,
  BadgeWrapper,
  Box,
  BoxProps,
  Button,
  ButtonIcon,
  ButtonIconSize,
  ButtonSize,
  ButtonVariant,
  Icon,
  IconName,
  IconSize,
  Text,
} from '../../components/component-library';
import {
  Content,
  Footer,
  Header,
  Page,
} from '../../components/multichain/pages/page';
import LoadingScreen from '../../components/ui/loading-screen';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  BorderColor,
  BorderRadius,
  Display,
  FlexDirection,
  IconColor,
  JustifyContent,
  TextAlign,
  TextColor,
  TextVariant as DSTextVariant,
} from '../../helpers/constants/design-system';
import {
  SETTINGS_ROUTE,
  TRANSACTION_SHIELD_ROUTE,
} from '../../helpers/constants/routes';
import {
  TokenWithApprovalAmount,
  useAvailableTokenBalances,
  useSubscriptionPaymentMethods,
  useSubscriptionPricing,
  useSubscriptionProductPlans,
} from '../../hooks/subscription/useSubscriptionPricing';
import {
  useHandleSubscription,
  useUserSubscriptionByProduct,
  useUserSubscriptions,
} from '../../hooks/subscription/useSubscription';
import { useI18nContext } from '../../hooks/useI18nContext';
import { getLastUsedShieldSubscriptionPaymentDetails } from '../../selectors/subscription';
import { SUBSCRIPTION_DEFAULT_TRIAL_PERIOD_DAYS } from '../../../shared/constants/subscriptions';
import {
  isDevOrTestEnvironment,
  isDevOrUatBuild,
  getIsTrialedSubscription,
} from '../../../shared/modules/shield';
import { ShieldPaymentModal } from './shield-payment-modal';
import { Plan } from './types';
import { getProductPrice } from './utils';

const ShieldPlan = () => {
  const navigate = useNavigate();
  const t = useI18nContext();

  const lastUsedPaymentDetails = useSelector(
    getLastUsedShieldSubscriptionPaymentDetails,
  );

  // Stripe Test clocks
  const [enableStripeTestClock, setEnableStripeTestClock] = useState(
    lastUsedPaymentDetails?.useTestClock ?? false,
  );
  const showTestClocksCheckbox = isDevOrUatBuild() || isDevOrTestEnvironment();

  const {
    subscriptions,
    trialedProducts,
    loading: subscriptionsLoading,
  } = useUserSubscriptions({
    refetch: true, // always fetch latest subscriptions state in shield plan screen
  });
  const shieldSubscription = useUserSubscriptionByProduct(
    PRODUCT_TYPES.SHIELD,
    subscriptions,
  );
  const isTrialed = getIsTrialedSubscription(
    trialedProducts,
    PRODUCT_TYPES.SHIELD,
  );

  useEffect(() => {
    if (shieldSubscription) {
      // redirect to subscription settings page if user already has a subscription
      navigate(TRANSACTION_SHIELD_ROUTE);
    }
  }, [navigate, shieldSubscription]);

  const [selectedPlan, setSelectedPlan] = useState<RecurringInterval>(
    lastUsedPaymentDetails?.plan || RECURRING_INTERVALS.year,
  );

  const { subscriptionPricing, loading: subscriptionPricingLoading } =
    useSubscriptionPricing({
      refetch: true, // always fetch latest price
    });

  const pricingPlans = useSubscriptionProductPlans(
    PRODUCT_TYPES.SHIELD,
    subscriptionPricing,
  );
  const cryptoPaymentMethod = useSubscriptionPaymentMethods(
    'crypto' as PaymentType,
    subscriptionPricing,
  );

  const selectedProductPrice = useMemo(() => {
    return pricingPlans?.find((plan) => plan.interval === selectedPlan);
  }, [pricingPlans, selectedPlan]);

  const { availableTokenBalances, pending: pendingAvailableTokenBalances } =
    useAvailableTokenBalances({
      paymentChains: cryptoPaymentMethod?.chains,
      price: selectedProductPrice,
      productType: PRODUCT_TYPES.SHIELD,
    });
  const hasAvailableToken = availableTokenBalances.length > 0;
  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<PaymentType>(() => {
      // always default to card if no token is available
      if (!hasAvailableToken) {
        return PAYMENT_TYPES.byCard;
      }
      if (lastUsedPaymentDetails?.type) {
        return lastUsedPaymentDetails.type;
      }
      return PAYMENT_TYPES.byCrypto;
    });
  // default options for the new subscription request
  const defaultOptions = useMemo(() => {
    const paymentType =
      availableTokenBalances.length > 0
        ? PAYMENT_TYPES.byCrypto
        : PAYMENT_TYPES.byCard;
    const paymentCurrency = availableTokenBalances[0]?.symbol || 'USD';
    return {
      defaultPaymentType: paymentType,
      defaultPaymentCurrency: paymentCurrency,
      defaultBillingInterval: RECURRING_INTERVALS.year,
    };
  }, [availableTokenBalances]);

  const [selectedToken, setSelectedToken] = useState<
    TokenWithApprovalAmount | undefined
  >(() => {
    return availableTokenBalances[0];
  });

  // set selected token to the first available token if no token is selected
  useEffect(() => {
    if (
      pendingAvailableTokenBalances ||
      selectedToken ||
      availableTokenBalances.length === 0
    ) {
      return;
    }

    const lastUsedPaymentToken = lastUsedPaymentDetails?.paymentTokenAddress;
    const lastUsedPaymentMethod = lastUsedPaymentDetails?.type;
    const lastUsedPaymentPlan = lastUsedPaymentDetails?.plan;

    let lastUsedSelectedToken = availableTokenBalances[0];
    if (
      lastUsedPaymentToken &&
      lastUsedPaymentMethod === PAYMENT_TYPES.byCrypto &&
      lastUsedPaymentPlan === selectedPlan
    ) {
      lastUsedSelectedToken =
        availableTokenBalances.find(
          (token) => token.address === lastUsedPaymentToken,
        ) || availableTokenBalances[0];
    }

    setSelectedToken(lastUsedSelectedToken);
  }, [
    pendingAvailableTokenBalances,
    availableTokenBalances,
    selectedToken,
    setSelectedToken,
    lastUsedPaymentDetails,
    selectedPlan,
  ]);

  // reset selected token if selected plan changes
  useEffect(() => {
    setSelectedToken(undefined);
  }, [selectedPlan, setSelectedToken]);

  // set default selected payment method to crypto if selected token available
  useEffect(() => {
    const lastUsedPaymentMethod = lastUsedPaymentDetails?.type;
    // if the last used payment method is not crypto, don't set default method
    if (selectedToken && lastUsedPaymentMethod !== PAYMENT_TYPES.byCard) {
      setSelectedPaymentMethod(PAYMENT_TYPES.byCrypto);
    }
  }, [selectedToken, setSelectedPaymentMethod, lastUsedPaymentDetails]);

  const tokensSupported = useMemo(() => {
    const chainsAndTokensSupported = cryptoPaymentMethod?.chains ?? [];

    return [
      ...new Set(
        chainsAndTokensSupported.flatMap((chain) =>
          chain.tokens.map((token) => token.symbol),
        ),
      ),
    ];
  }, [cryptoPaymentMethod?.chains]);

  const { handleSubscription, subscriptionResult } = useHandleSubscription({
    selectedPaymentMethod,
    selectedToken,
    selectedPlan,
    defaultOptions,
    isTrialed,
    useTestClock: enableStripeTestClock,
  });

  const loading =
    subscriptionsLoading ||
    subscriptionPricingLoading ||
    subscriptionResult.pending;

  const plans: Plan[] = useMemo(
    () =>
      pricingPlans
        ?.map((plan) => {
          const isYearly = plan.interval === RECURRING_INTERVALS.year;
          const price = getProductPrice(plan);
          return {
            id: plan.interval,
            label: t(isYearly ? 'shieldPlanAnnual' : 'shieldPlanMonthly'),
            price: t(
              isYearly ? 'shieldPlanAnnualPrice' : 'shieldPlanMonthlyPrice',
              [`$${price}`],
            ),
          };
        })
        .sort((a, _b) =>
          // sort by year first
          a.id === RECURRING_INTERVALS.year ? -1 : 1,
        ) ?? [],
    [pricingPlans, t],
  );

  const planDetails = useMemo(() => {
    const details = [];
    if (!isTrialed) {
      details.push(
        t('shieldPlanDetails1', [
          selectedProductPrice?.trialPeriodDays ??
            SUBSCRIPTION_DEFAULT_TRIAL_PERIOD_DAYS,
        ]),
      );
    }

    let planDetails2 = t('shieldPlanDetails2Card');
    if (selectedPaymentMethod === PAYMENT_TYPES.byCrypto) {
      planDetails2 =
        selectedPlan === RECURRING_INTERVALS.year
          ? t('shieldPlanDetails2CryptoYear')
          : t('shieldPlanDetails2CryptoMonth');
    }
    details.push(planDetails2);
    if (selectedPlan === RECURRING_INTERVALS.month) {
      details.push(t('shieldPlanDetails3'));
    }
    return details;
  }, [t, selectedPaymentMethod, isTrialed, selectedProductPrice, selectedPlan]);

  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const handleBack = () => {
    // transaction shield settings page has guard to redirect to current shield plan page if there is no subscription
    // which create a loop so we just back to settings page
    navigate(SETTINGS_ROUTE, { replace: true });
  };

  const rowsStyleProps: BoxProps<'div'> = {
    display: Display.Flex,
    justifyContent: JustifyContent.spaceBetween,
    alignItems: AlignItems.center,
    backgroundColor: BackgroundColor.backgroundSection,
    padding: 4,
  };

  return (
    <Page className="shield-plan-page" data-testid="shield-plan-page">
      <Header
        textProps={{
          variant: DSTextVariant.headingSm,
        }}
        startAccessory={
          <ButtonIcon
            size={ButtonIconSize.Md}
            ariaLabel={t('back')}
            iconName={IconName.ArrowLeft}
            onClick={handleBack}
          />
        }
      >
        {t('shieldPlanTitle')}
      </Header>
      {loading && <LoadingScreen />}
      {subscriptionPricing && (
        <>
          <Content>
            <Box
              display={Display.Grid}
              gap={2}
              marginBottom={4}
              paddingTop={2}
              className="shield-plan-page__plans"
            >
              {plans.map((plan) => (
                <Box
                  as="button"
                  key={plan.id}
                  {...rowsStyleProps}
                  borderRadius={BorderRadius.LG}
                  paddingTop={2}
                  paddingBottom={2}
                  gap={4}
                  className={classnames('shield-plan-page__plan', {
                    'shield-plan-page__plan--selected':
                      plan.id === selectedPlan,
                  })}
                  data-testid={`shield-plan-${plan.label.toLowerCase()}-button`}
                  onClick={() => setSelectedPlan(plan.id)}
                >
                  <div className="shield-plan-page__radio" />
                  <Box
                    textAlign={TextAlign.Left}
                    className="shield-plan-page__radio-label"
                  >
                    <Text variant={DSTextVariant.bodySm}>{plan.label}</Text>
                    <Text variant={DSTextVariant.headingMd}>{plan.price}</Text>
                  </Box>
                  {plan.id === RECURRING_INTERVALS.year && (
                    <Box
                      display={Display.Flex}
                      alignItems={AlignItems.center}
                      justifyContent={JustifyContent.center}
                      paddingInline={2}
                      borderRadius={BorderRadius.SM}
                      className="shield-plan-page__save-badge"
                    >
                      <Text
                        variant={DSTextVariant.bodyXsMedium}
                        color={TextColor.iconInverse}
                      >
                        {t('shieldPlanSave')}
                      </Text>
                    </Box>
                  )}
                </Box>
              ))}
            </Box>
            <Box className="shield-plan-page__group" marginBottom={4}>
              <Box
                as="button"
                className="shield-plan-page__row"
                {...rowsStyleProps}
                onClick={() => setShowPaymentModal(true)}
                width={BlockSize.Full}
              >
                <Text variant={DSTextVariant.bodyLgMedium}>
                  {t('shieldPlanPayWith')}
                </Text>

                <Box
                  display={Display.Flex}
                  gap={2}
                  alignItems={AlignItems.center}
                >
                  {selectedPaymentMethod === PAYMENT_TYPES.byCrypto &&
                  selectedToken ? (
                    <BadgeWrapper
                      badge={
                        <AvatarNetwork
                          size={AvatarNetworkSize.Xs}
                          name={
                            NETWORK_TO_NAME_MAP[
                              selectedToken.chainId as keyof typeof NETWORK_TO_NAME_MAP
                            ]
                          }
                          src={
                            CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[
                              selectedToken.chainId
                            ]
                          }
                          borderColor={BorderColor.borderMuted}
                        />
                      }
                    >
                      <AvatarToken
                        name={selectedToken?.symbol || ''}
                        src={selectedToken?.image || ''}
                        borderColor={BorderColor.borderMuted}
                      />
                    </BadgeWrapper>
                  ) : (
                    <Icon size={IconSize.Xl} name={IconName.Card} />
                  )}
                  <Text variant={DSTextVariant.bodyLgMedium}>
                    {selectedPaymentMethod === PAYMENT_TYPES.byCrypto
                      ? selectedToken?.symbol || ''
                      : t('shieldPlanCard')}
                  </Text>
                  <Icon size={IconSize.Md} name={IconName.ArrowDown} />
                </Box>
              </Box>
            </Box>
            <Box className="shield-plan-page__group">
              <Box
                className="shield-plan-page__row"
                {...rowsStyleProps}
                display={Display.Block}
              >
                <Text variant={DSTextVariant.bodyLgMedium} marginBottom={4}>
                  {t('shieldPlanDetails')}
                </Text>
                <Box
                  display={Display.Flex}
                  flexDirection={FlexDirection.Column}
                  gap={2}
                >
                  {planDetails.map((detail, index) => (
                    <Box key={index} display={Display.Flex} gap={2}>
                      <Box
                        display={Display.Flex}
                        alignItems={AlignItems.center}
                        style={{ height: '1lh' }}
                      >
                        <Icon
                          size={IconSize.Sm}
                          name={IconName.Check}
                          color={IconColor.primaryDefault}
                        />
                      </Box>
                      <Text variant={DSTextVariant.bodySm}>{detail}</Text>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>
            <ShieldPaymentModal
              isOpen={showPaymentModal}
              onClose={() => setShowPaymentModal(false)}
              selectedToken={selectedToken}
              selectedPaymentMethod={selectedPaymentMethod}
              hasStableTokenWithBalance={hasAvailableToken}
              setSelectedPaymentMethod={setSelectedPaymentMethod}
              onAssetChange={setSelectedToken}
              availableTokenBalances={availableTokenBalances}
              tokensSupported={tokensSupported}
            />
          </Content>
          <Footer
            className="shield-plan-page__footer"
            flexDirection={FlexDirection.Column}
            backgroundColor={BackgroundColor.backgroundMuted}
          >
            {showTestClocksCheckbox && (
              <Checkbox
                label="Enable Stripe Test clocks (for development and testing only)"
                labelProps={{
                  variant: TextVariant.BodySm,
                }}
                onChange={() =>
                  setEnableStripeTestClock(!enableStripeTestClock)
                }
                id="stripe-test-clocks"
                isSelected={enableStripeTestClock}
              />
            )}
            <Button
              size={ButtonSize.Lg}
              variant={ButtonVariant.Primary}
              block
              onClick={handleSubscription}
              data-testid="shield-plan-continue-button"
            >
              {t('continue')}
            </Button>
          </Footer>
        </>
      )}
    </Page>
  );
};

export default ShieldPlan;
