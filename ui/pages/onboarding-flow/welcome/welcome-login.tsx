import React, { useCallback, useState } from 'react';
import { useDispatch } from 'react-redux';
import {
  Box,
  Button,
  ButtonSize,
  ButtonVariant,
} from '../../../components/component-library';
import {
  AlignItems,
  BlockSize,
  Display,
  FlexDirection,
  JustifyContent,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getIsSeedlessOnboardingFeatureEnabled } from '../../../../shared/modules/environment';
import { ThemeType } from '../../../../shared/constants/preferences';
import { setTermsOfUseLastAgreed } from '../../../store/actions';
import LoginOptions from './login-options';
import { LOGIN_OPTION, LOGIN_TYPE, LoginOptionType, LoginType } from './types';

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function WelcomeLogin({
  onLogin,
}: {
  onLogin: (loginType: LoginType, loginOption: string) => Promise<void>;
}) {
  const t = useI18nContext();
  const [showLoginOptions, setShowLoginOptions] = useState(false);
  const [loginOption, setLoginOption] = useState<LoginOptionType | null>(null);
  const isSeedlessOnboardingFeatureEnabled =
    getIsSeedlessOnboardingFeatureEnabled();
  const dispatch = useDispatch();

  const handleLogin = useCallback(
    async (loginType: LoginType) => {
      if (!loginOption) {
        return;
      }
      setShowLoginOptions(false);

      await dispatch(setTermsOfUseLastAgreed(new Date().getTime()));

      await onLogin(loginType, loginOption);
    },
    [dispatch, loginOption, onLogin],
  );

  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      justifyContent={JustifyContent.spaceBetween}
      gap={12}
      marginInline="auto"
      className="welcome-login"
      data-testid="get-started"
    >
      <Box
        display={Display.Flex}
        justifyContent={JustifyContent.center}
        alignItems={AlignItems.center}
        width={BlockSize.Full}
      >
        <img
          src="images/logo/metamask-logo.svg"
          alt="MetaMask Logo"
          height={180}
          width={180}
        />
      </Box>
      <Box
        data-theme={ThemeType.dark}
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        gap={4}
      >
        <Button
          data-testid="onboarding-create-wallet"
          variant={ButtonVariant.Primary}
          size={ButtonSize.Lg}
          block
          onClick={async () => {
            setShowLoginOptions(true);
            setLoginOption(LOGIN_OPTION.NEW);
            if (!isSeedlessOnboardingFeatureEnabled) {
              await onLogin(LOGIN_TYPE.SRP, LOGIN_OPTION.NEW);
            }
          }}
        >
          {t('onboardingCreateWallet')}
        </Button>
        <Button
          data-theme={ThemeType.light}
          data-testid="onboarding-import-wallet"
          variant={ButtonVariant.Primary}
          size={ButtonSize.Lg}
          block
          onClick={async () => {
            setShowLoginOptions(true);
            setLoginOption(LOGIN_OPTION.EXISTING);
            if (!isSeedlessOnboardingFeatureEnabled) {
              await onLogin(LOGIN_TYPE.SRP, LOGIN_OPTION.EXISTING);
            }
          }}
        >
          {isSeedlessOnboardingFeatureEnabled
            ? t('onboardingImportWallet')
            : t('onboardingSrpImport')}
        </Button>
      </Box>
      {isSeedlessOnboardingFeatureEnabled &&
        showLoginOptions &&
        loginOption && (
          <LoginOptions
            loginOption={loginOption}
            onClose={() => {
              setLoginOption(null);
            }}
            handleLogin={handleLogin}
          />
        )}
    </Box>
  );
}
