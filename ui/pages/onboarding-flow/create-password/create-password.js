import React, { useState, useContext, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useHistory } from 'react-router-dom';
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
  ONBOARDING_IMPORT_WITH_SRP_ROUTE,
  ONBOARDING_METAMETRICS,
  ONBOARDING_SECURE_YOUR_WALLET_ROUTE,
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
  resetOnboarding,
} from '../../../store/actions';
import {
  getIsSeedlessOnboardingFeatureEnabled,
  getIsSocialLoginUiChangesEnabled,
} from '../../../../shared/modules/environment';
import { TraceName, TraceOperation } from '../../../../shared/lib/trace';

const isFirefox = getBrowserName() === PLATFORM_FIREFOX;

export default function CreatePassword({
  createNewAccount,
  importWithRecoveryPhrase,
  secretRecoveryPhrase,
}) {
  const t = useI18nContext();
  const [password, setPassword] = useState('');
  const [termsChecked, setTermsChecked] = useState(false);
  const [newAccountCreationInProgress, setNewAccountCreationInProgress] =
    useState(false);
  const history = useHistory();
  const dispatch = useDispatch();
  const firstTimeFlowType = useSelector(getFirstTimeFlowType);
  const trackEvent = useContext(MetaMetricsContext);
  const { bufferedTrace, bufferedEndTrace, onboardingParentContext } =
    trackEvent;
  const currentKeyring = useSelector(getCurrentKeyring);
  const isSeedlessOnboardingFeatureEnabled =
    getIsSeedlessOnboardingFeatureEnabled();
  const isSocialLoginFlow = useSelector(getIsSocialLoginFlow);
  const socialLoginType = useSelector(getSocialLoginType);

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
  const analyticsIframeUrl = `https://start.metamask.io/?${new URLSearchParams(
    analyticsIframeQuery,
  )}`;
  const isSocialLoginUiChangesEnabled = getIsSocialLoginUiChangesEnabled();

  useEffect(() => {
    if (currentKeyring && !newAccountCreationInProgress) {
      if (
        firstTimeFlowType === FirstTimeFlowType.import ||
        firstTimeFlowType === FirstTimeFlowType.socialImport
      ) {
        history.replace(
          isParticipateInMetaMetricsSet
            ? ONBOARDING_COMPLETION_ROUTE
            : ONBOARDING_METAMETRICS,
        );
      } else if (firstTimeFlowType === FirstTimeFlowType.socialCreate) {
        if (isFirefox) {
          history.replace(ONBOARDING_COMPLETION_ROUTE);
        } else {
          history.replace(ONBOARDING_METAMETRICS);
        }
      } else {
        history.replace(ONBOARDING_SECURE_YOUR_WALLET_ROUTE);
      }
    } else if (
      firstTimeFlowType === FirstTimeFlowType.import &&
      !secretRecoveryPhrase
    ) {
      history.replace(ONBOARDING_IMPORT_WITH_SRP_ROUTE);
    }
  }, [
    currentKeyring,
    history,
    firstTimeFlowType,
    newAccountCreationInProgress,
    secretRecoveryPhrase,
    isParticipateInMetaMetricsSet,
  ]);

  const handleLearnMoreClick = (event) => {
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
  const getAccountType = (baseType, includesSocialLogin = false) => {
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
        biometrics_enabled: false,
      },
    });

    trackEvent({
      category: MetaMetricsEventCategory.Onboarding,
      event: MetaMetricsEventName.WalletSetupCompleted,
      properties: {
        wallet_setup_type: 'import',
        new_wallet: false,
        account_type: getAccountType(
          MetaMetricsEventAccountType.Imported,
          isSocialLoginFlow,
        ),
      },
    });

    if (isFirefox) {
      history.replace(ONBOARDING_COMPLETION_ROUTE);
    } else {
      history.replace(ONBOARDING_METAMETRICS);
    }
  };

  const handleCreateNewWallet = async () => {
    trackEvent({
      category: MetaMetricsEventCategory.Onboarding,
      event: MetaMetricsEventName.WalletCreationAttempted,
      properties: {
        account_type: getAccountType(
          MetaMetricsEventAccountType.Default,
          isSocialLoginFlow,
        ),
      },
    });

    if (createNewAccount) {
      setNewAccountCreationInProgress(true);
      await createNewAccount(password);
    }

    if (isSocialLoginFlow) {
      bufferedEndTrace?.({ name: TraceName.OnboardingNewSocialCreateWallet });
      bufferedEndTrace?.({ name: TraceName.OnboardingJourneyOverall });
    }

    trackEvent({
      category: MetaMetricsEventCategory.Onboarding,
      event: MetaMetricsEventName.WalletCreated,
      properties: {
        biometrics_enabled: false,
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
        wallet_setup_type: 'new',
        new_wallet: true,
        account_type: getAccountType(
          MetaMetricsEventAccountType.Default,
          isSocialLoginFlow,
        ),
      },
    });

    if (isSeedlessOnboardingFeatureEnabled && isSocialLoginFlow) {
      if (isFirefox || isSocialLoginUiChangesEnabled) {
        history.replace(ONBOARDING_COMPLETION_ROUTE);
      } else {
        history.replace(ONBOARDING_METAMETRICS);
      }
    } else {
      history.replace(ONBOARDING_SECURE_YOUR_WALLET_ROUTE);
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

  const handleBackClick = async (event) => {
    event.preventDefault();
    // reset onboarding flow
    await dispatch(resetOnboarding());
    await forceUpdateMetamaskState(dispatch);

    firstTimeFlowType === FirstTimeFlowType.import
      ? history.replace(ONBOARDING_IMPORT_WITH_SRP_ROUTE)
      : history.replace(ONBOARDING_WELCOME_ROUTE);
  };

  const handlePasswordSetupError = (error) => {
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error';

    bufferedTrace?.({
      name: TraceName.OnboardingPasswordSetupError,
      op: TraceOperation.OnboardingUserJourney,
      parentContext: onboardingParentContext.current,
      tags: { errorMessage },
    });
    bufferedEndTrace?.({ name: TraceName.OnboardingPasswordSetupError });

    console.error(error);
  };

  const handleCreatePassword = async (event) => {
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

  const socialLoginCheckboxLabel = isSocialLoginUiChangesEnabled
    ? t('createPasswordMarketing')
    : t('passwordTermsWarningSocial');

  const checkboxLabel = isSocialLoginFlow
    ? socialLoginCheckboxLabel
    : t('passwordTermsWarning');

  return (
    <Box
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      justifyContent={JustifyContent.spaceBetween}
      height={BlockSize.Full}
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
          {!isSocialLoginFlow && (
            <Text
              variant={TextVariant.bodyMd}
              color={TextColor.textAlternative}
            >
              {t('stepOf', [
                firstTimeFlowType === FirstTimeFlowType.import ? 2 : 1,
                firstTimeFlowType === FirstTimeFlowType.import ? 2 : 3,
              ])}
            </Text>
          )}
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
              !isSocialLoginUiChangesEnabled && setTermsChecked(!termsChecked);
            }}
            label={
              <Text variant={TextVariant.bodySm} color={TextColor.textDefault}>
                {checkboxLabel} &nbsp;
                {!isSocialLoginUiChangesEnabled && createPasswordLink}
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
          disabled={
            !password || (!isSocialLoginUiChangesEnabled && !termsChecked)
          }
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

CreatePassword.propTypes = {
  createNewAccount: PropTypes.func,
  importWithRecoveryPhrase: PropTypes.func,
  secretRecoveryPhrase: PropTypes.string,
};
