import React, { useCallback, useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom-v5-compat';
import log from 'loglevel';
import {
  ONBOARDING_SECURE_YOUR_WALLET_ROUTE,
  ONBOARDING_COMPLETION_ROUTE,
  ONBOARDING_CREATE_PASSWORD_ROUTE,
  ONBOARDING_IMPORT_WITH_SRP_ROUTE,
  ONBOARDING_ACCOUNT_EXIST,
  ONBOARDING_ACCOUNT_NOT_FOUND,
  ONBOARDING_UNLOCK_ROUTE,
  ONBOARDING_METAMETRICS,
} from '../../../helpers/constants/routes';
import {
  getCurrentKeyring,
  getFirstTimeFlowType,
  getIsParticipateInMetaMetricsSet,
  getIsSocialLoginUserAuthenticated,
} from '../../../selectors';
import { FirstTimeFlowType } from '../../../../shared/constants/onboarding';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { setFirstTimeFlowType, startOAuthLogin } from '../../../store/actions';
import LoadingScreen from '../../../components/ui/loading-screen';
import {
  MetaMetricsEventAccountType,
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { getIsSeedlessOnboardingFeatureEnabled } from '../../../../shared/modules/environment';
import { getBrowserName } from '../../../../shared/modules/browser-runtime.utils';
import { PLATFORM_FIREFOX } from '../../../../shared/constants/app';
import { OAuthErrorMessages } from '../../../../shared/modules/error';
import { TraceName, TraceOperation } from '../../../../shared/lib/trace';
import WelcomeLogin from './welcome-login';
import WelcomeBanner from './welcome-banner';
import {
  LOGIN_ERROR,
  LOGIN_OPTION,
  LOGIN_TYPE,
  WelcomePageState,
} from './types';
import LoginErrorModal from './login-error-modal';

export default function OnboardingWelcome({
  pageState = WelcomePageState.Banner,
  setPageState,
}) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const currentKeyring = useSelector(getCurrentKeyring);
  const isSeedlessOnboardingFeatureEnabled =
    getIsSeedlessOnboardingFeatureEnabled();
  const firstTimeFlowType = useSelector(getFirstTimeFlowType);
  const isUserAuthenticatedWithSocialLogin = useSelector(
    getIsSocialLoginUserAuthenticated,
  );
  const isParticipateInMetaMetricsSet = useSelector(
    getIsParticipateInMetaMetricsSet,
  );
  const [newAccountCreationInProgress, setNewAccountCreationInProgress] =
    useState(false);

  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState(null);
  // Don't allow users to come back to this screen after they
  // have already imported or created a wallet
  useEffect(() => {
    if (currentKeyring && !newAccountCreationInProgress) {
      if (
        firstTimeFlowType === FirstTimeFlowType.import ||
        firstTimeFlowType === FirstTimeFlowType.socialImport ||
        firstTimeFlowType === FirstTimeFlowType.restore
      ) {
        navigate(
          isParticipateInMetaMetricsSet
            ? ONBOARDING_COMPLETION_ROUTE
            : ONBOARDING_METAMETRICS,
          { replace: true },
        );
      } else if (firstTimeFlowType === FirstTimeFlowType.socialCreate) {
        if (getBrowserName() === PLATFORM_FIREFOX) {
          navigate(ONBOARDING_COMPLETION_ROUTE, { replace: true });
        } else {
          navigate(ONBOARDING_METAMETRICS, { replace: true });
        }
      } else {
        navigate(ONBOARDING_SECURE_YOUR_WALLET_ROUTE, { replace: true });
      }
    } else if (isUserAuthenticatedWithSocialLogin) {
      if (firstTimeFlowType === FirstTimeFlowType.socialCreate) {
        navigate(ONBOARDING_CREATE_PASSWORD_ROUTE, { replace: true });
      } else {
        navigate(ONBOARDING_UNLOCK_ROUTE, { replace: true });
      }
    }
  }, [
    currentKeyring,
    navigate,
    firstTimeFlowType,
    newAccountCreationInProgress,
    isParticipateInMetaMetricsSet,
    isUserAuthenticatedWithSocialLogin,
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
    ],
  );

  const handleSocialLoginError = useCallback(
    (error, socialConnectionType) => {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      bufferedTrace?.({
        name: TraceName.OnboardingSocialLoginError,
        op: TraceOperation.OnboardingError,
        tags: { provider: socialConnectionType, errorMessage },
        parentContext: onboardingParentContext.current,
      });
      bufferedEndTrace?.({ name: TraceName.OnboardingSocialLoginError });
      bufferedEndTrace?.({
        name: TraceName.OnboardingSocialLoginAttempt,
        data: { success: false },
      });
    },
    [onboardingParentContext, bufferedTrace, bufferedEndTrace],
  );

  const onSocialLoginCreateClick = useCallback(
    async (socialConnectionType) => {
      setIsLoggingIn(true);
      setNewAccountCreationInProgress(true);
      await dispatch(setFirstTimeFlowType(FirstTimeFlowType.socialCreate));

      trackEvent({
        category: MetaMetricsEventCategory.Onboarding,
        event: MetaMetricsEventName.WalletSetupStarted,
        properties: {
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
            account_type: `${MetaMetricsEventAccountType.Default}_${socialConnectionType}`,
          },
        });
        if (isNewUser) {
          bufferedTrace?.({
            name: TraceName.OnboardingNewSocialCreateWallet,
            op: TraceOperation.OnboardingUserJourney,
            parentContext: onboardingParentContext.current,
          });
          navigate(ONBOARDING_CREATE_PASSWORD_ROUTE, { replace: true });
        } else {
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
      dispatch(setFirstTimeFlowType(FirstTimeFlowType.socialImport));

      trackEvent({
        category: MetaMetricsEventCategory.Onboarding,
        event: MetaMetricsEventName.WalletImportStarted,
        properties: {
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
            account_type: `${MetaMetricsEventAccountType.Imported}_${socialConnectionType}`,
          },
        });

        if (isNewUser) {
          navigate(ONBOARDING_ACCOUNT_NOT_FOUND);
        } else {
          bufferedTrace?.({
            name: TraceName.OnboardingExistingSocialLogin,
            op: TraceOperation.OnboardingUserJourney,
            parentContext: onboardingParentContext.current,
          });
          navigate(ONBOARDING_UNLOCK_ROUTE);
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

  const handleLoginError = useCallback((error) => {
    log.error('handleLoginError::error', error);
    const errorMessage = error.message;
    if (errorMessage === OAuthErrorMessages.USER_CANCELLED_LOGIN_ERROR) {
      setLoginError(null);
    } else {
      setLoginError(LOGIN_ERROR.GENERIC);
    }
  }, []);

  const handleLogin = useCallback(
    async (loginType, loginOption) => {
      try {
        if (loginOption === LOGIN_OPTION.NEW && loginType === LOGIN_TYPE.SRP) {
          await onCreateClick();
        } else if (
          loginOption === LOGIN_OPTION.EXISTING &&
          loginType === LOGIN_TYPE.SRP
        ) {
          await onImportClick();
        } else if (isSeedlessOnboardingFeatureEnabled) {
          if (loginOption === LOGIN_OPTION.NEW) {
            await onSocialLoginCreateClick(loginType);
          } else if (loginOption === LOGIN_OPTION.EXISTING) {
            await onSocialLoginImportClick(loginType);
          }
        }
      } catch (error) {
        handleLoginError(error);
      }
    },
    [
      onCreateClick,
      onImportClick,
      onSocialLoginCreateClick,
      onSocialLoginImportClick,
      isSeedlessOnboardingFeatureEnabled,
      handleLoginError,
    ],
  );

  return (
    <>
      {pageState === WelcomePageState.Banner && (
        <WelcomeBanner onAccept={() => setPageState(WelcomePageState.Login)} />
      )}

      {pageState === WelcomePageState.Login && (
        <WelcomeLogin onLogin={handleLogin} />
      )}

      {isLoggingIn && <LoadingScreen />}

      {loginError !== null && (
        <LoginErrorModal
          onClose={() => setLoginError(null)}
          loginError={loginError}
        />
      )}
    </>
  );
}

OnboardingWelcome.propTypes = {
  pageState: PropTypes.oneOf(Object.values(WelcomePageState)),
  setPageState: PropTypes.func.isRequired,
};
