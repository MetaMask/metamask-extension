/* eslint-disable @typescript-eslint/naming-convention */
import { useCallback } from 'react';
import { errorCodes } from '@metamask/rpc-errors';

import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../../../shared/constants/metametrics';
import { useAnalytics } from '../../../../../hooks/useAnalytics';

/**
 * Stage of the non-EVM send lifecycle at which a failure occurred.
 */
export const NonEvmSendFailurePhase = {
  Validation: 'validation',
  Confirmation: 'confirmation',
  SnapRpc: 'snap_rpc',
  Broadcast: 'broadcast',
  Unknown: 'unknown',
} as const;

export type NonEvmSendFailurePhase =
  (typeof NonEvmSendFailurePhase)[keyof typeof NonEvmSendFailurePhase];

/**
 * Stable machine-readable reason for a failed non-EVM send.
 */
export const NonEvmSendErrorCode = {
  UserRejected: 'user_rejected',
  Unknown: 'unknown',
} as const;

/**
 * Recorded for a required property that cannot be resolved at failure time.
 *
 * `chain_id_caip` and `snap_id` are required by the event contract. A missing
 * chain id or an account without Snap metadata would otherwise write
 * `undefined`, producing an invalid event and a null warehouse column. An
 * explicit sentinel keeps the failure countable instead of silently dropping
 * it, which matters most for the failure branch this event exists to capture.
 */
export const NonEvmSendUnknownValue = 'unknown';

type NonEvmSendCommonProperties = {
  /** CAIP-2 chain id of the send, for example bip122:000000000019d6689c085ae165831e93. */
  chainIdCaip?: string;
  /** Snap that services the account and executes the send. */
  snapId?: string;
};

type NonEvmSendFailedProperties = NonEvmSendCommonProperties & {
  failurePhase: NonEvmSendFailurePhase;
  errorCode: string;
};

/**
 * Determines whether a rejected confirmSend call was a deliberate user
 * cancellation rather than a genuine failure.
 *
 * JSON-RPC 4001 is language-independent, so this does not inspect the message.
 *
 * @param error - The error thrown by the snap request.
 * @returns Whether the user deliberately cancelled the send.
 */
export const isNonEvmSendUserRejection = (error: unknown): boolean =>
  (error as { code?: number })?.code ===
  errorCodes.provider.userRejectedRequest;

/**
 * Classifies a thrown confirmSend error into the failure axes recorded on
 * `Send Failed`.
 *
 * User rejection is classified rather than dropped so cancelled attempts stay
 * countable, and can be excluded from the failure rate by filtering on
 * `error_code` instead of by absence.
 *
 * @param error - The error thrown by the snap request.
 * @returns The error code and failure phase to report.
 */
export const classifyNonEvmSendError = (
  error: unknown,
): { errorCode: string; failurePhase: NonEvmSendFailurePhase } => {
  if (isNonEvmSendUserRejection(error)) {
    return {
      errorCode: NonEvmSendErrorCode.UserRejected,
      failurePhase: NonEvmSendFailurePhase.Confirmation,
    };
  }

  const code = (error as { code?: number })?.code;

  return {
    errorCode:
      typeof code === 'number' ? String(code) : NonEvmSendErrorCode.Unknown,
    failurePhase: NonEvmSendFailurePhase.SnapRpc,
  };
};

/**
 * Substitutes {@link NonEvmSendUnknownValue} for a required dimension that is
 * missing or empty, so a required event property is never emitted as
 * `undefined`.
 *
 * @param value - The resolved dimension, if any.
 * @returns The value, or the sentinel when it cannot be resolved.
 */
export const resolveNonEvmSendDimension = (value?: string): string =>
  value || NonEvmSendUnknownValue;

/**
 * Captures the non-EVM send failure branch.
 *
 * The Snap owns the non-EVM transaction lifecycle and already emits
 * `Transaction Added` / `Approved` / `Rejected` / `Submitted` / `Finalized`
 * through `snap_trackEvent`. This hook deliberately does not duplicate the
 * submit/complete steps; it only fills the gap the Snap leaves, since the Snap
 * emits no failure event for validation or transport errors.
 *
 * Both Extension and Mobile emit identical names and properties; the `client`
 * property is the dimension that separates them.
 *
 * @returns Functions to capture the non-EVM send failure.
 */
export const useNonEvmSendMetrics = () => {
  const { trackEvent, createEventBuilder } = useAnalytics();

  const captureSendFailed = useCallback(
    ({
      chainIdCaip,
      snapId,
      failurePhase,
      errorCode,
    }: NonEvmSendFailedProperties) => {
      trackEvent(
        createEventBuilder(MetaMetricsEventName.SendFailed)
          .addCategory(MetaMetricsEventCategory.Send)
          .addProperties({
            chain_id_caip: resolveNonEvmSendDimension(chainIdCaip),
            snap_id: resolveNonEvmSendDimension(snapId),
            client: 'extension',
            failure_phase: failurePhase,
            error_code: errorCode,
          })
          .build(),
      );
    },
    [createEventBuilder, trackEvent],
  );

  return { captureSendFailed };
};
