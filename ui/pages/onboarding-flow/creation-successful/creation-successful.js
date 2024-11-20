import React, { useContext } from 'react';
import { useHistory } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Button,
  ButtonSize,
  ButtonVariant,
} from '../../../components/component-library/button';
import {
  TextVariant,
  Display,
  AlignItems,
  JustifyContent,
  FlexDirection,
} from '../../../helpers/constants/design-system';
import {
  Box,
  Text,
  IconName,
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
import { useCreateSession } from '../../../hooks/metamask-notifications/useCreateSession';
import { selectIsProfileSyncingEnabled } from '../../../selectors/metamask-notifications/profile-syncing';

export default function CreationSuccessful() {
  const history = useHistory();
  const t = useI18nContext();
  const trackEvent = useContext(MetaMetricsContext);
  const firstTimeFlowType = useSelector(getFirstTimeFlowType);
  const seedPhraseBackedUp = useSelector(getSeedPhraseBackedUp);
  const learnMoreLink =
    'https://support.metamask.io/hc/en-us/articles/360015489591-Basic-Safety-and-Security-Tips-for-MetaMask';
  const learnHowToKeepWordsSafe =
    'https://community.metamask.io/t/what-is-a-secret-recovery-phrase-and-how-to-keep-your-crypto-wallet-secure/3440';

  const { createSession } = useCreateSession();

  const isProfileSyncingEnabled = useSelector(selectIsProfileSyncingEnabled);

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
        <Text
          justifyContent={JustifyContent.center}
          marginBottom={4}
          style={{
            alignSelf: AlignItems.center,
            fontSize: '70px',
          }}
        >
          <span>
            {firstTimeFlowType === FirstTimeFlowType.create &&
            !seedPhraseBackedUp
              ? '🔓'
              : '🎉'}
          </span>
        </Text>
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
            t('rememberSRPIfYouLooseAccess', [
              <ButtonLink
                key="rememberSRPIfYouLooseAccess"
                size={ButtonLinkSize.Inherit}
                textProps={{
                  variant: TextVariant.bodyMd,
                  alignItems: AlignItems.flexStart,
                }}
                as="a"
                href={learnHowToKeepWordsSafe}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t('learnHow')}
              </ButtonLink>,
            ])}

          {firstTimeFlowType === FirstTimeFlowType.create &&
            seedPhraseBackedUp &&
            t('walletProtectedAndReadyToUse', [
              <b key="walletProtectedAndReadyToUse">
                {t('securityPrivacyPath')}
              </b>,
            ])}
          {firstTimeFlowType === FirstTimeFlowType.create &&
            !seedPhraseBackedUp &&
            t('ifYouGetLockedOut', [
              <b key="ifYouGetLockedOut">{t('securityPrivacyPath')}</b>,
            ])}
        </Text>
      </Box>

      {firstTimeFlowType === FirstTimeFlowType.create && (
        <Text variant={TextVariant.bodyLgMedium} marginBottom={6}>
          {t('keepReminderOfSRP', [
            <ButtonLink
              key="keepReminderOfSRP"
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
          style={{
            fontSize: 'var(--font-size-5)',
          }}
          onClick={() => history.push(ONBOARDING_PRIVACY_SETTINGS_ROUTE)}
          marginTop={4}
          marginBottom={4}
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
          data-testid="onboarding-complete-done"
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
                is_profile_syncing_enabled: isProfileSyncingEnabled,
              },
            });
            createSession();
            history.push(ONBOARDING_PIN_EXTENSION_ROUTE);
          }}
        >
          {t('done')}
        </Button>
      </Box>
    </Box>
  );
}
