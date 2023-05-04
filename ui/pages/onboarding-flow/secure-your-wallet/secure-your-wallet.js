import React, { useState, useContext } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Box from '../../../components/ui/box';
import Button from '../../../components/ui/button';
import {
  TextAlign,
  TextVariant,
  JustifyContent,
  FontWeight,
  DISPLAY,
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
import { Text } from '../../../components/component-library';
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
    <div className="secure-your-wallet" data-testid="secure-your-wallet">
      {showSkipSRPBackupPopover && (
        <SkipSRPBackup handleClose={() => setShowSkipSRPBackupPopover(false)} />
      )}
      <ThreeStepProgressBar
        stage={threeStepStages.RECOVERY_PHRASE_VIDEO}
        marginBottom={4}
      />
      <Box
        justifyContent={JustifyContent.center}
        textAlign={TextAlign.Center}
        marginBottom={4}
      >
        <Text
          variant={TextVariant.headingLg}
          as="h2"
          fontWeight={FontWeight.Bold}
        >
          {t('seedPhraseIntroTitle')}
        </Text>
      </Box>
      <Box justifyContent={JustifyContent.center} marginBottom={6}>
        <Text
          variant={TextVariant.headingSm}
          as="h4"
          className="secure-your-wallet__details"
        >
          {t('seedPhraseIntroTitleCopy')}
        </Text>
      </Box>
      <Box>
        <video
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
        </video>
      </Box>
      <Box
        margin={8}
        justifyContent={JustifyContent.spaceBetween}
        className="secure-your-wallet__actions"
      >
        <Button
          data-testid="secure-wallet-later"
          type="secondary"
          rounded
          large
          onClick={handleClickNotRecommended}
        >
          {t('seedPhraseIntroNotRecommendedButtonCopy')}
        </Button>
        <Button
          data-testid="secure-wallet-recommended"
          type="primary"
          rounded
          large
          onClick={handleClickRecommended}
        >
          {t('seedPhraseIntroRecommendedButtonCopy')}
        </Button>
      </Box>
      <Box className="secure-your-wallet__desc">
        <Box marginBottom={4}>
          <Text
            as="p"
            variant={TextVariant.headingSm}
            fontWeight={FontWeight.Bold}
            boxProps={{ display: DISPLAY.BLOCK }}
          >
            {t('seedPhraseIntroSidebarTitleOne')}
          </Text>
          <Text as="p" variant={TextVariant.headingSm}>
            {t('seedPhraseIntroSidebarCopyOne')}
          </Text>
        </Box>
        <Box marginBottom={4}>
          <Text
            as="p"
            variant={TextVariant.headingSm}
            fontWeight={FontWeight.Bold}
            boxProps={{ display: DISPLAY.BLOCK }}
          >
            {t('seedPhraseIntroSidebarTitleTwo')}
          </Text>
          <ul className="secure-your-wallet__list">
            <li>{t('seedPhraseIntroSidebarBulletOne')}</li>
            <li>{t('seedPhraseIntroSidebarBulletThree')}</li>
            <li>{t('seedPhraseIntroSidebarBulletFour')}</li>
          </ul>
        </Box>
        <Box marginBottom={6}>
          <Text
            as="p"
            variant={TextVariant.headingSm}
            fontWeight={FontWeight.Bold}
            boxProps={{ display: DISPLAY.BLOCK }}
          >
            {t('seedPhraseIntroSidebarTitleThree')}
          </Text>
          <Text as="p" variant={TextVariant.headingSm}>
            {t('seedPhraseIntroSidebarCopyTwo')}
          </Text>
        </Box>
        <Box className="secure-your-wallet__highlighted" marginBottom={2}>
          <Text as="p" variant={TextVariant.headingSm}>
            {t('seedPhraseIntroSidebarCopyThree')}
          </Text>
        </Box>
      </Box>
    </div>
  );
}
