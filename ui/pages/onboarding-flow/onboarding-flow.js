import React, { useEffect, useState, useContext } from 'react';
import {
  Routes as Switch,
  Route,
  useNavigate,
  useLocation,
} from 'react-router-dom-v5-compat';
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
  ONBOARDING_DOWNLOAD_APP_ROUTE,
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
  setParticipateInMetaMetrics,
  setTermsOfUseLastAgreed,
  setDataCollectionForMarketing,
} from '../../store/actions';
import {
  getFirstTimeFlowType,
  getFirstTimeFlowTypeRouteAfterUnlock,
  getIsSocialLoginFlow,
} from '../../selectors';
import { MetaMetricsContext } from '../../contexts/metametrics';
///: BEGIN:ONLY_INCLUDE_IF(build-flask)
import ExperimentalArea from '../../components/app/flask/experimental-area';
///: END:ONLY_INCLUDE_IF
import { submitRequestToBackgroundAndCatch } from '../../components/app/toast-master/utils';
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
import AccountExist from './account-exist/account-exist';
import AccountNotFound from './account-not-found/account-not-found';
import RevealRecoveryPhrase from './recovery-phrase/reveal-recovery-phrase';
import OnboardingDownloadApp from './download-app/download-app';

export default function OnboardingFlow() {
  const [secretRecoveryPhrase, setSecretRecoveryPhrase] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch();
  const { pathname, search } = useLocation();
  const navigate = useNavigate();
  const completedOnboarding = useSelector(getCompletedOnboarding);
  const nextRoute = useSelector(getFirstTimeFlowTypeRouteAfterUnlock);
  const isFromReminder = new URLSearchParams(search).get('isFromReminder');
  const isFromSettingsSecurity = new URLSearchParams(search).get(
    'isFromSettingsSecurity',
  );
  const trackEvent = useContext(MetaMetricsContext);
  const { bufferedTrace, onboardingParentContext } = trackEvent;
  const isUnlocked = useSelector(getIsUnlocked);
  const firstTimeFlowType = useSelector(getFirstTimeFlowType);
  const isSeedlessOnboardingFeatureEnabled =
    getIsSeedlessOnboardingFeatureEnabled();
  const isPrimarySeedPhraseBackedUp = useSelector(
    getIsPrimarySeedPhraseBackedUp,
  );
  const isSocialLogin = useSelector(getIsSocialLoginFlow);

  const envType = getEnvironmentType();
  const isPopup = envType === ENVIRONMENT_TYPE_POPUP;

  // If the user has not agreed to the terms of use, we show the banner
  // Otherwise, we show the login page
  const [welcomePageState, setWelcomePageState] = useState(false);

  useEffect(() => {
    setOnboardingDate();
  }, []);

  useEffect(() => {
    if (completedOnboarding && !isFromReminder) {
      navigate(DEFAULT_ROUTE);
    }
  }, [navigate, completedOnboarding, isFromReminder]);

  useEffect(() => {
    const isSRPBackupRoute = [
      ONBOARDING_SECURE_YOUR_WALLET_ROUTE,
      ONBOARDING_REVIEW_SRP_ROUTE,
      ONBOARDING_CONFIRM_SRP_ROUTE,
    ].some((route) => pathname?.startsWith(route));

    if (isUnlocked && !completedOnboarding && !secretRecoveryPhrase) {
      if (isSRPBackupRoute) {
        navigate(ONBOARDING_UNLOCK_ROUTE);
      }
    }

    if (
      isPrimarySeedPhraseBackedUp &&
      isSRPBackupRoute &&
      completedOnboarding
    ) {
      navigate(isFromSettingsSecurity ? SECURITY_ROUTE : DEFAULT_ROUTE, {
        replace: true,
      });
    }

    if (pathname === ONBOARDING_WELCOME_ROUTE) {
      setWelcomePageState(true);
    } else {
      setWelcomePageState(false);
    }
  }, [
    isUnlocked,
    completedOnboarding,
    secretRecoveryPhrase,
    pathname,
    navigate,
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

      // For social login, we need to agree to the terms of use
      if (isSocialLogin) {
        await dispatch(setTermsOfUseLastAgreed(new Date().getTime()));
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

      if (isSocialLogin) {
        await dispatch(setParticipateInMetaMetrics(true));
        await dispatch(setDataCollectionForMarketing(true));
      }

      setSecretRecoveryPhrase(retrievedSecretRecoveryPhrase);
      navigate(nextRoute, { replace: true });
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
        'onboarding-flow--welcome-login': welcomePageState,
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
          <Route path={ONBOARDING_ACCOUNT_EXIST} element={<AccountExist />} />
          <Route
            path={ONBOARDING_ACCOUNT_NOT_FOUND}
            element={<AccountNotFound />}
          />
          <Route
            path={ONBOARDING_CREATE_PASSWORD_ROUTE}
            element={
              <CreatePassword
                createNewAccount={handleCreateNewAccount}
                importWithRecoveryPhrase={handleImportWithRecoveryPhrase}
                secretRecoveryPhrase={secretRecoveryPhrase}
              />
            }
          />
          <Route
            path={ONBOARDING_SECURE_YOUR_WALLET_ROUTE}
            element={<SecureYourWallet />}
          />
          <Route
            path={ONBOARDING_REVEAL_SRP_ROUTE}
            element={
              <RevealRecoveryPhrase
                setSecretRecoveryPhrase={setSecretRecoveryPhrase}
              />
            }
          />
          <Route
            path={ONBOARDING_REVIEW_SRP_ROUTE}
            element={
              <ReviewRecoveryPhrase
                secretRecoveryPhrase={secretRecoveryPhrase}
              />
            }
          />
          <Route
            path={ONBOARDING_CONFIRM_SRP_ROUTE}
            element={
              <ConfirmRecoveryPhrase
                secretRecoveryPhrase={secretRecoveryPhrase}
              />
            }
          />
          <Route
            path={ONBOARDING_IMPORT_WITH_SRP_ROUTE}
            element={
              <ImportSRP submitSecretRecoveryPhrase={setSecretRecoveryPhrase} />
            }
          />
          <Route
            path={ONBOARDING_UNLOCK_ROUTE}
            element={<Unlock onSubmit={handleUnlock} />}
          />
          <Route
            path={ONBOARDING_PRIVACY_SETTINGS_ROUTE}
            element={<PrivacySettings />}
          />
          <Route
            path={ONBOARDING_COMPLETION_ROUTE}
            element={<CreationSuccessful />}
          />
          <Route
            path={ONBOARDING_WELCOME_ROUTE}
            element={<OnboardingWelcome />}
          />
          <Route
            path={ONBOARDING_PIN_EXTENSION_ROUTE}
            element={<OnboardingPinExtension />}
          />
          <Route
            path={ONBOARDING_METAMETRICS}
            element={<MetaMetricsComponent />}
          />
          <Route
            path={ONBOARDING_DOWNLOAD_APP_ROUTE}
            element={<OnboardingDownloadApp />}
          />
          {
            ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
          }
          <Route
            path={ONBOARDING_EXPERIMENTAL_AREA}
            element={<ExperimentalArea redirectTo={ONBOARDING_WELCOME_ROUTE} />}
          />
          {
            ///: END:ONLY_INCLUDE_IF
          }
          <Route path="*" element={<OnboardingFlowSwitch />} />
        </Switch>
      </Box>
      {isLoading && <LoadingScreen />}
    </Box>
  );
}

function setOnboardingDate() {
  submitRequestToBackgroundAndCatch('setOnboardingDate');
}
