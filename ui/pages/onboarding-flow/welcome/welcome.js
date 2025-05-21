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
import { setFirstTimeFlowType, startOAuthLogin } from '../../../store/actions';
import LoadingScreen from '../../../components/ui/loading-screen';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
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
      event: MetaMetricsEventName.OnboardingWalletCreationStarted,
      properties: {
        account_type: 'metamask',
      },
    });

    ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
    history.push(ONBOARDING_CREATE_PASSWORD_ROUTE);
    ///: END:ONLY_INCLUDE_IF
  }, [dispatch, history, trackEvent]);

  const onImportClick = useCallback(async () => {
    setIsLoggingIn(true);
    await dispatch(setFirstTimeFlowType(FirstTimeFlowType.import));
    trackEvent({
      category: MetaMetricsEventCategory.Onboarding,
      event: MetaMetricsEventName.OnboardingWalletImportStarted,
      properties: {
        account_type: 'imported',
      },
    });

    ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
    history.push(ONBOARDING_IMPORT_WITH_SRP_ROUTE);
    ///: END:ONLY_INCLUDE_IF
  }, [dispatch, history, trackEvent]);

  const onSocialLoginClick = useCallback(
    async (socialConnectionType, loginOption) => {
      setIsLoggingIn(true);
      try {
        setNewAccountCreationInProgress(true);
        dispatch(setFirstTimeFlowType(FirstTimeFlowType.social));

        const isNewUser = await dispatch(startOAuthLogin(socialConnectionType));

        // if user is not new user and login option is new, redirect to account exist page
        if (loginOption === 'new' && !isNewUser) {
          history.push(ONBOARDING_ACCOUNT_EXIST);
          return;
        } else if (loginOption === 'existing' && isNewUser) {
          // if user is new user and login option is existing, redirect to account not found page
          history.push(ONBOARDING_ACCOUNT_NOT_FOUND);
          return;
        }

        if (!isNewUser) {
          // redirect to login page
          history.push(ONBOARDING_UNLOCK_ROUTE);
          return;
        }

        trackEvent({
          category: MetaMetricsEventCategory.Onboarding,
          // TODO: add seedless onboarding event to MetaMetrics?
          event: MetaMetricsEventName.OnboardingWalletCreationStarted,
          properties: {
            account_type: 'metamask',
          },
        });

        ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta,build-flask)
        history.push(ONBOARDING_CREATE_PASSWORD_ROUTE);
        ///: END:ONLY_INCLUDE_IF
      } finally {
        setIsLoggingIn(false);
      }
    },
    [dispatch, history, trackEvent],
  );

  const handleLogin = useCallback(
    (loginType, loginOption) => {
      if (loginType === LOGIN_TYPE.SRP) {
        if (loginOption === LOGIN_OPTION.NEW) {
          onCreateClick();
        } else {
          onImportClick();
        }
      } else {
        onSocialLoginClick(loginType, loginOption);
      }
    },
    [onCreateClick, onImportClick, onSocialLoginClick],
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
  pageState: PropTypes.oneOf(Object.values(WelcomePageState)).isRequired,
  setPageState: PropTypes.func.isRequired,
};
