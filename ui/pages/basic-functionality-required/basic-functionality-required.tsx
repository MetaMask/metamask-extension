import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Box,
  Button,
  ButtonSize,
  ButtonVariant,
  Text,
  TextButton,
  TextVariant,
  FontWeight,
  TextColor,
  BoxAlignItems,
  BoxFlexDirection,
  BoxBackgroundColor,
  BoxBorderColor,
  BoxJustifyContent,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../hooks/useI18nContext';
import {
  AlignItems,
  Display,
  FlexDirection,
} from '../../helpers/constants/design-system';
import { Container } from '../../components/component-library/container/container';
import ToggleButton from '../../components/ui/toggle-button';
import { DEFAULT_ROUTE, SECURITY_ROUTE } from '../../helpers/constants/routes';
import { getUseExternalServices } from '../../selectors';
import { toggleExternalServices } from '../../store/actions';
import type { BasicFunctionalityOffState } from '../../helpers/higher-order-components/require-basic-functionality/require-basic-functionality';

const CONTAINER_STYLE = { marginTop: '111px' } as const;
const CARD_BOX_STYLE = { width: '446px', minHeight: '592px' } as const;
const LOGO_STYLE = { width: '160px', height: '160px' } as const;

/**
 * Shown when Basic Functionality is off and the user opens a route that requires it (e.g. swap, rewards).
 * Shows an inline toggle to turn it on and, when on, a primary CTA to open the blocked feature page.
 */
export const BasicFunctionalityOff = () => {
  const t = useI18nContext();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const useExternalServices = useSelector(getUseExternalServices);

  const state = location.state as BasicFunctionalityOffState | undefined;
  const blockedRoutePath = state?.blockedRoutePath ?? '';
  const openPageCtaMessageKey = state?.openPageCtaMessageKey ?? '';
  const hasFeatureContext = Boolean(blockedRoutePath && openPageCtaMessageKey);

  const handleToggleBasicFunctionality = (currentValue: boolean) => {
    dispatch(toggleExternalServices(!currentValue));
  };

  const handleOpenFeaturePage = () => {
    if (useExternalServices && blockedRoutePath) {
      navigate(blockedRoutePath);
    }
  };

  return (
    <Container
      display={Display.Flex}
      alignItems={AlignItems.center}
      flexDirection={FlexDirection.Column}
      style={CONTAINER_STYLE}
    >
      <Box
        flexDirection={BoxFlexDirection.Column}
        alignItems={BoxAlignItems.Center}
        backgroundColor={BoxBackgroundColor.BackgroundDefault}
        borderColor={BoxBorderColor.BorderMuted}
        style={{
          ...CARD_BOX_STYLE,
          display: Display.Flex,
          textAlign: 'center',
          borderRadius: '6px',
          paddingLeft: 24,
          paddingRight: 24,
          paddingTop: 48,
          paddingBottom: 32,
          borderWidth: 1,
        }}
      >
        <img
          className="metamask-basic-functionality-off-logo"
          alt="MetaMask logo"
          src="./images/logo/metamask-fox.svg"
          style={LOGO_STYLE}
        />
        <Text
          asChild
          variant={TextVariant.HeadingLg}
          fontWeight={FontWeight.Bold}
        >
          <h1 style={{ marginTop: 16, marginBottom: 16 }}>
            {t('basicFunctionalityRequired_title')}
          </h1>
        </Text>
        <Box
          data-testid="basic-functionality-off-description"
          paddingBottom={4}
        >
          <Text variant={TextVariant.BodyMd} color={TextColor.TextAlternative}>
            {t('basicFunctionalityRequired_description')}
          </Text>
        </Box>

        <Box
          flexDirection={BoxFlexDirection.Column}
          alignItems={BoxAlignItems.Center}
          style={{ width: '100%', marginTop: 8, gap: 8 }}
          data-testid="basic-functionality-off-toggle-row"
        >
          <Box
            flexDirection={BoxFlexDirection.Row}
            alignItems={BoxAlignItems.Center}
            justifyContent={BoxJustifyContent.Center}
            style={{ gap: 12, display: 'flex' }}
          >
            <Text variant={TextVariant.BodyMd}>
              {t('basicFunctionalityRequired_toggleLabel')}
            </Text>
            <ToggleButton
              value={useExternalServices === true}
              onToggle={handleToggleBasicFunctionality}
              offLabel={t('off')}
              onLabel={t('on')}
              dataTestId="basic-functionality-off-toggle"
            />
          </Box>
          <TextButton
            onClick={() => navigate(SECURITY_ROUTE)}
            data-testid="basic-functionality-off-review-in-settings"
          >
            {t('basicFunctionalityRequired_reviewInSettings')}
          </TextButton>
        </Box>

        <Box style={{ width: '100%', marginTop: 48 }}>
          {hasFeatureContext && (
            <Button
              variant={ButtonVariant.Primary}
              size={ButtonSize.Lg}
              data-testid="basic-functionality-off-open-feature"
              onClick={handleOpenFeaturePage}
              disabled={useExternalServices !== true}
              style={{ width: '100%', marginBottom: 12 }}
            >
              {t(openPageCtaMessageKey)}
            </Button>
          )}
          <TextButton
            onClick={() => navigate(DEFAULT_ROUTE)}
            data-testid="basic-functionality-off-go-home"
          >
            {t('basicFunctionalityRequired_goToHome')}
          </TextButton>
        </Box>
      </Box>
    </Container>
  );
};
