import { ethers } from 'ethers';
import React, { useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import { useI18nContext } from '../../../hooks/useI18nContext';
import TextField from '../../ui/text-field';
import { clearClipboard } from '../../../helpers/utils/util';
import CheckBox from '../../ui/check-box';
import Typography from '../../ui/typography';
import { COLORS } from '../../../helpers/constants/design-system';
import Textarea from '../../ui/textarea';
import { parseSecretRecoveryPhrase } from './parse-secret-recovery-phrase';

const { isValidMnemonic } = ethers.utils;

export default function SrpInput({ onChange }) {
  const [srpError, setSrpError] = useState('');
  const [draftSrp, setDraftSrp] = useState('');
  const [showSrp, setShowSrp] = useState(false);

  const t = useI18nContext();

  const onSrpChange = useCallback(
    (event) => {
      const rawSrp = event.target.value;
      let newSrpError = '';
      const parsedSeedPhrase = parseSecretRecoveryPhrase(rawSrp);

      if (rawSrp) {
        const wordCount = parsedSeedPhrase.split(/\s/u).length;
        if (wordCount % 3 !== 0 || wordCount > 24 || wordCount < 12) {
          newSrpError = t('seedPhraseReq');
        } else if (!isValidMnemonic(parsedSeedPhrase)) {
          newSrpError = t('invalidSeedPhrase');
        }
      }

      setDraftSrp(rawSrp);
      setSrpError(newSrpError);
      onChange(newSrpError ? '' : parsedSeedPhrase);
    },
    [setDraftSrp, setSrpError, t, onChange],
  );

  const toggleShowSrp = useCallback(() => {
    setShowSrp((currentShowSrp) => !currentShowSrp);
  }, []);

  return (
    <>
      <label htmlFor="import-srp__srp" className="import-srp__srp-label">
        <Typography>{t('secretRecoveryPhrase')}</Typography>
      </label>
      {showSrp ? (
        <Textarea
          id="import-srp__srp"
          className="import-srp__srp-shown"
          onChange={onSrpChange}
          onPaste={clearClipboard}
          value={draftSrp}
          placeholder={t('seedPhrasePlaceholder')}
          autoComplete="off"
        />
      ) : (
        <TextField
          id="import-srp__srp"
          type="password"
          onChange={onSrpChange}
          value={draftSrp}
          placeholder={t('seedPhrasePlaceholderPaste')}
          autoComplete="off"
          onPaste={clearClipboard}
        />
      )}
      {srpError ? (
        <Typography
          color={COLORS.ERROR_DEFAULT}
          tag="span"
          className="import-srp__srp-error"
        >
          {srpError}
        </Typography>
      ) : null}
      <div className="import-srp__show-srp">
        <CheckBox
          id="import-srp__show-srp-checkbox"
          checked={showSrp}
          onClick={toggleShowSrp}
          title={t('showSeedPhrase')}
        />
        <label
          className="import-srp__show-srp-label"
          htmlFor="import-srp__show-srp-checkbox"
        >
          <Typography tag="span">{t('showSeedPhrase')}</Typography>
        </label>
      </div>
    </>
  );
}

SrpInput.propTypes = {
  /**
   * Event handler for SRP changes.
   *
   * This is only called with a valid, well-formated (i.e. exactly one space
   * between each word) SRP or with an empty string.
   *
   * This is called each time the draft SRP is updated. If the draft SRP is
   * valid, this is called with a well-formatted version of that draft SRP.
   * Otherwise, this is called with an empty string.
   */
  onChange: PropTypes.func.isRequired,
};
