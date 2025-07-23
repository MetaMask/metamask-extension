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
  SECURITY_ROUTE,
  ONBOARDING_REVEAL_SRP_ROUTE,
} from '../../helpers/constants/routes';
import {
  getCompletedOnboarding,
  getIsPrimarySeedPhraseBackedUp,
  getIsUnlocked,
} from '../../ducks/metamask/metamask';
import {
  createNewVaultAndGetSeedPhrase,
  unlockAndGetSeedPhrase,
  createNewVaultAndRestore,
  restoreSocialBackupAndGetSeedPhrase,
  createNewVaultAndSyncWithSocial,
} from '../../store/actions';
import {
  getFirstTimeFlowType,
  getFirstTimeFlowTypeRouteAfterUnlock,
  getShowTermsOfUse,
} from '../../selectors';
import { MetaMetricsContext } from '../../contexts/metametrics';
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
import {
  Box,
  Button,
  ButtonVariant,
  Icon,
  IconName,
  IconSize,
} from '../../components/component-library';
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
  TextVariant,
} from '../../helpers/constants/design-system';
// eslint-disable-next-line import/no-restricted-paths
import { getEnvironmentType } from '../../../app/scripts/lib/util';
import { ENVIRONMENT_TYPE_POPUP } from '../../../shared/constants/app';
import { FirstTimeFlowType } from '../../../shared/constants/onboarding';
import { getIsSeedlessOnboardingFeatureEnabled } from '../../../shared/modules/environment';
import { TraceName, TraceOperation } from '../../../shared/lib/trace';
import LoadingScreen from '../../components/ui/loading-screen';
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
import RevealRecoveryPhrase from './recovery-phrase/reveal-recovery-phrase';

const TWITTER_URL = 'https://twitter.com/MetaMask';

export default function OnboardingFlow() {
  const [secretRecoveryPhrase, setSecretRecoveryPhrase] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch();
  const { pathname, search } = useLocation();
  const history = useHistory();
  const t = useI18nContext();
  const hdEntropyIndex = useSelector(getHDEntropyIndex);
  const completedOnboarding = useSelector(getCompletedOnboarding);
  const nextRoute = useSelector(getFirstTimeFlowTypeRouteAfterUnlock);
  const isFromReminder = new URLSearchParams(search).get('isFromReminder');
  const isFromSettingsSecurity = new URLSearchParams(search).get(
    'isFromSettingsSecurity',
  );
  const trackEvent = useContext(MetaMetricsContext);
  const { bufferedTrace, onboardingParentContext } = trackEvent;
  const isUnlocked = useSelector(getIsUnlocked);
  const showTermsOfUse = useSelector(getShowTermsOfUse);
  const firstTimeFlowType = useSelector(getFirstTimeFlowType);
  const isSeedlessOnboardingFeatureEnabled =
    getIsSeedlessOnboardingFeatureEnabled();
  const isPrimarySeedPhraseBackedUp = useSelector(
    getIsPrimarySeedPhraseBackedUp,
  );

  const envType = getEnvironmentType();
  const isPopup = envType === ENVIRONMENT_TYPE_POPUP;

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
    const isSRPBackupRoute = [
      ONBOARDING_SECURE_YOUR_WALLET_ROUTE,
      ONBOARDING_REVIEW_SRP_ROUTE,
      ONBOARDING_CONFIRM_SRP_ROUTE,
    ].some((route) => pathname?.startsWith(route));

    if (isUnlocked && !completedOnboarding && !secretRecoveryPhrase) {
      if (isSRPBackupRoute) {
        history.push(ONBOARDING_UNLOCK_ROUTE);
      }
    }

    if (
      isPrimarySeedPhraseBackedUp &&
      isSRPBackupRoute &&
      completedOnboarding
    ) {
      history.replace(isFromSettingsSecurity ? SECURITY_ROUTE : DEFAULT_ROUTE);
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
    isPrimarySeedPhraseBackedUp,
    isFromSettingsSecurity,
  ]);

  useEffect(() => {
    const trace = bufferedTrace?.({
      name: TraceName.OnboardingJourneyOverall,
      op: TraceOperation.OnboardingUserJourney,
    });
    if (onboardingParentContext) {
      onboardingParentContext.current = trace;
    }
  }, [onboardingParentContext, bufferedTrace]);

  const handleCreateNewAccount = async (password) => {
    try {
      setIsLoading(true);
      let newSecretRecoveryPhrase;
      if (
        isSeedlessOnboardingFeatureEnabled &&
        firstTimeFlowType === FirstTimeFlowType.socialCreate
      ) {
        newSecretRecoveryPhrase = await dispatch(
          createNewVaultAndSyncWithSocial(password),
        );
      } else if (firstTimeFlowType === FirstTimeFlowType.create) {
        newSecretRecoveryPhrase = await dispatch(
          createNewVaultAndGetSeedPhrase(password),
        );
      }

      setSecretRecoveryPhrase(newSecretRecoveryPhrase);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnlock = async (password) => {
    try {
      setIsLoading(true);
      let retrievedSecretRecoveryPhrase;

      if (
        isSeedlessOnboardingFeatureEnabled &&
        firstTimeFlowType === FirstTimeFlowType.socialImport
      ) {
        retrievedSecretRecoveryPhrase = await dispatch(
          restoreSocialBackupAndGetSeedPhrase(password),
        );
      } else {
        retrievedSecretRecoveryPhrase = await dispatch(
          unlockAndGetSeedPhrase(password),
        );
      }

      setSecretRecoveryPhrase(retrievedSecretRecoveryPhrase);
      history.replace(nextRoute);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportWithRecoveryPhrase = async (password, srp) => {
    return await dispatch(createNewVaultAndRestore(password, srp));
  };

  let isFullPage =
    pathname === ONBOARDING_WELCOME_ROUTE ||
    pathname === ONBOARDING_UNLOCK_ROUTE;

  ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
  isFullPage = isFullPage || pathname === ONBOARDING_EXPERIMENTAL_AREA;
  ///: END:ONLY_INCLUDE_IF

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
      {!isPopup && <OnboardingAppHeader pageState={welcomePageState} />}
      <Box
        className={classnames('onboarding-flow__container', {
          'onboarding-flow__container--full': isFullPage,
          'onboarding-flow__container--popup': isPopup,
        })}
        width={BlockSize.Full}
        borderStyle={
          isFullPage || isPopup ? BorderStyle.none : BorderStyle.solid
        }
        borderRadius={BorderRadius.LG}
        marginTop={pathname === ONBOARDING_WELCOME_ROUTE || isPopup ? 0 : 3}
        ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
        marginBottom={pathname === ONBOARDING_EXPERIMENTAL_AREA ? 6 : 0}
        ///: END:ONLY_INCLUDE_IF
        marginInline="auto"
        borderColor={BorderColor.borderMuted}
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
            path={ONBOARDING_REVEAL_SRP_ROUTE}
            render={() => (
              <RevealRecoveryPhrase
                setSecretRecoveryPhrase={setSecretRecoveryPhrase}
              />
            )}
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
          variant={ButtonVariant.Link}
          href={TWITTER_URL}
          marginInline="auto"
          marginTop={isPopup ? 0 : 4}
          marginBottom={isPopup ? 4 : 0}
          target="_blank"
          rel="noopener noreferrer"
          textProps={{
            variant: TextVariant.bodyLgMedium,
          }}
          onClick={() => {
            trackEvent({
              category: MetaMetricsEventCategory.Onboarding,
              event: MetaMetricsEventName.OnboardingTwitterClick,
              properties: {
                text: t('followUsOnX', ['X']),
                location: MetaMetricsEventName.WalletCreated,
                url: TWITTER_URL,
                hd_entropy_index: hdEntropyIndex,
              },
            });
          }}
        >
          {t('followUsOnX', [
            <Icon
              key="x-icon"
              className="onboarding-flow__x-button__icon"
              name={IconName.X}
              size={IconSize.Lg}
            />,
          ])}
        </Button>
      )}
      {isLoading && <LoadingScreen />}
    </Box>
  );
}

function setOnboardingDate() {
  submitRequestToBackgroundAndCatch('setOnboardingDate');
}
