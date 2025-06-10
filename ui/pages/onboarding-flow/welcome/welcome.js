import React, { useCallback, useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { useHistory } from 'react-router-dom';
import {
  ONBOARDING_SECURE_YOUR_WALLET_ROUTE,
  ONBOARDING_COMPLETION_ROUTE,
  ONBOARDING_CREATE_PASSWORD_ROUTE,
  ONBOARDING_IMPORT_WITH_SRP_ROUTE,
  ONBOARDING_ACCOUNT_EXIST,
  ONBOARDING_ACCOUNT_NOT_FOUND,
  ONBOARDING_UNLOCK_ROUTE,
} from '../../../helpers/constants/routes';
import { getCurrentKeyring, getFirstTimeFlowType } from '../../../selectors';
import { FirstTimeFlowType } from '../../../../shared/constants/onboarding';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { useSentryTrace } from '../../../contexts/sentry-trace';
import { setFirstTimeFlowType, startOAuthLogin } from '../../../store/actions';
import LoadingScreen from '../../../components/ui/loading-screen';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  MetaMetricsEventAccountType,
} from '../../../../shared/constants/metametrics';
import {
  bufferedTrace,
  bufferedEndTrace,
  TraceName,
  TraceOperation,
} from '../../../../shared/lib/trace';
import WelcomeLogin from './welcome-login';
import WelcomeBanner from './welcome-banner';
import { LOGIN_OPTION, LOGIN_TYPE } from './types';

const WelcomePageState = {
  Banner: 'Banner',
  Login: 'Login',
};

export default function OnboardingWelcome({
  pageState = WelcomePageState.Banner,
  setPageState,
}) {
  const dispatch = useDispatch();
  const history = useHistory();
  const currentKeyring = useSelector(getCurrentKeyring);
  const firstTimeFlowType = useSelector(getFirstTimeFlowType);
  const [newAccountCreationInProgress, setNewAccountCreationInProgress] =
    useState(false);

  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const { onboardingParentContext } = useSentryTrace();

  // Don't allow users to come back to this screen after they
  // have already imported or created a wallet
  useEffect(() => {
    if (currentKeyring && !newAccountCreationInProgress) {
      if (firstTimeFlowType === FirstTimeFlowType.import) {
        history.replace(ONBOARDING_COMPLETION_ROUTE);
      }
      if (firstTimeFlowType === FirstTimeFlowType.restore) {
        history.replace(ONBOARDING_COMPLETION_ROUTE);
      } else {
        history.replace(ONBOARDING_SECURE_YOUR_WALLET_ROUTE);
      }
    }
  }, [
    currentKeyring,
    history,
    firstTimeFlowType,
    newAccountCreationInProgress,
  ]);
  const trackEvent = useContext(MetaMetricsContext);

  const onCreateClick = useCallback(async () => {
    setIsLoggingIn(true);
    setNewAccountCreationInProgress(true);
    dispatch(setFirstTimeFlowType(FirstTimeFlowType.create));
    trackEvent({
      category: MetaMetricsEventCategory.Onboarding,
      event: MetaMetricsEventName.WalletSetupStarted,
      properties: {
        account_type: MetaMetricsEventAccountType.Default,
      },
    });
    bufferedTrace({
      name: TraceName.OnboardingNewSrpCreateWallet,
      op: TraceOperation.OnboardingUserJourney,
      parentContext: onboardingParentContext.current,
    });

    history.push(ONBOARDING_CREATE_PASSWORD_ROUTE);
  }, [dispatch, history, trackEvent, onboardingParentContext]);

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
    bufferedTrace({
      name: TraceName.OnboardingExistingSrpImport,
      op: TraceOperation.OnboardingUserJourney,
      parentContext: onboardingParentContext.current,
    });

    history.push(ONBOARDING_IMPORT_WITH_SRP_ROUTE);
  }, [dispatch, history, trackEvent, onboardingParentContext]);

  const handleSocialLogin = useCallback(
    async (socialConnectionType) => {
      bufferedTrace({
        name: TraceName.OnboardingSocialLoginAttempt,
        op: TraceOperation.OnboardingUserJourney,
        tags: { provider: socialConnectionType },
        parentContext: onboardingParentContext.current,
      });
      const isNewUser = await dispatch(startOAuthLogin(socialConnectionType));
      bufferedEndTrace({ name: TraceName.OnboardingSocialLoginAttempt });

      return isNewUser;
    },
    [dispatch, onboardingParentContext],
  );

  const handleSocialLoginError = useCallback(
    (error, socialConnectionType) => {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';

      bufferedTrace({
        name: TraceName.OnboardingSocialLoginError,
        op: TraceOperation.OnboardingError,
        tags: { provider: socialConnectionType, errorMessage },
        parentContext: onboardingParentContext.current,
      });
      bufferedEndTrace({ name: TraceName.OnboardingSocialLoginError });
      bufferedEndTrace({
        name: TraceName.OnboardingSocialLoginAttempt,
        data: { success: false },
      });
    },
    [onboardingParentContext],
  );

  const onSocialLoginCreateClick = useCallback(
    async (socialConnectionType) => {
      setIsLoggingIn(true);
      setNewAccountCreationInProgress(true);
      dispatch(setFirstTimeFlowType(FirstTimeFlowType.socialCreate));

      // Track wallet setup started for social login users
      trackEvent({
        category: MetaMetricsEventCategory.Onboarding,
        event: MetaMetricsEventName.WalletRehydrationSelected,
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
        trackEvent({
          category: MetaMetricsEventCategory.Onboarding,
          event: MetaMetricsEventName.WalletSetupStarted,
          properties: {
            account_type: `${MetaMetricsEventAccountType.Default}_${socialConnectionType}`,
          },
        });
        if (isNewUser) {
          bufferedTrace({
            name: TraceName.OnboardingNewSocialCreateWallet,
            op: TraceOperation.OnboardingUserJourney,
            parentContext: onboardingParentContext.current,
          });
          history.push(ONBOARDING_CREATE_PASSWORD_ROUTE);
        } else {
          history.push(
            `${ONBOARDING_ACCOUNT_EXIST}?socialConnectionType=${socialConnectionType}`,
          );
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
      history,
      onboardingParentContext,
      handleSocialLoginError,
    ],
  );

  const onSocialLoginImportClick = useCallback(
    async (socialConnectionType) => {
      setIsLoggingIn(true);
      dispatch(setFirstTimeFlowType(FirstTimeFlowType.socialImport));

      // Track wallet login selected for existing social login users
      trackEvent({
        category: MetaMetricsEventCategory.Onboarding,
        event: MetaMetricsEventName.WalletRehydrationSelected,
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
        trackEvent({
          category: MetaMetricsEventCategory.Onboarding,
          event: MetaMetricsEventName.WalletImportStarted,
          properties: {
            account_type: `${MetaMetricsEventAccountType.Imported}_${socialConnectionType}`,
          },
        });

        if (isNewUser) {
          history.push(
            `${ONBOARDING_ACCOUNT_NOT_FOUND}?socialConnectionType=${socialConnectionType}`,
          );
        } else {
          bufferedTrace({
            name: TraceName.OnboardingExistingSocialLogin,
            op: TraceOperation.OnboardingUserJourney,
            parentContext: onboardingParentContext.current,
          });
          history.push(ONBOARDING_UNLOCK_ROUTE);
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
      history,
      onboardingParentContext,
      handleSocialLoginError,
    ],
  );

  const handleLogin = useCallback(
    async (loginType, loginOption) => {
      if (loginOption === LOGIN_OPTION.NEW && loginType === LOGIN_TYPE.SRP) {
        onCreateClick();
      } else if (loginOption === LOGIN_OPTION.NEW) {
        await onSocialLoginCreateClick(loginType);
      } else if (
        loginOption === LOGIN_OPTION.EXISTING &&
        loginType === LOGIN_TYPE.SRP
      ) {
        onImportClick();
      } else if (loginOption === LOGIN_OPTION.EXISTING) {
        await onSocialLoginImportClick(loginType);
      }
    },
    [
      onCreateClick,
      onImportClick,
      onSocialLoginCreateClick,
      onSocialLoginImportClick,
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
    </>
  );
}

OnboardingWelcome.propTypes = {
  pageState: PropTypes.oneOf(Object.values(WelcomePageState)),
  setPageState: PropTypes.func.isRequired,
};
