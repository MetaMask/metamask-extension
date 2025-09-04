import React, { useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom-v5-compat';
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
} from '../../../helpers/constants/design-system';
import { Box, Text } from '../../../components/component-library';
import { useI18nContext } from '../../../hooks/useI18nContext';
import {
  ONBOARDING_CREATE_PASSWORD_ROUTE,
  ONBOARDING_WELCOME_ROUTE,
} from '../../../helpers/constants/routes';
import {
  getFirstTimeFlowType,
  getSocialLoginEmail,
  getSocialLoginType,
} from '../../../selectors';
import { FirstTimeFlowType } from '../../../../shared/constants/onboarding';
import {
  forceUpdateMetamaskState,
  resetOnboarding,
  setFirstTimeFlowType,
} from '../../../store/actions';
import {
  MetaMetricsEventAccountType,
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { TraceName, TraceOperation } from '../../../../shared/lib/trace';
import { MetaMetricsContext } from '../../../contexts/metametrics';

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function AccountNotFound() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const t = useI18nContext();
  const firstTimeFlowType = useSelector(getFirstTimeFlowType);
  const userSocialLoginEmail = useSelector(getSocialLoginEmail);
  const socialLoginType = useSelector(getSocialLoginType);
  const {
    trackEvent,
    bufferedTrace,
    bufferedEndTrace,
    onboardingParentContext,
  } = useContext(MetaMetricsContext);

  const onLoginWithDifferentMethod = async () => {
    await dispatch(resetOnboarding());
    await forceUpdateMetamaskState(dispatch);
    navigate(ONBOARDING_WELCOME_ROUTE, { replace: true });
  };

  const onCreateNewAccount = () => {
    trackEvent({
      category: MetaMetricsEventCategory.Onboarding,
      event: MetaMetricsEventName.WalletSetupStarted,
      properties: {
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        account_type: `${MetaMetricsEventAccountType.Default}_${socialLoginType}`,
      },
    });
    bufferedTrace?.({
      name: TraceName.OnboardingNewSocialCreateWallet,
      op: TraceOperation.OnboardingUserJourney,
      tags: { source: 'account_status_redirect' },
      parentContext: onboardingParentContext?.current,
    });
    dispatch(setFirstTimeFlowType(FirstTimeFlowType.socialCreate));
    navigate(ONBOARDING_CREATE_PASSWORD_ROUTE, { replace: true });
  };

  useEffect(() => {
    if (firstTimeFlowType !== FirstTimeFlowType.socialImport) {
      // if the onboarding flow is not social import, redirect to the welcome page
      navigate(ONBOARDING_WELCOME_ROUTE, { replace: true });
    }
    if (firstTimeFlowType === FirstTimeFlowType.socialImport) {
      bufferedTrace?.({
        name: TraceName.OnboardingExistingSocialAccountNotFound,
        op: TraceOperation.OnboardingUserJourney,
        parentContext: onboardingParentContext?.current,
      });
    }
    return () => {
      if (firstTimeFlowType === FirstTimeFlowType.socialImport) {
        bufferedEndTrace?.({
          name: TraceName.OnboardingExistingSocialAccountNotFound,
        });
      }
    };
  }, [
    firstTimeFlowType,
    navigate,
    onboardingParentContext,
    bufferedTrace,
    bufferedEndTrace,
  ]);

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
            {t('accountNotFoundDescription', [userSocialLoginEmail || '-'])}
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
          onClick={onCreateNewAccount}
        >
          {t('accountNotFoundCreateOne')}
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
