import React, { useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import { useI18nContext } from '../../../hooks/useI18nContext';
import TextField from '../../ui/text-field';
import Button from '../../ui/button';
import CheckBox from '../../ui/check-box';
import Typography from '../../ui/typography';
import SrpInput from '../srp-input';

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
  const [termsChecked, setTermsChecked] = useState(false);

  const t = useI18nContext();

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
    !confirmPasswordError;

  const onImport = useCallback(
    async (event) => {
      event.preventDefault();

      if (!isValid) {
        return;
      }

      await onSubmit(password, seedPhrase);
    },
    [isValid, onSubmit, password, seedPhrase],
  );

  const toggleTermsCheck = useCallback(() => {
    setTermsChecked((currentTermsChecked) => !currentTermsChecked);
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
      <SrpInput onChange={setSeedPhrase} srpText={t('secretRecoveryPhrase')} />
      <div className="create-new-vault__create-password">
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
      </div>
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
            <Typography as="span">{termsOfUse}</Typography>
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
