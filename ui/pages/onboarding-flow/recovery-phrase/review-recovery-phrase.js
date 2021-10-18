import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
import PropTypes from 'prop-types';
import Box from '../../../components/ui/box';
import Button from '../../../components/ui/button';
import Typography from '../../../components/ui/typography';
import Copy from '../../../components/ui/icon/copy-icon.component';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { ONBOARDING_CONFIRM_SRP_ROUTE } from '../../../helpers/constants/routes';
import {
  TEXT_ALIGN,
  TYPOGRAPHY,
  JUSTIFY_CONTENT,
  FONT_WEIGHT,
} from '../../../helpers/constants/design-system';
import {
  ThreeStepProgressBar,
  threeStepStages,
} from '../../../components/app/step-progress-bar';
import RecoveryPhraseChips from './recovery-phrase-chips';

export default function RecoveryPhrase({ secretRecoveryPhrase }) {
  const history = useHistory();
  const t = useI18nContext();
  const [copied, handleCopy] = useCopyToClipboard();
  const [phraseRevealed, setPhraseRevealed] = useState(false);
  return (
    <div className="recovery-phrase">
      <ThreeStepProgressBar stage={threeStepStages.RECOVERY_PHRASE_REVIEW} />
      <Box
        justifyContent={JUSTIFY_CONTENT.CENTER}
        textAlign={TEXT_ALIGN.CENTER}
        marginBottom={4}
      >
        <Typography variant={TYPOGRAPHY.H2} fontWeight={FONT_WEIGHT.BOLD}>
          {t('seedPhraseWriteDownHeader')}
        </Typography>
      </Box>
      <Box
        justifyContent={JUSTIFY_CONTENT.CENTER}
        textAlign={TEXT_ALIGN.CENTER}
        marginBottom={4}
      >
        <Typography variant={TYPOGRAPHY.H4}>
          {t('seedPhraseWriteDownDetails')}
        </Typography>
      </Box>
      <Box
        justifyContent={JUSTIFY_CONTENT.SPACE_EVENLY}
        textAlign={TEXT_ALIGN.LEFT}
        marginBottom={4}
        className="recovery-phrase__tips"
      >
        <Typography variant={TYPOGRAPHY.H4} fontWeight={FONT_WEIGHT.BOLD}>
          {t('tips')}:
        </Typography>
        <ul>
          <li>
            <Typography variant={TYPOGRAPHY.H4}>
              {t('seedPhraseIntroSidebarBulletFour')}
            </Typography>
          </li>
          <li>
            <Typography variant={TYPOGRAPHY.H4}>
              {t('seedPhraseIntroSidebarBulletTwo')}
            </Typography>
          </li>
          <li>
            <Typography variant={TYPOGRAPHY.H4}>
              {t('seedPhraseIntroSidebarBulletThree')}
            </Typography>
          </li>
          <li>
            <Typography variant={TYPOGRAPHY.H4}>
              {t('seedPhraseIntroSidebarBulletFour')}
            </Typography>
          </li>
        </ul>
      </Box>
      <RecoveryPhraseChips
        secretRecoveryPhrase={secretRecoveryPhrase.split(' ')}
        phraseRevealed={phraseRevealed}
      />
      <div className="recovery-phrase__footer">
        {phraseRevealed ? (
          <div className="recovery-phrase__footer--copy">
            <Button
              onClick={() => {
                handleCopy(secretRecoveryPhrase);
              }}
              icon={copied ? null : <Copy size={20} color="#3098DC" />}
              className="recovery-phrase__footer--copy--button"
              type="link"
            >
              {copied ? t('copiedExclamation') : t('copyToClipboard')}
            </Button>
            <Button
              type="primary"
              className="recovery-phrase__footer--button"
              onClick={() => {
                history.push(ONBOARDING_CONFIRM_SRP_ROUTE);
              }}
            >
              {t('next')}
            </Button>
          </div>
        ) : (
          <Button
            type="primary"
            className="recovery-phrase__footer--button"
            onClick={() => {
              setPhraseRevealed(true);
            }}
          >
            {t('revealSeedWords')}
          </Button>
        )}
      </div>
    </div>
  );
}

RecoveryPhrase.propTypes = {
  secretRecoveryPhrase: PropTypes.string,
};
