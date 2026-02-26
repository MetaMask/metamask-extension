import React, { useMemo } from 'react';
import {
  Box,
  BoxProps,
  Button,
  ButtonSize,
  ButtonVariant,
  Icon,
  IconName,
  IconSize,
  PolymorphicRef,
  Text,
} from '../../../components/component-library';
import {
  AlignItems,
  BlockSize,
  Display,
  FontWeight,
  IconColor,
  JustifyContent,
  TextAlign,
  TextColor,
  TextTransform,
  TextVariant,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { ThemeType } from '../../../../shared/constants/preferences';
import { useTheme } from '../../../hooks/useTheme';
import { LOGIN_TYPE, LoginType, LoginOptionType, LOGIN_OPTION } from './types';

export const SocialButton = React.forwardRef(
  (
    {
      icon,
      label,
      ...props
    }: { icon: React.ReactNode; label: string } & BoxProps<'button'>,
    ref?: PolymorphicRef<'button'>,
  ) => {
    return (
      <Button
        ref={ref}
        className="options-modal__plain-button"
        variant={ButtonVariant.Primary}
        size={ButtonSize.Lg}
        block
        {...props}
      >
        <Box
          display={Display.Flex}
          alignItems={AlignItems.center}
          justifyContent={JustifyContent.center}
          width={BlockSize.Full}
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
        marginBottom={4}
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
            name={IconName.Apple}
            color={IconColor.infoInverse}
            size={IconSize.Lg}
          />
        }
        label={
          loginOption === LOGIN_OPTION.EXISTING
            ? t('onboardingSignInWith', ['Apple'])
            : t('onboardingContinueWith', ['Apple'])
        }
        marginBottom={2}
        onClick={() => handleLogin(LOGIN_TYPE.APPLE)}
      />
      <Box
        alignItems={AlignItems.center}
        marginBottom={4}
        className="options-modal__or"
      >
        <Text
          width={BlockSize.Max}
          variant={TextVariant.bodyMd}
          fontWeight={FontWeight.Medium}
          color={TextColor.textAlternative}
          paddingInline={2}
          marginInline="auto"
          textTransform={TextTransform.Lowercase}
          as="div"
          style={{
            position: 'relative',
            zIndex: 1,
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
        width={BlockSize.Full}
        size={ButtonSize.Lg}
        onClick={() => handleLogin(LOGIN_TYPE.SRP)}
      >
        {loginOption === LOGIN_OPTION.EXISTING
          ? t('onboardingSrpImport')
          : t('onboardingSrpCreate')}
      </Button>
      <Text
        variant={TextVariant.bodySm}
        fontWeight={FontWeight.Medium}
        textAlign={TextAlign.Center}
        paddingTop={8}
        color={TextColor.textDefault}
        width={BlockSize.Full}
        margin={'auto'}
      >
        {t('onboardingLoginFooter', [
          <Text
            as="a"
            href="https://consensys.io/terms-of-use"
            target="_blank"
            rel="noopener noreferrer"
            variant={TextVariant.bodySm}
            fontWeight={FontWeight.Medium}
            color={TextColor.primaryDefault}
            key="onboardingLoginFooterTermsOfUse"
          >
            {t('onboardingLoginFooterTermsOfUse')}
          </Text>,
          <Text
            as="a"
            variant={TextVariant.bodySm}
            fontWeight={FontWeight.Medium}
            href="https://consensys.io/privacy-notice"
            target="_blank"
            rel="noopener noreferrer"
            color={TextColor.primaryDefault}
            key="onboardingLoginFooterPrivacyNotice"
          >
            {t('onboardingLoginFooterPrivacyNotice')}
          </Text>,
        ])}
      </Text>
    </Box>
  );
}
