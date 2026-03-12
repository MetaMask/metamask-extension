import React, { useMemo } from 'react';
import {
  Box,
  Button,
  ButtonProps,
  ButtonSize,
  ButtonVariant,
  Icon,
  IconName,
  IconSize,
  Text,
  FontWeight,
  IconColor,
  TextAlign,
  TextColor,
  TextVariant,
  BoxAlignItems,
  BoxJustifyContent,
  BoxFlexDirection,
  TextTransform,
} from '@metamask/design-system-react';
import classnames from 'clsx';
import { PolymorphicRef } from '../../../components/component-library';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { ThemeType } from '../../../../shared/constants/preferences';
import { useTheme } from '../../../hooks/useTheme';
import { LOGIN_TYPE, LoginType, LoginOptionType, LOGIN_OPTION } from './types';

export const SocialButton = React.forwardRef(
  (
    {
      icon,
      label,
      btnClass,
      ...props
    }: {
      icon: React.ReactNode;
      label: string;
      btnClass?: string;
    } & Omit<ButtonProps, 'children'>,
    ref?: PolymorphicRef<'button'>,
  ) => {
    return (
      <Button
        ref={ref}
        className={classnames('options-modal__plain-button w-full', btnClass)}
        variant={ButtonVariant.Primary}
        size={ButtonSize.Lg}
        {...props}
      >
        <Box
          flexDirection={BoxFlexDirection.Row}
          alignItems={BoxAlignItems.Center}
          justifyContent={BoxJustifyContent.Center}
          className="w-full"
          gap={2}
        >
          {icon}
          <Box>{label}</Box>
        </Box>
      </Button>
    );
  },
);

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function LoginOptions({
  loginOption,
  handleLogin,
}: {
  loginOption: LoginOptionType;
  handleLogin: (loginType: LoginType) => void;
}) {
  const t = useI18nContext();
  const theme = useTheme();

  const backgroundColorForLoginOptions = useMemo(() => {
    return theme === ThemeType.light
      ? 'var(--welcome-bg-light)'
      : 'var(--color-accent02-dark)';
  }, [theme]);

  return (
    <Box>
      <SocialButton
        data-testid={
          loginOption === LOGIN_OPTION.EXISTING
            ? 'onboarding-import-with-google-button'
            : 'onboarding-create-with-google-button'
        }
        icon={
          <img
            src="images/icons/google.svg"
            className="options-modal__social-icon"
            alt={t('onboardingOptionIcon', ['Google'])}
          />
        }
        label={
          loginOption === LOGIN_OPTION.EXISTING
            ? t('onboardingSignInWith', ['Google'])
            : t('onboardingContinueWith', ['Google'])
        }
        btnClass="mb-4"
        onClick={() => handleLogin(LOGIN_TYPE.GOOGLE)}
      />
      <SocialButton
        data-testid={
          loginOption === LOGIN_OPTION.EXISTING
            ? 'onboarding-import-with-apple-button'
            : 'onboarding-create-with-apple-button'
        }
        icon={
          <Icon
            name={IconName.AppleLogo}
            color={IconColor.InfoInverse}
            size={IconSize.Lg}
          />
        }
        label={
          loginOption === LOGIN_OPTION.EXISTING
            ? t('onboardingSignInWith', ['Apple'])
            : t('onboardingContinueWith', ['Apple'])
        }
        btnClass="mb-2"
        onClick={() => handleLogin(LOGIN_TYPE.APPLE)}
      />
      <Box
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Center}
        marginBottom={4}
        className="options-modal__or"
      >
        <Text
          className="w-max px-2 mx-auto relative z-[1]"
          variant={TextVariant.BodyMd}
          fontWeight={FontWeight.Medium}
          color={TextColor.TextAlternative}
          textTransform={TextTransform.Lowercase}
          style={{
            backgroundColor: backgroundColorForLoginOptions,
          }}
        >
          {t('or')}
        </Text>
      </Box>
      <Button
        data-theme={theme === ThemeType.dark ? ThemeType.light : ThemeType.dark}
        data-testid={
          loginOption === LOGIN_OPTION.EXISTING
            ? 'onboarding-import-with-srp-button'
            : 'onboarding-create-with-srp-button'
        }
        variant={ButtonVariant.Primary}
        className="w-full"
        size={ButtonSize.Lg}
        onClick={() => handleLogin(LOGIN_TYPE.SRP)}
      >
        {loginOption === LOGIN_OPTION.EXISTING
          ? t('onboardingSrpImport')
          : t('onboardingSrpCreate')}
      </Button>
      <Text
        variant={TextVariant.BodySm}
        fontWeight={FontWeight.Medium}
        textAlign={TextAlign.Center}
        color={TextColor.TextDefault}
        className="w-full mx-auto pt-8"
      >
        {t('onboardingLoginFooter', [
          <Text
            variant={TextVariant.BodySm}
            fontWeight={FontWeight.Medium}
            color={TextColor.PrimaryDefault}
            key="onboardingLoginFooterTermsOfUse"
            asChild
          >
            <a
              href="https://consensys.io/terms-of-use"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('onboardingLoginFooterTermsOfUse')}
            </a>
          </Text>,
          <Text
            variant={TextVariant.BodySm}
            fontWeight={FontWeight.Medium}
            color={TextColor.PrimaryDefault}
            key="onboardingLoginFooterPrivacyNotice"
            asChild
          >
            <a
              href="https://consensys.io/privacy-notice"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('onboardingLoginFooterPrivacyNotice')}
            </a>
          </Text>,
        ])}
      </Text>
    </Box>
  );
}
