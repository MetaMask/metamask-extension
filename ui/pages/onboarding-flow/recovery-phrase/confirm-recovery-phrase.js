import React, { useState, useMemo, useContext } from 'react';
import { useHistory } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { debounce } from 'lodash';
import PropTypes from 'prop-types';
import Box from '../../../components/ui/box';
import Button from '../../../components/ui/button';
import { Text } from '../../../components/component-library';
import {
  TextAlign,
  TextVariant,
  JustifyContent,
  FontWeight,
} from '../../../helpers/constants/design-system';
import {
  ThreeStepProgressBar,
  threeStepStages,
} from '../../../components/app/step-progress-bar';
import { ONBOARDING_COMPLETION_ROUTE } from '../../../helpers/constants/routes';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { setSeedPhraseBackedUp } from '../../../store/actions';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import RecoveryPhraseChips from './recovery-phrase-chips';

export default function ConfirmRecoveryPhrase({ secretRecoveryPhrase = '' }) {
  const history = useHistory();
  const t = useI18nContext();
  const dispatch = useDispatch();
  const splitSecretRecoveryPhrase = secretRecoveryPhrase.split(' ');
  const indicesToCheck = [2, 3, 7];
  const [matching, setMatching] = useState(false);
  const trackEvent = useContext(MetaMetricsContext);

  // Removes seed phrase words from chips corresponding to the
  // indicesToCheck so that user has to complete the phrase and confirm
  // they have saved it.
  const initializePhraseElements = () => {
    const phraseElements = { ...splitSecretRecoveryPhrase };
    indicesToCheck.forEach((i) => {
      phraseElements[i] = '';
    });
    return phraseElements;
  };
  const [phraseElements, setPhraseElements] = useState(
    initializePhraseElements(),
  );

  const validate = useMemo(
    () =>
      debounce((elements) => {
        setMatching(Object.values(elements).join(' ') === secretRecoveryPhrase);
      }, 500),
    [setMatching, secretRecoveryPhrase],
  );

  const handleSetPhraseElements = (values) => {
    setPhraseElements(values);
    validate(values);
  };

  return (
    <div
      className="recovery-phrase__confirm"
      data-testid="confirm-recovery-phrase"
    >
      <ThreeStepProgressBar
        stage={threeStepStages.RECOVERY_PHRASE_CONFIRM}
        marginBottom={4}
      />
      <Box
        justifyContent={JustifyContent.center}
        textAlign={TextAlign.Center}
        marginBottom={4}
      >
        <Text variant={TextVariant.headingLg} fontWeight={FontWeight.Bold}>
          {t('seedPhraseConfirm')}
        </Text>
      </Box>
      <Box
        justifyContent={JustifyContent.center}
        textAlign={TextAlign.Center}
        marginBottom={4}
      >
        <Text variant={TextVariant.headingSm} fontWeight={FontWeight.Normal}>
          {t('seedPhraseEnterMissingWords')}
        </Text>
      </Box>
      <RecoveryPhraseChips
        secretRecoveryPhrase={splitSecretRecoveryPhrase}
        confirmPhase
        setInputValue={handleSetPhraseElements}
        inputValue={phraseElements}
        indicesToCheck={indicesToCheck}
      />
      <div className="recovery-phrase__footer__confirm">
        <Button
          data-testid="recovery-phrase-confirm"
          type="primary"
          large
          className="recovery-phrase__footer__confirm--button"
          onClick={async () => {
            await dispatch(setSeedPhraseBackedUp(true));
            trackEvent({
              category: MetaMetricsEventCategory.Onboarding,
              event:
                MetaMetricsEventName.OnboardingWalletSecurityPhraseConfirmed,
            });
            history.push(ONBOARDING_COMPLETION_ROUTE);
          }}
          disabled={!matching}
        >
          {t('confirm')}
        </Button>
      </div>
    </div>
  );
}

ConfirmRecoveryPhrase.propTypes = {
  secretRecoveryPhrase: PropTypes.string,
};
