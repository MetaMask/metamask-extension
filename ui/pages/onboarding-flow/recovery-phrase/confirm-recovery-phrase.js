import React, { useState, useMemo } from 'react';
import { useHistory } from 'react-router-dom';
import { debounce } from 'lodash';
import PropTypes from 'prop-types';
import Box from '../../../components/ui/box';
import Button from '../../../components/ui/button';
import Typography from '../../../components/ui/typography';
import {
  TEXT_ALIGN,
  TYPOGRAPHY,
  JUSTIFY_CONTENT,
  FONT_WEIGHT,
} from '../../../helpers/constants/design-system';
import { INITIALIZE_END_OF_FLOW_ROUTE } from '../../../helpers/constants/routes';
import ProgressBar from '../../../components/app/step-progress-bar';
import { useI18nContext } from '../../../hooks/useI18nContext';
import RecoveryPhraseChips from './recovery-phrase-chips';

export default function ConfirmRecoveryPhrase({ seedPhrase = '' }) {
  const history = useHistory();
  const t = useI18nContext();
  const splitSeedPhrase = seedPhrase.split(' ');
  const indicesToCheck = [2, 3, 7];
  const [matching, setMatching] = useState(false);

  // Removes seed phrase words from chips corresponding to the
  // indicesToCheck so that user has to complete the phrase and confirm
  // they have saved it.
  const initializePhraseElements = () => {
    const phraseElements = { ...splitSeedPhrase };
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
        setMatching(Object.values(elements).join(' ') === seedPhrase);
      }, 500),
    [setMatching, seedPhrase],
  );

  const handleSetPhraseElements = (values) => {
    setPhraseElements(values);
    validate(values);
  };

  return (
    <div>
      <ProgressBar stage="SEED_PHRASE_CONFIRM" />
      <Box
        justifyContent={JUSTIFY_CONTENT.CENTER}
        textAlign={TEXT_ALIGN.CENTER}
        marginBottom={4}
      >
        <Typography variant={TYPOGRAPHY.H2} fontWeight={FONT_WEIGHT.BOLD}>
          {t('seedPhraseConfirm')}
        </Typography>
      </Box>
      <Box
        justifyContent={JUSTIFY_CONTENT.CENTER}
        textAlign={TEXT_ALIGN.CENTER}
        marginBottom={4}
      >
        <Typography variant={TYPOGRAPHY.H4}>
          {t('seedPhraseEnterMissingWords')}
        </Typography>
      </Box>
      <RecoveryPhraseChips
        seedPhrase={splitSeedPhrase}
        confirmPhase
        setInputValue={handleSetPhraseElements}
        inputValue={phraseElements}
        indicesToCheck={indicesToCheck}
      />
      <div className="recovery-phrase__footer">
        <Button
          rounded
          type="primary"
          className="recovery-phrase__footer--button"
          onClick={() => {
            history.push(INITIALIZE_END_OF_FLOW_ROUTE);
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
  seedPhrase: PropTypes.string,
};
