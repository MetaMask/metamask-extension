import React, { useState, useContext } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';

import {
  TextAlign,
  TextVariant,
  JustifyContent,
  BackgroundColor,
  BorderRadius,
  AlignItems,
  FlexDirection,
  Display,
  BlockSize,
} from '../../../helpers/constants/design-system';
import {
  ThreeStepProgressBar,
  threeStepStages,
} from '../../../components/app/step-progress-bar';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { ONBOARDING_REVIEW_SRP_ROUTE } from '../../../helpers/constants/routes';
import { getCurrentLocale } from '../../../ducks/locale/locale';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import {
  Box,
  Button,
  BUTTON_VARIANT,
  BUTTON_SIZES,
  Text,
} from '../../../components/component-library';
import SkipSRPBackup from './skip-srp-backup-popover';

export default function SecureYourWallet() {
  const history = useHistory();
  const t = useI18nContext();
  const { search } = useLocation();
  const currentLocale = useSelector(getCurrentLocale);
  const [showSkipSRPBackupPopover, setShowSkipSRPBackupPopover] =
    useState(false);
  const searchParams = new URLSearchParams(search);
  const isFromReminderParam = searchParams.get('isFromReminder')
    ? '/?isFromReminder=true'
    : '';

  const trackEvent = useContext(MetaMetricsContext);

  const handleClickRecommended = () => {
    trackEvent({
      category: MetaMetricsEventCategory.Onboarding,
      event: MetaMetricsEventName.OnboardingWalletSecurityStarted,
    });
    history.push(`${ONBOARDING_REVIEW_SRP_ROUTE}${isFromReminderParam}`);
  };

  const handleClickNotRecommended = () => {
    trackEvent({
      category: MetaMetricsEventCategory.Onboarding,
      event: MetaMetricsEventName.OnboardingWalletSecuritySkipInitiated,
    });
    setShowSkipSRPBackupPopover(true);
  };

  const subtitles = {
    en: 'English',
    es: 'Spanish',
    hi: 'Hindi',
    id: 'Indonesian',
    ja: 'Japanese',
    ko: 'Korean',
    pt: 'Portuguese',
    ru: 'Russian',
    tl: 'Tagalog',
    vi: 'Vietnamese',
    de: 'German',
    el: 'Greek',
    fr: 'French',
    tr: 'Turkish',
    zh: 'Chinese - China',
  };

  const defaultLang = subtitles[currentLocale] ? currentLocale : 'en';
  return (
    <Box
      display={Display.Flex}
      justifyContent={JustifyContent.center}
      alignItems={AlignItems.center}
      flexDirection={FlexDirection.Column}
      className="secure-your-wallet"
      data-testid="secure-your-wallet"
    >
      {showSkipSRPBackupPopover && (
        <SkipSRPBackup handleClose={() => setShowSkipSRPBackupPopover(false)} />
      )}
      <ThreeStepProgressBar
        stage={threeStepStages.RECOVERY_PHRASE_VIDEO}
        marginBottom={4}
      />
      <Text
        variant={TextVariant.headingLg}
        as="h2"
        marginBottom={4}
        textAlign={TextAlign.Center}
      >
        {t('seedPhraseIntroTitle')}
      </Text>
      <Text
        variant={TextVariant.bodyLgMedium}
        marginBottom={6}
        className="secure-your-wallet__details"
      >
        {t('seedPhraseIntroTitleCopy')}
      </Text>
      <Box
        as="video"
        borderRadius={BorderRadius.LG}
        marginBottom={8}
        className="secure-your-wallet__video"
        onPlay={() => {
          trackEvent({
            category: MetaMetricsEventCategory.Onboarding,
            event: MetaMetricsEventName.OnboardingWalletVideoPlay,
          });
        }}
        controls
      >
        <source
          type="video/webm"
          src="./images/videos/recovery-onboarding/video.webm"
        />
        {Object.keys(subtitles).map((key) => {
          return (
            <track
              default={Boolean(key === defaultLang)}
              srcLang={key}
              label={subtitles[key]}
              key={`${key}-subtitles`}
              kind="subtitles"
              src={`./images/videos/recovery-onboarding/subtitles/${key}.vtt`}
            />
          );
        })}
      </Box>
      <Box
        className="secure-your-wallet__actions"
        marginBottom={8}
        width={BlockSize.Full}
        display={Display.Flex}
        flexDirection={[FlexDirection.Column, FlexDirection.Row]}
        justifyContent={JustifyContent.spaceBetween}
        gap={4}
      >
        <Button
          data-testid="secure-wallet-later"
          variant={BUTTON_VARIANT.SECONDARY}
          size={BUTTON_SIZES.LG}
          block
          onClick={handleClickNotRecommended}
        >
          {t('seedPhraseIntroNotRecommendedButtonCopy')}
        </Button>
        <Button
          data-testid="secure-wallet-recommended"
          size={BUTTON_SIZES.LG}
          block
          onClick={handleClickRecommended}
        >
          {t('seedPhraseIntroRecommendedButtonCopy')}
        </Button>
      </Box>
      <Box className="secure-your-wallet__desc">
        <Text as="h3" variant={TextVariant.headingSm}>
          {t('seedPhraseIntroSidebarTitleOne')}
        </Text>
        <Text marginBottom={4}>{t('seedPhraseIntroSidebarCopyOne')}</Text>
        <Text as="h3" variant={TextVariant.headingSm}>
          {t('seedPhraseIntroSidebarTitleTwo')}
        </Text>
        <Box as="ul" className="secure-your-wallet__list" marginBottom={4}>
          <Text as="li">{t('seedPhraseIntroSidebarBulletOne')}</Text>
          <Text as="li">{t('seedPhraseIntroSidebarBulletThree')}</Text>
          <Text as="li">{t('seedPhraseIntroSidebarBulletFour')}</Text>
        </Box>
        <Text as="h3" variant={TextVariant.headingSm}>
          {t('seedPhraseIntroSidebarTitleThree')}
        </Text>
        <Text as="p" marginBottom={4}>
          {t('seedPhraseIntroSidebarCopyTwo')}
        </Text>
        <Text
          as="h3"
          variant={TextVariant.headingSm}
          backgroundColor={BackgroundColor.primaryMuted}
          padding={4}
          borderRadius={BorderRadius.LG}
        >
          {t('seedPhraseIntroSidebarCopyThree')}
        </Text>
      </Box>
    </Box>
  );
}
