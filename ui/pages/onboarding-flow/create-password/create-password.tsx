import React, {
  useState,
  useContext,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import log from 'loglevel';
import { Box } from '@metamask/design-system-react';
import {
  ONBOARDING_COMPLETION_ROUTE,
  ONBOARDING_DOWNLOAD_APP_ROUTE,
  ONBOARDING_IMPORT_WITH_SRP_ROUTE,
  ONBOARDING_METAMETRICS,
  ONBOARDING_REVIEW_SRP_ROUTE,
  ONBOARDING_WELCOME_ROUTE,
  ONBOARDING_SETUP_PASSKEY_ROUTE,
} from '../../../helpers/constants/routes';
import {
  getFirstTimeFlowType,
  getAnalyticsId,
  getCompletedMetaMetricsOnboarding,
  getOptedIn,
  getIsSocialLoginFlow,
  getIsPasskeyFeatureAvailable,
  getIsSecretEscrowPasskeyAvailable,
  getDeferredDeepLinkParameters,
  getAccountTypeForOnboardingMetrics,
  getSocialLoginEmail,
  getSecretEscrowFactors,
} from '../../../selectors';
import { getCurrentKeyring } from '../../../../shared/lib/selectors/keyring';
import { generateWalletPassword } from '../../../../shared/lib/generate-wallet-password';
import {
  getAddableSecretEscrowFactorOptions,
  getFirstSecretEscrowFactorOptions,
  isPasskeyFactor,
  isPasswordFactor,
  isTotpFactor,
  resolveEnrolledSecretEscrowFactors,
  SecretEscrowFactorKind,
  type SecretEscrowFactorOption,
} from '../../../../shared/constants/secret-escrow-factors';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { useAnalytics } from '../../../hooks/useAnalytics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  MetaMetricsUserTrait,
} from '../../../../shared/constants/metametrics';
import { FirstTimeFlowType } from '../../../../shared/constants/onboarding';
import { useIsFirefox } from '../../../hooks/useIsFirefox';
import {
  addSecretEscrowUserPasswordFactor,
  createSecretEscrowPasswordFactor,
  enrollSecretEscrowTotpFactor,
  forceUpdateMetamaskState,
  getIsSeedlessOnboardingUserAuthenticated,
  setDataCollectionForMarketing,
  setMarketingConsent,
} from '../../../store/actions';
import { useOnboardingReset } from '../hooks/useOnboardingReset';
import { TraceName, TraceOperation } from '../../../../shared/lib/trace';
import { getIsWalletResetInProgress } from '../../../ducks/metamask/metamask';
// eslint-disable-next-line import-x/no-restricted-paths -- TODO(ADR-0021): route-isolation backlog
import { CreatePasswordForm } from '../../create-password-form';
import { useDispatch } from '../../../store/hooks';
import LoadingScreen from '../../../components/ui/loading-screen';
import UnlockFactorPicker from '../unlock-factor-picker';
import SetupTotp from '../setup-totp';
import {
  clearSocialCreateFactorSession,
  getSocialCreateUserChoseTypedPassword,
  getSocialCreateUserFactors,
  getSocialCreateWalletPassword,
  markSocialCreateUserFactor,
  setSocialCreateWalletPassword,
} from '../social-create-wallet-password';

type CreatePasswordProps = {
  createNewAccount: (password: string) => void;
  importWithRecoveryPhrase: (
    password: string,
    secretRecoveryPhrase: string,
  ) => void;
  secretRecoveryPhrase: string;
};

type SocialCreateStep =
  | 'choose-factors'
  | 'manage-factors'
  | 'create-password'
  | 'setup-totp'
  | 'creating';

type CreateWalletFactorOptions = {
  /** Register the vault password as an escrow password factor. */
  registerPasswordFactor: boolean;
  /** Navigate to passkey setup after vault creation. */
  setupPasskey: boolean;
  /** Hide "Maybe later" on passkey setup. */
  requirePasskey: boolean;
};

export default function CreatePassword({
  createNewAccount,
  importWithRecoveryPhrase,
  secretRecoveryPhrase,
}: CreatePasswordProps) {
  const [newAccountCreationInProgress, setNewAccountCreationInProgress] =
    useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [selectedFactorOption, setSelectedFactorOption] =
    useState<SecretEscrowFactorOption | null>(null);
  const [addingPasswordAfterCreate, setAddingPasswordAfterCreate] =
    useState(false);
  /** Bumped when session factor marks change so manage UI re-reads them. */
  const [factorSessionRevision, setFactorSessionRevision] = useState(0);
  const location = useLocation();
  const manageFromNavigation = Boolean(location.state?.manageFactors);
  const [socialCreateStep, setSocialCreateStep] = useState<SocialCreateStep>(
    () =>
      manageFromNavigation || getSocialCreateUserFactors().length > 0
        ? 'manage-factors'
        : 'choose-factors',
  );
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isFirefox = useIsFirefox();
  const resetOnboardingAndReturn = useOnboardingReset();
  const firstTimeFlowType = useSelector(getFirstTimeFlowType);
  const { trackEvent, createEventBuilder } = useAnalytics();
  const { bufferedTrace, bufferedEndTrace, onboardingParentContext } =
    useContext(MetaMetricsContext);
  const currentKeyring = useSelector(getCurrentKeyring);
  const isSocialLoginFlow = useSelector(getIsSocialLoginFlow);
  const isPasskeyFeatureAvailable = useSelector(getIsPasskeyFeatureAvailable);
  const isSecretEscrowPasskeyAvailable = useSelector(
    getIsSecretEscrowPasskeyAvailable,
  );
  const escrowFactors = useSelector(getSecretEscrowFactors);
  const isWalletResetInProgress = useSelector(getIsWalletResetInProgress);
  const utmProperties = useSelector(getDeferredDeepLinkParameters);

  const isOptedIn = useSelector(getOptedIn);
  const completedMetaMetricsOnboarding = useSelector(
    getCompletedMetaMetricsOnboarding,
  );
  const analyticsId = useSelector(getAnalyticsId);
  const accountTypeForMetrics = useSelector(getAccountTypeForOnboardingMetrics);
  const socialLoginEmail = useSelector(getSocialLoginEmail);
  const base64AnalyticsId = Buffer.from(analyticsId ?? '').toString('base64');
  const shouldInjectMetametricsIframe = Boolean(
    completedMetaMetricsOnboarding && isOptedIn && base64AnalyticsId,
  );
  const analyticsIframeQuery = {
    mmi: base64AnalyticsId,
    env: 'production',
  };
  const urlSearchParams = new URLSearchParams(analyticsIframeQuery);
  const analyticsIframeUrl = `https://start.metamask.io/?${urlSearchParams.toString()}`;

  const isSocialCreateFactorFlow =
    isSocialLoginFlow &&
    isSecretEscrowPasskeyAvailable &&
    firstTimeFlowType === FirstTimeFlowType.socialCreate;

  // Re-enter manage mode when returning from passkey setup (location state).
  const resolvedSocialCreateStep: SocialCreateStep =
    manageFromNavigation &&
    socialCreateStep !== 'create-password' &&
    socialCreateStep !== 'setup-totp' &&
    socialCreateStep !== 'creating'
      ? 'manage-factors'
      : socialCreateStep;

  const displayedEnrolledFactors = useMemo(
    () =>
      resolveEnrolledSecretEscrowFactors({
        escrowFactors,
        userChoseTypedPassword: getSocialCreateUserChoseTypedPassword(),
      }),
    // factorSessionRevision forces recompute after session password marks.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- session module is not reactive
    [escrowFactors, factorSessionRevision],
  );

  const showFactorPicker = isSocialCreateFactorFlow && !currentKeyring;
  const showFactorManager =
    isSocialCreateFactorFlow &&
    Boolean(currentKeyring) &&
    (resolvedSocialCreateStep === 'manage-factors' ||
      displayedEnrolledFactors.length > 0 ||
      Boolean(getSocialCreateWalletPassword()) ||
      manageFromNavigation);

  const factorAvailability = useMemo(
    () => ({
      passkeyAvailable: isSecretEscrowPasskeyAvailable,
    }),
    [isSecretEscrowPasskeyAvailable],
  );

  const factorOptions = useMemo(
    () => getFirstSecretEscrowFactorOptions(factorAvailability),
    [factorAvailability],
  );

  const displayedAddableOptions = useMemo(
    () =>
      getAddableSecretEscrowFactorOptions(
        factorAvailability,
        displayedEnrolledFactors,
      ),
    [factorAvailability, displayedEnrolledFactors],
  );

  const syncFactorSessionRevision = useCallback(() => {
    setFactorSessionRevision((revision) => revision + 1);
  }, []);

  const validateSocialLoginAuthenticatedState = useCallback(async () => {
    const isSeedlessOnboardingUserAuthenticated = await dispatch(
      getIsSeedlessOnboardingUserAuthenticated(),
    );
    if (!isSeedlessOnboardingUserAuthenticated) {
      navigate(ONBOARDING_WELCOME_ROUTE, { replace: true });
    }
    return isSeedlessOnboardingUserAuthenticated;
  }, [dispatch, navigate]);

  useEffect(() => {
    if (
      currentKeyring &&
      !newAccountCreationInProgress &&
      !isWalletResetInProgress
    ) {
      // Stay on create-password for social-create factor manage flow.
      if (
        isSocialCreateFactorFlow &&
        (resolvedSocialCreateStep === 'manage-factors' ||
          resolvedSocialCreateStep === 'create-password' ||
          resolvedSocialCreateStep === 'setup-totp' ||
          resolvedSocialCreateStep === 'creating' ||
          getSocialCreateWalletPassword() ||
          getSocialCreateUserFactors().length > 0)
      ) {
        return;
      }

      if (
        isPasskeyFeatureAvailable &&
        (firstTimeFlowType === FirstTimeFlowType.import ||
          firstTimeFlowType === FirstTimeFlowType.create)
      ) {
        navigate(ONBOARDING_SETUP_PASSKEY_ROUTE, { replace: true });
        return;
      }

      if (
        isSecretEscrowPasskeyAvailable &&
        (firstTimeFlowType === FirstTimeFlowType.socialImport ||
          firstTimeFlowType === FirstTimeFlowType.socialCreate)
      ) {
        navigate(ONBOARDING_SETUP_PASSKEY_ROUTE, { replace: true });
        return;
      }

      if (
        firstTimeFlowType === FirstTimeFlowType.import ||
        firstTimeFlowType === FirstTimeFlowType.socialImport
      ) {
        if (
          !isFirefox &&
          firstTimeFlowType === FirstTimeFlowType.socialImport
        ) {
          navigate(ONBOARDING_COMPLETION_ROUTE, { replace: true });
        } else {
          navigate(
            completedMetaMetricsOnboarding
              ? ONBOARDING_COMPLETION_ROUTE
              : ONBOARDING_METAMETRICS,
            { replace: true },
          );
        }
      } else if (firstTimeFlowType === FirstTimeFlowType.socialCreate) {
        navigate(ONBOARDING_COMPLETION_ROUTE, { replace: true });
      } else {
        navigate(ONBOARDING_REVIEW_SRP_ROUTE, { replace: true });
      }
    } else if (
      firstTimeFlowType === FirstTimeFlowType.import &&
      !secretRecoveryPhrase
    ) {
      navigate(ONBOARDING_IMPORT_WITH_SRP_ROUTE, { replace: true });
    }
  }, [
    currentKeyring,
    isFirefox,
    navigate,
    firstTimeFlowType,
    newAccountCreationInProgress,
    secretRecoveryPhrase,
    completedMetaMetricsOnboarding,
    isWalletResetInProgress,
    isPasskeyFeatureAvailable,
    isSecretEscrowPasskeyAvailable,
    isSocialCreateFactorFlow,
    resolvedSocialCreateStep,
  ]);

  useEffect(() => {
    (async () => {
      if (isSocialLoginFlow) {
        await validateSocialLoginAuthenticatedState();
      }
    })();
  }, [isSocialLoginFlow, validateSocialLoginAuthenticatedState]);

  const handleWalletImport = async (password: string) => {
    trackEvent(
      createEventBuilder(MetaMetricsEventName.WalletImportAttempted)
        .addCategory(MetaMetricsEventCategory.Onboarding)
        .build(),
    );

    await importWithRecoveryPhrase(password, secretRecoveryPhrase);

    bufferedEndTrace?.({ name: TraceName.OnboardingExistingSrpImport });
    bufferedEndTrace?.({ name: TraceName.OnboardingJourneyOverall });

    trackEvent(
      createEventBuilder(MetaMetricsEventName.WalletImported)
        .addCategory(MetaMetricsEventCategory.Onboarding)
        .addProperties({
          // eslint-disable-next-line @typescript-eslint/naming-convention
          biometrics_enabled: false,
        })
        .build(),
    );

    trackEvent(
      createEventBuilder(MetaMetricsEventName.WalletSetupCompleted)
        .addCategory(MetaMetricsEventCategory.Onboarding)
        .addProperties({
          // eslint-disable-next-line @typescript-eslint/naming-convention
          wallet_setup_type: 'import',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          new_wallet: false,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          account_type: accountTypeForMetrics,
          ...utmProperties,
        })
        .build(),
    );

    if (isPasskeyFeatureAvailable) {
      navigate(ONBOARDING_SETUP_PASSKEY_ROUTE, { replace: true });
    } else if (isSecretEscrowPasskeyAvailable) {
      navigate(ONBOARDING_SETUP_PASSKEY_ROUTE, {
        replace: true,
        state: { password },
      });
    } else if (isFirefox || isSocialLoginFlow) {
      navigate(ONBOARDING_COMPLETION_ROUTE, { replace: true });
    } else {
      navigate(ONBOARDING_METAMETRICS, { replace: true });
    }
  };

  const goToManageFactors = useCallback(() => {
    syncFactorSessionRevision();
    setAddingPasswordAfterCreate(false);
    setSelectedFactorOption(null);
    setSocialCreateStep('manage-factors');
    setNewAccountCreationInProgress(false);
  }, [syncFactorSessionRevision]);

  const handleCreateNewWallet = async (
    password: string,
    termsChecked: boolean,
    factorOptionsConfig: CreateWalletFactorOptions = {
      registerPasswordFactor: Boolean(
        isSocialLoginFlow && isSecretEscrowPasskeyAvailable,
      ),
      setupPasskey: Boolean(
        isSocialLoginFlow && isSecretEscrowPasskeyAvailable,
      ),
      requirePasskey: false,
    },
  ) => {
    trackEvent(
      createEventBuilder(MetaMetricsEventName.WalletCreationAttempted)
        .addCategory(MetaMetricsEventCategory.Onboarding)
        .addProperties({
          // eslint-disable-next-line @typescript-eslint/naming-convention
          account_type: accountTypeForMetrics,
        })
        .build(),
    );

    setNewAccountCreationInProgress(true);
    await createNewAccount(password);

    if (
      isSocialLoginFlow &&
      isSecretEscrowPasskeyAvailable &&
      factorOptionsConfig.registerPasswordFactor
    ) {
      try {
        await createSecretEscrowPasswordFactor(password);
        await forceUpdateMetamaskState(dispatch);
      } catch (error) {
        log.error('Failed to create secret escrow password factor', error);
      }
    }

    if (isSocialLoginFlow) {
      bufferedEndTrace?.({ name: TraceName.OnboardingNewSocialCreateWallet });
      bufferedEndTrace?.({ name: TraceName.OnboardingJourneyOverall });
    }

    trackEvent(
      createEventBuilder(MetaMetricsEventName.WalletCreated)
        .addCategory(MetaMetricsEventCategory.Onboarding)
        .addProperties({
          // eslint-disable-next-line @typescript-eslint/naming-convention
          biometrics_enabled: factorOptionsConfig.setupPasskey,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          account_type: accountTypeForMetrics,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          unlock_factors: selectedFactorOption
            ? [selectedFactorOption.factor]
            : [],
        })
        .build(),
    );

    trackEvent(
      createEventBuilder(MetaMetricsEventName.WalletSetupCompleted)
        .addCategory(MetaMetricsEventCategory.Onboarding)
        .addProperties({
          // eslint-disable-next-line @typescript-eslint/naming-convention
          wallet_setup_type: 'new',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          new_wallet: true,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          account_type: accountTypeForMetrics,
          ...utmProperties,
        })
        .build(),
    );
    if (isSocialLoginFlow) {
      trackEvent(
        createEventBuilder(MetaMetricsEventName.AnalyticsPreferenceSelected)
          .addCategory(MetaMetricsEventCategory.Onboarding)
          .addProperties({
            [MetaMetricsUserTrait.IsMetricsOptedIn]: true,
            [MetaMetricsUserTrait.HasMarketingConsent]: termsChecked,
            location: selectedFactorOption
              ? `onboarding_factor_${selectedFactorOption.id}`
              : 'onboarding_create_password',
          })
          .build(),
      );

      if (termsChecked) {
        dispatch(setMarketingConsent(true));
        dispatch(setDataCollectionForMarketing(true));
      }
      if (factorOptionsConfig.setupPasskey && isSecretEscrowPasskeyAvailable) {
        navigate(ONBOARDING_SETUP_PASSKEY_ROUTE, {
          replace: true,
          state: {
            password,
            requirePasskey: factorOptionsConfig.requirePasskey,
            returnToManageFactors: true,
          },
        });
      } else if (isSecretEscrowPasskeyAvailable) {
        // Password-first (or other non-passkey) factor setup → manage screen.
        goToManageFactors();
      } else {
        navigate(ONBOARDING_DOWNLOAD_APP_ROUTE, { replace: true });
      }
    } else if (isPasskeyFeatureAvailable) {
      navigate(ONBOARDING_SETUP_PASSKEY_ROUTE, { replace: true });
    } else {
      navigate(ONBOARDING_REVIEW_SRP_ROUTE, { replace: true });
    }
  };

  useEffect(() => {
    bufferedTrace?.({
      name: TraceName.OnboardingPasswordSetupAttempt,
      op: TraceOperation.OnboardingUserJourney,
      parentContext: onboardingParentContext?.current,
    });
    return () => {
      bufferedEndTrace?.({ name: TraceName.OnboardingPasswordSetupAttempt });
    };
  }, [onboardingParentContext, bufferedTrace, bufferedEndTrace]);

  const handleBackClick = async (
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    event.preventDefault();

    if (
      isSocialCreateFactorFlow &&
      (resolvedSocialCreateStep === 'setup-totp' ||
        (resolvedSocialCreateStep === 'create-password' &&
          addingPasswordAfterCreate))
    ) {
      goToManageFactors();
      return;
    }

    if (
      (showFactorPicker || showFactorManager) &&
      resolvedSocialCreateStep === 'create-password' &&
      selectedFactorOption
    ) {
      setSelectedFactorOption(null);
      setSocialCreateStep('choose-factors');
      return;
    }

    if (firstTimeFlowType === FirstTimeFlowType.import) {
      navigate(ONBOARDING_IMPORT_WITH_SRP_ROUTE, { replace: true });
    } else {
      await resetOnboardingAndReturn();
    }
  };

  const runCreateWithFactorOption = async (
    option: SecretEscrowFactorOption,
    password: string,
    termsChecked: boolean,
  ) => {
    setSocialCreateWalletPassword(password);
    if (isPasswordFactor(option.factor)) {
      // Mark before create so manage UI shows Password as set up immediately.
      markSocialCreateUserFactor(SecretEscrowFactorKind.Password);
      syncFactorSessionRevision();
    }

    await handleCreateNewWallet(password, termsChecked, {
      // Always register a password factor (typed or generated) so later
      // password rotation / wrap updates can unlock S without WebAuthn.
      registerPasswordFactor: true,
      setupPasskey: isPasskeyFactor(option.factor),
      requirePasskey: isPasskeyFactor(option.factor),
    });
  };

  const handleFactorOptionSelect = async (option: SecretEscrowFactorOption) => {
    setCreateError(null);
    setSelectedFactorOption(option);

    if (
      currentKeyring &&
      resolvedSocialCreateStep === 'manage-factors'
    ) {
      if (isPasswordFactor(option.factor)) {
        setAddingPasswordAfterCreate(true);
        setSocialCreateStep('create-password');
        return;
      }
      if (isPasskeyFactor(option.factor)) {
        const password = getSocialCreateWalletPassword();
        if (!password) {
          setCreateError('Missing wallet password for passkey setup');
          return;
        }
        navigate(ONBOARDING_SETUP_PASSKEY_ROUTE, {
          replace: true,
          state: {
            password,
            requirePasskey: false,
            returnToManageFactors: true,
          },
        });
        return;
      }
      if (isTotpFactor(option.factor)) {
        setSocialCreateStep('setup-totp');
        return;
      }
    }

    if (isPasswordFactor(option.factor)) {
      setSocialCreateStep('create-password');
      return;
    }

    // Passkey-first: generate vault password, create wallet, then passkey setup.
    setSocialCreateStep('creating');
    setIsSubmitting(true);
    try {
      const isAuthenticated = await validateSocialLoginAuthenticatedState();
      if (!isAuthenticated) {
        setSocialCreateStep('choose-factors');
        setSelectedFactorOption(null);
        return;
      }
      const password = generateWalletPassword();
      await runCreateWithFactorOption(option, password, false);
    } catch (error) {
      log.error('Error creating wallet with selected unlock factor', error);
      trackEvent(
        createEventBuilder(MetaMetricsEventName.WalletSetupFailure)
          .addCategory(MetaMetricsEventCategory.Onboarding)
          .build(),
      );
      setNewAccountCreationInProgress(false);
      setCreateError(
        error instanceof Error ? error.message : 'Wallet setup failed',
      );
      setSocialCreateStep('choose-factors');
      setSelectedFactorOption(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddPasswordAfterCreate = async (newPassword: string) => {
    const currentPassword = getSocialCreateWalletPassword();
    if (!currentPassword) {
      throw new Error('Missing current wallet password');
    }
    await addSecretEscrowUserPasswordFactor(currentPassword, newPassword);
    setSocialCreateWalletPassword(newPassword);
    markSocialCreateUserFactor(SecretEscrowFactorKind.Password);
    syncFactorSessionRevision();
    await forceUpdateMetamaskState(dispatch);
    goToManageFactors();
  };

  const handleTotpEnrollComplete = async (totpSecret: string) => {
    await enrollSecretEscrowTotpFactor(totpSecret);
    markSocialCreateUserFactor(SecretEscrowFactorKind.Totp);
    syncFactorSessionRevision();
    await forceUpdateMetamaskState(dispatch);
    goToManageFactors();
  };

  const handleCreatePassword = async (
    password: string,
    termsChecked: boolean,
  ) => {
    if (!password || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    try {
      if (
        secretRecoveryPhrase &&
        firstTimeFlowType === FirstTimeFlowType.import
      ) {
        await handleWalletImport(password);
      } else if (addingPasswordAfterCreate) {
        await handleAddPasswordAfterCreate(password);
      } else if (selectedFactorOption) {
        await runCreateWithFactorOption(
          selectedFactorOption,
          password,
          termsChecked,
        );
      } else {
        await handleCreateNewWallet(password, termsChecked);
      }
    } catch (error) {
      log.error('Error creating password', error);

      trackEvent(
        createEventBuilder(MetaMetricsEventName.WalletSetupFailure)
          .addCategory(MetaMetricsEventCategory.Onboarding)
          .build(),
      );
      setNewAccountCreationInProgress(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManageContinue = () => {
    clearSocialCreateFactorSession();
    navigate(ONBOARDING_DOWNLOAD_APP_ROUTE, { replace: true });
  };

  if (
    (showFactorPicker || showFactorManager) &&
    resolvedSocialCreateStep === 'creating'
  ) {
    return (
      <Box className="h-full w-full" data-testid="create-password-creating">
        <LoadingScreen
          loadingMessage={createError ?? undefined}
          showLoadingSpinner={!createError}
        />
      </Box>
    );
  }

  if (showFactorPicker && resolvedSocialCreateStep === 'choose-factors') {
    return (
      <UnlockFactorPicker
        options={factorOptions}
        onSelect={handleFactorOptionSelect}
        onBack={handleBackClick}
      />
    );
  }

  if (
    (showFactorManager || showFactorPicker) &&
    resolvedSocialCreateStep === 'setup-totp'
  ) {
    return (
      <SetupTotp
        accountName={socialLoginEmail ?? 'MetaMask'}
        onBack={handleBackClick}
        onComplete={handleTotpEnrollComplete}
      />
    );
  }

  if (
    (showFactorManager || showFactorPicker) &&
    resolvedSocialCreateStep === 'manage-factors'
  ) {
    return (
      <UnlockFactorPicker
        manageMode
        options={displayedAddableOptions}
        enrolledFactors={displayedEnrolledFactors}
        onSelect={handleFactorOptionSelect}
        onContinue={handleManageContinue}
        onBack={handleBackClick}
      />
    );
  }

  return (
    <Box className="h-full w-full">
      <CreatePasswordForm
        isSocialLoginFlow={isSocialLoginFlow}
        onSubmit={handleCreatePassword}
        onBack={handleBackClick}
        loading={isSubmitting}
      />
      {shouldInjectMetametricsIframe ? (
        <iframe
          src={analyticsIframeUrl}
          className="create-password__analytics-iframe"
          data-testid="create-password-iframe"
        />
      ) : null}
    </Box>
  );
}
