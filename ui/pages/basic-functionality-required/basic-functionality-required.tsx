import React from 'react';
import { useNavigate } from 'react-router-dom';
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
} from '@metamask/design-system-react';
import { useI18nContext } from '../../hooks/useI18nContext';
import {
  AlignItems,
  Display,
  FlexDirection,
} from '../../helpers/constants/design-system';
import { Container } from '../../components/component-library/container/container';
import { DEFAULT_ROUTE, SECURITY_ROUTE } from '../../helpers/constants/routes';

const CONTAINER_STYLE = { marginTop: '111px' } as const;
const CARD_BOX_STYLE = { width: '446px', minHeight: '592px' } as const;
const LOGO_STYLE = { width: '160px', height: '160px' } as const;

/**
 * Shown when the user opens a route that requires Basic Functionality (e.g. swap, rewards)
 * but the "Use external services" setting is off. Directs them to turn it on in Settings.
 */
export const BasicFunctionalityRequired = () => {
  const t = useI18nContext();
  const navigate = useNavigate();

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
          className="metamask-basic-functionality-required-logo"
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
          data-testid="basic-functionality-required-description"
          paddingBottom={12}
        >
          <Text variant={TextVariant.BodyMd} color={TextColor.TextAlternative}>
            {t('basicFunctionalityRequired_description')}
          </Text>
          <Box marginTop={2}>
            <Text
              variant={TextVariant.BodyMd}
              color={TextColor.TextAlternative}
            >
              {t('basicFunctionalityRequired_settingsHint', [
                <TextButton
                  key="settings-link"
                  onClick={() => navigate(SECURITY_ROUTE)}
                  data-testid="basic-functionality-required-settings-link"
                >
                  {t('basicFunctionalityRequired_openSettings')}
                </TextButton>,
              ])}
            </Text>
          </Box>
        </Box>
        <Box style={{ width: '100%', marginTop: 48 }}>
          <Button
            variant={ButtonVariant.Primary}
            size={ButtonSize.Lg}
            data-testid="basic-functionality-required-go-home"
            onClick={() => navigate(DEFAULT_ROUTE)}
            style={{ width: '100%' }}
          >
            {t('basicFunctionalityRequired_goToHome')}
          </Button>
        </Box>
      </Box>
    </Container>
  );
};
