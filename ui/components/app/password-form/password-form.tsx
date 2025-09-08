import React, { useCallback, useEffect, useState } from 'react';
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
import {
  TextColor,
  TextVariant,
} from '../../../helpers/constants/design-system';

type PasswordFormProps = {
  onChange: (password: string) => void;
  pwdInputTestId?: string;
  confirmPwdInputTestId?: string;
};

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function PasswordForm({
  onChange,
  pwdInputTestId,
  confirmPwdInputTestId,
}: PasswordFormProps) {
  const t = useI18nContext();

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  const handlePasswordChange = useCallback(
    (passwordInput: string) => {
      const confirmError =
        !confirmPassword || passwordInput === confirmPassword
          ? ''
          : t('passwordsDontMatch');

      setPassword(passwordInput);

      setConfirmPasswordError(confirmError);
    },
    [confirmPassword, t],
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
        label={t('newPasswordCreate')}
        id="create-password-new"
        autoFocus
        autoComplete
        size={FormTextFieldSize.Lg}
        value={password}
        inputProps={{
          'data-testid': pwdInputTestId || 'create-password-new-input',
          type: showPassword ? InputType.Text : InputType.Password,
        }}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          handlePasswordChange(e.target.value);
        }}
        helpTextProps={{
          color: TextColor.textAlternative,
        }}
        helpText={
          <Text
            variant={TextVariant.inherit}
            as="span"
            data-testid={'short-password-error'}
            color={TextColor.textAlternative}
          >
            {t('passwordNotLongEnough')}
          </Text>
        }
        endAccessory={
          <ButtonIcon
            iconName={showPassword ? IconName.EyeSlash : IconName.Eye}
            data-testid="show-password"
            type="button"
            onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
              e.stopPropagation();
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
        size={FormTextFieldSize.Lg}
        error={Boolean(confirmPasswordError)}
        helpTextProps={{
          'data-testid': 'confirm-password-error',
        }}
        helpText={confirmPasswordError}
        value={confirmPassword}
        inputProps={{
          'data-testid':
            confirmPwdInputTestId || 'create-password-confirm-input',
          type: showConfirmPassword ? InputType.Text : InputType.Password,
        }}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          handleConfirmPasswordChange(e.target.value);
        }}
        endAccessory={
          <ButtonIcon
            iconName={showConfirmPassword ? IconName.EyeSlash : IconName.Eye}
            data-testid="show-confirm-password"
            type="button"
            onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
              e.stopPropagation();
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
