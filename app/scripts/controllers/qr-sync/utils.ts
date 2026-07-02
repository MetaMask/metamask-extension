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
  QrSyncMessage,
  QrSyncOffer,
} from './types';

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
