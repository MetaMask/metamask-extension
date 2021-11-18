import React from 'react';
import { useSelector } from 'react-redux';
import { Redirect } from 'react-router-dom';
import {
  DEFAULT_ROUTE,
  ONBOARDING_COMPLETION_ROUTE,
  ONBOARDING_UNLOCK_ROUTE,
  LOCK_ROUTE,
  ONBOARDING_EXPERIMENTAL_AREA,
  ONBOARDING_WELCOME_ROUTE,
} from '../../../helpers/constants/routes';
import {
  getCompletedOnboarding,
  getIsInitialized,
  getIsUnlocked,
  getSeedPhraseBackedUp,
} from '../../../ducks/metamask/metamask';

export default function OnboardingFlowSwitch() {
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
    ///: BEGIN:ONLY_INCLUDE_IN(flask)
    return <Redirect to={{ pathname: ONBOARDING_EXPERIMENTAL_AREA }} />;
    ///: END:ONLY_INCLUDE_IN
    return <Redirect to={{ pathname: ONBOARDING_WELCOME_ROUTE }} />; // eslint-disable-line no-unreachable
  }

  return <Redirect to={{ pathname: ONBOARDING_UNLOCK_ROUTE }} />;
}
