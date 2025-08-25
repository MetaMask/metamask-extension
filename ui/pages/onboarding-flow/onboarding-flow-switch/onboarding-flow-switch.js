import React from 'react';
import { useSelector } from 'react-redux';
import { Redirect } from 'react-router-dom';
import {
  DEFAULT_ROUTE,
  ONBOARDING_COMPLETION_ROUTE,
  ONBOARDING_UNLOCK_ROUTE,
  LOCK_ROUTE,
  ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
  ONBOARDING_EXPERIMENTAL_AREA, // eslint-disable-line no-unused-vars
  ///: END:ONLY_INCLUDE_IF
  ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta)
  ONBOARDING_WELCOME_ROUTE, // eslint-disable-line no-unused-vars
  ///: END:ONLY_INCLUDE_IF
  ONBOARDING_METAMETRICS,
  ONBOARDING_CREATE_PASSWORD_ROUTE,
} from '../../../helpers/constants/routes';
import {
  getCompletedOnboarding,
  getIsInitialized,
  getIsUnlocked,
  getSeedPhraseBackedUp,
} from '../../../ducks/metamask/metamask';
///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta)
import { PLATFORM_FIREFOX } from '../../../../shared/constants/app'; // eslint-disable-line no-unused-vars
import { getBrowserName } from '../../../../shared/modules/browser-runtime.utils';
///: END:ONLY_INCLUDE_IF
import {
  getFirstTimeFlowType,
  getIsParticipateInMetaMetricsSet,
  getIsSocialLoginFlow,
  getIsSocialLoginUserAuthenticated,
} from '../../../selectors';
import { FirstTimeFlowType } from '../../../../shared/constants/onboarding';

export default function OnboardingFlowSwitch() {
  /* eslint-disable prefer-const */
  const completedOnboarding = useSelector(getCompletedOnboarding);
  const isInitialized = useSelector(getIsInitialized);
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
    return <Redirect to={{ pathname: DEFAULT_ROUTE }} />;
  }

  if (seedPhraseBackedUp !== null || (isUnlocked && isSocialLoginFlow)) {
    return (
      <Redirect
        to={{
          pathname: isParticipateInMetaMetricsSet
            ? ONBOARDING_COMPLETION_ROUTE
            : ONBOARDING_METAMETRICS,
        }}
      />
    );
  }

  if (isUnlocked) {
    return <Redirect to={{ pathname: LOCK_ROUTE }} />;
  }

  // TODO(ritave): Remove allow-list and only leave experimental_area exception
  if (!isInitialized && !isUserAuthenticatedWithSocialLogin) {
    let redirect;
    ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
    redirect = <Redirect to={{ pathname: ONBOARDING_EXPERIMENTAL_AREA }} />;
    ///: END:ONLY_INCLUDE_IF
    ///: BEGIN:ONLY_INCLUDE_IF(build-main,build-beta)
    redirect =
      getBrowserName() === PLATFORM_FIREFOX ? (
        <Redirect to={{ pathname: ONBOARDING_METAMETRICS }} />
      ) : (
        <Redirect to={{ pathname: ONBOARDING_WELCOME_ROUTE }} />
      );
    ///: END:ONLY_INCLUDE_IF
    return redirect;
  }
  if (
    !isInitialized &&
    isUserAuthenticatedWithSocialLogin &&
    firstTimeFlowType === FirstTimeFlowType.socialCreate
  ) {
    return <Redirect to={{ pathname: ONBOARDING_CREATE_PASSWORD_ROUTE }} />;
  }

  return <Redirect to={{ pathname: ONBOARDING_UNLOCK_ROUTE }} />;
}
