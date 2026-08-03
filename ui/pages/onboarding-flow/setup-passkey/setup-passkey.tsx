import React, { useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  ONBOARDING_COMPLETION_ROUTE,
  ONBOARDING_CREATE_PASSWORD_ROUTE,
  ONBOARDING_DOWNLOAD_APP_ROUTE,
  ONBOARDING_REVIEW_SRP_ROUTE,
  ONBOARDING_METAMETRICS,
} from '../../../helpers/constants/routes';
import {
  getFirstTimeFlowType,
  getCompletedMetaMetricsOnboarding,
  getIsSocialLoginFlow,
  getIsSecretEscrowPasskeyEnrolled,
} from '../../../selectors';
import SetupPasskeyContent from '../../../components/app/setup-passkey-content';
import { FirstTimeFlowType } from '../../../../shared/constants/onboarding';
import { SecretEscrowFactorKind } from '../../../../shared/constants/secret-escrow-factors';
import { useIsFirefox } from '../../../hooks/useIsFirefox';
import { markSocialCreateUserFactor } from '../social-create-wallet-password';

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
  const isSecretEscrowPasskeyEnrolled = useSelector(
    getIsSecretEscrowPasskeyEnrolled,
  );
  const completedMetaMetricsOnboarding = useSelector(
    getCompletedMetaMetricsOnboarding,
  );
  const password =
    typeof location.state?.password === 'string'
      ? location.state.password
      : undefined;
  const requirePasskey = Boolean(location.state?.requirePasskey);
  const returnToManageFactors = Boolean(location.state?.returnToManageFactors);

  const handleNext = useCallback(() => {
    if (
      returnToManageFactors &&
      isSocialLoginFlow &&
      firstTimeFlowType === FirstTimeFlowType.socialCreate
    ) {
      // Prefer Redux enrollment, but always mark when this was a required
      // passkey step — manage UI also derives passkey from escrow factors.
      if (isSecretEscrowPasskeyEnrolled || requirePasskey) {
        markSocialCreateUserFactor(SecretEscrowFactorKind.Passkey);
      }
      navigate(ONBOARDING_CREATE_PASSWORD_ROUTE, {
        replace: true,
        state: { manageFactors: true },
      });
      return;
    }

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
    isSecretEscrowPasskeyEnrolled,
    isSocialLoginFlow,
    navigate,
    completedMetaMetricsOnboarding,
    returnToManageFactors,
    requirePasskey,
  ]);

  return (
    <SetupPasskeyContent
      onNext={handleNext}
      password={password}
      requirePasskey={requirePasskey}
    />
  );
}
