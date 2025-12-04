import React, { useState, useContext, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom-v5-compat';
import { useDispatch, useSelector } from 'react-redux';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  JustifyContent,
  AlignItems,
  TextVariant,
  TextColor,
  BlockSize,
  IconColor,
  Display,
  FlexDirection,
  BackgroundColor,
  BorderRadius,
} from '../../../helpers/constants/design-system';
import {
  ONBOARDING_COMPLETION_ROUTE,
  ONBOARDING_DOWNLOAD_APP_ROUTE,
  ONBOARDING_IMPORT_WITH_SRP_ROUTE,
  ONBOARDING_METAMETRICS,
  ONBOARDING_REVIEW_SRP_ROUTE,
  ONBOARDING_WELCOME_ROUTE,
} from '../../../helpers/constants/routes';
import ZENDESK_URLS from '../../../helpers/constants/zendesk-url';
import {
  getFirstTimeFlowType,
  getCurrentKeyring,
  getMetaMetricsId,
  getParticipateInMetaMetrics,
  getIsSocialLoginFlow,
  getSocialLoginType,
  getIsParticipateInMetaMetricsSet,
} from '../../../selectors';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MetaMetricsEventAccountType,
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import {
  Box,
  Button,
  ButtonIcon,
  ButtonIconSize,
  ButtonSize,
  ButtonVariant,
  Checkbox,
  IconName,
  Text,
} from '../../../components/component-library';
import { FirstTimeFlowType } from '../../../../shared/constants/onboarding';
import PasswordForm from '../../../components/app/password-form/password-form';
import { PLATFORM_FIREFOX } from '../../../../shared/constants/app';
import { getBrowserName } from '../../../../shared/modules/browser-runtime.utils';
import {
  forceUpdateMetamaskState,
  getIsSeedlessOnboardingUserAuthenticated,
  resetOnboarding,
  setDataCollectionForMarketing,
  setMarketingConsent,
} from '../../../store/actions';
import { TraceName, TraceOperation } from '../../../../shared/lib/trace';
import { getIsWalletResetInProgress } from '../../../ducks/metamask/metamask';

type CreatePasswordProps = {
  createNewAccount: (password: string) => void;
  importWithRecoveryPhrase: (
    password: string,
    secretRecoveryPhrase: string,
  ) => void;
  secretRecoveryPhrase: string;
};

const isFirefox = getBrowserName() === PLATFORM_FIREFOX;

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function CreatePassword({
  createNewAccount,
  importWithRecoveryPhrase,
  secretRecoveryPhrase,
}: CreatePasswordProps) {
  const t = useI18nContext();
  const [password, setPassword] = useState('');
  const [termsChecked, setTermsChecked] = useState(false);
  const [newAccountCreationInProgress, setNewAccountCreationInProgress] =
    useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const firstTimeFlowType = useSelector(getFirstTimeFlowType);
  const trackEvent = useContext(MetaMetricsContext);
  const { bufferedTrace, bufferedEndTrace, onboardingParentContext } =
    trackEvent;
  const currentKeyring = useSelector(getCurrentKeyring);
  const isSocialLoginFlow = useSelector(getIsSocialLoginFlow);
  const socialLoginType = useSelector(getSocialLoginType);
  const isWalletResetInProgress = useSelector(getIsWalletResetInProgress);

  const participateInMetaMetrics = useSelector(getParticipateInMetaMetrics);
  const isParticipateInMetaMetricsSet = useSelector(
    getIsParticipateInMetaMetricsSet,
  );
  const metametricsId = useSelector(getMetaMetricsId);
  const base64MetametricsId = Buffer.from(metametricsId ?? '').toString(
    'base64',
  );
  const shouldInjectMetametricsIframe = Boolean(
    participateInMetaMetrics && base64MetametricsId,
  );
  const analyticsIframeQuery = {
    mmi: base64MetametricsId,
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
            isParticipateInMetaMetricsSet
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
    navigate,
    firstTimeFlowType,
    newAccountCreationInProgress,
    secretRecoveryPhrase,
    isParticipateInMetaMetricsSet,
    isWalletResetInProgress,
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

  const handleLearnMoreClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    event.stopPropagation();
    trackEvent({
      category: MetaMetricsEventCategory.Onboarding,
      event: MetaMetricsEventName.ExternalLinkClicked,
      properties: {
        text: 'Learn More',
        location: 'create_password',
        url: ZENDESK_URLS.PASSWORD_ARTICLE,
      },
    });
  };

  // Helper function to determine account type for analytics
  const getAccountType = (
    baseType: MetaMetricsEventAccountType,
    includesSocialLogin: boolean = false,
  ) => {
    if (includesSocialLogin && socialLoginType) {
      const socialProvider = String(socialLoginType).toLowerCase();
      return `${baseType}_${socialProvider}`;
    }
    return baseType;
  };

  const handleWalletImport = async () => {
    trackEvent({
      category: MetaMetricsEventCategory.Onboarding,
      event: MetaMetricsEventName.WalletImportAttempted,
    });

    await importWithRecoveryPhrase(password, secretRecoveryPhrase);

    bufferedEndTrace?.({ name: TraceName.OnboardingExistingSrpImport });
    bufferedEndTrace?.({ name: TraceName.OnboardingJourneyOverall });

    trackEvent({
      category: MetaMetricsEventCategory.Onboarding,
      event: MetaMetricsEventName.WalletImported,
      properties: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        biometrics_enabled: false,
      },
    });

    trackEvent({
      category: MetaMetricsEventCategory.Onboarding,
      event: MetaMetricsEventName.WalletSetupCompleted,
      properties: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        wallet_setup_type: 'import',
        // eslint-disable-next-line @typescript-eslint/naming-convention
        new_wallet: false,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        account_type: getAccountType(
          MetaMetricsEventAccountType.Imported,
          isSocialLoginFlow,
        ),
      },
    });

    if (isFirefox || isSocialLoginFlow) {
      navigate(ONBOARDING_COMPLETION_ROUTE, { replace: true });
    } else {
      navigate(ONBOARDING_METAMETRICS, { replace: true });
    }
  };

  const handleCreateNewWallet = async () => {
    trackEvent({
      category: MetaMetricsEventCategory.Onboarding,
      event: MetaMetricsEventName.WalletCreationAttempted,
      properties: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        account_type: getAccountType(
          MetaMetricsEventAccountType.Default,
          isSocialLoginFlow,
        ),
      },
    });

    setNewAccountCreationInProgress(true);
    await createNewAccount(password);

    if (isSocialLoginFlow) {
      bufferedEndTrace?.({ name: TraceName.OnboardingNewSocialCreateWallet });
      bufferedEndTrace?.({ name: TraceName.OnboardingJourneyOverall });
    }

    trackEvent({
      category: MetaMetricsEventCategory.Onboarding,
      event: MetaMetricsEventName.WalletCreated,
      properties: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        biometrics_enabled: false,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        account_type: getAccountType(
          MetaMetricsEventAccountType.Default,
          isSocialLoginFlow,
        ),
      },
    });

    trackEvent({
      category: MetaMetricsEventCategory.Onboarding,
      event: MetaMetricsEventName.WalletSetupCompleted,
      properties: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        wallet_setup_type: 'new',
        // eslint-disable-next-line @typescript-eslint/naming-convention
        new_wallet: true,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        account_type: getAccountType(
          MetaMetricsEventAccountType.Default,
          isSocialLoginFlow,
        ),
      },
    });
    if (isSocialLoginFlow) {
      if (termsChecked) {
        dispatch(setMarketingConsent(true));
        dispatch(setDataCollectionForMarketing(true));
      }
      navigate(ONBOARDING_DOWNLOAD_APP_ROUTE, { replace: true });
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
      // reset onboarding flow
      await dispatch(resetOnboarding());
      await forceUpdateMetamaskState(dispatch);

      navigate(ONBOARDING_WELCOME_ROUTE, { replace: true });
    }
  };

  const handlePasswordSetupError = (error: unknown) => {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    bufferedTrace?.({
      name: TraceName.OnboardingPasswordSetupError,
      op: TraceOperation.OnboardingUserJourney,
      parentContext: onboardingParentContext?.current,
      tags: { errorMessage },
    });
    bufferedEndTrace?.({ name: TraceName.OnboardingPasswordSetupError });

    console.error(error);
  };

  const handleCreatePassword = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event?.preventDefault();

    if (!password) {
      return;
    }

    try {
      // If secretRecoveryPhrase is defined we are in import wallet flow
      if (
        secretRecoveryPhrase &&
        firstTimeFlowType === FirstTimeFlowType.import
      ) {
        await handleWalletImport();
      } else {
        // Otherwise we are in create new wallet flow
        await handleCreateNewWallet();
      }
    } catch (error) {
      handlePasswordSetupError(error);
      trackEvent({
        category: MetaMetricsEventCategory.Onboarding,
        event: MetaMetricsEventName.WalletSetupFailure,
      });
    }
  };

  const createPasswordLink = (
    <a
      onClick={handleLearnMoreClick}
      key="create-password__link-text"
      href={ZENDESK_URLS.PASSWORD_ARTICLE}
      target="_blank"
      rel="noopener noreferrer"
    >
      <span className="create-password__link-text">
        {t('learnMoreUpperCaseWithDot')}
      </span>
    </a>
  );

  const checkboxLabel = isSocialLoginFlow
    ? t('createPasswordMarketing')
    : t('passwordTermsWarning');

  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      justifyContent={JustifyContent.spaceBetween}
      height={BlockSize.Full}
      width={BlockSize.Full}
      gap={4}
      as="form"
      className="create-password"
      data-testid="create-password"
      onSubmit={handleCreatePassword}
    >
      <Box>
        <Box
          justifyContent={JustifyContent.flexStart}
          marginBottom={4}
          width={BlockSize.Full}
        >
          <ButtonIcon
            iconName={IconName.ArrowLeft}
            color={IconColor.iconDefault}
            size={ButtonIconSize.Md}
            data-testid="create-password-back-button"
            type="button"
            onClick={handleBackClick}
            ariaLabel={t('back')}
          />
        </Box>
        <Box
          justifyContent={JustifyContent.flexStart}
          marginBottom={4}
          width={BlockSize.Full}
        >
          <Text variant={TextVariant.headingLg} as="h2">
            {t('createPassword')}
          </Text>
          {isSocialLoginFlow ? (
            <Text
              variant={TextVariant.bodyMd}
              color={TextColor.textAlternative}
              as="h2"
            >
              {t('createPasswordDetailsSocial')}
              <Text
                variant={TextVariant.bodyMd}
                color={TextColor.warningDefault}
                as="span"
              >
                {t('createPasswordDetailsSocialReset')}
              </Text>
            </Text>
          ) : (
            <Text
              variant={TextVariant.bodyMd}
              color={TextColor.textAlternative}
              as="h2"
            >
              {t('createPasswordDetails')}
            </Text>
          )}
        </Box>
        <PasswordForm onChange={(newPassword) => setPassword(newPassword)} />
        <Box
          className="create-password__terms-container"
          alignItems={AlignItems.center}
          justifyContent={JustifyContent.spaceBetween}
          marginTop={6}
          backgroundColor={BackgroundColor.backgroundMuted}
          padding={3}
          borderRadius={BorderRadius.LG}
        >
          <Checkbox
            inputProps={{ 'data-testid': 'create-password-terms' }}
            alignItems={AlignItems.flexStart}
            isChecked={termsChecked}
            onChange={() => {
              setTermsChecked(!termsChecked);
            }}
            label={
              <Text variant={TextVariant.bodySm} color={TextColor.textDefault}>
                {checkboxLabel}
                {!isSocialLoginFlow && (
                  <>
                    <br />
                    {createPasswordLink}
                  </>
                )}
              </Text>
            }
          />
        </Box>
      </Box>
      <Box>
        <Button
          data-testid="create-password-submit"
          variant={ButtonVariant.Primary}
          width={BlockSize.Full}
          size={ButtonSize.Lg}
          className="create-password__form--submit-button"
          disabled={!password || (!isSocialLoginFlow && !termsChecked)}
        >
          {t('createPasswordCreate')}
        </Button>
      </Box>
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
