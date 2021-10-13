import React, { useEffect, useState } from 'react';
import { Switch, Route, useHistory, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Unlock from '../unlock-page';
import {
  ONBOARDING_CREATE_PASSWORD_ROUTE,
  ONBOARDING_REVIEW_SRP_ROUTE,
  ONBOARDING_CONFIRM_SRP_ROUTE,
  ONBOARDING_UNLOCK_ROUTE,
  DEFAULT_ROUTE,
  ONBOARDING_SECURE_YOUR_WALLET_ROUTE,
  ONBOARDING_PRIVACY_SETTINGS_ROUTE,
  ONBOARDING_COMPLETION_ROUTE,
} from '../../helpers/constants/routes';
import {
  getCompletedOnboarding,
  getIsInitialized,
  getIsUnlocked,
  getSeedPhraseBackedUp,
} from '../../ducks/metamask/metamask';
import {
  createNewVaultAndGetSeedPhrase,
  unlockAndGetSeedPhrase,
} from '../../store/actions';
import { getFirstTimeFlowTypeRoute } from '../../selectors';
import Button from '../../components/ui/button';
import { useI18nContext } from '../../hooks/useI18nContext';
import OnboardingFlowSwitch from './onboarding-flow-switch/onboarding-flow-switch';
import CreatePassword from './create-password/create-password';
import ReviewRecoveryPhrase from './recovery-phrase/review-recovery-phrase';
import SecureYourWallet from './secure-your-wallet/secure-your-wallet';
import ConfirmRecoveryPhrase from './recovery-phrase/confirm-recovery-phrase';
import PrivacySettings from './privacy-settings/privacy-settings';
import CreationSuccessful from './creation-successful/creation-successful';

export default function OnboardingFlow() {
  const [seedPhrase, setSeedPhrase] = useState('');
  const dispatch = useDispatch();
  const currentLocation = useLocation();
  const history = useHistory();
  const t = useI18nContext();
  const isInitialized = useSelector(getIsInitialized);
  const isUnlocked = useSelector(getIsUnlocked);
  const completedOnboarding = useSelector(getCompletedOnboarding);
  const seedPhraseBackedUp = useSelector(getSeedPhraseBackedUp);
  const nextRoute = useSelector(getFirstTimeFlowTypeRoute);

  useEffect(() => {
    // For ONBOARDING_V2 dev purposes,
    // Remove when ONBOARDING_V2 dev complete
    if (process.env.ONBOARDING_V2) {
      history.push(ONBOARDING_COMPLETION_ROUTE);
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
    const newSeedPhrase = await dispatch(
      createNewVaultAndGetSeedPhrase(password),
    );
    setSeedPhrase(newSeedPhrase);
  };

  const handleUnlock = async (password) => {
    const retreivedSeedPhrase = await dispatch(
      unlockAndGetSeedPhrase(password),
    );
    setSeedPhrase(retreivedSeedPhrase);
    history.push(nextRoute);
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
            exact
            path={ONBOARDING_SECURE_YOUR_WALLET_ROUTE}
            component={SecureYourWallet}
          />
          <Route
            path={ONBOARDING_REVIEW_SRP_ROUTE}
            render={() => <ReviewRecoveryPhrase seedPhrase={seedPhrase} />}
          />
          <Route
            path={ONBOARDING_CONFIRM_SRP_ROUTE}
            render={() => <ConfirmRecoveryPhrase seedPhrase={seedPhrase} />}
          />
          <Route
            path={ONBOARDING_UNLOCK_ROUTE}
            render={(routeProps) => (
              <Unlock {...routeProps} onSubmit={handleUnlock} />
            )}
          />
          <Route
            path={ONBOARDING_PRIVACY_SETTINGS_ROUTE}
            component={PrivacySettings}
          />
          <Route
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
