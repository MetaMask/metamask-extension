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
import { useNavigate } from 'react-router-dom';
import {
  Box,
  BoxFlexDirection,
  BoxAlignItems,
  BoxJustifyContent,
} from '@metamask/design-system-react';
import type { AuthConnection } from '@metamask/seedless-onboarding-controller';
import {
  ONBOARDING_COMPLETION_ROUTE,
  ONBOARDING_CREATE_PASSWORD_ROUTE,
  ONBOARDING_IMPORT_WITH_SRP_ROUTE,
  ONBOARDING_ACCOUNT_EXIST,
  ONBOARDING_ACCOUNT_NOT_FOUND,
  ONBOARDING_UNLOCK_ROUTE,
  ONBOARDING_METAMETRICS,
  ONBOARDING_REVIEW_SRP_ROUTE,
  ONBOARDING_SETUP_PASSKEY_ROUTE,
} from '../../../helpers/constants/routes';
import {
  getAccountTypeForOnboardingMetrics,
  getFirstTimeFlowType,
  getCompletedMetaMetricsOnboarding,
  getIsPasskeyFeatureAvailable,
  getIsSocialLoginFlow,
} from '../../../selectors';
import { getCurrentKeyring } from '../../../../shared/lib/selectors/keyring';
import { FirstTimeFlowType } from '../../../../shared/constants/onboarding';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import type { UIMetricsEventPayload } from '../../../contexts/metametrics';
import { useAnalytics } from '../../../hooks/useAnalytics';
import type { MetaMetricsEventOptions } from '../../../../shared/constants/metametrics';
import { ENVIRONMENT } from '../../../../shared/constants/build';
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
import { getIsSeedlessOnboardingFeatureEnabled } from '../../../../shared/lib/environment';
import { useIsFirefox } from '../../../hooks/useIsFirefox';
import {
  isUserCancelledLoginError,
  OAuthErrorMessages,
} from '../../../../shared/lib/error';
import { TraceName, TraceOperation } from '../../../../shared/lib/trace';
import { useRiveWasmContext } from '../../../contexts/rive-wasm';
import { getIsWalletResetInProgress } from '../../../ducks/metamask/metamask';
import WelcomeLogin from './welcome-login';
import {
  LOGIN_ERROR,
  LOGIN_OPTION,
  LOGIN_TYPE,
  LoginErrorType,
  LoginType,
} from './types';
import LoginErrorModal from './login-error-modal';

const MetaMaskWordMarkAnimation = lazy(
  () =>
    // @ts-expect-error - TypeScript expects .js extension for ESM, but Jest needs the actual .tsx file
    import('./metamask-wordmark-animation') as unknown as Promise<{
      default: ComponentType<
        React.PropsWithChildren<{
          setIsAnimationComplete: (isAnimationComplete: boolean) => void;
          isAnimationComplete?: boolean;
          skipTransition?: boolean;
        }>
      >;
    }>,
);

const FoxAppearAnimation = lazy(
  () =>
    // @ts-expect-error - TypeScript expects .js extension for ESM, but Jest needs the actual .tsx file
    import('./fox-appear-animation') as unknown as Promise<{
      default: ComponentType<
        React.PropsWithChildren<{
          isLoader?: boolean;
          skipTransition?: boolean;
        }>
      >;
    }>,
);

export default function OnboardingWelcome() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const currentKeyring = useSelector(getCurrentKeyring);
  const isSeedlessOnboardingFeatureEnabled =
    getIsSeedlessOnboardingFeatureEnabled();
  const firstTimeFlowType = useSelector(getFirstTimeFlowType);
  const isWalletResetInProgress = useSelector(getIsWalletResetInProgress);
  const isSocialLoginFLow = useSelector(getIsSocialLoginFlow);
  const completedMetaMetricsOnboarding = useSelector(
    getCompletedMetaMetricsOnboarding,
  );
  const isPasskeyFeatureAvailable = useSelector(getIsPasskeyFeatureAvailable);
  const accountTypeForMetrics = useSelector(getAccountTypeForOnboardingMetrics);
  const [newAccountCreationInProgress, setNewAccountCreationInProgress] =
    useState(false);

  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<LoginErrorType | null>(null);

  const { animationCompleted } = useRiveWasmContext();
  const shouldSkipAnimation = Boolean(
    animationCompleted?.MetamaskWordMarkAnimation ||
    process.env.METAMASK_ENVIRONMENT === ENVIRONMENT.TESTING,
  );

  // In test environments or when returning from another page, skip animations
  const [isAnimationComplete, setIsAnimationComplete] =
    useState(shouldSkipAnimation);

  const isFireFox = useIsFirefox();

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
          completedMetaMetricsOnboarding
            ? ONBOARDING_COMPLETION_ROUTE
            : ONBOARDING_METAMETRICS,
          { replace: true },
        );
      } else if (firstTimeFlowType === FirstTimeFlowType.socialCreate) {
        navigate(ONBOARDING_COMPLETION_ROUTE, { replace: true });
      } else if (isPasskeyFeatureAvailable) {
        navigate(ONBOARDING_SETUP_PASSKEY_ROUTE, { replace: true });
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
    completedMetaMetricsOnboarding,
    getIsUserAuthenticatedWithSocialLogin,
    isFireFox,
    isWalletResetInProgress,
    isSocialLoginFLow,
    isPasskeyFeatureAvailable,
  ]);

  const { trackEvent, createEventBuilder } = useAnalytics();
  const { bufferedTrace, bufferedEndTrace, onboardingParentContext } =
    useContext(MetaMetricsContext);

  const trackLegacyEventForAction = useCallback(
    async (
      payload: UIMetricsEventPayload,
      options?: MetaMetricsEventOptions,
    ): Promise<void> => {
      trackEvent(
        createEventBuilder(payload.event)
          .addProperties({
            ...payload.properties,
            ...(payload.category === undefined
              ? {}
              : { category: payload.category }),
          })
          .addSensitiveProperties(payload.sensitiveProperties)
          .build(options),
      );
    },
    [createEventBuilder, trackEvent],
  );

  const onCreateClick = useCallback(async () => {
    setIsLoggingIn(true);
    setNewAccountCreationInProgress(true);
    await dispatch(setFirstTimeFlowType(FirstTimeFlowType.create));
    trackEvent(
      createEventBuilder(MetaMetricsEventName.WalletSetupStarted)
        .addCategory(MetaMetricsEventCategory.Onboarding)
        .addProperties({
          // eslint-disable-next-line @typescript-eslint/naming-convention
          account_type: accountTypeForMetrics,
        })
        .build(),
    );
    bufferedTrace?.({
      name: TraceName.OnboardingNewSrpCreateWallet,
      op: TraceOperation.OnboardingUserJourney,
      parentContext: onboardingParentContext?.current,
    });

    navigate(ONBOARDING_CREATE_PASSWORD_ROUTE);
  }, [
    dispatch,
    navigate,
    createEventBuilder,
    trackEvent,
    onboardingParentContext,
    bufferedTrace,
    accountTypeForMetrics,
  ]);

  const onImportClick = useCallback(async () => {
    setIsLoggingIn(true);
    await dispatch(setFirstTimeFlowType(FirstTimeFlowType.import));
    trackEvent(
      createEventBuilder(MetaMetricsEventName.WalletImportStarted)
        .addCategory(MetaMetricsEventCategory.Onboarding)
        .addProperties({
          // eslint-disable-next-line @typescript-eslint/naming-convention
          account_type: accountTypeForMetrics,
        })
        .build(),
    );
    bufferedTrace?.({
      name: TraceName.OnboardingExistingSrpImport,
      op: TraceOperation.OnboardingUserJourney,
      parentContext: onboardingParentContext?.current,
    });

    navigate(ONBOARDING_IMPORT_WITH_SRP_ROUTE);
  }, [
    dispatch,
    navigate,
    createEventBuilder,
    trackEvent,
    onboardingParentContext,
    bufferedTrace,
    accountTypeForMetrics,
  ]);

  const handleSocialLogin = useCallback(
    async (socialConnectionType: LoginType) => {
      if (isSeedlessOnboardingFeatureEnabled) {
        bufferedTrace?.({
          name: TraceName.OnboardingSocialLoginAttempt,
          op: TraceOperation.OnboardingUserJourney,
          tags: { provider: socialConnectionType },
          parentContext: onboardingParentContext?.current,
        });
        const isNewUser = await dispatch(
          startOAuthLogin(
            socialConnectionType as AuthConnection,
            bufferedTrace,
            bufferedEndTrace,
            trackLegacyEventForAction,
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
      trackLegacyEventForAction,
    ],
  );

  const handleSocialLoginError = useCallback(
    (error: Error | undefined, loginType: LoginType) => {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      // Map raw OAuth error messages to UI modal-friendly constants
      if (isUserCancelledLoginError(error)) {
        setLoginError(null);
        return;
      }

      bufferedEndTrace?.({
        name: TraceName.OnboardingSocialLoginAttempt,
        data: { success: false },
      });

      if (errorMessage === OAuthErrorMessages.INVALID_OAUTH_STATE_ERROR) {
        setLoginError(LOGIN_ERROR.SESSION_EXPIRED);
        return;
      }

      // Telegram-specific failures are most commonly caused by an outdated
      // Telegram desktop app — the OAuth handshake happens inside Telegram's
      // embedded webview which silently fails on old clients. Route those to
      // a Telegram-specific modal so users know to update their Telegram app
      // rather than seeing a generic connection error.
      if (loginType === LOGIN_TYPE.TELEGRAM) {
        const isTelegramVerifyFailure =
          /Telegram verify failed:\s*(403|404)/u.test(errorMessage);
        const isLikelyOutdatedApp =
          isTelegramVerifyFailure ||
          errorMessage === OAuthErrorMessages.NO_REDIRECT_URL_FOUND_ERROR;

        if (isLikelyOutdatedApp) {
          trackEvent(
            createEventBuilder(MetaMetricsEventName.SocialLoginFailed)
              .addCategory(MetaMetricsEventCategory.Onboarding)
              .addProperties({
                // eslint-disable-next-line @typescript-eslint/naming-convention
                account_type: `${MetaMetricsEventAccountType.Default}_${loginType}`,
                // eslint-disable-next-line @typescript-eslint/naming-convention
                is_rehydration: 'unknown',
                // eslint-disable-next-line @typescript-eslint/naming-convention
                failure_type: 'outdated_app',
                // eslint-disable-next-line @typescript-eslint/naming-convention
                error_category: 'telegram_app',
              })
              .build(),
          );
          setLoginError(LOGIN_ERROR.TELEGRAM_OUTDATED);
          return;
        }
      }

      if (errorMessage === OAuthErrorMessages.NO_REDIRECT_URL_FOUND_ERROR) {
        setLoginError(LOGIN_ERROR.UNABLE_TO_CONNECT);
        return;
      }

      setLoginError(LOGIN_ERROR.GENERIC);
    },
    [bufferedEndTrace, createEventBuilder, trackEvent],
  );

  const onSocialLoginCreateClick = useCallback(
    async (socialConnectionType: LoginType) => {
      setIsLoggingIn(true);
      setNewAccountCreationInProgress(true);
      // here, we cannot use the selector yet because the social login flow is not complete and the state is not updated yet
      const accountTypeForSocialLoginMetrics = `${MetaMetricsEventAccountType.Default}_${socialConnectionType}`;

      trackEvent(
        createEventBuilder(MetaMetricsEventName.WalletSetupStarted)
          .addCategory(MetaMetricsEventCategory.Onboarding)
          .addProperties({
            // eslint-disable-next-line @typescript-eslint/naming-convention
            account_type: accountTypeForSocialLoginMetrics,
          })
          .build(),
      );

      try {
        const isNewUser = await handleSocialLogin(socialConnectionType);

        // Track wallet setup completed for social login users
        trackEvent(
          createEventBuilder(MetaMetricsEventName.SocialLoginCompleted)
            .addCategory(MetaMetricsEventCategory.Onboarding)
            .addProperties({
              // eslint-disable-next-line @typescript-eslint/naming-convention
              account_type: accountTypeForSocialLoginMetrics,
            })
            .build(),
        );
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
        handleSocialLoginError(error as Error, socialConnectionType);
      } finally {
        setIsLoggingIn(false);
      }
    },
    [
      dispatch,
      handleSocialLogin,
      createEventBuilder,
      trackEvent,
      navigate,
      onboardingParentContext,
      handleSocialLoginError,
      bufferedTrace,
    ],
  );

  const onSocialLoginImportClick = useCallback(
    async (socialConnectionType: LoginType) => {
      setIsLoggingIn(true);

      // here, we cannot use the selector yet because the social login flow is not complete and the state is not updated yet
      const accountTypeForSocialLoginMetrics = `${MetaMetricsEventAccountType.Imported}_${socialConnectionType}`;

      trackEvent(
        createEventBuilder(MetaMetricsEventName.WalletImportStarted)
          .addCategory(MetaMetricsEventCategory.Onboarding)
          .addProperties({
            // eslint-disable-next-line @typescript-eslint/naming-convention
            account_type: accountTypeForSocialLoginMetrics,
          })
          .build(),
      );

      try {
        const isNewUser = await handleSocialLogin(socialConnectionType);

        // Track wallet login completed for existing social login users
        trackEvent(
          createEventBuilder(MetaMetricsEventName.SocialLoginCompleted)
            .addCategory(MetaMetricsEventCategory.Onboarding)
            .addProperties({
              // eslint-disable-next-line @typescript-eslint/naming-convention
              account_type: accountTypeForSocialLoginMetrics,
            })
            .build(),
        );

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
          navigate(ONBOARDING_UNLOCK_ROUTE, { replace: true });
        }
      } catch (error) {
        handleSocialLoginError(error as Error, socialConnectionType);
      } finally {
        setIsLoggingIn(false);
      }
    },
    [
      handleSocialLogin,
      createEventBuilder,
      trackEvent,
      navigate,
      onboardingParentContext,
      handleSocialLoginError,
      bufferedTrace,
      dispatch,
    ],
  );

  const handleLoginError = useCallback((error: unknown) => {
    if (isUserCancelledLoginError(error as Error | undefined)) {
      setLoginError(null);
    } else {
      setLoginError(LOGIN_ERROR.GENERIC);
    }
  }, []);

  const handleLogin = useCallback(
    async (loginType: LoginType, loginOption: string) => {
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
        }

        if (!isFireFox) {
          // Set pna25Acknowledged to true for social login users (Chrome)
          dispatch(setPna25Acknowledged(true, true));
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
      flexDirection={BoxFlexDirection.Column}
      justifyContent={BoxJustifyContent.Center}
      alignItems={BoxAlignItems.Center}
      className="welcome-container h-full w-full"
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
              onClose={() => setLoginError(null)}
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
