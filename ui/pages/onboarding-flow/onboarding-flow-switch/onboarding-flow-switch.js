import React from 'react';
import { useSelector } from 'react-redux';
import { Redirect } from 'react-router-dom';
import {
  DEFAULT_ROUTE,
  LOCK_ROUTE,
  INITIALIZE_END_OF_FLOW_ROUTE,
  ONBOARDING_GET_STARTED_ROUTE,
  INITIALIZE_UNLOCK_ROUTE,
} from '../../../helpers/constants/routes';
import {
  getCompletedOnboarding,
  getIsInitialized,
  getIsUnlocked,
  getSeedPhraseBackedUp,
} from '../../../selectors';

export default function OnboardingFlowSwitch() {
  const completedOnboarding = useSelector(getCompletedOnboarding);
  const isInitialized = useSelector(getIsInitialized);
  const isUnlocked = useSelector(getIsUnlocked);
  const seedPhraseBackedUp = useSelector(getSeedPhraseBackedUp);

  if (completedOnboarding) {
    return <Redirect to={{ pathname: DEFAULT_ROUTE }} />;
  }

  if (seedPhraseBackedUp !== null) {
    return <Redirect to={{ pathname: INITIALIZE_END_OF_FLOW_ROUTE }} />;
  }

  if (isUnlocked) {
    return <Redirect to={{ pathname: LOCK_ROUTE }} />;
  }

  if (!isInitialized) {
    return <Redirect to={{ pathname: ONBOARDING_GET_STARTED_ROUTE }} />;
  }

  return <Redirect to={{ pathname: INITIALIZE_UNLOCK_ROUTE }} />;
}
