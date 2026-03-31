/* eslint-disable @typescript-eslint/naming-convention, camelcase -- Segment event properties use snake_case */
import { ErrorCode, HardwareWalletError } from '@metamask/hw-wallet-sdk';
import { Json } from '@metamask/utils';
import {
  MetaMetricsHardwareWalletDeviceType,
  MetaMetricsHardwareWalletRecoveryErrorType,
  MetaMetricsHardwareWalletRecoveryLocation,
} from '../constants/metametrics';

const UNKNOWN_DEVICE_MODEL = 'N/A';
const MAX_ERROR_MESSAGE_LENGTH = 500;

/**
 * Canonical Segment `properties` keys produced by {@link buildHardwareWalletRecoverySegmentProperties}.
 * Must stay aligned with `segment-schema`:
 * `libraries/properties/metamask-hardware-wallet-globals.yaml` and
 * `libraries/properties/metamask-hardware-wallet-recovery-globals.yaml`.
 */
export const HARDWARE_WALLET_RECOVERY_SEGMENT_PAYLOAD_KEYS = [
  'device_model',
  'device_type',
  'error_code',
  'error_message',
  'error_type',
  'error_type_view_count',
  'location',
] as const;

/**
 * UI / keyring wallet keys (see {@link HardwareWalletType}) that have a defined Segment `device_type`.
 * Values are {@link MetaMetricsHardwareWalletDeviceType} — Segment uses different strings than our keys
 * (e.g. `qr` → `QR Hardware`), so a lookup table is required; we cannot use the UI enum value alone as the payload.
 */
const HARDWARE_WALLET_TYPE_KEY_TO_SEGMENT_DEVICE_TYPE = {
  ledger: MetaMetricsHardwareWalletDeviceType.Ledger,
  trezor: MetaMetricsHardwareWalletDeviceType.Trezor,
  qr: MetaMetricsHardwareWalletDeviceType.QrHardware,
  lattice: MetaMetricsHardwareWalletDeviceType.Lattice,
} as const satisfies Record<string, MetaMetricsHardwareWalletDeviceType>;

type MappableHardwareWalletTypeKey =
  keyof typeof HARDWARE_WALLET_TYPE_KEY_TO_SEGMENT_DEVICE_TYPE;

/**
 * Arguments for {@link buildHardwareWalletRecoverySegmentProperties} (camelCase for TS/ESLint).
 * These map to Segment snake_case keys — they are **not** the wire property names.
 */
type RecoverySegmentPropertyArgs = {
  /** Segment key: `location` */
  location: MetaMetricsHardwareWalletRecoveryLocation;
  /** Segment key: `device_type` */
  deviceType: MetaMetricsHardwareWalletDeviceType;
  /** Segment key: `device_model` */
  deviceModel: string;
  /** Segment key: `error_type` */
  errorType: MetaMetricsHardwareWalletRecoveryErrorType;
  /** Segment key: `error_type_view_count` */
  errorTypeViewCount: number;
  /** Used to derive Segment keys `error_code` and `error_message` */
  error: unknown;
};

/**
 * Builds `trackEvent` `properties` for hardware wallet recovery events.
 *
 * Composes `metamask-hardware-wallet-globals` + `metamask-hardware-wallet-recovery-globals`
 * (and satisfies `metamask-hardware-wallet-recovery-error-globals` when that library is on the event).
 *
 * @param args - Recovery context; camelCase fields are mapped to Segment snake_case keys.
 * @returns Object whose keys match Segment (`device_type`, not `deviceType`).
 */
export function buildHardwareWalletRecoverySegmentProperties(
  args: RecoverySegmentPropertyArgs,
): Record<string, Json> {
  const { error_code, error_message } =
    extractHardwareWalletRecoveryErrorCodeAndMessage(args.error);
  return {
    location: args.location,
    device_type: args.deviceType,
    device_model: args.deviceModel,
    error_type: args.errorType,
    error_type_view_count: args.errorTypeViewCount,
    error_code,
    error_message,
  };
}

/**
 * Resolves a numeric hardware wallet error code when available.
 *
 * @param error - Unknown error shape from RPC or UI.
 * @returns The {@link ErrorCode} when recognized, otherwise null.
 */
function resolveHardwareWalletErrorCode(error: unknown): ErrorCode | null {
  if (error instanceof HardwareWalletError) {
    return error.code;
  }

  if (
    error &&
    typeof error === 'object' &&
    'code' in error &&
    typeof (error as { code: unknown }).code === 'number'
  ) {
    return (error as { code: ErrorCode }).code;
  }

  return null;
}

/**
 * Reads a human-readable message from an unknown error value.
 *
 * @param error - Any thrown value or RPC error object.
 * @returns Message string, or empty string if none.
 */
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (
    error &&
    typeof error === 'object' &&
    'message' in error &&
    typeof (error as { message: unknown }).message === 'string'
  ) {
    return (error as { message: string }).message;
  }
  return '';
}

/**
 * Normalizes whitespace and caps length for Segment `error_message`.
 *
 * @param message - Raw error text.
 * @returns Sanitized message safe to send in analytics.
 */
function sanitizeErrorMessage(message: string): string {
  const trimmed = message.replace(/\s+/gu, ' ').trim();
  if (trimmed.length <= MAX_ERROR_MESSAGE_LENGTH) {
    return trimmed;
  }
  return `${trimmed.slice(0, MAX_ERROR_MESSAGE_LENGTH)}…`;
}

/**
 * Maps an {@link ErrorCode} numeric value to its enum name string for Segment `error_code`.
 *
 * @param code - Hardware wallet SDK error code.
 * @returns String label (e.g. `DeviceDisconnected`).
 */
function errorCodeToLabel(code: ErrorCode): string {
  return ErrorCode[code];
}

/**
 * Builds Segment `error_code` and `error_message` from an error (or empty strings when absent).
 *
 * @param error - Underlying error.
 * @returns Object with snake_case keys matching the Segment recovery-error library.
 */
export function extractHardwareWalletRecoveryErrorCodeAndMessage(
  error: unknown,
): { error_code: string; error_message: string } {
  if (error instanceof HardwareWalletError) {
    return {
      error_code: errorCodeToLabel(error.code),
      error_message: sanitizeErrorMessage(
        error.userMessage || error.message || '',
      ),
    };
  }

  const code = resolveHardwareWalletErrorCode(error);
  const message = getErrorMessage(error);
  if (code !== null) {
    return {
      error_code: errorCodeToLabel(code),
      error_message: sanitizeErrorMessage(message),
    };
  }

  return {
    error_code: '',
    error_message: sanitizeErrorMessage(message || String(error)),
  };
}

/**
 * Maps internal wallet type keys to Segment `device_type` enum values.
 *
 * Segment schema only defines Ledger, Trezor, QR Hardware, and Lattice.
 * Unknown/unmapped wallet types are intentionally not tracked.
 *
 * @param walletType - Hardware wallet type key from UI/hardware contexts.
 * @returns Corresponding {@link MetaMetricsHardwareWalletDeviceType}, or null when unmapped.
 */
export function mapHardwareWalletTypeToMetricDeviceType(
  walletType?: string | null,
): MetaMetricsHardwareWalletDeviceType | null {
  if (
    walletType === null ||
    walletType === undefined ||
    walletType === 'unknown'
  ) {
    return null;
  }

  return Object.hasOwn(
    HARDWARE_WALLET_TYPE_KEY_TO_SEGMENT_DEVICE_TYPE,
    walletType,
  )
    ? HARDWARE_WALLET_TYPE_KEY_TO_SEGMENT_DEVICE_TYPE[
        walletType as MappableHardwareWalletTypeKey
      ]
    : null;
}

/**
 * Best-effort device model for analytics (matches Hardware Wallet Account Connected usage).
 *
 * @param error - Hardware wallet error that may carry metadata.
 * @returns Model name or {@link UNKNOWN_DEVICE_MODEL}.
 */
export function getHardwareWalletMetricDeviceModel(error: unknown): string {
  if (!(error instanceof HardwareWalletError)) {
    return UNKNOWN_DEVICE_MODEL;
  }

  const meta = error.metadata as
    | { deviceModel?: string; device_model?: string; model?: string }
    | undefined;
  if (!meta) {
    return UNKNOWN_DEVICE_MODEL;
  }

  return (
    meta.deviceModel ?? meta.device_model ?? meta.model ?? UNKNOWN_DEVICE_MODEL
  );
}

/**
 * Normalizes a hardware wallet error into the Segment `error_type` enum.
 *
 * @param error - Error shown in the recovery modal or connection failure.
 * @returns value for analytics.
 */
export function mapHardwareWalletRecoveryErrorType(
  error: unknown,
): MetaMetricsHardwareWalletRecoveryErrorType {
  const code = resolveHardwareWalletErrorCode(error);

  if (code === null) {
    return MetaMetricsHardwareWalletRecoveryErrorType.GenericError;
  }

  switch (code) {
    case ErrorCode.AuthenticationDeviceLocked:
    case ErrorCode.AuthenticationDeviceBlocked:
      return MetaMetricsHardwareWalletRecoveryErrorType.DeviceLocked;
    case ErrorCode.DeviceDisconnected:
    case ErrorCode.ConnectionClosed:
    case ErrorCode.ConnectionTimeout:
    case ErrorCode.ConnectionTransportMissing:
      return MetaMetricsHardwareWalletRecoveryErrorType.DeviceDisconnected;
    case ErrorCode.DeviceStateEthAppClosed:
      return MetaMetricsHardwareWalletRecoveryErrorType.EthereumAppNotOpened;
    case ErrorCode.DeviceStateBlindSignNotSupported:
      return MetaMetricsHardwareWalletRecoveryErrorType.BlindSigningNotEnabled;
    default:
      return MetaMetricsHardwareWalletRecoveryErrorType.GenericError;
  }
}
