import React, { useCallback, useEffect, useState } from 'react';
import zxcvbn from 'zxcvbn';
import {
  Box,
  ButtonIcon,
  FormTextField,
  FormTextFieldSize,
  IconName,
  InputType,
  Text,
} from '../../component-library';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { PASSWORD_MIN_LENGTH } from '../../../helpers/constants/common';
import { TextVariant } from '../../../helpers/constants/design-system';

type PasswordFormProps = {
  onChange: (password: string) => void;
};

export default function PasswordForm({ onChange }: PasswordFormProps) {
  const t = useI18nContext();

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  const getPasswordStrengthLabel = useCallback(
    (isTooShort: boolean, score: number) => {
      if (isTooShort) {
        return {
          className: 'create-password__weak',
          dataTestId: 'short-password-error',
          text: t('passwordNotLongEnough'),
          description: '',
        };
      }
      if (score >= 4) {
        return {
          className: 'create-password__strong',
          dataTestId: 'strong-password',
          text: t('strong'),
          description: '',
        };
      }
      if (score === 3) {
        return {
          className: 'create-password__average',
          dataTestId: 'average-password',
          text: t('average'),
          description: t('passwordStrengthDescription'),
        };
      }
      return {
        className: 'create-password__weak',
        dataTestId: 'weak-password',
        text: t('weak'),
        description: t('passwordStrengthDescription'),
      };
    },
    [t],
  );

  const [passwordStrengthElement, setPasswordStrengthElement] = useState(() => {
    const passwordStrengthLabel = getPasswordStrengthLabel(true, 0);
    return (
      <Text
        variant={TextVariant.inherit}
        as="span"
        key={0}
        data-testid={passwordStrengthLabel.dataTestId}
      >
        {passwordStrengthLabel.text}
      </Text>
    );
  });

  const handlePasswordChange = useCallback(
    (passwordInput: string) => {
      const isTooShort = passwordInput.length < PASSWORD_MIN_LENGTH;
      const { score } = zxcvbn(passwordInput);
      const passwordStrengthLabel = getPasswordStrengthLabel(isTooShort, score);
      const passwordStrengthComponent = isTooShort ? (
        <Text
          variant={TextVariant.inherit}
          as="span"
          key={score}
          data-testid={passwordStrengthLabel.dataTestId}
        >
          {passwordStrengthLabel.text}
        </Text>
      ) : (
        t('passwordStrength', [
          <Text
            variant={TextVariant.inherit}
            as="span"
            key={score}
            data-testid={passwordStrengthLabel.dataTestId}
            className={passwordStrengthLabel.className}
          >
            {passwordStrengthLabel.text}
          </Text>,
        ])
      );

      const confirmError =
        !confirmPassword || passwordInput === confirmPassword
          ? ''
          : t('passwordsDontMatch');

      setPassword(passwordInput);
      setPasswordStrengthElement(passwordStrengthComponent);
      setConfirmPasswordError(confirmError);
    },
    [confirmPassword, t, getPasswordStrengthLabel],
  );

  const handleConfirmPasswordChange = useCallback(
    (confirmPasswordInput: string) => {
      const error =
        password === confirmPasswordInput || confirmPasswordInput.length === 0
          ? ''
          : t('passwordsDontMatch');

      setConfirmPassword(confirmPasswordInput);
      setConfirmPasswordError(error);
    },
    [password, t],
  );

  useEffect(() => {
    if (
      password.length >= PASSWORD_MIN_LENGTH &&
      confirmPassword.length >= PASSWORD_MIN_LENGTH &&
      password === confirmPassword
    ) {
      onChange(password);
    } else {
      onChange('');
    }
  }, [password, confirmPassword, onChange]);

  return (
    <Box>
      <FormTextField
        label={t('newPassword')}
        id="create-password-new"
        autoFocus
        autoComplete
        placeholder={t('newPasswordPlaceholder')}
        labelProps={{ marginBottom: 1, children: t('newPassword') }}
        size={FormTextFieldSize.Lg}
        value={password}
        inputProps={{
          'data-testid': 'create-password-new-input',
          type: showPassword ? InputType.Text : InputType.Password,
        }}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          handlePasswordChange(e.target.value);
        }}
        helpText={
          passwordStrengthElement && (
            <Text as="div" variant={TextVariant.inherit}>
              {passwordStrengthElement}
            </Text>
          )
        }
        endAccessory={
          <ButtonIcon
            iconName={showPassword ? IconName.EyeSlash : IconName.Eye}
            data-testid="show-password"
            onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
              e.preventDefault();
              setShowPassword(!showPassword);
            }}
            ariaLabel={
              showPassword ? t('passwordToggleHide') : t('passwordToggleShow')
            }
          />
        }
      />

      <FormTextField
        label={t('confirmPassword')}
        id="create-password-confirm"
        autoComplete
        marginTop={4}
        placeholder={t('confirmPasswordPlaceholder')}
        labelProps={{ marginBottom: 1, children: t('confirmPassword') }}
        size={FormTextFieldSize.Lg}
        error={Boolean(confirmPasswordError)}
        helpText={confirmPasswordError}
        value={confirmPassword}
        disabled={password.length < PASSWORD_MIN_LENGTH}
        inputProps={{
          'data-testid': 'create-password-confirm-input',
          type: showConfirmPassword ? InputType.Text : InputType.Password,
        }}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          handleConfirmPasswordChange(e.target.value);
        }}
        endAccessory={
          <ButtonIcon
            iconName={showConfirmPassword ? IconName.EyeSlash : IconName.Eye}
            data-testid="show-confirm-password"
            onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
              e.preventDefault();
              setShowConfirmPassword(!showConfirmPassword);
            }}
            ariaLabel={
              showConfirmPassword
                ? t('passwordToggleHide')
                : t('passwordToggleShow')
            }
          />
        }
      />
    </Box>
  );
}
