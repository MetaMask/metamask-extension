import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { captureException } from '../../../../shared/lib/sentry';
import { useAnalytics } from '../../useAnalytics';
import { selectEnrolledCredentials } from '../../../selectors/identity/authentication';
import { extensionMfaControllerAdapter } from './bindings';
import { startMfaFlow } from './engine/activeFlow';
import type { MfaEvent } from './engine/analytics';
import type {
  EnrollOptions,
  MfaFlowOptions,
  MfaFlowResult,
  VerifyOrEnrollOptions,
} from './engine/types';

const EVENTS: Record<MfaEvent, MetaMetricsEventName> = {
  'MFA Flow Status Updated': MetaMetricsEventName.MfaFlowStatusUpdated,
  'MFA Step Viewed': MetaMetricsEventName.MfaStepViewed,
  'MFA Error Viewed': MetaMetricsEventName.MfaErrorViewed,
  'MFA Error CTA Clicked': MetaMetricsEventName.MfaErrorCtaClicked,
  'MFA Method Selected': MetaMetricsEventName.MfaMethodSelected,
  'MFA Code Resent': MetaMetricsEventName.MfaCodeResent,
};

const clientOptions: Pick<
  MfaFlowOptions,
  'platform' | 'controller' | 'reportError'
> = {
  platform: 'extension',
  controller: extensionMfaControllerAdapter,
  reportError: (error, { code, operation, step }) => {
    captureException(error, {
      tags: { feature: 'mfa', mfaCode: code, operation },
      extra: { step },
    });
  },
};

/**
 * The MFA kit for features and settings.
 *
 * - `verifyOrEnroll`: makes sure `methods` are set up, then, when
 * `verifyWith` is set, resolves with a verification token proven with one of
 * them. Rejects with `flow_cancelled` when the user backs out, or with the
 * code of an error the kit has already shown. This is the only way features
 * get a token: `AuthenticationController.getVerificationToken` is low-level
 * (it knows nothing of `verifyWith`, and returns `null` instead of showing
 * the screens), and lint rejects it outside this folder.
 * - `enroll`: sets up one method, for example from settings. No intro, no
 * verification after.
 * - `credentials`: the profile's methods, as last fetched from the server.
 *
 * @returns The kit's entry points and the credential list.
 */
export const useMfa = () => {
  const credentials = useSelector(selectEnrolledCredentials);
  // The extension sends events through a hook, which checks the user's
  // consent, so the flow gets them from the caller.
  const { trackEvent, createEventBuilder } = useAnalytics();

  const entryPoints = useMemo(() => {
    const options = {
      ...clientOptions,
      trackEvent: (
        event: MfaEvent,
        properties: Record<string, string | boolean | string[]>,
      ) => {
        trackEvent(
          createEventBuilder(EVENTS[event])
            .addCategory(MetaMetricsEventCategory.Auth)
            .addProperties(properties)
            .build(),
        ).catch(() => undefined);
      },
    };
    return {
      verifyOrEnroll: ({
        reason,
        ...request
      }: VerifyOrEnrollOptions): Promise<MfaFlowResult> =>
        startMfaFlow({
          request: { kind: 'verifyOrEnroll', ...request },
          reason,
          ...options,
        }),
      enroll: ({ method, reason }: EnrollOptions): Promise<MfaFlowResult> =>
        startMfaFlow({
          request: { kind: 'enroll', method },
          reason,
          ...options,
        }),
    };
  }, [trackEvent, createEventBuilder]);

  return { credentials, ...entryPoints };
};
