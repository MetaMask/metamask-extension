import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ONBOARDING_UNLOCK_ROUTE } from '../../../helpers/constants/routes';
import { FirstTimeFlowType } from '../../../../shared/constants/onboarding';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { TraceName, TraceOperation } from '../../../../shared/lib/trace';
import { AccountStatusLayout } from '../account-status-layout';
import { useAccountStatusContext } from '../hooks/useAccountStatusContext';

export default function AccountExist() {
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
    telegramDescriptionKey: 'accountAlreadyExistsLoginDescriptionTelegram',
    defaultDescriptionKey: 'accountAlreadyExistsLoginDescription',
    validFlowType: FirstTimeFlowType.socialImport,
    pageViewedEventName: MetaMetricsEventName.AccountAlreadyExistsPageViewed,
    pageTraceName: TraceName.OnboardingNewSocialAccountExists,
  });

  const onLoginWithDifferentMethod = async (
    e?: React.MouseEvent<HTMLButtonElement>,
  ) => {
    e?.preventDefault();
    await resetOnboardingAndReturn();
  };

  const onDone = async () => {
    trackEvent(
      createEventBuilder(MetaMetricsEventName.WalletImportStarted)
        .addCategory(MetaMetricsEventCategory.Onboarding)
        .addProperties({
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          account_type: accountTypeForMetrics,
        })
        .build(),
    );
    bufferedTrace?.({
      name: TraceName.OnboardingExistingSocialLogin,
      op: TraceOperation.OnboardingUserJourney,
      tags: { source: 'account_status_redirect' },
      parentContext: onboardingParentContext?.current,
    });
    navigate(ONBOARDING_UNLOCK_ROUTE, { replace: true });
  };

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
