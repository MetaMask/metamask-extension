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
  ONBOARDING_WELCOME_ROUTE,
  ONBOARDING_UNLOCK_ROUTE,
} from '../../../helpers/constants/routes';
import { getFirstTimeFlowType, getSocialLoginEmail } from '../../../selectors';
import { FirstTimeFlowType } from '../../../../shared/constants/onboarding';
import {
  setFirstTimeFlowType,
  resetOAuthLoginState,
} from '../../../store/actions';
import {
  bufferedTrace,
  bufferedEndTrace,
  TraceName,
  TraceOperation,
} from '../../../../shared/lib/trace';
import { useSentryTrace } from '../../../contexts/sentry-trace';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  MetaMetricsEventAccountType,
} from '../../../../shared/constants/metametrics';

export default function AccountExist() {
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

  const onLogin = () => {
    bufferedTrace({
      name: TraceName.OnboardingExistingSocialLogin,
      op: TraceOperation.OnboardingUserJourney,
      tags: { source: 'account_status_redirect' },
      parentContext: onboardingParentContext.current,
    });
    dispatch(setFirstTimeFlowType(FirstTimeFlowType.socialImport));
    trackEvent({
      category: MetaMetricsEventCategory.Onboarding,
      event: MetaMetricsEventName.WalletImportStarted,
      properties: {
        account_type: `${MetaMetricsEventAccountType.Imported}_${socialConnectionType}`,
      },
    });
    history.push(ONBOARDING_UNLOCK_ROUTE);
  };

  const onLoginWithDifferentMethod = async () => {
    // clear the social login state
    await dispatch(resetOAuthLoginState());
    history.push(ONBOARDING_WELCOME_ROUTE);
  };

  useEffect(() => {
    if (firstTimeFlowType !== FirstTimeFlowType.socialCreate) {
      history.push(ONBOARDING_WELCOME_ROUTE);
    }
    if (firstTimeFlowType === FirstTimeFlowType.socialCreate) {
      bufferedTrace({
        name: TraceName.OnboardingNewSocialAccountExists,
        op: TraceOperation.OnboardingUserJourney,
        parentContext: onboardingParentContext.current,
      });
    }
    return () => {
      if (firstTimeFlowType === FirstTimeFlowType.socialCreate) {
        bufferedEndTrace({ name: TraceName.OnboardingNewSocialAccountExists });
      }
    };
  }, [firstTimeFlowType, history, onboardingParentContext]);

  return (
    <Box
      className="account-exist"
      data-testid="account-exist"
      display={Display.Flex}
      flexDirection={FlexDirection.Column}
      justifyContent={JustifyContent.spaceBetween}
      alignItems={AlignItems.center}
      height={BlockSize.Full}
      gap={6}
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
            {t('accountAlreadyExistsTitle')}
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
              alt={t('accountAlreadyExistsTitle')}
              style={{
                alignSelf: 'center',
              }}
            />
          </Box>
          <Text variant={TextVariant.bodyMd} marginBottom={6}>
            {t('accountAlreadyExistsLoginDescription', [userSocialLoginEmail])}
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
          onClick={onLogin}
        >
          {t('accountAlreadyExistsLogin')}
        </Button>
        <Button
          data-testid="account-exist-login-with-different-method"
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
