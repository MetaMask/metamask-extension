import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  ButtonSize,
  ButtonVariant,
} from '../../components/component-library/button';
import { useI18nContext } from '../../hooks/useI18nContext';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  BorderColor,
  BorderRadius,
  Display,
  FlexDirection,
  FontWeight,
  TextAlign,
  TextColor,
  TextVariant,
} from '../../helpers/constants/design-system';
import { Text } from '../../components/component-library/text/text';
import { Box } from '../../components/component-library/box/box';
import { Container } from '../../components/component-library/container/container';
import { ButtonLink } from '../../components/component-library';
import { DEFAULT_ROUTE, SECURITY_ROUTE } from '../../helpers/constants/routes';

const CONTAINER_STYLE = { marginTop: '111px' } as const;
const CARD_BOX_STYLE = { width: '446px', minHeight: '320px' } as const;
const LOGO_STYLE = { width: '120px', height: '120px' } as const;

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
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        alignItems={AlignItems.center}
        textAlign={TextAlign.Center}
        backgroundColor={BackgroundColor.backgroundDefault}
        borderColor={BorderColor.borderMuted}
        borderRadius={BorderRadius.MD}
        style={CARD_BOX_STYLE}
        paddingLeft={6}
        paddingRight={6}
        paddingTop={12}
        paddingBottom={8}
        borderWidth={1}
      >
        <img
          className="metamask-basic-functionality-required-logo"
          alt="MetaMask logo"
          src="./images/logo/metamask-fox.svg"
          style={LOGO_STYLE}
        />
        <Text
          as="h1"
          variant={TextVariant.headingLg}
          fontWeight={FontWeight.Bold}
          marginTop={4}
          marginBottom={4}
        >
          {t('basicFunctionalityRequired_title')}
        </Text>
        <Box
          as="div"
          data-testid="basic-functionality-required-description"
          paddingBottom={6}
        >
          <Text variant={TextVariant.bodyMd} color={TextColor.textAlternative}>
            {t('basicFunctionalityRequired_description')}
          </Text>
          <Text
            variant={TextVariant.bodyMd}
            color={TextColor.textAlternative}
            marginTop={2}
          >
            {t('basicFunctionalityRequired_settingsHint', [
              <ButtonLink
                key="settings-link"
                as="button"
                onClick={() => navigate(SECURITY_ROUTE)}
                data-testid="basic-functionality-required-settings-link"
              >
                {t('basicFunctionalityRequired_openSettings')}
              </ButtonLink>,
            ])}
          </Text>
        </Box>
        <Box width={BlockSize.Full} marginTop={8}>
          <Button
            width={BlockSize.Full}
            variant={ButtonVariant.Primary}
            size={ButtonSize.Lg}
            data-testid="basic-functionality-required-go-home"
            onClick={() => navigate(DEFAULT_ROUTE)}
          >
            {t('basicFunctionalityRequired_goToHome')}
          </Button>
        </Box>
      </Box>
    </Container>
  );
};
