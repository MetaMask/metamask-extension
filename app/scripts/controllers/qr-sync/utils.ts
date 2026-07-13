import type { SessionRequest } from '@metamask/mobile-wallet-protocol-core';
import { bytesToBase64, stringToBytes } from '@metamask/utils';

import {
  QR_SYNC_PHASES,
  QR_SYNC_TIMEOUT_MS,
  type QrSyncPhase,
} from '../../../../shared/constants/qr-sync';
import { QrSyncErrorCodes } from '../../../../shared/constants/qr-sync';
import {
  QrSyncActionTypes,
  QrSyncConnectionStatus,
  QrSyncErrorMessages,
  QrSyncMessageVersion,
} from './constants';
import type {
  QrSyncConnectionStatusType,
  QrSyncError,
  QrSyncErrorCodeType,
  QrSyncMessage,
  QrSyncOffer,
} from './types';

/**
 * The error code emitted by the MWP client when the QR code expires before the
 * wallet connects (i.e. no handshake offer was received in time).
 *
 * The MWP core enum is minified in the published bundle and cannot be imported
 * safely, so the string is defined locally.
 */
export const MWP_REQUEST_EXPIRED_CODE = 'REQUEST_EXPIRED';

/**
 * Determines whether an error originates from an expired QR handshake request.
 *
 * @param error - The error to inspect.
 * @returns `true` when the error's `code` or `name` is `REQUEST_EXPIRED`.
 */
export function isQrExpiredError(error: unknown): boolean {
  if (!error || typeof error !== 'object') {
    return false;
  }

  const { code, name } = error as { code?: unknown; name?: unknown };
  return code === MWP_REQUEST_EXPIRED_CODE || name === MWP_REQUEST_EXPIRED_CODE;
}

/**
 * Registry of detectors that map a raw error to a specific QR sync error code.
 *
 * Add future detectable error types here so `#setError` call sites do not need
 * to compute codes individually.
 */
export const QR_SYNC_ERROR_DETECTORS: {
  matches: (error: unknown) => boolean;
  code: QrSyncErrorCodeType;
}[] = [{ matches: isQrExpiredError, code: QrSyncErrorCodes.QR_EXPIRED }];

/**
 * Resolves the QR sync error code for a raw error, falling back to a default
 * when no detector matches.
 *
 * @param error - The raw error to inspect.
 * @param defaultCode - The code to use when no detector matches.
 * @returns The resolved QR sync error code.
 */
export function resolveQrSyncErrorCode(
  error: unknown,
  defaultCode: QrSyncErrorCodeType,
): QrSyncErrorCodeType {
  return (
    QR_SYNC_ERROR_DETECTORS.find(({ matches }) => matches(error))?.code ??
    defaultCode
  );
}

export function createInitSyncSessionMessage(): QrSyncMessage {
  return {
    type: QrSyncActionTypes.INIT_SYNC_SESSION,
    version: QrSyncMessageVersion.V1,
  };
}

export function generateQrCode(request: SessionRequest): string {
  const base64QRpayload = bytesToBase64(stringToBytes(JSON.stringify(request)));
  return `metamask://connect/mwp?p=${encodeURIComponent(base64QRpayload)}`;
}

export function parseJsonMessage(message: unknown): unknown {
  if (typeof message !== 'string') {
    return message;
  }

  try {
    return JSON.parse(message);
  } catch {
    return null;
  }
}

export function normalizeQrSyncMessage(
  message: unknown,
): QrSyncMessage<unknown> | null {
  const normalizedMessage = parseJsonMessage(message);

  if (
    !normalizedMessage ||
    typeof normalizedMessage !== 'object' ||
    !('type' in normalizedMessage) ||
    typeof normalizedMessage.type !== 'string'
  ) {
    return null;
  }

  return normalizedMessage as QrSyncMessage<unknown>;
}

export function isQrSyncOffer(value: unknown): value is QrSyncOffer {
  if (!value || typeof value !== 'object') {
    return false;
  }

  return (
    'sessionId' in value &&
    typeof (value as QrSyncOffer).sessionId === 'string' &&
    'isOnboardingCompleted' in value &&
    typeof (value as QrSyncOffer).isOnboardingCompleted === 'boolean'
  );
}

export function canAcceptSyncOffer({
  hasDappClient,
  connectionStatus,
  phase,
}: {
  hasDappClient: boolean;
  connectionStatus: QrSyncConnectionStatusType;
  phase: QrSyncPhase;
}): boolean {
  return (
    hasDappClient &&
    connectionStatus === QrSyncConnectionStatus.CONNECTED &&
    phase === QR_SYNC_PHASES.AWAITING_SYNC_OFFER
  );
}

export function assertQrSyncPhase(
  currentPhase: QrSyncPhase,
  expectedPhases: QrSyncPhase[],
): void {
  if (!expectedPhases.includes(currentPhase)) {
    throw new Error(
      `QrSyncController action invalid in phase "${currentPhase}". Expected one of: ${expectedPhases.join(
        ', ',
      )}`,
    );
  }
}

export function getSyncCompletionTimeoutMs(
  deadline: number,
  fallbackTimeoutMs: number = QR_SYNC_TIMEOUT_MS.SYNC_COMPLETION_TIMEOUT,
): number {
  return Math.max(deadline - Date.now(), 0) || fallbackTimeoutMs;
}

export function getSyncOfferFailureError(error: unknown): QrSyncError {
  const message =
    error instanceof Error
      ? error.message
      : QrSyncErrorMessages.SYNC_OFFER_FAILED;

  return {
    code:
      message === QrSyncErrorMessages.SYNC_OFFER_TIMED_OUT
        ? QrSyncErrorCodes.SESSION_EXPIRED
        : QrSyncErrorCodes.SYNC_FAILED,
    message,
  };
}

export function getSyncCompletionFailureError(error: unknown): QrSyncError {
  const message =
    error instanceof Error
      ? error.message
      : QrSyncErrorMessages.SYNC_COMPLETION_FAILED;

  return {
    code:
      message === QrSyncErrorMessages.SYNC_COMPLETION_TIMED_OUT
        ? QrSyncErrorCodes.SESSION_EXPIRED
        : QrSyncErrorCodes.SYNC_FAILED,
    message,
  };
}
