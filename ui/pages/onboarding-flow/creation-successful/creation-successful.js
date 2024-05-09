import React, { useContext } from 'react';
import { useHistory } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Button,
  ButtonSize,
  ButtonVariant,
} from '../../../components/component-library/button';
import {
  TextColor,
  TextVariant,
  IconColor,
  Display,
  AlignItems,
  JustifyContent,
  FlexDirection,
  BlockSize,
  Size,
} from '../../../helpers/constants/design-system';
import {
  Box,
  PickerNetwork,
  Text,
  TextField,
  ButtonSecondary,
  ButtonSecondarySize,
  Icon,
  IconName,
  ButtonPrimary,
  ButtonPrimarySize,
  ButtonLink,
  ButtonLinkSize,
  IconSize,
} from '../../../components/component-library';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  ONBOARDING_PIN_EXTENSION_ROUTE,
  ONBOARDING_PRIVACY_SETTINGS_ROUTE,
} from '../../../helpers/constants/routes';
import { FirstTimeFlowType } from '../../../../shared/constants/onboarding';
import { getFirstTimeFlowType } from '../../../selectors';
import { getSeedPhraseBackedUp } from '../../../ducks/metamask/metamask';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../../contexts/metametrics';

export default function CreationSuccessful() {
  const history = useHistory();
  const t = useI18nContext();
  const trackEvent = useContext(MetaMetricsContext);
  const firstTimeFlowType = useSelector(getFirstTimeFlowType);
  const seedPhraseBackedUp = useSelector(getSeedPhraseBackedUp);
  const learnMoreLink =
    'https://support.metamask.io/hc/en-us/articles/360015489591-Basic-Safety-and-Security-Tips-for-MetaMask';

  return (
    <Box
      className="creation-successful"
      data-testid="creation-successful"
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
    >
      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        justifyContent={JustifyContent.center}
        marginTop={6}
      >
        {firstTimeFlowType === FirstTimeFlowType.create &&
        !seedPhraseBackedUp ? (
          <Text
            justifyContent={JustifyContent.center}
            style={{
              alignSelf: AlignItems.center,
              fontSize: '70px',
            }}
          >
            🔓
          </Text>
        ) : (
          <img src="./images/tada.png" />
        )}
        <Text
          variant={TextVariant.headingLg}
          as="h2"
          margin={6}
          justifyContent={JustifyContent.center}
          style={{
            alignSelf: AlignItems.center,
          }}
        >
          {firstTimeFlowType === FirstTimeFlowType.import &&
            t('yourWalletIsReady')}

          {firstTimeFlowType === FirstTimeFlowType.create &&
            !seedPhraseBackedUp &&
            t('reminderSet')}

          {firstTimeFlowType === FirstTimeFlowType.create &&
            seedPhraseBackedUp &&
            t('congratulations')}
        </Text>
        <Text variant={TextVariant.bodyLgMedium} marginBottom={6}>
          {firstTimeFlowType === FirstTimeFlowType.import &&
            t('rememberSRPIfYouLooseAccess')}
          {firstTimeFlowType === FirstTimeFlowType.create &&
            seedPhraseBackedUp &&
            t('walletProtectedAndReadyToUse', [
              <b>{t('securityPrivacyPath')}</b>,
            ])}
          {firstTimeFlowType === FirstTimeFlowType.create &&
            !seedPhraseBackedUp &&
            t('ifYouGetLockedOut', [<b>{t('securityPrivacyPath')}</b>])}
        </Text>
      </Box>

      {firstTimeFlowType === FirstTimeFlowType.create && seedPhraseBackedUp && (
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          alignItems={AlignItems.flexStart}
        >
          <Button variant={ButtonVariant.Link} onClick={() => 'www.google.com'}>
            {t('leaveYourselfAHint')}
          </Button>
        </Box>
      )}

      {firstTimeFlowType === FirstTimeFlowType.create && (
        <Box>
          <Text variant={TextVariant.bodyLgMedium} marginBottom={6}>
            {t('keepReminderOfSRP', [
              <ButtonLink
                size={ButtonLinkSize.Inherit}
                textProps={{
                  variant: TextVariant.bodyMd,
                  alignItems: AlignItems.flexStart,
                }}
                as="a"
                href={learnMoreLink}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t('learnMoreUpperCaseWithDot')}
              </ButtonLink>,
            ])}
          </Text>
        </Box>
      )}

      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        alignItems={AlignItems.flexStart}
      >
        <Button
          variant={ButtonVariant.Link}
          startIconName={IconName.Setting}
          startIconProps={{
            size: IconSize.Md,
          }}
          size={ButtonLinkSize.Lg}
          style={{
            fontSize: 'var(--font-size-5)',
          }}
          data-
          onClick={() => history.push(ONBOARDING_PRIVACY_SETTINGS_ROUTE)}
        >
          {t('manageDefaultSettings')}
        </Button>
        <Text variant={TextVariant.bodySm}>
          {t('settingsOptimisedForEaseOfUseAndSecurity')}
        </Text>
      </Box>

      <Box
        marginTop={6}
        className="creation-successful__actions"
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        justifyContent={JustifyContent.center}
        alignItems={AlignItems.center}
      >
        <Button
          variant={ButtonVariant.Primary}
          size={ButtonSize.Lg}
          style={{
            width: '184px',
          }}
          marginTop={6}
          onClick={() => {
            trackEvent({
              category: MetaMetricsEventCategory.Onboarding,
              event: MetaMetricsEventName.OnboardingWalletCreationComplete,
              properties: {
                method: firstTimeFlowType,
              },
            });
            history.push(ONBOARDING_PIN_EXTENSION_ROUTE);
          }}
        >
          {t('done')}
        </Button>
      </Box>
    </Box>
  );
}
