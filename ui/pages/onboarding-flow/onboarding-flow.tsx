import React, { useEffect, useState, useContext, useMemo } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
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
  ONBOARDING_ROUTE,
  ONBOARDING_PRIVACY_SETTINGS_ROUTE,
  ONBOARDING_COMPLETION_ROUTE,
  ONBOARDING_IMPORT_WITH_SRP_ROUTE,
  ONBOARDING_METAMETRICS,
  ONBOARDING_ACCOUNT_EXIST,
  ONBOARDING_ACCOUNT_NOT_FOUND,
  SECURITY_ROUTE,
  ONBOARDING_REVEAL_SRP_ROUTE,
  ONBOARDING_DOWNLOAD_APP_ROUTE,
} from '../../helpers/constants/routes';
import { toRelativeRoutePath } from '../routes/utils';
import {
  getCompletedOnboarding,
  getIsPrimarySeedPhraseBackedUp,
  getIsUnlocked,
  getOpenedWithSidepanel,
} from '../../ducks/metamask/metamask';
import {
  createNewVaultAndGetSeedPhrase,
  unlockAndGetSeedPhrase,
  createNewVaultAndRestore,
  restoreSocialBackupAndGetSeedPhrase,
  createNewVaultAndSyncWithSocial,
  setCompletedOnboarding,
} from '../../store/actions';
import {
  getFirstTimeFlowType,
  getFirstTimeFlowTypeRouteAfterUnlock,
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
import {
  ENVIRONMENT_TYPE_POPUP,
  ENVIRONMENT_TYPE_SIDEPANEL,
} from '../../../shared/constants/app';
import { FirstTimeFlowType } from '../../../shared/constants/onboarding';
import { getIsSeedlessOnboardingFeatureEnabled } from '../../../shared/modules/environment';
import { TraceName, TraceOperation } from '../../../shared/lib/trace';
import LoadingScreen from '../../components/ui/loading-screen';
import type { MetaMaskReduxDispatch } from '../../store/store';
import { useTheme } from '../../hooks/useTheme';
import { ThemeType } from '../../../shared/constants/preferences';
import OnboardingFlowSwitch from './onboarding-flow-switch/onboarding-flow-switch';
import CreatePassword from './create-password/create-password';
import ReviewRecoveryPhrase from './recovery-phrase/review-recovery-phrase';
import ConfirmRecoveryPhrase from './recovery-phrase/confirm-recovery-phrase';
import PrivacySettings from './privacy-settings/privacy-settings';
import CreationSuccessful from './creation-successful/creation-successful';
import OnboardingWelcome from './welcome/welcome';
import ImportSRP from './import-srp/import-srp';
import MetaMetricsComponent from './metametrics/metametrics';
import OnboardingAppHeader from './onboarding-app-header/onboarding-app-header';
import AccountExist from './account-exist/account-exist';
import AccountNotFound from './account-not-found/account-not-found';
import RevealRecoveryPhrase from './recovery-phrase/reveal-recovery-phrase';
import OnboardingDownloadApp from './download-app/download-app';

// Helper to convert onboarding paths to relative paths for nested route matching
const toRelativePath = (path: string) =>
  toRelativeRoutePath(path, ONBOARDING_ROUTE);

// eslint-disable-next-line @typescript-eslint/naming-convention
export default function OnboardingFlow() {
  const [secretRecoveryPhrase, setSecretRecoveryPhrase] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const dispatch = useDispatch<MetaMaskReduxDispatch>();
  const location = useLocation();
  const { pathname, search } = location;
  const navigate = useNavigate();
  const theme = useTheme();
  const completedOnboarding: boolean = useSelector(getCompletedOnboarding);
  const openedWithSidepanel = useSelector(getOpenedWithSidepanel);
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

  const envType = getEnvironmentType();
  const isPopup = envType === ENVIRONMENT_TYPE_POPUP;
  const isSidepanel = envType === ENVIRONMENT_TYPE_SIDEPANEL;

  // If the user has not agreed to the terms of use, we show the banner
  // Otherwise, we show the login page
  const isWelcomePage = useMemo(
    () => pathname === ONBOARDING_WELCOME_ROUTE,
    [pathname],
  );

  useEffect(() => {
    setOnboardingDate();
  }, []);

  useEffect(() => {
    if (completedOnboarding && !isFromReminder && !openedWithSidepanel) {
      navigate(DEFAULT_ROUTE, { replace: true });
    }
  }, [navigate, completedOnboarding, isFromReminder, openedWithSidepanel]);

  useEffect(() => {
    const isSRPBackupRoute = [
      ONBOARDING_REVIEW_SRP_ROUTE,
      ONBOARDING_CONFIRM_SRP_ROUTE,
    ].some((route) => pathname?.startsWith(route));

    if (isUnlocked && !completedOnboarding && !secretRecoveryPhrase) {
      if (isSRPBackupRoute) {
        navigate(ONBOARDING_UNLOCK_ROUTE, { replace: true });
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
    bufferedTrace?.({
      name: TraceName.OnboardingJourneyOverall,
      op: TraceOperation.OnboardingUserJourney,
    });
    if (onboardingParentContext) {
      // Intentionally mutating ref object
      onboardingParentContext.current = {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        _name: TraceName.OnboardingJourneyOverall,
      };
    }
  }, [onboardingParentContext, bufferedTrace]);

  const handleCreateNewAccount = async (password: string) => {
    try {
      setIsLoading(true);
      let newSecretRecoveryPhrase: string | undefined;
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

      if (newSecretRecoveryPhrase) {
        setSecretRecoveryPhrase(newSecretRecoveryPhrase);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnlock = async (password: string) => {
    try {
      setIsLoading(true);
      let retrievedSecretRecoveryPhrase: string | undefined;

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

      if (retrievedSecretRecoveryPhrase) {
        setSecretRecoveryPhrase(retrievedSecretRecoveryPhrase);
      }
      if (firstTimeFlowType === FirstTimeFlowType.socialImport) {
        // For existing social login users, set onboarding complete
        // The useEffect watching completedOnboarding will handle navigation to DEFAULT_ROUTE
        await dispatch(setCompletedOnboarding());
        // Don't navigate here - let the useEffect handle it to avoid duplicate navigations
        return;
      }
      navigate(nextRoute, { replace: true });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImportWithRecoveryPhrase = async (
    password: string,
    srp: string,
  ) => {
    return await dispatch(createNewVaultAndRestore(password, srp));
  };

  let isFullPage =
    pathname === ONBOARDING_WELCOME_ROUTE ||
    pathname === ONBOARDING_UNLOCK_ROUTE;

  ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
  isFullPage = isFullPage || pathname === ONBOARDING_EXPERIMENTAL_AREA;
  ///: END:ONLY_INCLUDE_IF

  const backgroundColorForWelcomePage = useMemo(() => {
    if (isWelcomePage) {
      return theme === ThemeType.light
        ? 'var(--welcome-bg-light)'
        : 'var(--color-accent02-dark)';
    }
    return 'var(--color-background-default)';
  }, [isWelcomePage, theme]);

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
      className="onboarding-flow"
      style={{
        backgroundColor: backgroundColorForWelcomePage,
      }}
    >
      {!isPopup && !isSidepanel && (
        <OnboardingAppHeader
          isWelcomePage={isWelcomePage}
          location={location}
        />
      )}
      <Box
        className={classnames('onboarding-flow__container', {
          'onboarding-flow__container--full': isFullPage,
          'onboarding-flow__container--popup': isPopup,
          'onboarding-flow__container--sidepanel': isSidepanel,
        })}
        width={BlockSize.Full}
        borderStyle={
          isFullPage || isPopup || isSidepanel
            ? BorderStyle.none
            : BorderStyle.solid
        }
        borderRadius={BorderRadius.LG}
        marginTop={
          pathname === ONBOARDING_WELCOME_ROUTE || isPopup || isSidepanel
            ? 0
            : 3
        }
        ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
        marginBottom={pathname === ONBOARDING_EXPERIMENTAL_AREA ? 6 : 0}
        ///: END:ONLY_INCLUDE_IF
        marginInline="auto"
        borderColor={BorderColor.borderMuted}
      >
        <Routes>
          <Route
            path={toRelativePath(ONBOARDING_ACCOUNT_EXIST)}
            element={<AccountExist />}
          />
          <Route
            path={toRelativePath(ONBOARDING_ACCOUNT_NOT_FOUND)}
            element={<AccountNotFound />}
          />
          <Route
            path={toRelativePath(ONBOARDING_CREATE_PASSWORD_ROUTE)}
            element={
              <CreatePassword
                createNewAccount={handleCreateNewAccount}
                importWithRecoveryPhrase={handleImportWithRecoveryPhrase}
                secretRecoveryPhrase={secretRecoveryPhrase}
              />
            }
          />
          <Route
            path={toRelativePath(ONBOARDING_REVEAL_SRP_ROUTE)}
            element={
              <RevealRecoveryPhrase
                setSecretRecoveryPhrase={setSecretRecoveryPhrase}
              />
            }
          />
          <Route
            path={toRelativePath(ONBOARDING_REVIEW_SRP_ROUTE)}
            element={
              <ReviewRecoveryPhrase
                secretRecoveryPhrase={secretRecoveryPhrase}
              />
            }
          />
          <Route
            path={toRelativePath(ONBOARDING_CONFIRM_SRP_ROUTE)}
            element={
              <ConfirmRecoveryPhrase
                secretRecoveryPhrase={secretRecoveryPhrase}
              />
            }
          />
          <Route
            path={toRelativePath(ONBOARDING_IMPORT_WITH_SRP_ROUTE)}
            element={
              <ImportSRP submitSecretRecoveryPhrase={setSecretRecoveryPhrase} />
            }
          />
          <Route
            path={toRelativePath(ONBOARDING_UNLOCK_ROUTE)}
            element={<Unlock onSubmit={handleUnlock} />}
          />
          <Route
            path={toRelativePath(ONBOARDING_PRIVACY_SETTINGS_ROUTE)}
            element={<PrivacySettings />}
          />
          <Route
            path={toRelativePath(ONBOARDING_COMPLETION_ROUTE)}
            element={<CreationSuccessful />}
          />
          <Route
            path={toRelativePath(ONBOARDING_WELCOME_ROUTE)}
            element={<OnboardingWelcome />}
          />
          <Route
            path={toRelativePath(ONBOARDING_METAMETRICS)}
            element={<MetaMetricsComponent />}
          />
          <Route
            path={toRelativePath(ONBOARDING_DOWNLOAD_APP_ROUTE)}
            element={<OnboardingDownloadApp />}
          />
          {
            ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
          }
          <Route
            path={toRelativePath(ONBOARDING_EXPERIMENTAL_AREA)}
            element={<ExperimentalArea redirectTo={ONBOARDING_WELCOME_ROUTE} />}
          />
          {
            ///: END:ONLY_INCLUDE_IF
          }
          <Route path="*" element={<OnboardingFlowSwitch />} />
        </Routes>
      </Box>
      {isLoading && <LoadingScreen />}
    </Box>
  );
}

function setOnboardingDate() {
  submitRequestToBackgroundAndCatch('setOnboardingDate');
}
