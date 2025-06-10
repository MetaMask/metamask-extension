import React, { useContext, useEffect } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  Button,
  ButtonSize,
  ButtonVariant,
} from '../../../components/component-library/button';
import {
  TextVariant,
  Display,
  AlignItems,
  JustifyContent,
  FlexDirection,
  BlockSize,
  IconColor,
} from '../../../helpers/constants/design-system';
import {
  Box,
  Text,
  IconName,
  ButtonIcon,
  ButtonIconSize,
} from '../../../components/component-library';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  ONBOARDING_CREATE_PASSWORD_ROUTE,
  ONBOARDING_WELCOME_ROUTE,
} from '../../../helpers/constants/routes';

import { getFirstTimeFlowType, getSocialLoginEmail } from '../../../selectors';
import { FirstTimeFlowType } from '../../../../shared/constants/onboarding';
import {
  setFirstTimeFlowType,
  resetOAuthLoginState,
} from '../../../store/actions';
import {
  bufferedEndTrace,
  bufferedTrace,
  TraceName,
  TraceOperation,
} from '../../../../shared/lib/trace';
import { useSentryTrace } from '../../../contexts/sentry-trace';
import {
  MetaMetricsEventAccountType,
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { MetaMetricsContext } from '../../../contexts/metametrics';

export default function AccountNotFound() {
  const history = useHistory();
  const location = useLocation();
  const dispatch = useDispatch();
  const t = useI18nContext();
  const firstTimeFlowType = useSelector(getFirstTimeFlowType);
  const userSocialLoginEmail = useSelector(getSocialLoginEmail);
  const { onboardingParentContext } = useSentryTrace();
  const trackEvent = useContext(MetaMetricsContext);

  // Get socialConnectionType from query parameters
  const urlParams = new URLSearchParams(location.search);
  const socialConnectionType = urlParams.get('socialConnectionType') || '';

  const onBack = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    await dispatch(resetOAuthLoginState());
    history.goBack();
  };

  const onCreateWallet = () => {
    bufferedTrace({
      name: TraceName.OnboardingNewSocialCreateWallet,
      op: TraceOperation.OnboardingUserJourney,
      tags: { source: 'account_status_redirect' },
      parentContext: onboardingParentContext.current,
    });
    dispatch(setFirstTimeFlowType(FirstTimeFlowType.socialCreate));
    trackEvent({
      category: MetaMetricsEventCategory.Onboarding,
      event: MetaMetricsEventName.WalletSetupStarted,
      properties: {
        account_type: `${MetaMetricsEventAccountType.Default}_${socialConnectionType}`,
      },
    });
    history.push(ONBOARDING_CREATE_PASSWORD_ROUTE);
  };

  const onLoginWithDifferentMethod = async () => {
    // clear the social login state
    await dispatch(resetOAuthLoginState());
    history.push(ONBOARDING_WELCOME_ROUTE);
  };

  useEffect(() => {
    if (firstTimeFlowType !== FirstTimeFlowType.socialImport) {
      // if the onboarding flow is not social import, redirect to the welcome page
      history.push(ONBOARDING_WELCOME_ROUTE);
    }
    if (firstTimeFlowType === FirstTimeFlowType.socialImport) {
      bufferedTrace({
        name: TraceName.OnboardingExistingSocialAccountNotFound,
        op: TraceOperation.OnboardingUserJourney,
        parentContext: onboardingParentContext.current,
      });
    }
    return () => {
      if (firstTimeFlowType === FirstTimeFlowType.socialImport) {
        bufferedEndTrace({
          name: TraceName.OnboardingExistingSocialAccountNotFound,
        });
      }
    };
  }, [firstTimeFlowType, history, onboardingParentContext]);

  return (
    <Box
      className="account-not-found"
      data-testid="account-not-found"
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      justifyContent={JustifyContent.spaceBetween}
      alignItems={AlignItems.center}
      gap={6}
      height={BlockSize.Full}
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
            onClick={onBack}
            ariaLabel="back"
          />
        </Box>
        <Box
          display={Display.Flex}
          flexDirection={FlexDirection.Column}
          justifyContent={JustifyContent.center}
          alignItems={AlignItems.flexStart}
        >
          <Text
            variant={TextVariant.headingLg}
            as="h2"
            justifyContent={JustifyContent.center}
            style={{
              alignSelf: AlignItems.flexStart,
            }}
            marginBottom={4}
          >
            {t('accountNotFoundTitle')}
          </Text>
          <Box
            width={BlockSize.Full}
            display={Display.Flex}
            justifyContent={JustifyContent.center}
            alignItems={AlignItems.center}
            marginBottom={6}
          >
            <img
              src="images/account-status.png"
              width={276}
              height={276}
              alt={t('accountNotFoundTitle')}
              style={{
                alignSelf: 'center',
              }}
            />
          </Box>
          <Text variant={TextVariant.bodyMd} marginBottom={6}>
            {t('accountNotFoundDescription', [userSocialLoginEmail])}
          </Text>
        </Box>
      </Box>

      <Box
        display={Display.Flex}
        flexDirection={FlexDirection.Column}
        justifyContent={JustifyContent.center}
        alignItems={AlignItems.center}
        width={BlockSize.Full}
        gap={4}
      >
        <Button
          data-testid="onboarding-complete-done"
          variant={ButtonVariant.Primary}
          size={ButtonSize.Lg}
          width={BlockSize.Full}
          onClick={onCreateWallet}
        >
          {t('accountNotFoundCreateOne')}
        </Button>
        <Button
          data-testid="account-not-found-login-with-different-method"
          variant={ButtonVariant.Secondary}
          size={ButtonSize.Lg}
          width={BlockSize.Full}
          onClick={onLoginWithDifferentMethod}
        >
          {t('useDifferentLoginMethod')}
        </Button>
      </Box>
    </Box>
  );
}
