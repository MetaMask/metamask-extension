import React, { useState, useContext } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Box from '../../../components/ui/box';
import Button from '../../../components/ui/button';
import Typography from '../../../components/ui/typography';
import {
  TEXT_ALIGN,
  TYPOGRAPHY,
  JUSTIFY_CONTENT,
  FONT_WEIGHT,
  DISPLAY,
} from '../../../helpers/constants/design-system';
import {
  ThreeStepProgressBar,
  threeStepStages,
} from '../../../components/app/step-progress-bar';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { ONBOARDING_REVIEW_SRP_ROUTE } from '../../../helpers/constants/routes';
import { getCurrentLocale } from '../../../ducks/metamask/metamask';
import { EVENT_NAMES, EVENT } from '../../../../shared/constants/metametrics';
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
      category: EVENT.CATEGORIES.ONBOARDING,
      event: EVENT_NAMES.ONBOARDING_WALLET_SECURITY_STARTED,
    });
    history.push(`${ONBOARDING_REVIEW_SRP_ROUTE}${isFromReminderParam}`);
  };

  const handleClickNotRecommended = () => {
    trackEvent({
      category: EVENT.CATEGORIES.ONBOARDING,
      event: EVENT_NAMES.ONBOARDING_WALLET_SECURITY_SKIP_INITIATED,
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
        justifyContent={JUSTIFY_CONTENT.CENTER}
        textAlign={TEXT_ALIGN.CENTER}
        marginBottom={4}
      >
        <Typography variant={TYPOGRAPHY.H2} fontWeight={FONT_WEIGHT.BOLD}>
          {t('seedPhraseIntroTitle')}
        </Typography>
      </Box>
      <Box justifyContent={JUSTIFY_CONTENT.CENTER} marginBottom={6}>
        <Typography
          variant={TYPOGRAPHY.H4}
          className="secure-your-wallet__details"
        >
          {t('seedPhraseIntroTitleCopy')}
        </Typography>
      </Box>
      <Box>
        <video
          className="secure-your-wallet__video"
          onPlay={() => {
            trackEvent({
              category: EVENT.CATEGORIES.ONBOARDING,
              event: EVENT_NAMES.ONBOARDING_WALLET_VIDEO_PLAY,
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
        justifyContent={JUSTIFY_CONTENT.SPACE_BETWEEN}
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
          <Typography
            as="p"
            variant={TYPOGRAPHY.H4}
            fontWeight={FONT_WEIGHT.BOLD}
            boxProps={{ display: DISPLAY.BLOCK }}
          >
            {t('seedPhraseIntroSidebarTitleOne')}
          </Typography>
          <Typography as="p" variant={TYPOGRAPHY.H4}>
            {t('seedPhraseIntroSidebarCopyOne')}
          </Typography>
        </Box>
        <Box marginBottom={4}>
          <Typography
            as="p"
            variant={TYPOGRAPHY.H4}
            fontWeight={FONT_WEIGHT.BOLD}
            boxProps={{ display: DISPLAY.BLOCK }}
          >
            {t('seedPhraseIntroSidebarTitleTwo')}
          </Typography>
          <ul className="secure-your-wallet__list">
            <li>{t('seedPhraseIntroSidebarBulletOne')}</li>
            <li>{t('seedPhraseIntroSidebarBulletThree')}</li>
            <li>{t('seedPhraseIntroSidebarBulletFour')}</li>
          </ul>
        </Box>
        <Box marginBottom={6}>
          <Typography
            as="p"
            variant={TYPOGRAPHY.H4}
            fontWeight={FONT_WEIGHT.BOLD}
            boxProps={{ display: DISPLAY.BLOCK }}
          >
            {t('seedPhraseIntroSidebarTitleThree')}
          </Typography>
          <Typography as="p" variant={TYPOGRAPHY.H4}>
            {t('seedPhraseIntroSidebarCopyTwo')}
          </Typography>
        </Box>
        <Box className="secure-your-wallet__highlighted" marginBottom={2}>
          <Typography as="p" variant={TYPOGRAPHY.H4}>
            {t('seedPhraseIntroSidebarCopyThree')}
          </Typography>
        </Box>
      </Box>
    </div>
  );
}
