import React from 'react';
import { useSelector } from 'react-redux';
import { Redirect } from 'react-router-dom';
import {
  DEFAULT_ROUTE,
  ///: BEGIN:ONLY_INCLUDE_IN(build-main,build-beta,build-flask)
  ONBOARDING_COMPLETION_ROUTE,
  ///: END:ONLY_INCLUDE_IN
  ONBOARDING_UNLOCK_ROUTE,
  LOCK_ROUTE,
  ///: BEGIN:ONLY_INCLUDE_IN(build-flask)
  ONBOARDING_EXPERIMENTAL_AREA, // eslint-disable-line no-unused-vars
  ///: END:ONLY_INCLUDE_IN
  ///: BEGIN:ONLY_INCLUDE_IN(build-main,build-beta,build-mmi)
  ONBOARDING_WELCOME_ROUTE, // eslint-disable-line no-unused-vars
  ///: END:ONLY_INCLUDE_IN
  ///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
  MMI_ONBOARDING_COMPLETION_ROUTE,
  ///: END:ONLY_INCLUDE_IN
} from '../../../helpers/constants/routes';
import {
  getCompletedOnboarding,
  getIsInitialized,
  getIsUnlocked,
  getSeedPhraseBackedUp,
} from '../../../ducks/metamask/metamask';

export default function OnboardingFlowSwitch() {
  /* eslint-disable prefer-const */
  const completedOnboarding = useSelector(getCompletedOnboarding);
  const isInitialized = useSelector(getIsInitialized);
  const seedPhraseBackedUp = useSelector(getSeedPhraseBackedUp);
  const isUnlocked = useSelector(getIsUnlocked);

  if (completedOnboarding) {
    return <Redirect to={{ pathname: DEFAULT_ROUTE }} />;
  }

  ///: BEGIN:ONLY_INCLUDE_IN(build-main,build-beta,build-flask)
  if (seedPhraseBackedUp !== null) {
    return <Redirect to={{ pathname: ONBOARDING_COMPLETION_ROUTE }} />;
  }
  ///: END:ONLY_INCLUDE_IN

  ///: BEGIN:ONLY_INCLUDE_IN(build-mmi)
  if (seedPhraseBackedUp !== null) {
    return <Redirect to={{ pathname: MMI_ONBOARDING_COMPLETION_ROUTE }} />;
  }
  ///: END:ONLY_INCLUDE_IN

  if (isUnlocked) {
    return <Redirect to={{ pathname: LOCK_ROUTE }} />;
  }

  // TODO(ritave): Remove allow-list and only leave experimental_area exception
  if (!isInitialized) {
    let redirect;
    ///: BEGIN:ONLY_INCLUDE_IN(build-flask)
    redirect = <Redirect to={{ pathname: ONBOARDING_EXPERIMENTAL_AREA }} />;
    ///: END:ONLY_INCLUDE_IN
    ///: BEGIN:ONLY_INCLUDE_IN(build-main,build-beta,build-mmi)
    redirect = <Redirect to={{ pathname: ONBOARDING_WELCOME_ROUTE }} />;
    ///: END:ONLY_INCLUDE_IN
    return redirect;
  }

  return <Redirect to={{ pathname: ONBOARDING_UNLOCK_ROUTE }} />;
}
