import React, { useState, useContext } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import PropTypes from 'prop-types';
import Button from '../../../components/ui/button';
import { useCopyToClipboard } from '../../../hooks/useCopyToClipboard';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { ONBOARDING_CONFIRM_SRP_ROUTE } from '../../../helpers/constants/routes';
import {
  Text,
  Icon,
  IconName,
  Box,
} from '../../../components/component-library';
import {
  TextVariant,
  TextAlign,
  JustifyContent,
  FontWeight,
  IconColor,
} from '../../../helpers/constants/design-system';
import {
  ThreeStepProgressBar,
  threeStepStages,
} from '../../../components/app/step-progress-bar';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
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
        justifyContent={JustifyContent.center}
        textAlign={TextAlign.Center}
        marginBottom={4}
      >
        <Text
          variant={TextVariant.headingLg}
          fontWeight={FontWeight.Bold}
          className="recovery-phrase__header"
        >
          {t('seedPhraseWriteDownHeader')}
        </Text>
      </Box>
      <Box
        justifyContent={JustifyContent.center}
        textAlign={TextAlign.Center}
        marginBottom={4}
      >
        <Text variant={TextVariant.headingSm} fontWeight={FontWeight.Normal}>
          {t('seedPhraseWriteDownDetails')}
        </Text>
      </Box>
      <Box
        textAlign={TextAlign.Left}
        marginBottom={4}
        className="recovery-phrase__tips"
      >
        <Text variant={TextVariant.headingSm}>{t('tips')}:</Text>
        <ul>
          <li>
            <Text
              variant={TextVariant.headingSm}
              fontWeight={FontWeight.Normal}
            >
              {t('seedPhraseIntroSidebarBulletOne')}
            </Text>
          </li>
          <li>
            <Text
              variant={TextVariant.headingSm}
              fontWeight={FontWeight.Normal}
            >
              {t('seedPhraseIntroSidebarBulletTwo')}
            </Text>
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
                  <Icon
                    name={copied ? IconName.CopySuccess : IconName.Copy}
                    color={IconColor.primaryDefault}
                  />
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
                  category: MetaMetricsEventCategory.Onboarding,
                  event:
                    MetaMetricsEventName.OnboardingWalletSecurityPhraseWrittenDown,
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
                category: MetaMetricsEventCategory.Onboarding,
                event:
                  MetaMetricsEventName.OnboardingWalletSecurityPhraseRevealed,
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
