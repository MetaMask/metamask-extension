import React, { useState, useMemo, useContext } from 'react';
import { useHistory } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { debounce } from 'lodash';
import PropTypes from 'prop-types';
import {
  Button,
  ButtonSize,
  Text,
  Container,
  ContainerMaxWidth,
} from '../../../components/component-library';

import {
  TextAlign,
  TextVariant,
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
      <Container
        maxWidth={ContainerMaxWidth.Lg}
        marginLeft="auto"
        marginRight="auto"
      >
        <ThreeStepProgressBar stage={threeStepStages.RECOVERY_PHRASE_CONFIRM} />
        <Text
          variant={TextVariant.headingLg}
          fontWeight={FontWeight.Bold}
          textAlign={TextAlign.Center}
          marginBottom={4}
          marginTop={4}
        >
          {t('seedPhraseConfirm')}
        </Text>
        <Text
          variant={TextVariant.bodyLgMedium}
          textAlign={TextAlign.Center}
          marginBottom={4}
        >
          {t('seedPhraseEnterMissingWords')}
        </Text>
      </Container>
      <RecoveryPhraseChips
        secretRecoveryPhrase={splitSecretRecoveryPhrase}
        confirmPhase
        setInputValue={handleSetPhraseElements}
        inputValue={phraseElements}
        indicesToCheck={indicesToCheck}
      />
      <Button
        data-testid="recovery-phrase-confirm"
        size={ButtonSize.Lg}
        block
        onClick={async () => {
          await dispatch(setSeedPhraseBackedUp(true));
          trackEvent({
            category: MetaMetricsEventCategory.Onboarding,
            event: MetaMetricsEventName.OnboardingWalletSecurityPhraseConfirmed,
          });
          history.push(ONBOARDING_COMPLETION_ROUTE);
        }}
        disabled={!matching}
      >
        {t('confirm')}
      </Button>
    </div>
  );
}

ConfirmRecoveryPhrase.propTypes = {
  secretRecoveryPhrase: PropTypes.string,
};
