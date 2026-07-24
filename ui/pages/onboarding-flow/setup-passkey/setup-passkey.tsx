import React, { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  ONBOARDING_COMPLETION_ROUTE,
  ONBOARDING_REVIEW_SRP_ROUTE,
  ONBOARDING_METAMETRICS,
} from '../../../helpers/constants/routes';
import {
  getAccountTypeForOnboardingMetrics,
  getFirstTimeFlowType,
  getCompletedMetaMetricsOnboarding,
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
  const isFirefox = useIsFirefox();
  const firstTimeFlowType = useSelector(getFirstTimeFlowType);
  const completedMetaMetricsOnboarding = useSelector(
    getCompletedMetaMetricsOnboarding,
  );

  const handleNext = useCallback(() => {
    let nextRoute: string;

    if (firstTimeFlowType === FirstTimeFlowType.create) {
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
  }, [firstTimeFlowType, isFirefox, navigate, completedMetaMetricsOnboarding]);

  return <SetupPasskeyContent onNext={handleNext} />;
}
