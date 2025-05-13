import React, { useEffect, useState, useContext } from 'react';
import { Switch, Route, useHistory, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import classnames from 'classnames';
import Unlock from '../unlock-page';
import {
  ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
  ONBOARDING_EXPERIMENTAL_AREA,
  ///: END:ONLY_INCLUDE_IF
  ONBOARDING_CREATE_PASSWORD_ROUTE,
  ONBOARDING_REVIEW_SRP_ROUTE,
  ONBOARDING_CONFIRM_SRP_ROUTE,
  ONBOARDING_UNLOCK_ROUTE,
  ONBOARDING_WELCOME_ROUTE,
  DEFAULT_ROUTE,
  ONBOARDING_SECURE_YOUR_WALLET_ROUTE,
  ONBOARDING_PRIVACY_SETTINGS_ROUTE,
  ONBOARDING_COMPLETION_ROUTE,
  ONBOARDING_IMPORT_WITH_SRP_ROUTE,
  ONBOARDING_PIN_EXTENSION_ROUTE,
  ONBOARDING_METAMETRICS,
  ONBOARDING_PASSWORD_HINT,
  ONBOARDING_ACCOUNT_EXIST,
  ONBOARDING_ACCOUNT_NOT_FOUND,
} from '../../helpers/constants/routes';
import {
  getCompletedOnboarding,
  getIsUnlocked,
} from '../../ducks/metamask/metamask';
import {
  createNewVaultAndGetSeedPhrase,
  unlockAndGetSeedPhrase,
  createNewVaultAndRestore,
  setPasswordHash,
  createNewVaultAndSyncWithSocial,
  restoreSocialBackupAndGetSeedPhrase,
} from '../../store/actions';
import {
  getFirstTimeFlowType,
  getFirstTimeFlowTypeRouteAfterUnlock,
} from '../../selectors';
import { MetaMetricsContext } from '../../contexts/metametrics';
import Button from '../../components/ui/button';
import RevealSRPModal from '../../components/app/reveal-SRP-modal';
import { useI18nContext } from '../../hooks/useI18nContext';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../shared/constants/metametrics';
///: BEGIN:ONLY_INCLUDE_IF(build-flask)
import ExperimentalArea from '../../components/app/flask/experimental-area';
///: END:ONLY_INCLUDE_IF
import { submitRequestToBackgroundAndCatch } from '../../components/app/toast-master/utils';
import { getHDEntropyIndex } from '../../selectors/selectors';
import { FirstTimeFlowType } from '../../../shared/constants/onboarding';
import OnboardingFlowSwitch from './onboarding-flow-switch/onboarding-flow-switch';
import CreatePassword from './create-password/create-password';
import ReviewRecoveryPhrase from './recovery-phrase/review-recovery-phrase';
import SecureYourWallet from './secure-your-wallet/secure-your-wallet';
import ConfirmRecoveryPhrase from './recovery-phrase/confirm-recovery-phrase';
import PrivacySettings from './privacy-settings/privacy-settings';
import CreationSuccessful from './creation-successful/creation-successful';
import OnboardingWelcome from './welcome/welcome';
import ImportSRP from './import-srp/import-srp';
import OnboardingPinExtension from './pin-extension/pin-extension';
import MetaMetricsComponent from './metametrics/metametrics';
import PasswordHint from './password-hint/password-hint';
import AccountExist from './account-exist/account-exist';
import AccountNotFound from './account-not-found/account-not-found';

const TWITTER_URL = 'https://twitter.com/MetaMask';

export default function OnboardingFlow() {
  const [secretRecoveryPhrase, setSecretRecoveryPhrase] = useState('');
  const dispatch = useDispatch();
  const { pathname, search } = useLocation();
  const history = useHistory();
  const t = useI18nContext();
  const hdEntropyIndex = useSelector(getHDEntropyIndex);
  const completedOnboarding = useSelector(getCompletedOnboarding);
  const firstTimeFlowType = useSelector(getFirstTimeFlowType);
  const nextRoute = useSelector(getFirstTimeFlowTypeRouteAfterUnlock);
  const isFromReminder = new URLSearchParams(search).get('isFromReminder');
  const trackEvent = useContext(MetaMetricsContext);
  const isUnlocked = useSelector(getIsUnlocked);

  useEffect(() => {
    setOnboardingDate();
  }, []);

  useEffect(() => {
    if (completedOnboarding && !isFromReminder) {
      history.push(DEFAULT_ROUTE);
    }
  }, [history, completedOnboarding, isFromReminder]);

  useEffect(() => {
    if (isUnlocked && !completedOnboarding && !secretRecoveryPhrase) {
      const needsSRP = [
        ONBOARDING_REVIEW_SRP_ROUTE,
        ONBOARDING_CONFIRM_SRP_ROUTE,
      ].some((route) => pathname.startsWith(route));

      if (needsSRP) {
        history.push(ONBOARDING_UNLOCK_ROUTE);
      }
    }
  }, [
    isUnlocked,
    completedOnboarding,
    secretRecoveryPhrase,
    pathname,
    history,
  ]);

  const handleCreateNewAccount = async (password) => {
    let newSecretRecoveryPhrase;
    if (firstTimeFlowType === FirstTimeFlowType.social) {
      newSecretRecoveryPhrase = await dispatch(
        createNewVaultAndSyncWithSocial(password),
      );
    } else {
      newSecretRecoveryPhrase = await dispatch(
        createNewVaultAndGetSeedPhrase(password),
      );
    }
    setSecretRecoveryPhrase(newSecretRecoveryPhrase);
    // save `PasswordHash` in the preferences
    dispatch(setPasswordHash(password));
  };

  const handleUnlock = async (password) => {
    let retrievedSecretRecoveryPhrase;
    if (firstTimeFlowType === FirstTimeFlowType.social) {
      retrievedSecretRecoveryPhrase = await dispatch(
        restoreSocialBackupAndGetSeedPhrase(password),
      );

      if (retrievedSecretRecoveryPhrase === null) {
        // if the seed phrase is not found, ask user to setup the password and generate a new seed phrase
        history.push(ONBOARDING_CREATE_PASSWORD_ROUTE);
        return;
      }
    } else {
      retrievedSecretRecoveryPhrase = await dispatch(
        unlockAndGetSeedPhrase(password),
      );
    }

    setSecretRecoveryPhrase(retrievedSecretRecoveryPhrase);
    // save `PasswordHash` in the preferences
    dispatch(setPasswordHash(password));
    history.push(nextRoute);
  };

  const handleImportWithRecoveryPhrase = async (password, srp) => {
    return await dispatch(createNewVaultAndRestore(password, srp));
  };

  const showPasswordModalToAllowSRPReveal =
    pathname === `${ONBOARDING_REVIEW_SRP_ROUTE}/` &&
    completedOnboarding &&
    !secretRecoveryPhrase &&
    isFromReminder;

  return (
    <div
      className={classnames('onboarding-flow', {
        'onboarding-flow--welcome': pathname === ONBOARDING_WELCOME_ROUTE,
        'onboarding-flow--unlock': pathname === ONBOARDING_UNLOCK_ROUTE,
      })}
    >
      <RevealSRPModal
        setSecretRecoveryPhrase={setSecretRecoveryPhrase}
        onClose={() => history.push(DEFAULT_ROUTE)}
        isOpen={showPasswordModalToAllowSRPReveal}
      />
      <div
        className={classnames('onboarding-flow__wrapper', {
          'onboarding-flow__wrapper--welcome':
            pathname === ONBOARDING_WELCOME_ROUTE,
          'onboarding-flow__wrapper--unlock':
            pathname === ONBOARDING_UNLOCK_ROUTE,
        })}
      >
        <Switch>
          <Route path={ONBOARDING_ACCOUNT_EXIST} component={AccountExist} />
          <Route
            path={ONBOARDING_ACCOUNT_NOT_FOUND}
            component={AccountNotFound}
          />
          <Route
            path={ONBOARDING_CREATE_PASSWORD_ROUTE}
            render={(routeProps) => (
              <CreatePassword
                {...routeProps}
                createNewAccount={handleCreateNewAccount}
                importWithRecoveryPhrase={handleImportWithRecoveryPhrase}
                secretRecoveryPhrase={secretRecoveryPhrase}
              />
            )}
          />
          <Route
            path={ONBOARDING_SECURE_YOUR_WALLET_ROUTE}
            component={SecureYourWallet}
          />
          <Route
            path={ONBOARDING_REVIEW_SRP_ROUTE}
            render={() => (
              <ReviewRecoveryPhrase
                secretRecoveryPhrase={secretRecoveryPhrase}
              />
            )}
          />
          <Route
            path={ONBOARDING_CONFIRM_SRP_ROUTE}
            render={() => (
              <ConfirmRecoveryPhrase
                secretRecoveryPhrase={secretRecoveryPhrase}
              />
            )}
          />
          <Route
            path={ONBOARDING_IMPORT_WITH_SRP_ROUTE}
            render={(routeProps) => (
              <ImportSRP
                {...routeProps}
                submitSecretRecoveryPhrase={setSecretRecoveryPhrase}
              />
            )}
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
          <Route
            path={ONBOARDING_WELCOME_ROUTE}
            component={OnboardingWelcome}
          />
          <Route
            path={ONBOARDING_PIN_EXTENSION_ROUTE}
            component={OnboardingPinExtension}
          />
          <Route
            path={ONBOARDING_METAMETRICS}
            component={MetaMetricsComponent}
          />
          <Route path={ONBOARDING_PASSWORD_HINT} component={PasswordHint} />
          {
            ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
          }
          <Route
            path={ONBOARDING_EXPERIMENTAL_AREA}
            render={(routeProps) => (
              <ExperimentalArea
                {...routeProps}
                redirectTo={ONBOARDING_WELCOME_ROUTE}
              />
            )}
          />
          {
            ///: END:ONLY_INCLUDE_IF
          }
          <Route exact path="*" component={OnboardingFlowSwitch} />
        </Switch>
      </div>
      {pathname === ONBOARDING_COMPLETION_ROUTE && (
        <Button
          className="onboarding-flow__twitter-button"
          type="link"
          href={TWITTER_URL}
          onClick={() => {
            trackEvent({
              category: MetaMetricsEventCategory.Onboarding,
              event: MetaMetricsEventName.OnboardingTwitterClick,
              properties: {
                text: t('followUsOnTwitter'),
                location: MetaMetricsEventName.OnboardingWalletCreationComplete,
                url: TWITTER_URL,
                hd_entropy_index: hdEntropyIndex,
              },
            });
          }}
          target="_blank"
        >
          <span>{t('followUsOnTwitter')}</span>
          <i className="fab fa-twitter onboarding-flow__twitter-button__icon" />
        </Button>
      )}
    </div>
  );
}

function setOnboardingDate() {
  submitRequestToBackgroundAndCatch('setOnboardingDate');
}
