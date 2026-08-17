import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  Box,
  BoxFlexDirection,
  Button,
  ButtonSize,
  ButtonVariant,
} from '@metamask/design-system-react';
import { useI18nContext } from '../../../hooks/useI18nContext';
import { getIsSeedlessOnboardingFeatureEnabled } from '../../../../shared/lib/environment';
import { ThemeType } from '../../../../shared/constants/preferences';
import { setTermsOfUseLastAgreed } from '../../../store/actions';
import { useTheme } from '../../../hooks/useTheme';
import { ONBOARDING_WELCOME_ROUTE } from '../../../helpers/constants/routes';
import { useDispatch } from '../../../store/hooks';
import LoginOptions from './login-options';
import { LOGIN_OPTION, LOGIN_TYPE, LoginOptionType, LoginType } from './types';

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
  const isSeedlessOnboardingFeatureEnabled =
    getIsSeedlessOnboardingFeatureEnabled();
  const dispatch = useDispatch();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const theme = useTheme();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const loginParam = searchParams.get('login');
  const [localLoginOption, setLocalLoginOption] =
    useState<LoginOptionType | null>(null);
  const [hiddenForLoginParam, setHiddenForLoginParam] = useState<string | null>(
    null,
  );
  const [isTransitioning, setIsTransitioning] = useState(false);

  const loginOption =
    (loginParam as LoginOptionType | null) ?? localLoginOption;
  const showLoginOptions = loginParam
    ? hiddenForLoginParam !== loginParam
    : localLoginOption !== null;

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleLogin = useCallback(
    async (loginType: LoginType) => {
      if (!loginOption) {
        return;
      }
      if (loginParam) {
        setHiddenForLoginParam(loginParam);
      } else {
        setLocalLoginOption(null);
      }

      await dispatch(setTermsOfUseLastAgreed(new Date().getTime()));

      await onLogin(loginType, loginOption);
    },
    [dispatch, loginOption, loginParam, onLogin],
  );

  const handleButtonClick = async (
    option: LoginOptionType,
    loginType?: LoginType,
  ) => {
    if (isSeedlessOnboardingFeatureEnabled) {
      setHiddenForLoginParam(null);
      setIsTransitioning(true);
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      // Wait for fade-out animation
      timeoutRef.current = setTimeout(() => {
        setIsTransitioning(false);
        timeoutRef.current = null;
        setLocalLoginOption(option);
        navigate(`${ONBOARDING_WELCOME_ROUTE}?login=${option}`);
      }, 100);
    } else {
      setLocalLoginOption(option);
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
            flexDirection={BoxFlexDirection.Column}
            gap={4}
            className={`w-full ${isTransitioning ? 'welcome-login__cta--fade-out' : ''}`}
          >
            <Button
              data-testid="onboarding-create-wallet"
              variant={ButtonVariant.Primary}
              size={ButtonSize.Lg}
              className="w-full"
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
              className="w-full"
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
