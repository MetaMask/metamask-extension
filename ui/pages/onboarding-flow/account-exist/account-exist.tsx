import React, { useEffect, useContext, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  ONBOARDING_WELCOME_ROUTE,
  ONBOARDING_UNLOCK_ROUTE,
} from '../../../helpers/constants/routes';
import {
  getAccountTypeForOnboardingMetrics,
  getFirstTimeFlowType,
  getSocialLoginEmail,
  getSocialLoginType,
} from '../../../selectors';
import {
  AuthConnection,
  FirstTimeFlowType,
} from '../../../../shared/constants/onboarding';
import {
  forceUpdateMetamaskState,
  resetOnboarding,
} from '../../../store/actions';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { TraceName, TraceOperation } from '../../../../shared/lib/trace';
import { AccountStatusLayout } from '../account-status-layout';

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function AccountExist() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const firstTimeFlowType = useSelector(getFirstTimeFlowType);
  const userSocialLoginEmail = useSelector(getSocialLoginEmail);
  const socialLoginType = useSelector(getSocialLoginType);
  const accountTypeForMetrics = useSelector(getAccountTypeForOnboardingMetrics);
  const {
    trackEvent,
    bufferedTrace,
    bufferedEndTrace,
    onboardingParentContext,
  } = useContext(MetaMetricsContext);

  const descriptionKey = useMemo(() => {
    if (socialLoginType === AuthConnection.Telegram) {
      return 'accountAlreadyExistsLoginDescriptionTelegram';
    }
    return 'accountAlreadyExistsLoginDescription';
  }, [socialLoginType]);

  const descriptionInterpolation = useMemo(() => {
    if (socialLoginType === AuthConnection.Telegram) {
      return [socialLoginType];
    }
    return [userSocialLoginEmail || '-'];
  }, [socialLoginType, userSocialLoginEmail]);

  const onLoginWithDifferentMethod = async (
    e?: React.MouseEvent<HTMLButtonElement>,
  ) => {
    e?.preventDefault();
    await dispatch(resetOnboarding());
    await forceUpdateMetamaskState(dispatch);
    navigate(ONBOARDING_WELCOME_ROUTE, { replace: true });
  };

  const onDone = async () => {
    trackEvent({
      category: MetaMetricsEventCategory.Onboarding,
      event: MetaMetricsEventName.WalletImportStarted,
      properties: {
        // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
        // eslint-disable-next-line @typescript-eslint/naming-convention
        account_type: accountTypeForMetrics,
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
    <AccountStatusLayout
      dataTestId="account-exist"
      titleKey="accountAlreadyExistsTitle"
      descriptionKey={descriptionKey}
      descriptionInterpolation={descriptionInterpolation}
      primaryButtonTextKey="accountAlreadyExistsLogin"
      onPrimaryButtonClick={onDone}
      secondaryButtonTextKey="useDifferentLoginMethod"
      onSecondaryButtonClick={onLoginWithDifferentMethod}
    />
  );
}
