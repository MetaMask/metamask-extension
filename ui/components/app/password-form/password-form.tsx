import React, { useCallback, useEffect, useState } from 'react';
// import zxcvbn from 'zxcvbn';
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
};

type PasswordRule = {
  id: string;
  label: string;
  isValid: boolean;
  test: (password: string) => boolean;
};

export default function PasswordForm({ onChange }: PasswordFormProps) {
  const t = useI18nContext();

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  // 密码规则定义
  const passwordRules: PasswordRule[] = [
    {
      id: 'length',
      label: t('setPasswordTips1'),
      isValid: false,
      test: (pwd: string) => pwd.length >= PASSWORD_MIN_LENGTH,
    },
    {
      id: 'upper',
      label: t('setPasswordTips2'),
      isValid: false,
      test: (pwd: string) => /[A-Z]/.test(pwd),
    },
    {
      id: 'lower',
      label: t('setPasswordTips3'),
      isValid: false,
      test: (pwd: string) => /[a-z]/.test(pwd),
    },
    {
      id: 'number',
      label: t('setPasswordTips4'),
      isValid: false,
      test: (pwd: string) => /[0-9]/.test(pwd),
    },
    {
      id: 'special',
      label: t('setPasswordTips5'),
      isValid: false,
      test: (pwd: string) => /[@#$!]/.test(pwd),
    },
  ];

  const [rules, setRules] = useState<PasswordRule[]>(passwordRules);

  // 检查密码规则
  const checkPasswordRules = useCallback(
    (pwd: string) => {
      return passwordRules.map((rule) => ({
        ...rule,
        isValid: rule.test(pwd),
      }));
    },
    [passwordRules],
  );

  // const getPasswordStrengthLabel = useCallback(
  //   (isTooShort: boolean, score: number) => {
  //     if (isTooShort) {
  //       return {
  //         className: 'create-password__weak',
  //         dataTestId: 'short-password-error',
  //         text: t('passwordNotLongEnough'),
  //         description: '',
  //       };
  //     }
  //     if (score >= 4) {
  //       return {
  //         className: 'create-password__strong',
  //         dataTestId: 'strong-password',
  //         text: t('strong'),
  //         description: '',
  //       };
  //     }
  //     if (score === 3) {
  //       return {
  //         className: 'create-password__average',
  //         dataTestId: 'average-password',
  //         text: t('average'),
  //         description: t('passwordStrengthDescription'),
  //       };
  //     }
  //     return {
  //       className: 'create-password__weak',
  //       dataTestId: 'weak-password',
  //       text: t('weak'),
  //       description: t('passwordStrengthDescription'),
  //     };
  //   },
  //   [t],
  // );

  // const [passwordStrengthElement, setPasswordStrengthElement] = useState(null);

  const handlePasswordChange = useCallback(
    (passwordInput: string) => {
      // const isTooShort = passwordInput.length < PASSWORD_MIN_LENGTH;
      // const { score } = zxcvbn(passwordInput);
      // const passwordStrengthLabel = getPasswordStrengthLabel(isTooShort, score);
      // const passwordStrengthComponent = isTooShort ? (
      //   <Text
      //     variant={TextVariant.inherit}
      //     as="span"
      //     key={score}
      //     data-testid={passwordStrengthLabel.dataTestId}
      //     color={TextColor.textAlternative}
      //   >
      //     {passwordStrengthLabel.text}
      //   </Text>
      // ) : (
      //   t('passwordStrength', [
      //     <Text
      //       variant={TextVariant.inherit}
      //       as="span"
      //       key={score}
      //       data-testid={passwordStrengthLabel.dataTestId}
      //       className={passwordStrengthLabel.className}
      //     >
      //       {passwordStrengthLabel.text}
      //     </Text>,
      //   ])
      // );

      const confirmError =
        !confirmPassword || passwordInput === confirmPassword
          ? ''
          : t('passwordsDontMatch');

      const updatedRules = checkPasswordRules(passwordInput);
      setRules(updatedRules);

      setPassword(passwordInput);
      // setPasswordStrengthElement(passwordStrengthComponent);
      setConfirmPasswordError(confirmError);
    },
    [confirmPassword, t, checkPasswordRules],
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
      <Box marginBottom={3}>
        <Text variant={TextVariant.bodyMd} as="div" marginBottom={2}>
          {t('setPasswordTips')}
        </Text>
        <Box as="ul" className="create-password__rules-list">
          {rules.map((rule) => (
            <Box as="li" key={rule.id} className="create-password__rule-item">
              <Text
                variant={TextVariant.inherit}
                as="span"
                className={`create-password__rule-icon ${
                  rule.isValid
                    ? 'create-password__rule-icon--valid'
                    : 'create-password__rule-icon--invalid'
                }`}
              >
                •
              </Text>
              <Text
                variant={TextVariant.inherit}
                as="span"
                className={`create-password__rule-text ${
                  rule.isValid
                    ? 'create-password__rule-text--valid'
                    : 'create-password__rule-text--invalid'
                }`}
              >
                {rule.label}
              </Text>
            </Box>
          ))}
        </Box>
      </Box>

      <FormTextField
        label={t('newPasswordCreate')}
        id="create-password-new"
        autoFocus
        autoComplete
        size={FormTextFieldSize.Lg}
        value={password}
        inputProps={{
          'data-testid': 'create-password-new-input',
          type: showPassword ? InputType.Text : InputType.Password,
        }}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
          handlePasswordChange(e.target.value);
        }}
        helpTextProps={{
          color: TextColor.textAlternative,
        }}
        // helpText={passwordStrengthElement && passwordStrengthElement}
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
