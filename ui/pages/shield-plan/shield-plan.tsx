import React, { useMemo, useState } from 'react';
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

import { useMultichainBalances } from '../../hooks/useMultichainBalances';
import {
  CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP,
  CHAIN_IDS,
  NETWORK_TO_NAME_MAP,
} from '../../../shared/constants/network';
import {
  AssetWithDisplayData,
  ERC20Asset,
  NativeAsset,
} from '../../components/multichain/asset-picker-amount/asset-picker-modal/types';
import { ShieldPaymentModal } from './shield-payment-modal';
import {
  PAYMENT_METHODS,
  PaymentMethod,
  Plan,
  PLAN_TYPES,
  SHIELD_PLAN_PRICES,
  SUPPORTED_STABLE_TOKENS,
} from './types';

const ShieldPlan = () => {
  const history = useHistory();
  const t = useI18nContext();

  // Get multichain balances to filter tokens with balance
  const { assetsWithBalance: multichainTokensWithBalance } =
    useMultichainBalances();

  const hasStableTokenWithBalance = useMemo(() => {
    return multichainTokensWithBalance.some((token) =>
      SUPPORTED_STABLE_TOKENS.includes(token.symbol),
    );
  }, [multichainTokensWithBalance]);

  const [selectedPlan, setSelectedPlan] = useState<Plan['id']>(
    PLAN_TYPES.ANNUAL,
  );

  const [selectedPaymentMethod, setSelectedPaymentMethod] =
    useState<PaymentMethod>(
      hasStableTokenWithBalance ? PAYMENT_METHODS.TOKEN : PAYMENT_METHODS.CARD,
    );

  const [selectedToken, setSelectedToken] = useState<
    AssetWithDisplayData<ERC20Asset> | AssetWithDisplayData<NativeAsset> | null
  >(() => {
    const stableToken = multichainTokensWithBalance.find((token) =>
      SUPPORTED_STABLE_TOKENS.includes(token.symbol),
    );
    return stableToken
      ? (stableToken as
          | AssetWithDisplayData<ERC20Asset>
          | AssetWithDisplayData<NativeAsset>)
      : null;
  });

  const handleBack = () => {
    history.goBack();
  };

  const plans: Plan[] = [
    {
      id: PLAN_TYPES.ANNUAL,
      label: t('shieldPlanAnnual'),
      price: t('shieldPlanAnnualPrice', [SHIELD_PLAN_PRICES.ANNUAL]),
    },
    {
      id: PLAN_TYPES.MONTHLY,
      label: t('shieldPlanMonthly'),
      price: t('shieldPlanMonthlyPrice', [SHIELD_PLAN_PRICES.MONTHLY]),
    },
  ];

  const planDetails = [
    t('shieldPlanDetails1'),
    t(
      selectedPaymentMethod === PAYMENT_METHODS.TOKEN
        ? 'shieldPlanDetails2'
        : 'shieldPlanDetails2Card',
    ),
    t('shieldPlanDetails3'),
  ];

  const [showPaymentModal, setShowPaymentModal] = useState(false);

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

            <Box display={Display.Flex} gap={2} alignItems={AlignItems.center}>
              {selectedPaymentMethod === PAYMENT_METHODS.TOKEN ? (
                <BadgeWrapper
                  badge={
                    <AvatarNetwork
                      size={AvatarNetworkSize.Xs}
                      name={NETWORK_TO_NAME_MAP[CHAIN_IDS.MAINNET]}
                      src={CHAIN_ID_TO_NETWORK_IMAGE_URL_MAP[CHAIN_IDS.MAINNET]}
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
                {selectedPaymentMethod === PAYMENT_METHODS.TOKEN
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
          hasStableTokenWithBalance={hasStableTokenWithBalance}
          setSelectedPaymentMethod={setSelectedPaymentMethod}
          onAssetChange={setSelectedToken}
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
          {t('shieldPlanAutoRenew', [SHIELD_PLAN_PRICES.MONTHLY])}
        </Text>
      </Footer>
    </Page>
  );
};

export default ShieldPlan;
