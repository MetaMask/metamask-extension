import React, { useState, useContext } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
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
import { EVENT_NAMES, EVENT } from '../../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import RecoveryPhraseChips from './recovery-phrase-chips';

export default function RecoveryPhrase({ secretRecoveryPhrase }) {
  const history = useHistory();
  const t = useI18nContext();
  const { search } = useLocation();
  const [copied, handleCopy] = useCopyToClipboard();
  const [phraseRevealed, setPhraseRevealed] = useState(false);
  const [hiddenPhrase, setHiddenPhrase] = useState(false);
  const searchParams = new URLSearchParams(search);
  const isFromReminderParam = searchParams.get('isFromReminder')
    ? '/?isFromReminder=true'
    : '';
  const trackEvent = useContext(MetaMetricsContext);

  return (
    <div className="recovery-phrase" data-testid="recovery-phrase">
      <ThreeStepProgressBar stage={threeStepStages.RECOVERY_PHRASE_REVIEW} />
      <Box
        justifyContent={JUSTIFY_CONTENT.CENTER}
        textAlign={TEXT_ALIGN.CENTER}
        marginBottom={4}
      >
        <Typography
          variant={TYPOGRAPHY.H2}
          fontWeight={FONT_WEIGHT.BOLD}
          className="recovery-phrase__header"
        >
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
              {t('seedPhraseIntroSidebarBulletOne')}
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
        phraseRevealed={phraseRevealed && !hiddenPhrase}
        hiddenPhrase={hiddenPhrase}
      />
      <div className="recovery-phrase__footer">
        {phraseRevealed ? (
          <div className="recovery-phrase__footer__copy-and-hide">
            <div className="recovery-phrase__footer__copy-and-hide__area">
              <Button
                type="link"
                icon={
                  <i
                    className={`far fa-eye${hiddenPhrase ? '' : '-slash'}`}
                    color="var(--color-primary-default)"
                  />
                }
                className="recovery-phrase__footer__copy-and-hide__button recovery-phrase__footer__copy-and-hide__button__hide-seed"
                onClick={() => {
                  setHiddenPhrase(!hiddenPhrase);
                }}
              >
                {hiddenPhrase ? t('revealTheSeedPhrase') : t('hideSeedPhrase')}
              </Button>
              <Button
                onClick={() => {
                  handleCopy(secretRecoveryPhrase);
                }}
                icon={
                  copied ? null : (
                    <Copy size={20} color="var(--color-primary-default)" />
                  )
                }
                className="recovery-phrase__footer__copy-and-hide__button recovery-phrase__footer__copy-and-hide__button__copy-to-clipboard"
                type="link"
              >
                {copied ? t('copiedExclamation') : t('copyToClipboard')}
              </Button>
            </div>
            <Button
              data-testid="recovery-phrase-next"
              type="primary"
              className="recovery-phrase__footer--button"
              onClick={() => {
                trackEvent({
                  category: EVENT.CATEGORIES.ONBOARDING,
                  event:
                    EVENT_NAMES.ONBOARDING_WALLET_SECURITY_PHRASE_WRITTEN_DOWN,
                });
                history.push(
                  `${ONBOARDING_CONFIRM_SRP_ROUTE}${isFromReminderParam}`,
                );
              }}
            >
              {t('next')}
            </Button>
          </div>
        ) : (
          <Button
            data-testid="recovery-phrase-reveal"
            type="primary"
            className="recovery-phrase__footer--button"
            onClick={() => {
              trackEvent({
                category: EVENT.CATEGORIES.ONBOARDING,
                event: EVENT_NAMES.ONBOARDING_WALLET_SECURITY_PHRASE_REVEALED,
              });
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
