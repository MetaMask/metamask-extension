import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  PAYMENT_TYPES,
  PaymentType,
  PRODUCT_TYPES,
  RECURRING_INTERVALS,
  RecurringInterval,
} from '@metamask/subscription-controller';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  BadgeWrapper,
  Box,
  Button,
  ButtonIcon,
  ButtonIconSize,
  ButtonSize,
  ButtonVariant,
  Checkbox,
  FontWeight,
  Icon,
  IconColor,
  IconName,
  IconSize,
  Text,
  TextColor,
  TextVariant,
  twMerge,
} from '@metamask/design-system-react';
import { Hex } from '@metamask/utils';
import log from 'loglevel';
import {
  CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP,
  NETWORK_TO_NAME_MAP,
} from '../../../../shared/constants/network';
import {
  AvatarNetwork,
  AvatarNetworkSize,
  AvatarToken,
} from '../../../components/component-library';
import {
  Content,
  Footer,
  Header,
  Page,
} from '../../../components/multichain/pages/page';
import LoadingScreen from '../../../components/ui/loading-screen';
import {
  AlignItems,
  BackgroundColor,
  BorderColor,
  FlexDirection,
  JustifyContent,
  TextVariant as OldTextVariant,
} from '../../../helpers/constants/design-system';
import {
  DEFAULT_ROUTE,
  SETTINGS_ROUTE,
  SHIELD_PLAN_ROUTE,
  TRANSACTION_SHIELD_ROUTE,
} from '../../../helpers/constants/routes';
import {
  TokenWithApprovalAmount,
  useAvailableTokenBalances,
  useSubscriptionPaymentMethods,
  useSubscriptionPricing,
  useSubscriptionProductPlans,
} from '../../../hooks/subscription/useSubscriptionPricing';
import {
  useHandleSubscription,
  useShieldRewards,
  useSubscriptionError,
  useUserSubscriptionByProduct,
  useUserSubscriptions,
} from '../../../hooks/subscription/useSubscription';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getLastUsedShieldSubscriptionPaymentDetails } from '../../../selectors/subscription';
import {
  ShieldMetricsSourceEnum,
  ShieldUnexpectedErrorEventLocationEnum,
  SUBSCRIPTION_DEFAULT_TRIAL_PERIOD_DAYS,
} from '../../../../shared/constants/subscriptions';
import {
  isDevOrTestEnvironment,
  isDevOrUatBuild,
  getIsTrialedSubscription,
} from '../../../../shared/lib/shield';
import ApiErrorHandler from '../../../components/app/api-error-handler';
import type { MetaMaskReduxDispatch } from '../../../store/types';
import { useDispatch } from '../../../store/hooks';
import {
  setLastUsedSubscriptionPaymentDetails,
  setPendingRedirectRoute,
} from '../../../store/actions';
import { RewardsBadge } from '../../../components/app/rewards/RewardsBadge';
import { getIntlLocale } from '../../../ducks/locale/locale';
import { getPendingRedirectRoute } from '../../../selectors';
import { PendingRedirectRoute } from '../../../../shared/lib/pending-redirect-state';
import { ShieldPaymentModal } from './shield-payment-modal';
import { ShieldRewardsModal } from './shield-rewards-modal';
import { Plan } from './types';
import { getProductPrice } from './utils';

const ShieldPlan = () => {
  const navigate = useNavigate();
  const { search } = useLocation();
  const locale = useSelector(getIntlLocale);
  const t = useI18nContext();
  const dispatch = useDispatch();

  const lastUsedPaymentDetails = useSelector(
    getLastUsedShieldSubscriptionPaymentDetails,
  );

  const pendingRedirectRoute = useSelector(
    getPendingRedirectRoute,
  ) as PendingRedirectRoute | null;

  const { shieldSubscriptionApiError, getSubscriptionErrorMessage } =
    useSubscriptionError();

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

  // Token selection is keyed by plan so a plan change drops the prior token
  // without render-phase setState; a default is derived when none is chosen.
  const [tokenState, setTokenState] = useState<{
    plan: RecurringInterval;
    token: TokenWithApprovalAmount | undefined;
    userSelected: boolean;
  }>(() => ({
    plan: selectedPlan,
    token: availableTokenBalances[0],
    userSelected: false,
  }));

  const defaultSelectedToken = useMemo(() => {
    if (pendingAvailableTokenBalances || availableTokenBalances.length === 0) {
      return undefined;
    }
    const lastUsedPaymentToken = lastUsedPaymentDetails?.paymentTokenAddress;
    const lastUsedPaymentMethod = lastUsedPaymentDetails?.type;
    const lastUsedPaymentPlan = lastUsedPaymentDetails?.plan;
    if (
      lastUsedPaymentToken &&
      lastUsedPaymentMethod === PAYMENT_TYPES.byCrypto &&
      lastUsedPaymentPlan === selectedPlan
    ) {
      return (
        availableTokenBalances.find(
          (token) => token.address === lastUsedPaymentToken,
        ) || availableTokenBalances[0]
      );
    }
    return availableTokenBalances[0];
  }, [
    availableTokenBalances,
    lastUsedPaymentDetails,
    pendingAvailableTokenBalances,
    selectedPlan,
  ]);

  let selectedToken = defaultSelectedToken;
  if (tokenState.plan === selectedPlan) {
    selectedToken = tokenState.userSelected
      ? tokenState.token
      : (tokenState.token ?? defaultSelectedToken);
  }

  const setSelectedToken = useCallback(
    (token: TokenWithApprovalAmount | undefined) => {
      setTokenState({
        plan: selectedPlan,
        token,
        userSelected: true,
      });
    },
    [selectedPlan],
  );

  const selectedTokenAddress = selectedToken?.address;

  // Track if initial payment method selection has been done
  // This prevents auto-switching after payment cancel/failure when cache is cleared.
  const [hasInitializedPaymentMethod, setHasInitializedPaymentMethod] =
    useState(false);
  const [paymentMethodLocal, setPaymentMethodLocal] = useState<PaymentType>(
    () => {
      if (!hasAvailableToken) {
        return PAYMENT_TYPES.byCard;
      }
      if (lastUsedPaymentDetails?.type) {
        return lastUsedPaymentDetails.type;
      }
      return PAYMENT_TYPES.byCrypto;
    },
  );

  // Derive payment method from token availability until the user starts checkout;
  // after that, keep the local choice unless tokens disappear.
  let selectedPaymentMethod: PaymentType = PAYMENT_TYPES.byCard;
  if (selectedTokenAddress) {
    if (hasInitializedPaymentMethod) {
      selectedPaymentMethod = paymentMethodLocal;
    } else if (lastUsedPaymentDetails?.type !== PAYMENT_TYPES.byCard) {
      selectedPaymentMethod = PAYMENT_TYPES.byCrypto;
    }
  }

  const setSelectedPaymentMethod = useCallback((method: PaymentType) => {
    setPaymentMethodLocal(method);
  }, []);

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

  const onStartSubscription = useCallback(() => {
    setPaymentMethodLocal(selectedPaymentMethod);
    // set flag to prevent auto-switching payment method after payment cancel/failure
    setHasInitializedPaymentMethod(true);

    handleSubscription();
  }, [handleSubscription, selectedPaymentMethod]);

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
    subscriptionResult.error ||
    shieldSubscriptionApiError;

  const apiErrorMessage = getSubscriptionErrorMessage(hasApiError);

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

  const handleBack = async () => {
    // Clear pending redirect when user intentionally leaves this page.
    if (pendingRedirectRoute?.path.includes(SHIELD_PLAN_ROUTE)) {
      try {
        await dispatch(setPendingRedirectRoute(null));
      } catch (error) {
        log.error('[shield plan] clear pending redirect error', error);
      }
    }

    const source = new URLSearchParams(search).get('source');
    if (source === ShieldMetricsSourceEnum.Settings) {
      // this happens when user is from settings or transaction shield page
      navigate(SETTINGS_ROUTE, { replace: true });
    } else if (source === ShieldMetricsSourceEnum.ShieldSettings) {
      // this happens when user is from shield management page
      navigate(TRANSACTION_SHIELD_ROUTE, { replace: true });
    } else {
      // this happens when user is from homepage or post transaction page
      navigate(DEFAULT_ROUTE, { replace: true });
    }
  };

  const boxRowClassName = 'flex justify-between items-center p-4 bg-section';

  return (
    <Page className="shield-plan-page" data-testid="shield-plan-page">
      <Header
        textProps={{
          variant: OldTextVariant.headingSm,
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
            message={apiErrorMessage} // show the subscription error message if available
          />
        </Content>
      ) : (
        subscriptionPricing && (
          <>
            <Content>
              <Box className="shield-plan-page__plans grid gap-2 mb-4 pt-2">
                {plans.map((plan) => (
                  <Box
                    asChild
                    key={plan.id}
                    className={twMerge(
                      boxRowClassName,
                      'shield-plan-page__plan rounded-lg',
                      plan.id === selectedPlan &&
                        'shield-plan-page__plan--selected',
                    )}
                    data-testid={`shield-plan-${plan.label.toLowerCase()}-button`}
                    onClick={() => setSelectedPlan(plan.id)}
                  >
                    <button>
                      <div className="shield-plan-page__radio" />
                      <Box className="shield-plan-page__radio-label text-left">
                        <Text variant={TextVariant.BodySm}>{plan.label}</Text>
                        <Text
                          variant={TextVariant.HeadingMd}
                          className="shield-plan-page__plan-price"
                        >
                          {plan.price}
                        </Text>
                      </Box>
                      {plan.id === RECURRING_INTERVALS.year && (
                        <Box className="shield-plan-page__save-badge flex items-center justify-center px-2">
                          <Text
                            variant={TextVariant.BodyXs}
                            fontWeight={FontWeight.Medium}
                            color={TextColor.InfoInverse}
                          >
                            {t('shieldPlanSave')}
                          </Text>
                        </Box>
                      )}
                    </button>
                  </Box>
                ))}
              </Box>
              <Box className="shield-plan-page__group" marginBottom={4}>
                <Box
                  asChild
                  className={twMerge(
                    boxRowClassName,
                    'shield-plan-page__row w-full',
                  )}
                  onClick={() => setShowPaymentModal(true)}
                >
                  <button>
                    <Text
                      variant={TextVariant.BodyLg}
                      fontWeight={FontWeight.Medium}
                    >
                      {t('shieldPlanPayWith')}
                    </Text>

                    <Box className="flex items-center gap-2">
                      {selectedPaymentMethod === PAYMENT_TYPES.byCrypto &&
                      selectedToken ? (
                        <Box className="flex items-center gap-2">
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
                        </Box>
                      ) : (
                        <Icon size={IconSize.Xl} name={IconName.Card} />
                      )}
                      <Text
                        variant={TextVariant.BodyLg}
                        fontWeight={FontWeight.Medium}
                      >
                        {selectedPaymentMethod === PAYMENT_TYPES.byCrypto
                          ? selectedToken?.symbol || ''
                          : t('shieldPlanCard')}
                      </Text>
                      <Icon size={IconSize.Md} name={IconName.ArrowDown} />
                    </Box>
                  </button>
                </Box>
              </Box>
              <Box className="shield-plan-page__group">
                <Box
                  className={twMerge(
                    boxRowClassName,
                    'shield-plan-page__row block',
                  )}
                >
                  <Text
                    variant={TextVariant.BodyLg}
                    fontWeight={FontWeight.Medium}
                    className="mb-4"
                  >
                    {t('shieldPlanDetails')}
                  </Text>
                  <Box className="flex flex-col gap-2">
                    {planDetails.map((detail, index) => (
                      <Box key={index} className="flex gap-2">
                        <Box
                          className="flex items-center"
                          style={{ height: '1lh' }}
                        >
                          <Icon
                            size={IconSize.Sm}
                            name={IconName.Check}
                            color={IconColor.PrimaryDefault}
                          />
                        </Box>
                        <Text variant={TextVariant.BodyMd}>{detail}</Text>
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
                      variant={TextVariant.BodySm}
                      color={TextColor.TextAlternative}
                      className="mt-4"
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
                isFullWidth
                onClick={onStartSubscription}
                data-testid="shield-plan-continue-button"
              >
                {t('continue')}
              </Button>
              <Text
                variant={TextVariant.BodySm}
                color={TextColor.TextAlternative}
                className="text-center"
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
