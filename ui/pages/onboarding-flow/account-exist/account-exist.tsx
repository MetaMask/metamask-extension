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
  ONBOARDING_WELCOME_ROUTE,
  ONBOARDING_UNLOCK_ROUTE,
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
} from '../../../store/actions';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  MetaMetricsEventAccountType,
} from '../../../../shared/constants/metametrics';
import { TraceName, TraceOperation } from '../../../../shared/lib/trace';

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function AccountExist() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const t = useI18nContext();
  const firstTimeFlowType = useSelector(getFirstTimeFlowType);
  const userSocialLoginEmail = useSelector(getSocialLoginEmail);
  const socialLoginType = useSelector(getSocialLoginType);
  const trackEvent = useContext(MetaMetricsContext);
  const { bufferedTrace, bufferedEndTrace, onboardingParentContext } =
    trackEvent;

  const onLoginWithDifferentMethod = async (
    e: React.MouseEvent<HTMLButtonElement>,
  ) => {
    e.preventDefault();
    // reset onboarding flow
    await dispatch(resetOnboarding());
    await forceUpdateMetamaskState(dispatch);
    navigate(ONBOARDING_WELCOME_ROUTE, {
      replace: true,
    });
  };

  const onDone = async () => {
    trackEvent({
      category: MetaMetricsEventCategory.Onboarding,
      event: MetaMetricsEventName.WalletImportStarted,
      properties: {
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        account_type: `${MetaMetricsEventAccountType.Imported}_${socialLoginType}`,
      },
    });
    bufferedTrace?.({
      name: TraceName.OnboardingExistingSocialLogin,
      op: TraceOperation.OnboardingUserJourney,
      tags: { source: 'account_status_redirect' },
      parentContext: onboardingParentContext?.current,
    });
    navigate(ONBOARDING_UNLOCK_ROUTE, { replace: true });
  };

  useEffect(() => {
    if (firstTimeFlowType === FirstTimeFlowType.socialImport) {
      // Track page view event for account already exists page
      trackEvent({
        category: MetaMetricsEventCategory.Onboarding,
        event: MetaMetricsEventName.AccountAlreadyExistsPageViewed,
      });
      bufferedTrace?.({
        name: TraceName.OnboardingNewSocialAccountExists,
        op: TraceOperation.OnboardingUserJourney,
        parentContext: onboardingParentContext?.current,
      });
    } else {
      navigate(ONBOARDING_WELCOME_ROUTE, { replace: true });
    }
    return () => {
      if (firstTimeFlowType === FirstTimeFlowType.socialImport) {
        bufferedEndTrace?.({
          name: TraceName.OnboardingNewSocialAccountExists,
        });
      }
    };
  }, [
    firstTimeFlowType,
    navigate,
    onboardingParentContext,
    bufferedTrace,
    bufferedEndTrace,
    trackEvent,
  ]);

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
            {t('accountAlreadyExistsLoginDescription', [
              userSocialLoginEmail || '-',
            ])}
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
          onClick={onDone}
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
