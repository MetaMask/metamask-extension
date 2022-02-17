import { ethers } from 'ethers';
import React, { useCallback, useContext, useState } from 'react';
import PropTypes from 'prop-types';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import TextField from '../../ui/text-field';
import Button from '../../ui/button';
import { clearClipboard } from '../../../helpers/utils/util';
import CheckBox from '../../ui/check-box';
import Typography from '../../ui/typography';
import { COLORS } from '../../../helpers/constants/design-system';
import { parseSecretRecoveryPhrase } from './parse-secret-recovery-phrase';

const { isValidMnemonic } = ethers.utils;

export default function CreateNewVault({
  disabled = false,
  includeTerms = false,
  onSubmit,
  submitText,
}) {
  const [confirmPassword, setConfirmPassword] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [seedPhrase, setSeedPhrase] = useState('');
  const [seedPhraseError, setSeedPhraseError] = useState('');
  const [showSeedPhrase, setShowSeedPhrase] = useState(false);
  const [termsChecked, setTermsChecked] = useState(false);

  const t = useI18nContext();
  const metricsEvent = useContext(MetaMetricsContext);

  const onSeedPhraseChange = useCallback(
    (rawSeedPhrase) => {
      let newSeedPhraseError = '';

      if (rawSeedPhrase) {
        const parsedSeedPhrase = parseSecretRecoveryPhrase(rawSeedPhrase);
        const wordCount = parsedSeedPhrase.split(/\s/u).length;
        if (wordCount % 3 !== 0 || wordCount > 24 || wordCount < 12) {
          newSeedPhraseError = t('seedPhraseReq');
        } else if (!isValidMnemonic(parsedSeedPhrase)) {
          newSeedPhraseError = t('invalidSeedPhrase');
        }
      }

      setSeedPhrase(rawSeedPhrase);
      setSeedPhraseError(newSeedPhraseError);
    },
    [setSeedPhrase, setSeedPhraseError, t],
  );

  const onPasswordChange = useCallback(
    (newPassword) => {
      let newConfirmPasswordError = '';
      let newPasswordError = '';

      if (newPassword && newPassword.length < 8) {
        newPasswordError = t('passwordNotLongEnough');
      }

      if (confirmPassword && newPassword !== confirmPassword) {
        newConfirmPasswordError = t('passwordsDontMatch');
      }

      setPassword(newPassword);
      setPasswordError(newPasswordError);
      setConfirmPasswordError(newConfirmPasswordError);
    },
    [confirmPassword, t],
  );

  const onConfirmPasswordChange = useCallback(
    (newConfirmPassword) => {
      let newConfirmPasswordError = '';

      if (password !== newConfirmPassword) {
        newConfirmPasswordError = t('passwordsDontMatch');
      }

      setConfirmPassword(newConfirmPassword);
      setConfirmPasswordError(newConfirmPasswordError);
    },
    [password, t],
  );

  const isValid =
    !disabled &&
    password &&
    confirmPassword &&
    password === confirmPassword &&
    seedPhrase &&
    (!includeTerms || termsChecked) &&
    !passwordError &&
    !confirmPasswordError &&
    !seedPhraseError;

  const onImport = useCallback(
    async (event) => {
      event.preventDefault();

      if (!isValid) {
        return;
      }

      await onSubmit(password, parseSecretRecoveryPhrase(seedPhrase));
    },
    [isValid, onSubmit, password, seedPhrase],
  );

  const toggleTermsCheck = useCallback(() => {
    metricsEvent({
      eventOpts: {
        category: 'Onboarding',
        action: 'Import Seed Phrase',
        name: 'Check ToS',
      },
    });

    setTermsChecked((currentTermsChecked) => !currentTermsChecked);
  }, [metricsEvent]);

  const toggleShowSeedPhrase = useCallback(() => {
    setShowSeedPhrase((currentShowSeedPhrase) => !currentShowSeedPhrase);
  }, []);

  const termsOfUse = t('acceptTermsOfUse', [
    <a
      className="create-new-vault__terms-link"
      key="create-new-vault__link-text"
      href="https://metamask.io/terms.html"
      target="_blank"
      rel="noopener noreferrer"
    >
      {t('terms')}
    </a>,
  ]);

  return (
    <form className="create-new-vault__form" onSubmit={onImport}>
      <div className="create-new-vault__srp-section">
        <label
          htmlFor="create-new-vault__srp"
          className="create-new-vault__srp-label"
        >
          <Typography>{t('secretRecoveryPhrase')}</Typography>
        </label>
        {showSeedPhrase ? (
          <textarea
            id="create-new-vault__srp"
            className="create-new-vault__srp-shown"
            onChange={(e) => onSeedPhraseChange(e.target.value)}
            onPaste={clearClipboard}
            value={seedPhrase}
            placeholder={t('seedPhrasePlaceholder')}
            autoComplete="off"
          />
        ) : (
          <TextField
            id="create-new-vault__srp"
            type="password"
            onChange={(e) => onSeedPhraseChange(e.target.value)}
            value={seedPhrase}
            placeholder={t('seedPhrasePlaceholderPaste')}
            autoComplete="off"
            onPaste={clearClipboard}
          />
        )}
        {seedPhraseError ? (
          <Typography
            color={COLORS.ERROR1}
            tag="span"
            className="create-new-vault__srp-error"
          >
            {seedPhraseError}
          </Typography>
        ) : null}
        <div className="create-new-vault__show-srp">
          <CheckBox
            id="create-new-vault__show-srp-checkbox"
            checked={showSeedPhrase}
            onClick={toggleShowSeedPhrase}
            title={t('showSeedPhrase')}
          />
          <label
            className="create-new-vault__show-srp-label"
            htmlFor="create-new-vault__show-srp-checkbox"
          >
            <Typography tag="span">{t('showSeedPhrase')}</Typography>
          </label>
        </div>
      </div>
      <TextField
        id="password"
        label={t('newPassword')}
        type="password"
        value={password}
        onChange={(event) => onPasswordChange(event.target.value)}
        error={passwordError}
        autoComplete="new-password"
        margin="normal"
        largeLabel
      />
      <TextField
        id="confirm-password"
        label={t('confirmPassword')}
        type="password"
        value={confirmPassword}
        onChange={(event) => onConfirmPasswordChange(event.target.value)}
        error={confirmPasswordError}
        autoComplete="new-password"
        margin="normal"
        largeLabel
      />
      {includeTerms ? (
        <div className="create-new-vault__terms">
          <CheckBox
            id="create-new-vault__terms-checkbox"
            dataTestId="create-new-vault__terms-checkbox"
            checked={termsChecked}
            onClick={toggleTermsCheck}
          />
          <label
            className="create-new-vault__terms-label"
            htmlFor="create-new-vault__terms-checkbox"
          >
            <Typography tag="span">{termsOfUse}</Typography>
          </label>
        </div>
      ) : null}
      <Button
        className="create-new-vault__submit-button"
        type="primary"
        submit
        disabled={!isValid}
      >
        {submitText}
      </Button>
    </form>
  );
}

CreateNewVault.propTypes = {
  disabled: PropTypes.bool,
  includeTerms: PropTypes.bool,
  onSubmit: PropTypes.func.isRequired,
  submitText: PropTypes.string.isRequired,
};
