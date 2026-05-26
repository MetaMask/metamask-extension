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
  TextButton,
  TextButtonSize,
} from '@metamask/design-system-react';
import classnames from 'clsx';
import { PolymorphicRef } from '../../../components/component-library';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { ThemeType } from '../../../../shared/constants/preferences';
import { getIsTelegramLoginFeatureEnabled } from '../../../../shared/lib/environment';
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
          <span aria-hidden="true">{icon}</span>
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
  const isTelegramLoginFeatureEnabled = getIsTelegramLoginFeatureEnabled();

  const backgroundColorForLoginOptions = useMemo(() => {
    return theme === ThemeType.light
      ? 'var(--welcome-bg-light)'
      : 'var(--color-accent02-dark)';
  }, [theme]);

  const isExisting = useMemo(() => {
    return loginOption === LOGIN_OPTION.EXISTING;
  }, [loginOption]);

  const socialOptions: {
    name: string;
    loginType: LoginType;
    testIdSuffix: string;
    icon: React.ReactNode;
    btnClass: string;
  }[] = [
    {
      name: 'Google',
      loginType: LOGIN_TYPE.GOOGLE,
      testIdSuffix: 'google',
      icon: (
        <img
          src="images/icons/google.svg"
          className="options-modal__social-icon"
          alt=""
        />
      ),
      btnClass: 'mb-4',
    },
    {
      name: 'Apple',
      loginType: LOGIN_TYPE.APPLE,
      testIdSuffix: 'apple',
      icon: (
        <Icon
          name={IconName.AppleLogo}
          color={IconColor.InfoInverse}
          size={IconSize.Lg}
        />
      ),
      btnClass: 'mb-4',
    },
  ];

  if (isTelegramLoginFeatureEnabled) {
    socialOptions.push({
      name: 'Telegram',
      loginType: LOGIN_TYPE.TELEGRAM,
      testIdSuffix: 'telegram',
      icon: (
        <img
          src="images/icons/telegram.svg"
          className="options-modal__social-icon"
          alt=""
        />
      ),
      btnClass: 'mb-2',
    });
  }

  return (
    <Box>
      {socialOptions.map(
        ({ name, loginType, testIdSuffix, icon, btnClass }) => (
          <SocialButton
            key={loginType}
            data-testid={`onboarding-${
              isExisting ? 'import' : 'create'
            }-with-${testIdSuffix}-button`}
            icon={icon}
            label={t(
              isExisting ? 'onboardingSignInWith' : 'onboardingContinueWith',
              [name],
            )}
            btnClass={btnClass}
            onClick={() => handleLogin(loginType)}
          />
        ),
      )}
      <Box
        flexDirection={BoxFlexDirection.Row}
        alignItems={BoxAlignItems.Center}
        marginBottom={4}
        className="options-modal__or"
        role="separator"
        aria-orientation="horizontal"
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
        data-testid={`onboarding-${
          isExisting ? 'import' : 'create'
        }-with-srp-button`}
        variant={ButtonVariant.Primary}
        className="w-full"
        size={ButtonSize.Lg}
        onClick={() => handleLogin(LOGIN_TYPE.SRP)}
      >
        {t(isExisting ? 'onboardingSrpImport' : 'onboardingSrpCreate')}
      </Button>
      <Text
        variant={TextVariant.BodySm}
        fontWeight={FontWeight.Medium}
        textAlign={TextAlign.Center}
        color={TextColor.TextDefault}
        className="w-full mx-auto pt-8"
      >
        {t('onboardingLoginFooter', [
          <TextButton
            size={TextButtonSize.BodySm}
            key="onboardingLoginFooterTermsOfUse"
            asChild
          >
            <a
              href="https://consensys.io/terms-of-use"
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${t('onboardingLoginFooterTermsOfUse')} (${t(
                'opensInNewTab',
              )})`}
            >
              {t('onboardingLoginFooterTermsOfUse')}
            </a>
          </TextButton>,
          <TextButton
            size={TextButtonSize.BodySm}
            key="onboardingLoginFooterPrivacyNotice"
            asChild
          >
            <a
              href="https://consensys.io/privacy-notice"
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`${t('onboardingLoginFooterPrivacyNotice')} (${t(
                'opensInNewTab',
              )})`}
            >
              {t('onboardingLoginFooterPrivacyNotice')}
            </a>
          </TextButton>,
        ])}
      </Text>
    </Box>
  );
}
