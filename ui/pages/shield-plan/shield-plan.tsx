import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import classnames from 'classnames';
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
import { PAYMENT_METHODS, PaymentMethod } from './types';
import { ShieldPaymentModal } from './shield-payment-modal';

const PLAN_TYPES = {
  ANNUAL: 'annual',
  MONTHLY: 'monthly',
} as const;

type Plan = {
  id: (typeof PLAN_TYPES)[keyof typeof PLAN_TYPES];
  label: string;
  price: string;
};

const ShieldPlan = () => {
  const history = useHistory();
  const t = useI18nContext();

  const [selectedPlan, setSelectedPlan] = useState<Plan['id']>(
    PLAN_TYPES.ANNUAL,
  );

  const handleBack = () => {
    history.goBack();
  };

  const plans: Plan[] = [
    {
      id: PLAN_TYPES.ANNUAL,
      label: 'Annual',
      price: '$80/year',
    },
    {
      id: PLAN_TYPES.MONTHLY,
      label: 'Monthly',
      price: '$8/month',
    },
  ];

  const planDetails = [
    'No charge now, try free for 14 days',
    'Pre-approve membership (default 1 year), with fees charged only on a monthly basis',
    'Secures your assets from risky transactions',
  ];

  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<PaymentMethod>(PAYMENT_METHODS.TOKEN);

  const rowsStyleProps: BoxProps<'div'> = {
    display: Display.Flex,
    justifyContent: JustifyContent.spaceBetween,
    alignItems: AlignItems.center,
    backgroundColor: BackgroundColor.backgroundSection,
    padding: 4,
  };

  return (
    <Page className="shield-plan-page">
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
        Choose your plan
      </Header>
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
                'shield-plan-page__plan--selected': plan.id === selectedPlan,
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
              {plan.id === PLAN_TYPES.ANNUAL && (
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
                    Save 16%
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
            <Text variant={TextVariant.bodyLgMedium}>Pay with</Text>

            <Box display={Display.Flex} gap={2} alignItems={AlignItems.center}>
              {selectedPaymentMethod === PAYMENT_METHODS.TOKEN ? (
                <BadgeWrapper
                  badge={
                    <AvatarNetwork
                      size={AvatarNetworkSize.Xs}
                      name="Avalanche"
                      src="./images/avax-token.svg"
                      borderColor={BorderColor.borderMuted}
                    />
                  }
                >
                  <AvatarToken
                    name="Eth"
                    src="./images/eth_logo.svg"
                    borderColor={BorderColor.borderMuted}
                  />
                </BadgeWrapper>
              ) : (
                <Icon size={IconSize.Xl} name={IconName.Card} />
              )}
              <Text variant={TextVariant.bodyLgMedium}>
                {selectedPaymentMethod === PAYMENT_METHODS.TOKEN
                  ? 'ETH'
                  : 'Card'}
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
              Plan details
            </Text>
            <Box
              display={Display.Flex}
              flexDirection={FlexDirection.Column}
              gap={2}
            >
              {planDetails.map((detail, index) => (
                <Box key={index} display={Display.Flex} gap={2}>
                  <Icon
                    size={IconSize.Sm}
                    name={IconName.Check}
                    color={IconColor.primaryDefault}
                  />
                  <Text variant={TextVariant.bodySm}>{detail}</Text>
                </Box>
              ))}
            </Box>
          </Box>
        </Box>
        <ShieldPaymentModal
          isOpen={showPaymentModal}
          onClose={() => setShowPaymentModal(false)}
          selectedPaymentMethod={selectedPaymentMethod}
          setSelectedPaymentMethod={setSelectedPaymentMethod}
        />
      </Content>
      <Footer
        className="shield-plan-page__footer"
        flexDirection={FlexDirection.Column}
        gap={3}
        backgroundColor={BackgroundColor.backgroundMuted}
      >
        <Button size={ButtonSize.Lg} variant={ButtonVariant.Primary} block>
          {t('continue')}
        </Button>
        <Text
          variant={TextVariant.bodySm}
          color={TextColor.textAlternative}
          textAlign={TextAlign.Center}
        >
          Auto renews for $8/month until canceled
        </Text>
      </Footer>
    </Page>
  );
};

export default ShieldPlan;
