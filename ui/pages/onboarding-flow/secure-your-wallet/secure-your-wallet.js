import React from 'react';
import { useHistory } from 'react-router-dom';
import Box from '../../../components/ui/box';
import Button from '../../../components/ui/button';
import Typography from '../../../components/ui/typography';
import {
  TEXT_ALIGN,
  TYPOGRAPHY,
  JUSTIFY_CONTENT,
  FONT_WEIGHT,
  SIZES,
  COLORS,
  BORDER_STYLE,
} from '../../../helpers/constants/design-system';
import ProgressBar from '../../../components/app/step-progress-bar';
import { useI18nContext } from '../../../hooks/useI18nContext';

export default function SecureYourWallet() {
  const history = useHistory();
  const t = useI18nContext();

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

  return (
    <div className="secure-your-wallet">
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
                default
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
      <div className="secure-your-wallet__actions">
        <Button type="primary" rounded large>
          {t('seedPhraseIntroRecommendedButtonCopy')}
        </Button>
        <Button type="secondary" rounded large>
          {t('seedPhraseIntroNotRecommendedButtonCopy')}
        </Button>
      </div>
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
      <Box marginBottom={2} textAlign={TEXT_ALIGN.CENTER}>
        <Typography tag="span" variant={TYPOGRAPHY.H4}>
          {t('seedPhraseIntroSidebarCopyThree')}
        </Typography>
      </Box>
    </div>
  );
}
