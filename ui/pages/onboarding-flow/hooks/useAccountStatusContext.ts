import { useContext, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
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
import { MetaMetricsContext } from '../../../contexts/metametrics';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { useAnalytics } from '../../../hooks/useAnalytics';
import { TraceName, TraceOperation } from '../../../../shared/lib/trace';
import { ONBOARDING_WELCOME_ROUTE } from '../../../helpers/constants/routes';
import { useOnboardingReset } from './useOnboardingReset';

type UseAccountStatusContextOptions = {
  /** i18n key used when the social login type is Telegram. */
  telegramDescriptionKey: string;
  /** i18n key used for every other social login type. */
  defaultDescriptionKey: string;
  /** The only flow type for which this page is valid; all others redirect to welcome. */
  validFlowType: FirstTimeFlowType;
  /** MetaMetrics event fired on page mount. */
  pageViewedEventName: MetaMetricsEventName;
  /** Trace that wraps the lifetime of this page. */
  pageTraceName: TraceName;
};

/**
 * Encapsulates the shared selector reads, MetaMetrics context access,
 * description-interpolation logic, and the page-lifetime effect that are
 * common to the account-exist and account-not-found onboarding pages.
 *
 * On mount the hook fires a page-viewed telemetry event and starts a buffered
 * trace. If the current flow type does not match `validFlowType` it redirects
 * to the welcome route. The trace is ended on unmount.
 * @param options0
 * @param options0.telegramDescriptionKey
 * @param options0.defaultDescriptionKey
 * @param options0.validFlowType
 * @param options0.pageViewedEventName
 * @param options0.pageTraceName
 */
export function useAccountStatusContext({
  telegramDescriptionKey,
  defaultDescriptionKey,
  validFlowType,
  pageViewedEventName,
  pageTraceName,
}: UseAccountStatusContextOptions) {
  const navigate = useNavigate();
  const resetOnboardingAndReturn = useOnboardingReset();

  const firstTimeFlowType = useSelector(getFirstTimeFlowType);
  const userSocialLoginEmail = useSelector(getSocialLoginEmail);
  const socialLoginType = useSelector(getSocialLoginType);
  const accountTypeForMetrics = useSelector(getAccountTypeForOnboardingMetrics);

  const { trackEvent, createEventBuilder } = useAnalytics();
  const { bufferedTrace, bufferedEndTrace, onboardingParentContext } =
    useContext(MetaMetricsContext);

  const descriptionKey = useMemo(() => {
    if (socialLoginType === AuthConnection.Telegram) {
      return telegramDescriptionKey;
    }
    return defaultDescriptionKey;
  }, [socialLoginType, telegramDescriptionKey, defaultDescriptionKey]);

  const descriptionInterpolation = useMemo(() => {
    if (socialLoginType === AuthConnection.Telegram) {
      return [socialLoginType];
    }
    return [userSocialLoginEmail || '-'];
  }, [socialLoginType, userSocialLoginEmail]);

  useEffect(() => {
    if (firstTimeFlowType === validFlowType) {
      trackEvent(
        createEventBuilder(pageViewedEventName)
          .addCategory(MetaMetricsEventCategory.Onboarding)
          .build(),
      );
      bufferedTrace?.({
        name: pageTraceName,
        op: TraceOperation.OnboardingUserJourney,
        parentContext: onboardingParentContext?.current,
      });
    } else {
      navigate(ONBOARDING_WELCOME_ROUTE, { replace: true });
    }
    return () => {
      if (firstTimeFlowType === validFlowType) {
        bufferedEndTrace?.({ name: pageTraceName });
      }
    };
  }, [
    firstTimeFlowType,
    validFlowType,
    pageViewedEventName,
    pageTraceName,
    navigate,
    onboardingParentContext,
    bufferedTrace,
    bufferedEndTrace,
    createEventBuilder,
    trackEvent,
  ]);

  return {
    accountTypeForMetrics,
    descriptionKey,
    descriptionInterpolation,
    resetOnboardingAndReturn,
    trackEvent,
    createEventBuilder,
    bufferedTrace,
    onboardingParentContext,
  };
}
