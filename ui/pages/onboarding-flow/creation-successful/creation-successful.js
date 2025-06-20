import React, { useCallback, useContext, useMemo } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
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
  TextColor,
  IconColor,
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
  DEFAULT_ROUTE,
  SECURITY_ROUTE,
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
  const { search } = useLocation();
  const hdEntropyIndex = useSelector(getHDEntropyIndex);
  const firstTimeFlowType = useSelector(getFirstTimeFlowType);
  const seedPhraseBackedUp = useSelector(getSeedPhraseBackedUp);
  const learnMoreLink =
    'https://support.metamask.io/stay-safe/safety-in-web3/basic-safety-and-security-tips-for-metamask/';

  const isBackupAndSyncEnabled = useSelector(selectIsBackupAndSyncEnabled);

  const isWalletReady =
    firstTimeFlowType === FirstTimeFlowType.import || seedPhraseBackedUp;

  const searchParams = new URLSearchParams(search);
  const isFromReminder = searchParams.get('isFromReminder');
  const isFromSettingsSecurity = searchParams.get('isFromSettingsSecurity');

  const renderTitle = useMemo(() => {
    if (isWalletReady) {
      return isFromReminder
        ? t('yourWalletIsReadyFromReminder')
        : t('yourWalletIsReady');
    }

    return t('yourWalletIsReadyRemind');
  }, [isFromReminder, isWalletReady, t]);

  const renderDetails1 = useMemo(() => {
    if (isWalletReady) {
      return isFromReminder
        ? t('walletReadyLoseSrpFromReminder')
        : t('walletReadyLoseSrp');
    }

    return t('walletReadyLoseSrpRemind');
  }, [isWalletReady, isFromReminder, t]);

  const renderDetails2 = useMemo(() => {
    if (isWalletReady || isFromReminder) {
      return t('walletReadyLearn', [
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
      ]);
    }

    return t('walletReadyLearnRemind');
  }, [isWalletReady, isFromReminder, t]);

  const renderFox = useMemo(() => {
    if (isWalletReady || isFromReminder) {
      return (
        <LottieAnimation
          path="images/animations/fox/celebrating.lottie.json"
          loop
          autoplay
        />
      );
    }

    return (
      <LottieAnimation
        path="images/animations/fox/celebrating.lottie.json"
        loop
        autoplay
      />
    );
  }, [isWalletReady, isFromReminder]);

  const onDone = useCallback(() => {
    if (isFromReminder) {
      history.push(isFromSettingsSecurity ? SECURITY_ROUTE : DEFAULT_ROUTE);
      return;
    }

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
  }, [
    firstTimeFlowType,
    isBackupAndSyncEnabled,
    hdEntropyIndex,
    trackEvent,
    history,
    isFromReminder,
    isFromSettingsSecurity,
  ]);

  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      justifyContent={JustifyContent.spaceBetween}
      height={BlockSize.Full}
      gap={6}
      className="creation-successful"
      data-testid="wallet-ready"
    >
      <Box>
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
            {renderTitle}
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
              {renderFox}
            </Box>
          </Box>
          <Text
            variant={TextVariant.bodyMd}
            color={TextColor.textAlternative}
            marginBottom={6}
          >
            {renderDetails1}
          </Text>
          <Text
            variant={TextVariant.bodyMd}
            color={TextColor.textAlternative}
            marginBottom={6}
          >
            {renderDetails2}
          </Text>
        </Box>
        {!isFromReminder && (
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
                <Text
                  variant={TextVariant.bodyMd}
                  fontWeight={FontWeight.Medium}
                >
                  {t('manageDefaultSettings')}
                </Text>
              </Box>
              <Icon
                name={IconName.ArrowRight}
                color={IconColor.iconAlternative}
                size={IconSize.Sm}
              />
            </ButtonBase>
          </Box>
        )}
      </Box>

      <Box
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
          onClick={onDone}
        >
          {t('done')}
        </Button>
      </Box>
    </Box>
  );
}
