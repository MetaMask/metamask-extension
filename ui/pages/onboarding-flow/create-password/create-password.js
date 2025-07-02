import React, { useState, useContext, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useHistory } from 'react-router-dom';
import { useSelector } from 'react-redux';
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
import LoadingScreen from '../../../components/ui/loading-screen';
import { PLATFORM_FIREFOX } from '../../../../shared/constants/app';
import { getBrowserName } from '../../../../shared/modules/browser-runtime.utils';
import { getIsSeedlessOnboardingFeatureEnabled } from '../../../../shared/modules/environment';

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
  const firstTimeFlowType = useSelector(getFirstTimeFlowType);
  const trackEvent = useContext(MetaMetricsContext);
  const currentKeyring = useSelector(getCurrentKeyring);
  const isSeedlessOnboardingFeatureEnabled =
    getIsSeedlessOnboardingFeatureEnabled();
  const isSocialLoginFlow = useSelector(getIsSocialLoginFlow);

  const participateInMetaMetrics = useSelector(getParticipateInMetaMetrics);
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

  useEffect(() => {
    if (currentKeyring && !newAccountCreationInProgress) {
      if (
        firstTimeFlowType === FirstTimeFlowType.import ||
        firstTimeFlowType === FirstTimeFlowType.socialImport
      ) {
        history.replace(ONBOARDING_METAMETRICS);
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
  ]);

  const handleLearnMoreClick = (event) => {
    event.stopPropagation();
    trackEvent({
      category: MetaMetricsEventCategory.Onboarding,
      event: MetaMetricsEventName.ExternalLinkClicked,
      properties: {
        text: 'Learn More',
        location: 'create_password',
        url: ZENDESK_URLS.PASSWORD_AND_SRP_ARTICLE,
      },
    });
  };

  const handleWalletImport = async () => {
    trackEvent({
      category: MetaMetricsEventCategory.Onboarding,
      event: MetaMetricsEventName.WalletImportAttempted,
    });

    await importWithRecoveryPhrase(password, secretRecoveryPhrase);

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
        account_type: MetaMetricsEventAccountType.Imported,
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
        account_type: MetaMetricsEventAccountType.Default,
      },
    });

    if (createNewAccount) {
      setNewAccountCreationInProgress(true);
      await createNewAccount(password);
    }

    trackEvent({
      category: MetaMetricsEventCategory.Onboarding,
      event: MetaMetricsEventName.WalletSetupCompleted,
      properties: {
        wallet_setup_type: 'new',
        new_wallet: true,
        account_type: MetaMetricsEventAccountType.Default,
      },
    });

    if (isSeedlessOnboardingFeatureEnabled && isSocialLoginFlow) {
      if (isFirefox) {
        history.replace(ONBOARDING_COMPLETION_ROUTE);
      } else {
        history.replace(ONBOARDING_METAMETRICS);
      }
    } else {
      history.replace(ONBOARDING_SECURE_YOUR_WALLET_ROUTE);
    }
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
      href={ZENDESK_URLS.PASSWORD_AND_SRP_ARTICLE}
      target="_blank"
      rel="noopener noreferrer"
    >
      <span className="create-password__link-text">
        {t('learnMoreUpperCaseWithDot')}
      </span>
    </a>
  );

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
            onClick={() =>
              firstTimeFlowType === FirstTimeFlowType.import
                ? history.replace(ONBOARDING_IMPORT_WITH_SRP_ROUTE)
                : history.replace(ONBOARDING_WELCOME_ROUTE)
            }
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
          <Text
            variant={TextVariant.bodyMd}
            color={TextColor.textAlternative}
            as="h2"
          >
            {isSocialLoginFlow
              ? t('createPasswordDetailsSocial')
              : t('createPasswordDetails')}
          </Text>
        </Box>
        <PasswordForm onChange={(newPassword) => setPassword(newPassword)} />
        <Box
          className="create-password__terms-container"
          alignItems={AlignItems.center}
          justifyContent={JustifyContent.spaceBetween}
          marginTop={6}
        >
          <Checkbox
            inputProps={{ 'data-testid': 'create-password-terms' }}
            alignItems={AlignItems.flexStart}
            isChecked={termsChecked}
            onChange={() => {
              setTermsChecked(!termsChecked);
            }}
            label={
              <>
                {t('passwordTermsWarning')}
                &nbsp;
                {createPasswordLink}
              </>
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
          disabled={!password || !termsChecked}
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
      {newAccountCreationInProgress && <LoadingScreen />}
    </Box>
  );
}

CreatePassword.propTypes = {
  createNewAccount: PropTypes.func,
  importWithRecoveryPhrase: PropTypes.func,
  secretRecoveryPhrase: PropTypes.string,
};
