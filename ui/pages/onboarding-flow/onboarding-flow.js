import React, { useEffect, useState } from 'react';
import { Switch, Route, useHistory } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Unlock from '../unlock-page';
import {
  DEFAULT_ROUTE,
  ONBOARDING_ROUTE,
  ONBOARDING_GET_STARTED_ROUTE,
  ONBOARDING_HELP_US_IMPROVE_ROUTE,
  ONBOARDING_CREATE_PASSWORD_ROUTE,
  ONBOARDING_IMPORT_WITH_SRP_ROUTE,
  ONBOARDING_IMPORT_MOBILE_ROUTE,
  ONBOARDING_SECURE_YOUR_WALLET_ROUTE,
  ONBOARDING_REVIEW_SRP_ROUTE,
  ONBOARDING_CONFIRM_SRP_ROUTE,
  ONBOARDING_PRIVACY_SETTINGS_ROUTE,
  ONBOARDING_COMPLETION_ROUTE,
  ONBOARDING_UNLOCK_ROUTE,
} from '../../helpers/constants/routes';
import OnboardingFlowSwitch from './onboarding-flow-switch/onboarding-flow-switch';
import CreatePassword from './create-password/create-password';
import SecureYourWallet from './secure-your-wallet/secure-your-wallet';
import RecoveryPhrase from './recovery-phrase/confirm-recovery-phrase';
import ConfirmRecoveryPhrase from './recovery-phrase/confirm-recovery-phrase';
import StepProgressBar, {
  stages,
} from '../../components/app/step-progress-bar';
import {
  getCompletedOnboarding,
  getIsInitialized,
  getIsUnlocked,
  getSeedPhraseBackedUp,
} from '../../selectors';
import {
  createNewVaultAndGetSeedPhrase,
  createNewVaultAndRestore,
  unlockAndGetSeedPhrase,
  verifySeedPhrase,
} from '../../store/actions';

export default function OnboardingFlow() {
  const [seedPhrase, setSeedPhrase] = useState('');
  const dispatch = useDispatch();
  const history = useHistory();
  const completedOnboarding = useSelector(getCompletedOnboarding);
  const isInitialized = useSelector(getIsInitialized);
  const isUnlocked = useSelector(getIsUnlocked);
  const seedPhraseBackedUp = useSelector(getSeedPhraseBackedUp);

  useEffect(() => {
    history.push(ONBOARDING_SECURE_YOUR_WALLET_ROUTE);
   
    // if (
    //   completedOnboarding && seedPhraseBackedUp
    // ) {
    //   history.push(DEFAULT_ROUTE);
    //   return;
    // }

    // if (isInitialized && !isUnlocked) {
    //   history.push(ONBOARDING_UNLOCK_ROUTE);
    // }
  }, []);

  const handleCreateNewAccount = async (password) => {
    try {
      const seedPhrase = await dispatch(
        createNewVaultAndGetSeedPhrase(password),
      );
      setSeedPhrase(seedPhrase);
    } catch (error) {
      throw new Error(error.message);
    }
  };

    const handleImportWithSeedPhrase = async (password, seedPhrase) => {
      try {
        const vault = await dispatch(
          createNewVaultAndRestore(password, seedPhrase),
        );
        return vault;
      } catch (error) {
        throw new Error(error.message);
      }
    };

    const handleUnlock = async (password) => {
      try {
        const seedPhrase = await unlockAndGetSeedPhrase(password);
        setSeedPhrase(seedPhrase)
        // TODO - get next route
        // history.push()
      } catch (error) {
        throw new Error(error.message);
      }
    };

  return (
    <div className="onboarding-flow">
      <div className="onboarding-flow__wrapper">
        <Switch>
          {/* <Route exact path={ONBOARDING_GET_STARTED_ROUTE} component={GetStarted} /> */}
          {/* <Route
            exact
            path={ONBOARDING_HELP_US_IMPROVE_ROUTE}
            component={MetaMetricsOptInScreen}
          /> */}
          {/* 
        <Route
            path={ONBOARDING_IMPORT_WITH_SRP_ROUTE}
            component={}
          /> */}

          <Route
            path={ONBOARDING_CREATE_PASSWORD_ROUTE}
            render={(routeProps) => (
              <CreatePassword
                {...routeProps}
                createNewAccount={handleCreateNewAccount}
              />
            )}
          />
          {/* <Route path={ONBOARDING_IMPORT_MOBILE_ROUTE} component={ImportMobile} /> */}
          <Route
            path={ONBOARDING_REVIEW_SRP_ROUTE}
            render={() => <RecoveryPhrase seedPhrase={seedPhrase} />}
          />
          <Route
            path={ONBOARDING_CONFIRM_SRP_ROUTE}
            component={() => <ConfirmRecoveryPhrase seedPhrase={seedPhrase} />}
          />
          <Route
            path={ONBOARDING_SECURE_YOUR_WALLET_ROUTE}
            component={SecureYourWallet}
          />
          <Route
          path={ONBOARDING_UNLOCK_ROUTE}
          render={(routeProps) => (
            <Unlock {...routeProps} onSubmit={handleUnlock} />
          )}
        />
          {/* <Route
          exact
          path={ONBOARDING_COMPLETION_ROUTE}
          component={EndOfFlow}
        /> */}
          <Route exact path="*" component={OnboardingFlowSwitch} />
        </Switch>
      </div>
    </div>
  );
}
