import React, { useEffect, useState } from 'react';
import { Switch, Route, useHistory, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import Unlock from '../unlock-page';
import {
  // DEFAULT_ROUTE,
  // ONBOARDING_ROUTE,
  // ONBOARDING_GET_STARTED_ROUTE,
  // ONBOARDING_HELP_US_IMPROVE_ROUTE,
  ONBOARDING_CREATE_PASSWORD_ROUTE,
  // ONBOARDING_IMPORT_WITH_SRP_ROUTE,
  // ONBOARDING_IMPORT_MOBILE_ROUTE,
  // ONBOARDING_SECURE_YOUR_WALLET_ROUTE,
  ONBOARDING_REVIEW_SRP_ROUTE,
  ONBOARDING_CONFIRM_SRP_ROUTE,
  // ONBOARDING_PRIVACY_SETTINGS_ROUTE,
  ONBOARDING_COMPLETION_ROUTE,
  ONBOARDING_UNLOCK_ROUTE,
} from '../../helpers/constants/routes';
// import {
//   getCompletedOnboarding,
//   getIsInitialized,
//   getIsUnlocked,
//   getSeedPhraseBackedUp,
// } from '../../selectors';
import {
  createNewVaultAndGetSeedPhrase,
  unlockAndGetSeedPhrase,
  // createNewVaultAndRestore,
  // verifySeedPhrase,
} from '../../store/actions';
import Button from '../../components/ui/button';
import { useI18nContext } from '../../hooks/useI18nContext';
import OnboardingFlowSwitch from './onboarding-flow-switch/onboarding-flow-switch';
import CreatePassword from './create-password/create-password';
// import SecureYourWallet from './secure-your-wallet/secure-your-wallet';
import ReviewRecoveryPhrase from './recovery-phrase/review-recovery-phrase';
import ConfirmRecoveryPhrase from './recovery-phrase/confirm-recovery-phrase';
import CreationSuccessful from './creation-successful/creation-successful';

export default function OnboardingFlow() {
  const [seedPhrase, setSeedPhrase] = useState('');
  const dispatch = useDispatch();
  const history = useHistory();
  const t = useI18nContext();
  const currentLocation = useLocation();
  // const completedOnboarding = useSelector(getCompletedOnboarding);
  // const isInitialized = useSelector(getIsInitialized);
  // const isUnlocked = useSelector(getIsUnlocked);
  // const seedPhraseBackedUp = useSelector(getSeedPhraseBackedUp);

  useEffect(() => {
    history.push(ONBOARDING_COMPLETION_ROUTE);

    // if (
    //   completedOnboarding && seedPhraseBackedUp
    // ) {
    //   history.push(DEFAULT_ROUTE);
    //   return;
    // }

    // if (isInitialized && !isUnlocked) {
    //   history.push(ONBOARDING_UNLOCK_ROUTE);
    // }
  }, [history]);

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

  // const handleImportWithSeedPhrase = async (password, importedSeedPhrase) => {
  //   try {
  //     const vault = await dispatch(
  //       createNewVaultAndRestore(password, importedSeedPhrase),
  //     );
  //     return vault;
  //   } catch (error) {
  //     throw new Error(error.message);
  //   }
  // };

  const handleUnlock = async (password) => {
    try {
      const retreivedSeedPhrase = await unlockAndGetSeedPhrase(password);
      setSeedPhrase(retreivedSeedPhrase);
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
            render={() => <ReviewRecoveryPhrase seedPhrase={seedPhrase} />}
          />
          <Route
            path={ONBOARDING_CONFIRM_SRP_ROUTE}
            component={() => <ConfirmRecoveryPhrase seedPhrase={seedPhrase} />}
          />
          {/* <Route
            path={ONBOARDING_SECURE_YOUR_WALLET_ROUTE}
            component={SecureYourWallet}
          /> */}
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
