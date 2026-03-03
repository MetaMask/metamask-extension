import React from 'react';
import { useSelector } from 'react-redux';
import { Navigate } from 'react-router-dom';
import {
  DEFAULT_ROUTE,
  ONBOARDING_COMPLETION_ROUTE,
  ONBOARDING_UNLOCK_ROUTE,
  LOCK_ROUTE,
  ONBOARDING_EXPERIMENTAL_AREA,
  ONBOARDING_WELCOME_ROUTE,
  ONBOARDING_METAMETRICS,
  ONBOARDING_CREATE_PASSWORD_ROUTE,
} from '../../../helpers/constants/routes';
import {
  getCompletedOnboarding,
  getIsInitialized,
  getIsUnlocked,
  getIsWalletResetInProgress,
  getSeedPhraseBackedUp,
} from '../../../ducks/metamask/metamask';
import { PLATFORM_FIREFOX } from '../../../../shared/constants/app';
import { getBrowserName } from '../../../../shared/modules/browser-runtime.utils';
import {
  getFirstTimeFlowType,
  getIsParticipateInMetaMetricsSet,
  getIsSocialLoginFlow,
  getIsSocialLoginUserAuthenticated,
} from '../../../selectors';
import { FirstTimeFlowType } from '../../../../shared/constants/onboarding';
import {
  isBeta,
  isExperimental,
  isFlask,
  isMain,
} from '../../../../shared/lib/build-types';

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function OnboardingFlowSwitch() {
  /* eslint-disable prefer-const */
  const completedOnboarding = useSelector(getCompletedOnboarding);
  const isInitialized = useSelector(getIsInitialized);
  const isWalletResetInProgress = useSelector(getIsWalletResetInProgress);
  const isUserAuthenticatedWithSocialLogin = useSelector(
    getIsSocialLoginUserAuthenticated,
  );
  const seedPhraseBackedUp = useSelector(getSeedPhraseBackedUp);
  const firstTimeFlowType = useSelector(getFirstTimeFlowType);
  const isSocialLoginFlow = useSelector(getIsSocialLoginFlow);
  const isUnlocked = useSelector(getIsUnlocked);
  const isParticipateInMetaMetricsSet = useSelector(
    getIsParticipateInMetaMetricsSet,
  );

  if (completedOnboarding) {
    return <Navigate to={DEFAULT_ROUTE} replace />;
  }

  if (seedPhraseBackedUp !== null || (isUnlocked && isSocialLoginFlow)) {
    return (
      <Navigate
        to={
          isParticipateInMetaMetricsSet
            ? ONBOARDING_COMPLETION_ROUTE
            : ONBOARDING_METAMETRICS
        }
        replace
      />
    );
  }

  if (isUnlocked) {
    return <Navigate to={LOCK_ROUTE} replace />;
  }

  // TODO(ritave): Remove allow-list and only leave experimental_area exception
  if (
    (!isInitialized || isWalletResetInProgress) &&
    !isUserAuthenticatedWithSocialLogin
  ) {
    let redirect;

    if (isFlask()) {
      redirect = <Navigate to={ONBOARDING_EXPERIMENTAL_AREA} replace />;
    } else if (isMain() || isBeta() || isExperimental()) {
      redirect = (
        <Navigate
          to={
            getBrowserName() === PLATFORM_FIREFOX
              ? ONBOARDING_METAMETRICS
              : ONBOARDING_WELCOME_ROUTE
          }
          replace
        />
      );
    } else {
      throw new Error(
        'This should be unreachable code, so something is wrong with the build type',
      );
    }

    return redirect;
  }
  if (
    (!isInitialized || isWalletResetInProgress) &&
    isUserAuthenticatedWithSocialLogin &&
    firstTimeFlowType === FirstTimeFlowType.socialCreate
  ) {
    return <Navigate to={ONBOARDING_CREATE_PASSWORD_ROUTE} replace />;
  }

  return <Navigate to={ONBOARDING_UNLOCK_ROUTE} replace />;
}
