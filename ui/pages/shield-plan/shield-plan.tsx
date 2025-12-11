import React, { useCallback, useEffect, useMemo, useState } from 'react';
import classnames from 'classnames';
import {
  PAYMENT_TYPES,
  PaymentType,
  PRODUCT_TYPES,
  RECURRING_INTERVALS,
  RecurringInterval,
} from '@metamask/subscription-controller';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom-v5-compat';
import { Checkbox, TextVariant } from '@metamask/design-system-react';
import { Hex } from '@metamask/utils';
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
  DEFAULT_ROUTE,
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
  useShieldRewards,
  useUserSubscriptionByProduct,
  useUserSubscriptions,
} from '../../hooks/subscription/useSubscription';
import { useI18nContext } from '../../hooks/useI18nContext';
import { getLastUsedShieldSubscriptionPaymentDetails } from '../../selectors/subscription';
import {
  EntryModalSourceEnum,
  ShieldUnexpectedErrorEventLocationEnum,
  SUBSCRIPTION_DEFAULT_TRIAL_PERIOD_DAYS,
} from '../../../shared/constants/subscriptions';
import {
  isDevOrTestEnvironment,
  isDevOrUatBuild,
  getIsTrialedSubscription,
} from '../../../shared/modules/shield';
import ApiErrorHandler from '../../components/app/api-error-handler';
import { MetaMaskReduxDispatch } from '../../store/store';
import { setLastUsedSubscriptionPaymentDetails } from '../../store/actions';
import { RewardsBadge } from '../../components/app/rewards/RewardsBadge';
import { getIntlLocale } from '../../ducks/locale/locale';
import { ShieldPaymentModal } from './shield-payment-modal';
import { ShieldRewardsModal } from './shield-rewards-modal';
import { Plan } from './types';
import { getProductPrice } from './utils';

const ShieldPlan = () => {
  const navigate = useNavigate();
  const { search } = useLocation();
  const locale = useSelector(getIntlLocale);
  const t = useI18nContext();
  const dispatch = useDispatch<MetaMaskReduxDispatch>();

  const lastUsedPaymentDetails = useSelector(
    getLastUsedShieldSubscriptionPaymentDetails,
  );

  const {
    isRewardsSeason,
    pointsMonthly,
    pointsYearly,
    pending: pendingShieldRewards,
  } = useShieldRewards();

  // Stripe Test clocks
  const [enableStripeTestClock, setEnableStripeTestClock] = useState(
    lastUsedPaymentDetails?.useTestClock ?? false,
  );
  const showTestClocksCheckbox = isDevOrUatBuild() || isDevOrTestEnvironment();

  const {
    subscriptions,
    trialedProducts,
    loading: subscriptionsLoading,
    error: subscriptionsError,
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

  const {
    subscriptionPricing,
    loading: subscriptionPricingLoading,
    error: subscriptionPricingError,
  } = useSubscriptionPricing({
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

  const {
    availableTokenBalances,
    pending: pendingAvailableTokenBalances,
    error: availableTokenBalancesError,
  } = useAvailableTokenBalances({
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
      defaultPaymentChain: availableTokenBalances[0]?.chainId,
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

  const selectedTokenAddress = selectedToken?.address;
  // set default selected payment method to crypto if selected token available
  // should only trigger if selectedTokenAddress change (shouldn't trigger again if selected token object updated but still same token)
  useEffect(() => {
    const lastUsedPaymentMethod = lastUsedPaymentDetails?.type;
    if (
      selectedTokenAddress &&
      lastUsedPaymentMethod !== PAYMENT_TYPES.byCard
    ) {
      setSelectedPaymentMethod(PAYMENT_TYPES.byCrypto);
    } else {
      // should reset to byCard when selectedTokenAddress becomes undefined (no tokens available)
      // to prevent switching to a plan without available tokens leaves selectedPaymentMethod as byCrypto with no tokens
      setSelectedPaymentMethod(PAYMENT_TYPES.byCard);
    }
  }, [selectedTokenAddress, setSelectedPaymentMethod, lastUsedPaymentDetails]);

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

  const claimedRewardsPoints = useMemo(() => {
    const points =
      selectedPlan === RECURRING_INTERVALS.year ? pointsYearly : pointsMonthly;
    return points;
  }, [selectedPlan, pointsYearly, pointsMonthly]);

  const { handleSubscription, subscriptionResult } = useHandleSubscription({
    selectedPaymentMethod,
    selectedToken,
    selectedPlan,
    defaultOptions,
    isTrialed,
    useTestClock: enableStripeTestClock,
    rewardPoints: claimedRewardsPoints ?? undefined,
  });

  const handleUserChangeToken = useCallback(
    async (token: TokenWithApprovalAmount) => {
      setSelectedToken(token);
      // update last used subscription payment details everytime user select token
      await dispatch(
        setLastUsedSubscriptionPaymentDetails(PRODUCT_TYPES.SHIELD, {
          type: PAYMENT_TYPES.byCrypto,
          paymentTokenAddress: token.address as Hex,
          paymentTokenSymbol: token.symbol,
          plan: selectedPlan,
          useTestClock: enableStripeTestClock,
        }),
      );
    },
    [dispatch, selectedPlan, enableStripeTestClock, setSelectedToken],
  );

  const loading =
    subscriptionsLoading ||
    subscriptionPricingLoading ||
    subscriptionResult.pending ||
    pendingShieldRewards;

  const hasApiError =
    subscriptionsError ||
    subscriptionPricingError ||
    availableTokenBalancesError ||
    subscriptionResult.error;

  const plans: Plan[] = useMemo(
    () =>
      pricingPlans
        ?.map((plan) => {
          const isYearly = plan.interval === RECURRING_INTERVALS.year;
          const price = getProductPrice(plan);
          return {
            id: plan.interval,
            label: isYearly
              ? t('shieldPlanAnnual')
              : `${t('shieldPlanMonthly')}${selectedPaymentMethod === PAYMENT_TYPES.byCrypto ? '*' : ''}`,
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
    [pricingPlans, selectedPaymentMethod, t],
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
    details.push(t('shieldPlanDetails2', ['$10k']));
    details.push(t('shieldPlanDetails3'));
    return details;
  }, [t, isTrialed, selectedProductPrice]);

  const planDetailsRewardsText = useMemo(() => {
    const interval =
      selectedPlan === RECURRING_INTERVALS.year ? t('year') : t('month');

    if (!claimedRewardsPoints) {
      return '';
    }

    const formattedPoints = new Intl.NumberFormat(locale).format(
      claimedRewardsPoints,
    );
    return t('shieldPlanDetailsRewards', [formattedPoints, interval]);
  }, [selectedPlan, t, claimedRewardsPoints, locale]);

  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showRewardsModal, setShowRewardsModal] = useState(false);

  const handleBack = () => {
    const source = new URLSearchParams(search).get('source');
    if (source === EntryModalSourceEnum.Settings) {
      // this happens when user is from settings or transaction shield page
      navigate(SETTINGS_ROUTE, { replace: true });
    } else {
      // this happens when user is from homepage or post transaction page
      navigate(DEFAULT_ROUTE, { replace: true });
    }
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
            data-testid="shield-plan-back-button"
          />
        }
      >
        {t('shieldPlanTitle')}
      </Header>
      {loading && !hasApiError && <LoadingScreen />}
      {!loading && hasApiError ? (
        <Content
          justifyContent={JustifyContent.flexStart}
          alignItems={AlignItems.center}
        >
          <ApiErrorHandler
            className="shield-plan-page__error-content"
            error={hasApiError}
            location={ShieldUnexpectedErrorEventLocationEnum.ShieldPlanPage}
          />
        </Content>
      ) : (
        subscriptionPricing && (
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
                      <Text
                        variant={DSTextVariant.headingMd}
                        className="shield-plan-page__plan-price"
                      >
                        {plan.price}
                      </Text>
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
                        <Text variant={DSTextVariant.bodyMd}>{detail}</Text>
                      </Box>
                    ))}
                    {isRewardsSeason && planDetailsRewardsText && (
                      <Box>
                        <RewardsBadge
                          boxClassName="gap-1 px-2 py-0.5 bg-background-muted rounded-lg w-fit"
                          textClassName="font-medium"
                          withPointsSuffix={false}
                          formattedPoints={planDetailsRewardsText}
                          onClick={() => {
                            setShowRewardsModal(true);
                          }}
                        />
                      </Box>
                    )}
                  </Box>
                </Box>
                {selectedPaymentMethod === PAYMENT_TYPES.byCrypto &&
                  selectedPlan === RECURRING_INTERVALS.month && (
                    <Text
                      variant={DSTextVariant.bodySm}
                      color={TextColor.textAlternative}
                      marginTop={4}
                    >
                      * {t('shieldPlanCryptoMonthlyNote')}
                    </Text>
                  )}
              </Box>
              <ShieldPaymentModal
                isOpen={showPaymentModal}
                onClose={() => setShowPaymentModal(false)}
                selectedToken={selectedToken}
                selectedPaymentMethod={selectedPaymentMethod}
                hasStableTokenWithBalance={hasAvailableToken}
                setSelectedPaymentMethod={setSelectedPaymentMethod}
                onAssetChange={handleUserChangeToken}
                availableTokenBalances={availableTokenBalances}
                tokensSupported={tokensSupported}
              />
              <ShieldRewardsModal
                isOpen={showRewardsModal}
                rewardsText={planDetailsRewardsText}
                onClose={() => setShowRewardsModal(false)}
              />
            </Content>
            <Footer
              className="shield-plan-page__footer"
              flexDirection={FlexDirection.Column}
              gap={3}
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
              <Text
                variant={DSTextVariant.bodySm}
                color={TextColor.textAlternative}
                textAlign={TextAlign.Center}
              >
                {selectedPlan === RECURRING_INTERVALS.year
                  ? t('shieldPlanFooterNoteYearly')
                  : t('shieldPlanFooterNoteMonthly')}
              </Text>
            </Footer>
          </>
        )
      )}
    </Page>
  );
};

export default ShieldPlan;
