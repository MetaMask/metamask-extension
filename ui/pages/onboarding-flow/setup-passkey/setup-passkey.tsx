import React, { useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  ONBOARDING_COMPLETION_ROUTE,
  ONBOARDING_DOWNLOAD_APP_ROUTE,
  ONBOARDING_REVIEW_SRP_ROUTE,
  ONBOARDING_METAMETRICS,
} from '../../../helpers/constants/routes';
import {
  getFirstTimeFlowType,
  getCompletedMetaMetricsOnboarding,
  getIsSocialLoginFlow,
} from '../../../selectors';
import SetupPasskeyContent from '../../../components/app/setup-passkey-content';
import { FirstTimeFlowType } from '../../../../shared/constants/onboarding';
import { useIsFirefox } from '../../../hooks/useIsFirefox';

/**
 * Onboarding wrapper that renders the reusable passkey setup content and
 * advances to the next onboarding step.
 */
export default function SetupPasskey() {
  const navigate = useNavigate();
  const location = useLocation();
  const isFirefox = useIsFirefox();
  const firstTimeFlowType = useSelector(getFirstTimeFlowType);
  const isSocialLoginFlow = useSelector(getIsSocialLoginFlow);
  const completedMetaMetricsOnboarding = useSelector(
    getCompletedMetaMetricsOnboarding,
  );
  const password =
    typeof location.state?.password === 'string'
      ? location.state.password
      : undefined;

  const handleNext = useCallback(() => {
    let nextRoute: string;

    if (isSocialLoginFlow) {
      nextRoute =
        firstTimeFlowType === FirstTimeFlowType.socialCreate
          ? ONBOARDING_DOWNLOAD_APP_ROUTE
          : ONBOARDING_COMPLETION_ROUTE;
    } else if (firstTimeFlowType === FirstTimeFlowType.create) {
      nextRoute = ONBOARDING_REVIEW_SRP_ROUTE;
    } else if (firstTimeFlowType === FirstTimeFlowType.import) {
      if (isFirefox) {
        nextRoute = ONBOARDING_COMPLETION_ROUTE;
      } else {
        nextRoute = completedMetaMetricsOnboarding
          ? ONBOARDING_COMPLETION_ROUTE
          : ONBOARDING_METAMETRICS;
      }
    } else {
      nextRoute = ONBOARDING_COMPLETION_ROUTE;
    }

    navigate(nextRoute, { replace: true });
  }, [
    firstTimeFlowType,
    isFirefox,
    isSocialLoginFlow,
    navigate,
    completedMetaMetricsOnboarding,
  ]);

  return <SetupPasskeyContent onNext={handleNext} password={password} />;
}
