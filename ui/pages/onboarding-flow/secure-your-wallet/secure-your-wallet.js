import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useSelector } from 'react-redux';
import Box from '../../../components/ui/box';
import Button from '../../../components/ui/button';
import Typography from '../../../components/ui/typography';
import {
  TEXT_ALIGN,
  TYPOGRAPHY,
  JUSTIFY_CONTENT,
  FONT_WEIGHT,
} from '../../../helpers/constants/design-system';
import ProgressBar from '../../../components/app/step-progress-bar';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { ONBOARDING_REVIEW_SRP_ROUTE } from '../../../helpers/constants/routes';
import { getCurrentLocale } from '../../../ducks/metamask/metamask';
import SkipSRPBackup from './skip-srp-backup-popover';

export default function SecureYourWallet() {
  const history = useHistory();
  const t = useI18nContext();
  const currentLocale = useSelector(getCurrentLocale);
  const [showSkipSRPBackupPopover, setShowSkipSRPBackupPopover] = useState(
    false,
  );

  const handleClickRecommended = () => {
    history.push(ONBOARDING_REVIEW_SRP_ROUTE);
  };

  const handleClickNotRecommended = () => {
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
  };

  const defaultLang = subtitles[currentLocale] ? currentLocale : 'en';
  return (
    <div className="secure-your-wallet">
      {showSkipSRPBackupPopover && (
        <SkipSRPBackup handleClose={() => setShowSkipSRPBackupPopover(false)} />
      )}
      <ProgressBar stage="SEED_PHRASE_VIDEO" />
      <Box
        justifyContent={JUSTIFY_CONTENT.CENTER}
        textAlign={TEXT_ALIGN.CENTER}
        marginBottom={4}
      >
        <Typography variant={TYPOGRAPHY.H2} fontWeight={FONT_WEIGHT.BOLD}>
          {t('seedPhraseIntroTitle')}
        </Typography>
      </Box>
      <Box
        justifyContent={JUSTIFY_CONTENT.CENTER}
        textAlign={TEXT_ALIGN.CENTER}
        marginBottom={6}
      >
        <Typography
          variant={TYPOGRAPHY.H4}
          className="secure-your-wallet__details"
        >
          {t('seedPhraseIntroTitleCopy')}
        </Typography>
      </Box>
      <Box>
        <video controls style={{ borderRadius: '10px' }}>
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
        width="10/12"
        justifyContent={JUSTIFY_CONTENT.SPACE_BETWEEN}
        className="secure-your-wallet__actions"
      >
        <Button
          type="secondary"
          rounded
          large
          onClick={handleClickNotRecommended}
        >
          {t('seedPhraseIntroNotRecommendedButtonCopy')}
        </Button>
        <Button type="primary" rounded large onClick={handleClickRecommended}>
          {t('seedPhraseIntroRecommendedButtonCopy')}
        </Button>
      </Box>
      <Box marginBottom={4} textAlign={TEXT_ALIGN.CENTER}>
        <Typography
          tag="span"
          variant={TYPOGRAPHY.H4}
          fontWeight={FONT_WEIGHT.BOLD}
          boxProps={{ display: 'block' }}
        >
          {t('seedPhraseIntroSidebarTitleOne')}
        </Typography>
        <Typography tag="span" variant={TYPOGRAPHY.H4}>
          {t('seedPhraseIntroSidebarCopyOne')}
        </Typography>
      </Box>
      <Box marginBottom={4} textAlign={TEXT_ALIGN.CENTER}>
        <Typography
          tag="span"
          variant={TYPOGRAPHY.H4}
          fontWeight={FONT_WEIGHT.BOLD}
          boxProps={{ display: 'block' }}
        >
          {t('seedPhraseIntroSidebarTitleTwo')}
        </Typography>
        <ul className="secure-your-wallet__list">
          <li>{t('seedPhraseIntroSidebarBulletOne')}</li>
          <li>{t('seedPhraseIntroSidebarBulletTwo')}</li>
          <li>{t('seedPhraseIntroSidebarBulletThree')}</li>
          <li>{t('seedPhraseIntroSidebarBulletFour')}</li>
        </ul>
      </Box>
      <Box marginBottom={6} textAlign={TEXT_ALIGN.CENTER}>
        <Typography
          tag="span"
          variant={TYPOGRAPHY.H4}
          fontWeight={FONT_WEIGHT.BOLD}
          boxProps={{ display: 'block' }}
        >
          {t('seedPhraseIntroSidebarTitleThree')}
        </Typography>
        <Typography tag="span" variant={TYPOGRAPHY.H4}>
          {t('seedPhraseIntroSidebarCopyTwo')}
        </Typography>
      </Box>
      <Box
        className="secure-your-wallet__highlighted"
        marginBottom={2}
        textAlign={TEXT_ALIGN.CENTER}
      >
        <Typography tag="span" variant={TYPOGRAPHY.H4}>
          {t('seedPhraseIntroSidebarCopyThree')}
        </Typography>
      </Box>
    </div>
  );
}
