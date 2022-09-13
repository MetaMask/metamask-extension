import React from 'react';
import { useSelector } from 'react-redux';
import { Redirect } from 'react-router-dom';
import {
  DEFAULT_ROUTE,
  ONBOARDING_COMPLETION_ROUTE,
  ONBOARDING_UNLOCK_ROUTE,
  LOCK_ROUTE,
  ///: BEGIN:ONLY_INCLUDE_IN(flask)
  ONBOARDING_EXPERIMENTAL_AREA, // eslint-disable-line no-unused-vars
  ///: END:ONLY_INCLUDE_IN
  ///: BEGIN:ONLY_INCLUDE_IN(main,beta)
  ONBOARDING_WELCOME_ROUTE, // eslint-disable-line no-unused-vars
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

  if (seedPhraseBackedUp !== null) {
    return <Redirect to={{ pathname: ONBOARDING_COMPLETION_ROUTE }} />;
  }

  if (isUnlocked) {
    return <Redirect to={{ pathname: LOCK_ROUTE }} />;
  }

  if (!isInitialized) {
    let redirect;
    /* eslint-disable prefer-const */
    ///: BEGIN:ONLY_INCLUDE_IN(flask)
    redirect = <Redirect to={{ pathname: ONBOARDING_EXPERIMENTAL_AREA }} />;
    ///: END:ONLY_INCLUDE_IN
    ///: BEGIN:ONLY_INCLUDE_IN(main,beta)
    redirect = <Redirect to={{ pathname: ONBOARDING_WELCOME_ROUTE }} />;
    ///: END:ONLY_INCLUDE_IN
    /* eslint-enable prefer-const */
    return redirect;
  }

  return <Redirect to={{ pathname: ONBOARDING_UNLOCK_ROUTE }} />;
}
