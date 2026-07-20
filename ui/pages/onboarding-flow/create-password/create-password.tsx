import React, { useState, useContext, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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
  getDeferredDeepLinkParameters,
  getAccountTypeForOnboardingMetrics,
} from '../../../selectors';
import { getCurrentKeyring } from '../../../../shared/lib/selectors/keyring';
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

type CreatePasswordProps = {
  createNewAccount: (password: string) => void;
  importWithRecoveryPhrase: (
    password: string,
    secretRecoveryPhrase: string,
  ) => void;
  secretRecoveryPhrase: string;
};

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function CreatePassword({
  createNewAccount,
  importWithRecoveryPhrase,
  secretRecoveryPhrase,
}: CreatePasswordProps) {
  const [newAccountCreationInProgress, setNewAccountCreationInProgress] =
    useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
  const isWalletResetInProgress = useSelector(getIsWalletResetInProgress);
  const utmProperties = useSelector(getDeferredDeepLinkParameters);

  const isOptedIn = useSelector(getOptedIn);
  const completedMetaMetricsOnboarding = useSelector(
    getCompletedMetaMetricsOnboarding,
  );
  const analyticsId = useSelector(getAnalyticsId);
  const accountTypeForMetrics = useSelector(getAccountTypeForOnboardingMetrics);
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

  const validateSocialLoginAuthenticatedState = useCallback(async () => {
    const isSeedlessOnboardingUserAuthenticated = await dispatch(
      getIsSeedlessOnboardingUserAuthenticated(),
    );
    if (!isSeedlessOnboardingUserAuthenticated) {
      navigate(ONBOARDING_WELCOME_ROUTE, { replace: true });
    }
  }, [dispatch, navigate]);

  useEffect(() => {
    if (
      currentKeyring &&
      !newAccountCreationInProgress &&
      !isWalletResetInProgress
    ) {
      // route to passkey setup
      if (
        isPasskeyFeatureAvailable &&
        (firstTimeFlowType === FirstTimeFlowType.import ||
          firstTimeFlowType === FirstTimeFlowType.create)
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
          // we don't display the metametrics screen for social login flows if the user is not on firefox
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
  ]);

  useEffect(() => {
    // validate social login authenticated state on mount
    // before user attempts to create a new wallet
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
    } else if (isFirefox || isSocialLoginFlow) {
      navigate(ONBOARDING_COMPLETION_ROUTE, { replace: true });
    } else {
      navigate(ONBOARDING_METAMETRICS, { replace: true });
    }
  };

  const handleCreateNewWallet = async (
    password: string,
    termsChecked: boolean,
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

    if (isSocialLoginFlow) {
      bufferedEndTrace?.({ name: TraceName.OnboardingNewSocialCreateWallet });
      bufferedEndTrace?.({ name: TraceName.OnboardingJourneyOverall });
    }

    trackEvent(
      createEventBuilder(MetaMetricsEventName.WalletCreated)
        .addCategory(MetaMetricsEventCategory.Onboarding)
        .addProperties({
          // eslint-disable-next-line @typescript-eslint/naming-convention
          biometrics_enabled: false,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          account_type: accountTypeForMetrics,
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
      // track analytics preference selected event for social login users
      // as social login users will not see the metametrics screen
      trackEvent(
        createEventBuilder(MetaMetricsEventName.AnalyticsPreferenceSelected)
          .addCategory(MetaMetricsEventCategory.Onboarding)
          .addProperties({
            [MetaMetricsUserTrait.IsMetricsOptedIn]: true,
            [MetaMetricsUserTrait.HasMarketingConsent]: termsChecked,
            location: 'onboarding_create_password',
          })
          .build(),
      );

      if (termsChecked) {
        dispatch(setMarketingConsent(true));
        dispatch(setDataCollectionForMarketing(true));
      }
      navigate(ONBOARDING_DOWNLOAD_APP_ROUTE, { replace: true });
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

    if (firstTimeFlowType === FirstTimeFlowType.import) {
      // for SRP import flow, we will just navigate back to the import SRP page
      navigate(ONBOARDING_IMPORT_WITH_SRP_ROUTE, { replace: true });
    } else {
      await resetOnboardingAndReturn();
    }
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
      // If secretRecoveryPhrase is defined we are in import wallet flow
      if (
        secretRecoveryPhrase &&
        firstTimeFlowType === FirstTimeFlowType.import
      ) {
        await handleWalletImport(password);
      } else {
        // Otherwise we are in create new wallet flow
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
