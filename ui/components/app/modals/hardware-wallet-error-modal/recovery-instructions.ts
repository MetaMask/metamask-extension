import type { HardwareWalletError } from '../../../../contexts/hardware-wallets/errors';
import { ErrorCode } from '../../../../contexts/hardware-wallets/errors';

type I18nFunction = (key: string, ...args: unknown[]) => string;

/**
 * Get recovery instructions based on error code
 *
 * @param error - The hardware wallet error object
 * @param t - The internationalization function
 * @returns Array of recovery instruction strings
 */
export function getRecoveryInstructions(
  error: HardwareWalletError,
  t: I18nFunction,
): string[] {
  switch (error.code) {
    case ErrorCode.AUTH_LOCK_001:
    case ErrorCode.AUTH_LOCK_002:
      return [
        t('hardwareWalletErrorRecoveryUnlock1'),
        t('hardwareWalletErrorRecoveryUnlock2'),
        t('hardwareWalletErrorRecoveryUnlock3'),
      ];
    case ErrorCode.DEVICE_STATE_001:
      return [
        t('hardwareWalletErrorRecoveryApp1'),
        t('hardwareWalletErrorRecoveryApp2'),
        t('hardwareWalletErrorRecoveryApp3'),
      ];
    case ErrorCode.CONN_TRANSPORT_001:
      return [
        t('hardwareWalletErrorRecoveryWebHID1'),
        t('hardwareWalletErrorRecoveryWebHID2'),
      ];
    case ErrorCode.CONFIG_PERM_001:
      return [
        t('hardwareWalletErrorRecoveryPermission1'),
        t('hardwareWalletErrorRecoveryPermission2'),
        t('hardwareWalletErrorRecoveryPermission3'),
      ];
    case ErrorCode.DEVICE_STATE_003:
    case ErrorCode.CONN_CLOSED_001:
      return [
        t('hardwareWalletErrorRecoveryConnection1'),
        t('hardwareWalletErrorRecoveryConnection2'),
        t('hardwareWalletErrorRecoveryConnection3'),
      ];
    case ErrorCode.CONN_TIMEOUT_001:
      return [
        t('hardwareWalletErrorRecoveryTimeout1'),
        t('hardwareWalletErrorRecoveryTimeout2'),
      ];
    case ErrorCode.USER_CANCEL_001:
    case ErrorCode.USER_CANCEL_002:
      return [t('hardwareWalletErrorRecoveryUserCancel')];
    default:
      return [
        t('hardwareWalletErrorRecoveryDefault1'),
        t('hardwareWalletErrorRecoveryDefault2'),
      ];
  }
}

