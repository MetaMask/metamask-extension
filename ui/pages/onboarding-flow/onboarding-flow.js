import React, { useEffect, useState } from 'react';
import { Switch, Route, useHistory, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Unlock from '../unlock-page';
import {
  ONBOARDING_CREATE_PASSWORD_ROUTE,
  ONBOARDING_REVIEW_SRP_ROUTE,
  ONBOARDING_CONFIRM_SRP_ROUTE,
  ONBOARDING_COMPLETION_ROUTE,
  ONBOARDING_UNLOCK_ROUTE,
  DEFAULT_ROUTE,
} from '../../helpers/constants/routes';
import {
  getCompletedOnboarding,
  getFirstTimeFlowTypeRoute,
  getIsInitialized,
  getIsUnlocked,
  getSeedPhraseBackedUp,
} from '../../selectors';
import {
  createNewVaultAndGetSeedPhrase,
  unlockAndGetSeedPhrase,
} from '../../store/actions';
import Button from '../../components/ui/button';
import { useI18nContext } from '../../hooks/useI18nContext';
import OnboardingFlowSwitch from './onboarding-flow-switch/onboarding-flow-switch';
import CreatePassword from './create-password/create-password';
import ReviewRecoveryPhrase from './recovery-phrase/review-recovery-phrase';
import ConfirmRecoveryPhrase from './recovery-phrase/confirm-recovery-phrase';
import CreationSuccessful from './creation-successful/creation-successful';

export default function OnboardingFlow() {
  const [seedPhrase, setSeedPhrase] = useState('');
  const dispatch = useDispatch();
  const history = useHistory();
  const t = useI18nContext();
  const currentLocation = useLocation();
  const isInitialized = useSelector(getIsInitialized);
  const isUnlocked = useSelector(getIsUnlocked);
  const completedOnboarding = useSelector(getCompletedOnboarding);
  const seedPhraseBackedUp = useSelector(getSeedPhraseBackedUp);
  const nextRoute = useSelector(getFirstTimeFlowTypeRoute);

  useEffect(() => {
    if (process.env.ONBOARDING_V2) {
      history.push(ONBOARDING_CREATE_PASSWORD_ROUTE);
      return;
    }

    if (completedOnboarding && seedPhraseBackedUp) {
      history.push(DEFAULT_ROUTE);
      return;
    }

    if (isInitialized && !isUnlocked) {
      history.push(ONBOARDING_UNLOCK_ROUTE);
    }
  }, [
    history,
    completedOnboarding,
    isInitialized,
    isUnlocked,
    seedPhraseBackedUp,
  ]);

  const handleCreateNewAccount = async (password) => {
    try {
      const newSeedPhrase = await dispatch(
        createNewVaultAndGetSeedPhrase(password),
      );
      setSeedPhrase(newSeedPhrase);
    } catch (error) {
      throw new Error(error.message);
    }
  };

  const handleUnlock = async (password) => {
    try {
      const retreivedSeedPhrase = await dispatch(
        unlockAndGetSeedPhrase(password),
      );
      setSeedPhrase(retreivedSeedPhrase);
      history.push(nextRoute);
    } catch (error) {
      throw new Error(error.message);
    }
  };

  return (
    <div className="onboarding-flow">
      <div className="onboarding-flow__wrapper">
        <Switch>
          <Route
            path={ONBOARDING_CREATE_PASSWORD_ROUTE}
            render={(routeProps) => (
              <CreatePassword
                {...routeProps}
                createNewAccount={handleCreateNewAccount}
              />
            )}
          />
          <Route
            path={ONBOARDING_REVIEW_SRP_ROUTE}
            render={() => <ReviewRecoveryPhrase seedPhrase={seedPhrase} />}
          />
          <Route
            path={ONBOARDING_CONFIRM_SRP_ROUTE}
            component={() => <ConfirmRecoveryPhrase seedPhrase={seedPhrase} />}
          />
          <Route
            path={ONBOARDING_UNLOCK_ROUTE}
            render={(routeProps) => (
              <Unlock {...routeProps} onSubmit={handleUnlock} />
            )}
          />
          <Route
            exact
            path={ONBOARDING_COMPLETION_ROUTE}
            component={CreationSuccessful}
          />
          <Route exact path="*" component={OnboardingFlowSwitch} />
        </Switch>
      </div>
      {currentLocation?.pathname === ONBOARDING_COMPLETION_ROUTE && (
        <Button
          className="onboarding-flow__twitter-button"
          type="link"
          href="https://twitter.com/MetaMask"
          target="_blank"
        >
          <span>{t('followUsOnTwitter')}</span>
          <img src="images/twitter-icon.png" />
        </Button>
      )}
    </div>
  );
}
