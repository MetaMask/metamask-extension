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
} from '../../../helpers/constants/design-system';
import {
  ONBOARDING_METAMETRICS,
  ONBOARDING_COMPLETION_ROUTE,
  ONBOARDING_SECURE_YOUR_WALLET_ROUTE,
} from '../../../helpers/constants/routes';
import ZENDESK_URLS from '../../../helpers/constants/zendesk-url';
import {
  getFirstTimeFlowType,
  getCurrentKeyring,
  getMetaMetricsId,
  getParticipateInMetaMetrics,
  isSocialLoginFlow,
} from '../../../selectors';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
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
import { PLATFORM_FIREFOX } from '../../../../shared/constants/app';
// eslint-disable-next-line import/no-restricted-paths
import { getPlatform } from '../../../../app/scripts/lib/util';
import PasswordForm from '../../../components/app/password-form/password-form';
import LoadingScreen from '../../../components/ui/loading-screen';
import { resetOAuthLoginState } from '../../../store/actions';

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
  const socialLoginFlow = useSelector(isSocialLoginFlow);
  const trackEvent = useContext(MetaMetricsContext);
  const currentKeyring = useSelector(getCurrentKeyring);

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

  const isFirefox = getPlatform() === PLATFORM_FIREFOX;

  useEffect(() => {
    if (currentKeyring && !newAccountCreationInProgress) {
      if (
        firstTimeFlowType === FirstTimeFlowType.import ||
        firstTimeFlowType === FirstTimeFlowType.socialImport
      ) {
        history.replace(ONBOARDING_METAMETRICS);
      } else {
        history.replace(ONBOARDING_SECURE_YOUR_WALLET_ROUTE);
      }
    }
  }, [
    currentKeyring,
    history,
    firstTimeFlowType,
    newAccountCreationInProgress,
  ]);

  const handleBackClick = (event) => {
    event.preventDefault();
    // reset the social login state
    dispatch(resetOAuthLoginState());
    history.goBack();
  };

  const handleCreate = async (event) => {
    event?.preventDefault();

    if (!password) {
      return;
    }

    trackEvent({
      category: MetaMetricsEventCategory.Onboarding,
      event: MetaMetricsEventName.OnboardingWalletCreationAttempted,
    });

    // If secretRecoveryPhrase is defined we are in import wallet flow
    if (
      secretRecoveryPhrase &&
      firstTimeFlowType === FirstTimeFlowType.import
    ) {
      await importWithRecoveryPhrase(password, secretRecoveryPhrase);
      if (isFirefox) {
        history.push(ONBOARDING_COMPLETION_ROUTE);
      } else {
        history.push(ONBOARDING_METAMETRICS);
      }
    } else {
      // Otherwise we are in create new wallet flow
      try {
        if (createNewAccount) {
          setNewAccountCreationInProgress(true);
          await createNewAccount(password);
        }
        if (socialLoginFlow) {
          if (isFirefox) {
            history.push(ONBOARDING_COMPLETION_ROUTE);
          } else {
            history.push(ONBOARDING_METAMETRICS);
          }
        } else {
          history.push(ONBOARDING_SECURE_YOUR_WALLET_ROUTE);
        }
      } catch (error) {
        console.error(error);
      }
    }
  };

  const createPasswordLink = (
    <a
      onClick={(e) => e.stopPropagation()}
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
      onSubmit={handleCreate}
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
            ariaLabel="back"
          />
        </Box>
        <Box
          justifyContent={JustifyContent.flexStart}
          marginBottom={4}
          width={BlockSize.Full}
        >
          {!socialLoginFlow && (
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
        </Box>
        <PasswordForm onChange={(newPassword) => setPassword(newPassword)} />
      </Box>
      <Box>
        <Box
          className="create-password__terms-container"
          alignItems={AlignItems.center}
          justifyContent={JustifyContent.spaceBetween}
          marginBottom={4}
        >
          <Checkbox
            inputProps={{ 'data-testid': 'create-password-terms' }}
            alignItems={AlignItems.flexStart}
            isChecked={termsChecked}
            onChange={() => {
              setTermsChecked(!termsChecked);
            }}
            label={
              <Text variant={TextVariant.bodySm} marginLeft={1}>
                {t('passwordTermsWarning')}
                &nbsp;
                {createPasswordLink}
              </Text>
            }
          />
        </Box>
        <Button
          data-testid="create-password-submit"
          variant={ButtonVariant.Primary}
          width={BlockSize.Full}
          size={ButtonSize.Lg}
          className="create-password__form--submit-button"
          disabled={!password || !termsChecked}
        >
          {t('confirm')}
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
