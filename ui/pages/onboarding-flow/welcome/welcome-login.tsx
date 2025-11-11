import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useSearchParams, useNavigate } from 'react-router-dom-v5-compat';
import {
  Box,
  Button,
  ButtonSize,
  ButtonVariant,
} from '../../../components/component-library';
import {
  Display,
  FlexDirection,
  BlockSize,
} from '../../../helpers/constants/design-system';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getIsSeedlessOnboardingFeatureEnabled } from '../../../../shared/modules/environment';
import { ThemeType } from '../../../../shared/constants/preferences';
import { setTermsOfUseLastAgreed } from '../../../store/actions';
import { useTheme } from '../../../hooks/useTheme';
import { ONBOARDING_WELCOME_ROUTE } from '../../../helpers/constants/routes';
import LoginOptions from './login-options';
import { LOGIN_OPTION, LOGIN_TYPE, LoginOptionType, LoginType } from './types';

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function WelcomeLogin({
  onLogin,
  isAnimationComplete,
  skipTransition = false,
}: {
  onLogin: (loginType: LoginType, loginOption: string) => Promise<void>;
  isAnimationComplete: boolean;
  skipTransition?: boolean;
}) {
  const t = useI18nContext();
  const [showLoginOptions, setShowLoginOptions] = useState(false);
  const [loginOption, setLoginOption] = useState<LoginOptionType | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const isSeedlessOnboardingFeatureEnabled =
    getIsSeedlessOnboardingFeatureEnabled();
  const dispatch = useDispatch();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const theme = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const loginParam = searchParams.get('login');

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (loginParam) {
      setShowLoginOptions(true);
      setLoginOption(loginParam as LoginOptionType);
    } else {
      setShowLoginOptions(false);
      setLoginOption(null);
    }
  }, [loginParam]);

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

  const handleButtonClick = async (
    option: LoginOptionType,
    loginType?: LoginType,
  ) => {
    if (isSeedlessOnboardingFeatureEnabled) {
      setIsTransitioning(true);
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      // Wait for fade-out animation
      timeoutRef.current = setTimeout(() => {
        setShowLoginOptions(true);
        setLoginOption(option);
        setIsTransitioning(false);
        timeoutRef.current = null;
        navigate(`${ONBOARDING_WELCOME_ROUTE}?login=${option}`);
      }, 100);
    } else {
      setShowLoginOptions(true);
      setLoginOption(option);
      if (loginType) {
        await onLogin(loginType, option);
      }
    }
  };

  return (
    <>
      <Box
        data-testid="get-started"
        style={{
          opacity: isAnimationComplete ? 1 : 0,
          transform: isAnimationComplete
            ? 'translateY(0) scale(1)'
            : 'translateY(80px) scale(0.8)',
          // Skip transition when returning from another page
          transition: skipTransition
            ? 'none'
            : 'opacity 0.6s ease-out, transform 0.6s ease-out',
        }}
        className={'welcome-login'}
      >
        {isSeedlessOnboardingFeatureEnabled &&
        showLoginOptions &&
        loginOption ? (
          <Box className="welcome-login__options welcome-login__options--fade-in">
            <LoginOptions loginOption={loginOption} handleLogin={handleLogin} />
          </Box>
        ) : (
          <Box
            display={Display.Flex}
            flexDirection={FlexDirection.Column}
            width={BlockSize.Full}
            gap={4}
            className={`${
              isTransitioning ? 'welcome-login__cta--fade-out' : ''
            }`}
          >
            <Button
              data-testid="onboarding-create-wallet"
              variant={ButtonVariant.Primary}
              size={ButtonSize.Lg}
              block
              onClick={() =>
                handleButtonClick(LOGIN_OPTION.NEW, LOGIN_TYPE.SRP)
              }
            >
              {t('onboardingCreateWallet')}
            </Button>
            <Button
              data-theme={
                theme === ThemeType.dark ? ThemeType.light : ThemeType.dark
              }
              data-testid="onboarding-import-wallet"
              variant={ButtonVariant.Primary}
              size={ButtonSize.Lg}
              block
              onClick={() =>
                handleButtonClick(LOGIN_OPTION.EXISTING, LOGIN_TYPE.SRP)
              }
            >
              {isSeedlessOnboardingFeatureEnabled
                ? t('onboardingImportWallet')
                : t('onboardingSrpImport')}
            </Button>
          </Box>
        )}
      </Box>
    </>
  );
}
