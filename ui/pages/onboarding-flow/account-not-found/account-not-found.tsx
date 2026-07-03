import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ONBOARDING_CREATE_PASSWORD_ROUTE } from '../../../helpers/constants/routes';
import { FirstTimeFlowType } from '../../../../shared/constants/onboarding';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { TraceName, TraceOperation } from '../../../../shared/lib/trace';
import { AccountStatusLayout } from '../account-status-layout';
import { useAccountStatusContext } from '../hooks/useAccountStatusContext';

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
// eslint-disable-next-line @typescript-eslint/naming-convention
export default function AccountNotFound() {
  const navigate = useNavigate();
  const {
    accountTypeForMetrics,
    descriptionKey,
    descriptionInterpolation,
    resetOnboardingAndReturn,
    trackEvent,
    createEventBuilder,
    bufferedTrace,
    onboardingParentContext,
  } = useAccountStatusContext({
    telegramDescriptionKey: 'accountNotFoundDescriptionTelegram',
    defaultDescriptionKey: 'accountNotFoundDescription',
    validFlowType: FirstTimeFlowType.socialCreate,
    pageViewedEventName: MetaMetricsEventName.AccountNotFoundPageViewed,
    pageTraceName: TraceName.OnboardingExistingSocialAccountNotFound,
  });

  const onLoginWithDifferentMethod = async () => {
    await resetOnboardingAndReturn();
  };

  const onCreateNewAccount = () => {
    trackEvent(
      createEventBuilder(MetaMetricsEventName.WalletSetupStarted)
        .addCategory(MetaMetricsEventCategory.Onboarding)
        .addProperties({
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          account_type: accountTypeForMetrics,
        })
        .build(),
    );
    bufferedTrace?.({
      name: TraceName.OnboardingNewSocialCreateWallet,
      op: TraceOperation.OnboardingUserJourney,
      tags: { source: 'account_status_redirect' },
      parentContext: onboardingParentContext?.current,
    });
    navigate(ONBOARDING_CREATE_PASSWORD_ROUTE, { replace: true });
  };

  return (
    <AccountStatusLayout
      dataTestId="account-not-found"
      titleKey="accountNotFoundTitle"
      descriptionKey={descriptionKey}
      descriptionInterpolation={descriptionInterpolation}
      primaryButtonTextKey="accountNotFoundCreateOne"
      onPrimaryButtonClick={onCreateNewAccount}
      secondaryButtonTextKey="useDifferentLoginMethod"
      onSecondaryButtonClick={onLoginWithDifferentMethod}
    />
  );
}
