import React, { useCallback, useState } from 'react';
import PropTypes from 'prop-types';
import { useI18nContext } from '../../../hooks/useI18nContext';
import TextField from '../../ui/text-field';
import { ButtonVariant, Button, Checkbox } from '../../component-library';
import SrpInput from '../srp-input';
import { PASSWORD_MIN_LENGTH } from '../../../helpers/constants/common';

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

      if (newPassword && newPassword.length < PASSWORD_MIN_LENGTH) {
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
          data-testid="create-vault-password"
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
          data-testid="create-vault-confirm-password"
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
          <Checkbox
            id="create-new-vault-terms-checkbox"
            data-testid="create-new-vault-terms-checkbox"
            isChecked={termsChecked}
            onChange={toggleTermsCheck}
            label={termsOfUse}
          />
        </div>
      ) : null}
      <Button
        data-testid="create-new-vault-submit-button"
        className="create-new-vault__submit-button"
        variant={ButtonVariant.Primary}
        disabled={!isValid}
        type="submit"
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
