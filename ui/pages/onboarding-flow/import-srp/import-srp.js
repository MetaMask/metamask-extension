import React, { useState, useEffect, useContext } from 'react';
import { useHistory } from 'react-router-dom';
import { useSelector } from 'react-redux';
import PropTypes from 'prop-types';
import {
  TwoStepProgressBar,
  twoStepStages,
} from '../../../components/app/step-progress-bar';
import Box from '../../../components/ui/box';
import Button from '../../../components/ui/button';
import Typography from '../../../components/ui/typography';
import {
  FONT_WEIGHT,
  TEXT_ALIGN,
  TYPOGRAPHY,
} from '../../../helpers/constants/design-system';
import { ONBOARDING_CREATE_PASSWORD_ROUTE } from '../../../helpers/constants/routes';
import { useI18nContext } from '../../../hooks/useI18nContext';
import ZENDESK_URLS from '../../../helpers/constants/zendesk-url';
import SrpInput from '../../../components/app/srp-input';
import { getCurrentKeyring } from '../../../selectors';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { EVENT_NAMES, EVENT } from '../../../../shared/constants/metametrics';

export default function ImportSRP({ submitSecretRecoveryPhrase }) {
  const [secretRecoveryPhrase, setSecretRecoveryPhrase] = useState('');
  const history = useHistory();
  const t = useI18nContext();
  const currentKeyring = useSelector(getCurrentKeyring);

  useEffect(() => {
    if (currentKeyring) {
      history.replace(ONBOARDING_CREATE_PASSWORD_ROUTE);
    }
  }, [currentKeyring, history]);
  const trackEvent = useContext(MetaMetricsContext);

  return (
    <div className="import-srp" data-testid="import-srp">
      <TwoStepProgressBar
        stage={twoStepStages.RECOVERY_PHRASE_CONFIRM}
        marginBottom={4}
      />
      <div className="import-srp__header">
        <Typography variant={TYPOGRAPHY.H2} fontWeight={FONT_WEIGHT.BOLD}>
          {t('accessYourWalletWithSRP')}
        </Typography>
      </div>
      <div className="import-srp__description">
        <Typography variant={TYPOGRAPHY.H4}>
          {t('accessYourWalletWithSRPDescription', [
            <a
              key="learnMore"
              type="link"
              href={ZENDESK_URLS.SECRET_RECOVERY_PHRASE}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('learnMoreUpperCase')}
            </a>,
          ])}
        </Typography>
      </div>
      <div className="import-srp__actions">
        <Box textAlign={TEXT_ALIGN.LEFT}>
          <SrpInput
            onChange={setSecretRecoveryPhrase}
            srpText={t('typeYourSRP')}
          />
          <Button
            className="import-srp__confirm-button"
            type="primary"
            data-testid="import-srp-confirm"
            large
            onClick={() => {
              submitSecretRecoveryPhrase(secretRecoveryPhrase);
              trackEvent({
                category: EVENT.CATEGORIES.ONBOARDING,
                event: EVENT_NAMES.ONBOARDING_WALLET_SECURITY_PHRASE_CONFIRMED,
              });
              history.replace(ONBOARDING_CREATE_PASSWORD_ROUTE);
            }}
            disabled={!secretRecoveryPhrase.trim()}
          >
            {t('confirmRecoveryPhrase')}
          </Button>
        </Box>
      </div>
    </div>
  );
}

ImportSRP.propTypes = {
  submitSecretRecoveryPhrase: PropTypes.func,
};
