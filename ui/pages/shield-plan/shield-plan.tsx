import log from 'loglevel';
import React, { useEffect, useMemo, useState } from 'react';
import classnames from 'classnames';
import {
  PAYMENT_TYPES,
  PaymentType,
  ProductType,
  RECURRING_INTERVALS,
  RecurringInterval,
} from '@metamask/subscription-controller';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom-v5-compat';
import {
  Content,
  Footer,
  Header,
  Page,
} from '../../components/multichain/pages/page';
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
  TextVariant,
} from '../../helpers/constants/design-system';
import {
  ButtonIconSize,
  ButtonIcon,
  IconName,
  Box,
  Text,
  BoxProps,
  BadgeWrapper,
  AvatarNetwork,
  AvatarNetworkSize,
  AvatarToken,
  Icon,
  IconSize,
  ButtonSize,
  ButtonVariant,
  Button,
} from '../../components/component-library';
import { useI18nContext } from '../../hooks/useI18nContext';

import {
  CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP,
  NETWORK_TO_NAME_MAP,
} from '../../../shared/constants/network';
import LoadingScreen from '../../components/ui/loading-screen';
import {
  TokenWithApprovalAmount,
  useAvailableTokenBalances,
  useSubscriptionPaymentMethods,
  useSubscriptionPricing,
  useSubscriptionProductPlans,
} from '../../hooks/subscription/useSubscriptionPricing';
import { startSubscriptionWithCard } from '../../store/actions';
import {
  useUserSubscriptionByProduct,
  useUserSubscriptions,
} from '../../hooks/subscription/useSubscription';
import { TRANSACTION_SHIELD_ROUTE } from '../../helpers/constants/routes';
import { useAsyncCallback } from '../../hooks/useAsync';
import { ShieldPaymentModal } from './shield-payment-modal';
import { Plan } from './types';
import { getProductPrice } from './utils';

const ShieldPlan = () => {
  const navigate = useNavigate();
  const t = useI18nContext();
  const dispatch = useDispatch();

  const {
    subscriptions,
    loading: subscriptionsLoading,
    error: subscriptionsError,
  } = useUserSubscriptions();
  const shieldSubscription = useUserSubscriptionByProduct(
    'shield' as ProductType,
    subscriptions,
  );

  useEffect(() => {
    if (shieldSubscription) {
      // redirect to subscription settings page if user already has a subscription
      navigate(TRANSACTION_SHIELD_ROUTE);
    }
  }, [navigate, shieldSubscription]);

  const [selectedPlan, setSelectedPlan] = useState<RecurringInterval>(
    RECURRING_INTERVALS.year,
  );

  const {
    subscriptionPricing,
    loading: subscriptionPricingLoading,
    error: subscriptionPricingError,
  } = useSubscriptionPricing();

  const pricingPlans = useSubscriptionProductPlans(
    'shield' as ProductType,
    subscriptionPricing,
  );
  const cryptoPaymentMethod = useSubscriptionPaymentMethods(
    'crypto' as PaymentType,
    subscriptionPricing,
  );

  const selectedProductPrice = useMemo(() => {
    return pricingPlans?.find((plan) => plan.interval === selectedPlan);
  }, [pricingPlans, selectedPlan]);

  const availableTokenBalances = useAvailableTokenBalances({
    paymentChains: cryptoPaymentMethod?.chains,
    price: selectedProductPrice,
  });
  const hasAvailableToken = availableTokenBalances.length > 0;

  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<PaymentType>(
      hasAvailableToken ? PAYMENT_TYPES.byCrypto : PAYMENT_TYPES.byCard,
    );

  const [selectedToken, setSelectedToken] = useState<
    TokenWithApprovalAmount | undefined
  >(() => {
    return availableTokenBalances[0];
  });

  const [handleContinue, continueResult] = useAsyncCallback(async () => {
    try {
      if (selectedPaymentMethod === PAYMENT_TYPES.byCard) {
        await dispatch(
          startSubscriptionWithCard({
            products: ['shield' as ProductType],
            isTrialRequested: true,
            recurringInterval: selectedPlan,
          }),
        );
      } else {
        log.error('Crypto payment method is not supported at the moment');
      }
    } catch (err) {
      log.error('Error starting subscription', err);
    }
  }, []);

  const loading =
    subscriptionsLoading ||
    subscriptionPricingLoading ||
    continueResult.pending;
  const error =
    subscriptionsError || subscriptionPricingError || continueResult.error;

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
  const selectedPlanData = plans.find((plan) => plan.id === selectedPlan);

  const planDetails = [
    t('shieldPlanDetails1'),
    t(
      selectedPaymentMethod === PAYMENT_TYPES.byCrypto
        ? 'shieldPlanDetails2'
        : 'shieldPlanDetails2Card',
    ),
    t('shieldPlanDetails3'),
  ];

  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const handleBack = () => {
    navigate(-1);
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
          variant: TextVariant.headingSm,
        }}
        startAccessory={
          <ButtonIcon
            size={ButtonIconSize.Sm}
            ariaLabel={t('back')}
            iconName={IconName.ArrowLeft}
            onClick={handleBack}
          />
        }
      >
        {t('shieldPlanTitle')}
      </Header>
      {error && <Text variant={TextVariant.bodySm}>{error.message}</Text>}
      {loading && <LoadingScreen />}
      {subscriptionPricing && (
        <>
          <Content>
            <Box
              display={Display.Grid}
              gap={2}
              marginBottom={4}
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
                  onClick={() => setSelectedPlan(plan.id)}
                >
                  <div className="shield-plan-page__radio" />
                  <Box
                    textAlign={TextAlign.Left}
                    className="shield-plan-page__radio-label"
                  >
                    <Text variant={TextVariant.bodySm}>{plan.label}</Text>
                    <Text variant={TextVariant.headingMd}>{plan.price}</Text>
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
                        variant={TextVariant.bodyXs}
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
                <Text variant={TextVariant.bodyLgMedium}>
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
                  <Text variant={TextVariant.bodyLgMedium}>
                    {selectedPaymentMethod === PAYMENT_TYPES.byCrypto
                      ? selectedToken?.symbol || ''
                      : t('shieldPlanCard')}
                  </Text>
                  <Icon size={IconSize.Md} name={IconName.ArrowRight} />
                </Box>
              </Box>
            </Box>
            <Box className="shield-plan-page__group">
              <Box
                className="shield-plan-page__row"
                {...rowsStyleProps}
                display={Display.Block}
              >
                <Text variant={TextVariant.bodyLgMedium} marginBottom={4}>
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
                      <Text variant={TextVariant.bodySm}>{detail}</Text>
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>
            <ShieldPaymentModal
              isOpen={showPaymentModal}
              onClose={() => setShowPaymentModal(false)}
              selectedToken={selectedToken ?? undefined}
              selectedPaymentMethod={selectedPaymentMethod}
              hasStableTokenWithBalance={hasAvailableToken}
              setSelectedPaymentMethod={setSelectedPaymentMethod}
              onAssetChange={setSelectedToken}
              availableTokenBalances={availableTokenBalances}
            />
          </Content>
          <Footer
            className="shield-plan-page__footer"
            flexDirection={FlexDirection.Column}
            gap={3}
            backgroundColor={BackgroundColor.backgroundMuted}
          >
            <Button
              size={ButtonSize.Lg}
              variant={ButtonVariant.Primary}
              block
              onClick={handleContinue}
            >
              {t('continue')}
            </Button>
            <Text
              variant={TextVariant.bodySm}
              color={TextColor.textAlternative}
              textAlign={TextAlign.Center}
            >
              {t('shieldPlanAutoRenew', [selectedPlanData?.price])}
            </Text>
          </Footer>
        </>
      )}
    </Page>
  );
};

export default ShieldPlan;
