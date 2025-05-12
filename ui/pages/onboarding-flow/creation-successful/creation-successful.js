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
  BorderRadius,
  BlockSize,
  FontWeight,
} from '../../../helpers/constants/design-system';
import {
  Box,
  Text,
  IconName,
  IconSize,
  ButtonBase,
  Icon,
  ButtonLink,
  ButtonLinkSize,
} from '../../../components/component-library';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  ONBOARDING_PRIVACY_SETTINGS_ROUTE,
  ONBOARDING_PIN_EXTENSION_ROUTE,
} from '../../../helpers/constants/routes';
import { getFirstTimeFlowType, getHDEntropyIndex } from '../../../selectors';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { selectIsBackupAndSyncEnabled } from '../../../selectors/identity/backup-and-sync';
import { getSeedPhraseBackedUp } from '../../../ducks/metamask/metamask';
import { FirstTimeFlowType } from '../../../../shared/constants/onboarding';
import { LottieAnimation } from '../../../components/component-library/lottie-animation';

export default function CreationSuccessful() {
  const history = useHistory();
  const t = useI18nContext();
  const trackEvent = useContext(MetaMetricsContext);
  const hdEntropyIndex = useSelector(getHDEntropyIndex);
  const firstTimeFlowType = useSelector(getFirstTimeFlowType);
  const seedPhraseBackedUp = useSelector(getSeedPhraseBackedUp);
  const learnMoreLink =
    'https://support.metamask.io/hc/en-us/articles/360015489591-Basic-Safety-and-Security-Tips-for-MetaMask';
  // const learnHowToKeepWordsSafe =
  //   'https://community.metamask.io/t/what-is-a-secret-recovery-phrase-and-how-to-keep-your-crypto-wallet-secure/3440';

  const isBackupAndSyncEnabled = useSelector(selectIsBackupAndSyncEnabled);

  const renderTitle = () => {
    if (
      firstTimeFlowType === FirstTimeFlowType.social ||
      seedPhraseBackedUp
    ) {
      return t('yourWalletIsReady');
    }

    return t('yourWalletIsReadyRemind');
  };

  const renderFoxPath = () => {
    if (
      firstTimeFlowType === FirstTimeFlowType.social ||
      seedPhraseBackedUp
    ) {
      return 'images/animations/fox/celebrating.lottie.json';
    }

    // TODO: Check figma teaching fox animation
    return 'images/animations/fox/celebrating.lottie.json';
  };

  return (
    <Box className="creation-successful" data-testid="wallet-ready">
      <div className="creation-successful__content">
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          justifyContent={JustifyContent.center}
          alignItems={AlignItems.flexStart}
        >
          <Text
            variant={TextVariant.headingLg}
            as="h2"
            justifyContent={JustifyContent.center}
            style={{
              alignSelf: AlignItems.flexStart,
            }}
            marginBottom={4}
          >
            {renderTitle()}
          </Text>
          <Box
            width={BlockSize.Full}
            display={Display.Flex}
            justifyContent={JustifyContent.center}
            alignItems={AlignItems.center}
            marginBottom={6}
          >
            <Box
              display={Display.Flex}
              style={{ width: '144px', height: '144px' }}
            >
              <LottieAnimation path={renderFoxPath()} loop={false} autoplay />
            </Box>
          </Box>
          <Text variant={TextVariant.bodyMd} marginBottom={6}>
            {seedPhraseBackedUp
              ? t('walletReadyLoseSrp')
              : t('walletReadyLoseSrpRemind')}
          </Text>
          <Text variant={TextVariant.bodyMd} marginBottom={6}>
            {seedPhraseBackedUp
              ? t('walletReadyLearn', [
                  <ButtonLink
                    key="walletReadyLearn"
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
                    {t('learnHow')}
                  </ButtonLink>,
                ])
              : t('walletReadyLearnRemind')}
          </Text>
        </Box>

        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          alignItems={AlignItems.flexStart}
          className="creation-successful__settings-actions"
          gap={4}
        >
          <ButtonBase
            data-testid="manage-default-settings"
            borderRadius={BorderRadius.LG}
            width={BlockSize.Full}
            onClick={() => history.push(ONBOARDING_PRIVACY_SETTINGS_ROUTE)}
          >
            <Box display={Display.Flex} alignItems={AlignItems.center}>
              <Icon
                name={IconName.Setting}
                size={IconSize.Md}
                marginInlineEnd={3}
              />
              <Text variant={TextVariant.bodyMd} fontWeight={FontWeight.Medium}>
                {t('manageDefaultSettings')}
              </Text>
            </Box>
            <Icon name={IconName.ArrowRight} size={IconSize.Sm} />
          </ButtonBase>
        </Box>
      </div>

      <Box
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
          width={BlockSize.Full}
          onClick={() => {
            trackEvent({
              category: MetaMetricsEventCategory.Onboarding,
              event: MetaMetricsEventName.OnboardingWalletCreationComplete,
              properties: {
                method: firstTimeFlowType,
                is_profile_syncing_enabled: isBackupAndSyncEnabled,
                hd_entropy_index: hdEntropyIndex,
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
