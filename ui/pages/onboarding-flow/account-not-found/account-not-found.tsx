import React, { useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
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
} from '../../../store/actions';
import {
  MetaMetricsEventAccountType,
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { TraceName, TraceOperation } from '../../../../shared/lib/trace';
import { MetaMetricsContext } from '../../../contexts/metametrics';
import { AccountStatusLayout } from '../account-status-layout';

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860

export default function AccountNotFound() {
  const navigate = useNavigate();
  const dispatch = useDispatch();
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
    navigate(ONBOARDING_CREATE_PASSWORD_ROUTE, { replace: true });
  };

  useEffect(() => {
    if (firstTimeFlowType === FirstTimeFlowType.socialCreate) {
      trackEvent({
        category: MetaMetricsEventCategory.Onboarding,
        event: MetaMetricsEventName.AccountNotFoundPageViewed,
      });
      bufferedTrace?.({
        name: TraceName.OnboardingExistingSocialAccountNotFound,
        op: TraceOperation.OnboardingUserJourney,
        parentContext: onboardingParentContext?.current,
      });
    } else {
      navigate(ONBOARDING_WELCOME_ROUTE, { replace: true });
    }
    return () => {
      if (firstTimeFlowType === FirstTimeFlowType.socialCreate) {
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
    trackEvent,
  ]);

  return (
    <AccountStatusLayout
      dataTestId="account-not-found"
      titleKey="accountNotFoundTitle"
      descriptionKey="accountNotFoundDescription"
      descriptionInterpolation={[userSocialLoginEmail || '-']}
      primaryButtonTextKey="accountNotFoundCreateOne"
      onPrimaryButtonClick={onCreateNewAccount}
      secondaryButtonTextKey="useDifferentLoginMethod"
      onSecondaryButtonClick={onLoginWithDifferentMethod}
    />
  );
}
