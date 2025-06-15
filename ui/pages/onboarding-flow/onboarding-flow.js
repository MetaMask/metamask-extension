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
} from '../../store/actions';
import {
  getFirstTimeFlowTypeRouteAfterUnlock,
  getShowTermsOfUse,
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
import { Box } from '../../components/component-library';
import {
  AlignItems,
  BackgroundColor,
  BlockSize,
  BorderColor,
  BorderRadius,
  BorderStyle,
  Display,
  FlexDirection,
  JustifyContent,
} from '../../helpers/constants/design-system';
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
import OnboardingAppHeader from './onboarding-app-header/onboarding-app-header';
import { WelcomePageState } from './welcome/types';
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
  const nextRoute = useSelector(getFirstTimeFlowTypeRouteAfterUnlock);
  const isFromReminder = new URLSearchParams(search).get('isFromReminder');
  const trackEvent = useContext(MetaMetricsContext);
  const isUnlocked = useSelector(getIsUnlocked);
  const showTermsOfUse = useSelector(getShowTermsOfUse);

  // If the user has not agreed to the terms of use, we show the banner
  // Otherwise, we show the login page
  const [welcomePageState, setWelcomePageState] = useState(
    WelcomePageState.Banner,
  );

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
    if (pathname === ONBOARDING_WELCOME_ROUTE) {
      setWelcomePageState(
        showTermsOfUse ? WelcomePageState.Banner : WelcomePageState.Login,
      );
    } else {
      setWelcomePageState(null);
    }
  }, [
    isUnlocked,
    completedOnboarding,
    secretRecoveryPhrase,
    pathname,
    history,
    showTermsOfUse,
  ]);

  const handleCreateNewAccount = async (password) => {
    const newSecretRecoveryPhrase = await dispatch(
      createNewVaultAndGetSeedPhrase(password),
    );
    setSecretRecoveryPhrase(newSecretRecoveryPhrase);
  };

  const handleUnlock = async (password) => {
    const retrievedSecretRecoveryPhrase = await dispatch(
      unlockAndGetSeedPhrase(password),
    );
    setSecretRecoveryPhrase(retrievedSecretRecoveryPhrase);
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

  const isWelcomeAndUnlockPage =
    pathname === ONBOARDING_WELCOME_ROUTE ||
    pathname === ONBOARDING_UNLOCK_ROUTE;

  return (
    <Box
      backgroundColor={BackgroundColor.backgroundDefault}
      width={BlockSize.Full}
      height={BlockSize.Full}
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      alignItems={
        pathname === ONBOARDING_WELCOME_ROUTE
          ? AlignItems.flexStart
          : AlignItems.center
      }
      justifyContent={JustifyContent.flexStart}
      className={classnames('onboarding-flow', {
        'onboarding-flow--welcome-banner':
          welcomePageState === WelcomePageState.Banner,
        'onboarding-flow--welcome-login':
          welcomePageState === WelcomePageState.Login,
      })}
    >
      <OnboardingAppHeader pageState={welcomePageState} />
      <RevealSRPModal
        setSecretRecoveryPhrase={setSecretRecoveryPhrase}
        onClose={() => history.push(DEFAULT_ROUTE)}
        isOpen={showPasswordModalToAllowSRPReveal}
      />
      <Box
        paddingInline={isWelcomeAndUnlockPage ? 0 : 6}
        paddingTop={isWelcomeAndUnlockPage ? 0 : 8}
        paddingBottom={isWelcomeAndUnlockPage ? 0 : 8}
        width={BlockSize.Full}
        borderStyle={
          isWelcomeAndUnlockPage ? BorderStyle.none : BorderStyle.solid
        }
        borderRadius={BorderRadius.LG}
        marginTop={pathname === ONBOARDING_WELCOME_ROUTE ? 0 : 3}
        marginInline="auto"
        borderColor={BorderColor.borderMuted}
        style={{
          maxWidth: isWelcomeAndUnlockPage ? 'none' : '446px',
          minHeight: isWelcomeAndUnlockPage ? 'auto' : '627px',
          height: pathname === ONBOARDING_WELCOME_ROUTE ? '100%' : 'auto',
        }}
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
            render={(routeProps) => (
              <OnboardingWelcome
                {...routeProps}
                pageState={welcomePageState}
                setPageState={setWelcomePageState}
              />
            )}
          />
          <Route
            path={ONBOARDING_PIN_EXTENSION_ROUTE}
            component={OnboardingPinExtension}
          />
          <Route
            path={ONBOARDING_METAMETRICS}
            component={MetaMetricsComponent}
          />
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
      </Box>
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
    </Box>
  );
}

function setOnboardingDate() {
  submitRequestToBackgroundAndCatch('setOnboardingDate');
}
