import React, {
  lazy,
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ComponentType,
} from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom-v5-compat';
import { Box } from '../../../components/component-library';
import {
  ONBOARDING_COMPLETION_ROUTE,
  ONBOARDING_CREATE_PASSWORD_ROUTE,
  ONBOARDING_IMPORT_WITH_SRP_ROUTE,
  ONBOARDING_ACCOUNT_EXIST,
  ONBOARDING_ACCOUNT_NOT_FOUND,
  ONBOARDING_UNLOCK_ROUTE,
  ONBOARDING_METAMETRICS,
  ONBOARDING_REVIEW_SRP_ROUTE,
} from '../../../helpers/constants/routes';
import {
  getCurrentKeyring,
  getFirstTimeFlowType,
  getIsParticipateInMetaMetricsSet,
  getIsSocialLoginFlow,
} from '../../../selectors';
import { FirstTimeFlowType } from '../../../../shared/constants/onboarding';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  setFirstTimeFlowType,
  startOAuthLogin,
  setParticipateInMetaMetrics,
  setPna25Acknowledged,
  getIsSeedlessOnboardingUserAuthenticated,
} from '../../../store/actions';
import {
  MetaMetricsEventAccountType,
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { getIsSeedlessOnboardingFeatureEnabled } from '../../../../shared/modules/environment';
import { getBrowserName } from '../../../../shared/modules/browser-runtime.utils';
import { PLATFORM_FIREFOX } from '../../../../shared/constants/app';
import {
  isUserCancelledLoginError,
  OAuthErrorMessages,
} from '../../../../shared/modules/error';
import { TraceName, TraceOperation } from '../../../../shared/lib/trace';
import {
  AlignItems,
  Display,
  FlexDirection,
  JustifyContent,
  BlockSize,
} from '../../../helpers/constants/design-system';
import { useRiveWasmContext } from '../../../contexts/rive-wasm';
import { getIsWalletResetInProgress } from '../../../ducks/metamask/metamask';
import WelcomeLogin from './welcome-login';
import { LOGIN_ERROR, LOGIN_OPTION, LOGIN_TYPE, LoginErrorType } from './types';
import LoginErrorModal from './login-error-modal';

const MetaMaskWordMarkAnimation = lazy(
  () =>
    // @ts-expect-error - TypeScript expects .js extension for ESM, but Jest needs the actual .tsx file
    import('./metamask-wordmark-animation') as unknown as Promise<{
      default: ComponentType<{
        setIsAnimationComplete: (isAnimationComplete: boolean) => void;
        isAnimationComplete?: boolean;
        skipTransition?: boolean;
      }>;
    }>,
);

const FoxAppearAnimation = lazy(
  () =>
    // @ts-expect-error - TypeScript expects .js extension for ESM, but Jest needs the actual .tsx file
    import('./fox-appear-animation') as unknown as Promise<{
      default: ComponentType<{
        isLoader?: boolean;
        skipTransition?: boolean;
      }>;
    }>,
);

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function OnboardingWelcome() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const currentKeyring = useSelector(getCurrentKeyring);
  const isSeedlessOnboardingFeatureEnabled =
    getIsSeedlessOnboardingFeatureEnabled();
  const firstTimeFlowType = useSelector(getFirstTimeFlowType);
  const isWalletResetInProgress = useSelector(getIsWalletResetInProgress);
  const isSocialLoginFLow = useSelector(getIsSocialLoginFlow);
  const isParticipateInMetaMetricsSet = useSelector(
    getIsParticipateInMetaMetricsSet,
  );
  const [newAccountCreationInProgress, setNewAccountCreationInProgress] =
    useState(false);

  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<LoginErrorType | null>(null);

  const { animationCompleted } = useRiveWasmContext();
  const shouldSkipAnimation = Boolean(
    animationCompleted?.MetamaskWordMarkAnimation,
  );

  // In test environments or when returning from another page, skip animations
  const [isAnimationComplete, setIsAnimationComplete] =
    useState(shouldSkipAnimation);

  const isFireFox = getBrowserName() === PLATFORM_FIREFOX;

  const getIsUserAuthenticatedWithSocialLogin = useCallback(async () => {
    if (!isSocialLoginFLow) {
      return true;
    }

    const isSeedlessOnboardingUserAuthenticated = await dispatch(
      getIsSeedlessOnboardingUserAuthenticated(),
    );
    return isSeedlessOnboardingUserAuthenticated;
  }, [dispatch, isSocialLoginFLow]);

  // Don't allow users to come back to this screen after they
  // have already imported or created a wallet
  useEffect(() => {
    let isMounted = true;

    if (
      currentKeyring &&
      !newAccountCreationInProgress &&
      !isWalletResetInProgress
    ) {
      if (
        firstTimeFlowType === FirstTimeFlowType.import ||
        firstTimeFlowType === FirstTimeFlowType.restore
      ) {
        navigate(
          isParticipateInMetaMetricsSet
            ? ONBOARDING_COMPLETION_ROUTE
            : ONBOARDING_METAMETRICS,
          { replace: true },
        );
      } else if (firstTimeFlowType === FirstTimeFlowType.socialCreate) {
        navigate(ONBOARDING_COMPLETION_ROUTE, { replace: true });
      } else {
        navigate(ONBOARDING_REVIEW_SRP_ROUTE, { replace: true });
      }
    } else if (isSocialLoginFLow) {
      (async () => {
        const isUserAuthenticatedWithSocialLogin =
          await getIsUserAuthenticatedWithSocialLogin();
        if (isMounted && isUserAuthenticatedWithSocialLogin) {
          if (firstTimeFlowType === FirstTimeFlowType.socialCreate) {
            navigate(ONBOARDING_CREATE_PASSWORD_ROUTE, { replace: true });
          } else {
            navigate(ONBOARDING_UNLOCK_ROUTE, { replace: true });
          }
        }
      })();
    }

    return () => {
      isMounted = false;
    };
  }, [
    currentKeyring,
    navigate,
    firstTimeFlowType,
    newAccountCreationInProgress,
    isParticipateInMetaMetricsSet,
    getIsUserAuthenticatedWithSocialLogin,
    isFireFox,
    isWalletResetInProgress,
    isSocialLoginFLow,
  ]);

  const trackEvent = useContext(MetaMetricsContext);
  const { bufferedTrace, bufferedEndTrace, onboardingParentContext } =
    trackEvent;

  const onCreateClick = useCallback(async () => {
    setIsLoggingIn(true);
    setNewAccountCreationInProgress(true);
    await dispatch(setFirstTimeFlowType(FirstTimeFlowType.create));
    trackEvent({
      category: MetaMetricsEventCategory.Onboarding,
      event: MetaMetricsEventName.WalletSetupStarted,
      properties: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        account_type: MetaMetricsEventAccountType.Default,
      },
    });
    bufferedTrace?.({
      name: TraceName.OnboardingNewSrpCreateWallet,
      op: TraceOperation.OnboardingUserJourney,
      parentContext: onboardingParentContext?.current,
    });

    navigate(ONBOARDING_CREATE_PASSWORD_ROUTE);
  }, [dispatch, navigate, trackEvent, onboardingParentContext, bufferedTrace]);

  const onImportClick = useCallback(async () => {
    setIsLoggingIn(true);
    await dispatch(setFirstTimeFlowType(FirstTimeFlowType.import));
    trackEvent({
      category: MetaMetricsEventCategory.Onboarding,
      event: MetaMetricsEventName.WalletImportStarted,
      properties: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        account_type: MetaMetricsEventAccountType.Imported,
      },
    });
    bufferedTrace?.({
      name: TraceName.OnboardingExistingSrpImport,
      op: TraceOperation.OnboardingUserJourney,
      parentContext: onboardingParentContext?.current,
    });

    navigate(ONBOARDING_IMPORT_WITH_SRP_ROUTE);
  }, [dispatch, navigate, trackEvent, onboardingParentContext, bufferedTrace]);

  const handleSocialLogin = useCallback(
    async (socialConnectionType) => {
      if (isSeedlessOnboardingFeatureEnabled) {
        bufferedTrace?.({
          name: TraceName.OnboardingSocialLoginAttempt,
          op: TraceOperation.OnboardingUserJourney,
          tags: { provider: socialConnectionType },
          parentContext: onboardingParentContext?.current,
        });
        const isNewUser = await dispatch(
          startOAuthLogin(
            socialConnectionType,
            bufferedTrace,
            bufferedEndTrace,
            trackEvent,
          ),
        );
        bufferedEndTrace?.({ name: TraceName.OnboardingSocialLoginAttempt });
        return isNewUser;
      }
      return true;
    },
    [
      dispatch,
      isSeedlessOnboardingFeatureEnabled,
      onboardingParentContext,
      bufferedTrace,
      bufferedEndTrace,
      trackEvent,
    ],
  );

  const handleSocialLoginError = useCallback(
    (error, socialConnectionType) => {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      // Map raw OAuth error messages to UI modal-friendly constants
      if (isUserCancelledLoginError(error)) {
        setLoginError(null);
        return;
      }

      bufferedTrace?.({
        name: TraceName.OnboardingSocialLoginError,
        op: TraceOperation.OnboardingError,
        tags: { provider: socialConnectionType, errorMessage },
        parentContext: onboardingParentContext?.current,
      });
      bufferedEndTrace?.({ name: TraceName.OnboardingSocialLoginError });
      bufferedEndTrace?.({
        name: TraceName.OnboardingSocialLoginAttempt,
        data: { success: false },
      });

      if (errorMessage === OAuthErrorMessages.INVALID_OAUTH_STATE_ERROR) {
        setLoginError(LOGIN_ERROR.SESSION_EXPIRED);
        return;
      }

      if (
        errorMessage === OAuthErrorMessages.NO_REDIRECT_URL_FOUND_ERROR ||
        errorMessage === OAuthErrorMessages.NO_AUTH_CODE_FOUND_ERROR
      ) {
        setLoginError(LOGIN_ERROR.UNABLE_TO_CONNECT);
        return;
      }

      setLoginError(LOGIN_ERROR.GENERIC);
    },
    [onboardingParentContext, bufferedTrace, bufferedEndTrace],
  );

  const onSocialLoginCreateClick = useCallback(
    async (socialConnectionType) => {
      setIsLoggingIn(true);
      setNewAccountCreationInProgress(true);

      trackEvent({
        category: MetaMetricsEventCategory.Onboarding,
        event: MetaMetricsEventName.WalletSetupStarted,
        properties: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          account_type: `${MetaMetricsEventAccountType.Default}_${socialConnectionType}`,
        },
      });

      try {
        const isNewUser = await handleSocialLogin(socialConnectionType);

        // Track wallet setup completed for social login users
        trackEvent({
          category: MetaMetricsEventCategory.Onboarding,
          event: MetaMetricsEventName.SocialLoginCompleted,
          properties: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            account_type: `${MetaMetricsEventAccountType.Default}_${socialConnectionType}`,
          },
        });
        if (isNewUser) {
          bufferedTrace?.({
            name: TraceName.OnboardingNewSocialCreateWallet,
            op: TraceOperation.OnboardingUserJourney,
            parentContext: onboardingParentContext?.current,
          });
          await dispatch(setFirstTimeFlowType(FirstTimeFlowType.socialCreate));
          navigate(ONBOARDING_CREATE_PASSWORD_ROUTE, { replace: true });
        } else {
          await dispatch(setFirstTimeFlowType(FirstTimeFlowType.socialImport));
          navigate(ONBOARDING_ACCOUNT_EXIST, { replace: true });
        }
      } catch (error) {
        handleSocialLoginError(error, socialConnectionType);
      } finally {
        setIsLoggingIn(false);
      }
    },
    [
      dispatch,
      handleSocialLogin,
      trackEvent,
      navigate,
      onboardingParentContext,
      handleSocialLoginError,
      bufferedTrace,
    ],
  );

  const onSocialLoginImportClick = useCallback(
    async (socialConnectionType) => {
      setIsLoggingIn(true);
      trackEvent({
        category: MetaMetricsEventCategory.Onboarding,
        event: MetaMetricsEventName.WalletImportStarted,
        properties: {
          // eslint-disable-next-line @typescript-eslint/naming-convention
          account_type: `${MetaMetricsEventAccountType.Imported}_${socialConnectionType}`,
        },
      });

      try {
        const isNewUser = await handleSocialLogin(socialConnectionType);

        // Track wallet login completed for existing social login users
        trackEvent({
          category: MetaMetricsEventCategory.Onboarding,
          event: MetaMetricsEventName.SocialLoginCompleted,
          properties: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            account_type: `${MetaMetricsEventAccountType.Imported}_${socialConnectionType}`,
          },
        });

        if (isNewUser) {
          await dispatch(setFirstTimeFlowType(FirstTimeFlowType.socialCreate));
          navigate(ONBOARDING_ACCOUNT_NOT_FOUND);
        } else {
          bufferedTrace?.({
            name: TraceName.OnboardingExistingSocialLogin,
            op: TraceOperation.OnboardingUserJourney,
            parentContext: onboardingParentContext?.current,
          });
          await dispatch(setFirstTimeFlowType(FirstTimeFlowType.socialImport));
          navigate(ONBOARDING_UNLOCK_ROUTE);
        }
      } catch (error) {
        handleSocialLoginError(error, socialConnectionType);
      } finally {
        setIsLoggingIn(false);
      }
    },
    [
      handleSocialLogin,
      trackEvent,
      navigate,
      onboardingParentContext,
      handleSocialLoginError,
      bufferedTrace,
      dispatch,
    ],
  );

  const handleLoginError = useCallback((error) => {
    if (isUserCancelledLoginError(error)) {
      setLoginError(null);
    } else {
      setLoginError(LOGIN_ERROR.GENERIC);
    }
  }, []);

  const handleLogin = useCallback(
    async (loginType, loginOption) => {
      try {
        if (!isFireFox) {
          // reset the participate in meta metrics in case it was set to true from previous login attempts
          // to prevent the queued events from being sent
          dispatch(setParticipateInMetaMetrics(null));
        }

        if (loginType === LOGIN_TYPE.SRP) {
          if (loginOption === LOGIN_OPTION.NEW) {
            await onCreateClick();
          } else if (loginOption === LOGIN_OPTION.EXISTING) {
            await onImportClick();
          }
          // return here to prevent the social login flow from being enabled
          return;
        }

        if (!isSeedlessOnboardingFeatureEnabled) {
          return;
        }

        if (loginOption === LOGIN_OPTION.NEW) {
          await onSocialLoginCreateClick(loginType);
        } else if (loginOption === LOGIN_OPTION.EXISTING) {
          await onSocialLoginImportClick(loginType);
        }

        if (!isFireFox) {
          // automatically set participate in meta metrics to true for social login users in chrome
          dispatch(setParticipateInMetaMetrics(true));
          // Set pna25Acknowledged to true for social login users if feature flag is enabled
          if (process.env.EXTENSION_UX_PNA25) {
            dispatch(setPna25Acknowledged(true));
          }
        }
      } catch (error) {
        handleLoginError(error);
      }
    },
    [
      isSeedlessOnboardingFeatureEnabled,
      dispatch,
      onCreateClick,
      onImportClick,
      onSocialLoginCreateClick,
      isFireFox,
      onSocialLoginImportClick,
      handleLoginError,
    ],
  );

  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      justifyContent={JustifyContent.center}
      alignItems={AlignItems.center}
      height={BlockSize.Full}
      width={BlockSize.Full}
      className="welcome-container"
    >
      {!isLoggingIn && (
        <Suspense fallback={<Box />}>
          <MetaMaskWordMarkAnimation
            setIsAnimationComplete={setIsAnimationComplete}
            isAnimationComplete={isAnimationComplete}
            skipTransition={shouldSkipAnimation}
          />
        </Suspense>
      )}

      {!isLoggingIn && (
        <>
          <WelcomeLogin
            onLogin={handleLogin}
            isAnimationComplete={isAnimationComplete}
            skipTransition={shouldSkipAnimation}
          />

          {isAnimationComplete && (
            <Suspense fallback={<Box />}>
              <FoxAppearAnimation skipTransition={shouldSkipAnimation} />
            </Suspense>
          )}

          {loginError !== null && (
            <LoginErrorModal
              onDone={() => setLoginError(null)}
              loginError={loginError}
            />
          )}
        </>
      )}

      {isLoggingIn && (
        <Suspense fallback={<Box />}>
          <FoxAppearAnimation isLoader />
        </Suspense>
      )}
    </Box>
  );
}
