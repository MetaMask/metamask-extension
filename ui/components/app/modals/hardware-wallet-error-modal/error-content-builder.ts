import { IconName } from '../../../component-library';
import { ErrorCode } from '../../../../contexts/hardware-wallets/errors';
import type { HardwareWalletError } from '../../../../contexts/hardware-wallets/errors';
import { HardwareWalletType } from '../../../../contexts/hardware-wallets/types';

/**
 * Error content structure
 */
export type ErrorContent = {
  icon: IconName;
  title: string;
  description?: string;
  recoveryInstructions: string[];
};

/**
 * Build error content based on error code
 *
 * @param error - The hardware wallet error object
 * @param walletType - The type of hardware wallet
 * @param t - The translation function
 * @returns The formatted error content with icon, title, description, and recovery instructions
 */
export function buildErrorContent(
  error: HardwareWalletError,
  walletType: HardwareWalletType,
  t: (key: string, substitutions?: string[]) => string,
): ErrorContent {
  switch (error.code) {
    // Locked device errors
    case ErrorCode.AUTH_LOCK_001:
    case ErrorCode.AUTH_LOCK_002:
      return {
        icon: IconName.Lock,
        title: t('hardwareWalletErrorTitleDeviceLocked', [t(walletType)]),
        description: t('hardwareWalletErrorDescriptionDeviceLocked'),
        recoveryInstructions: [
          t('hardwareWalletErrorRecoveryUnlock1'),
          t('hardwareWalletErrorRecoveryUnlock2'),
          t('hardwareWalletErrorRecoveryUnlock3'),
        ],
      };

    // Device state - Wrong app
    case ErrorCode.DEVICE_STATE_001:
      return {
        icon: IconName.Apps,
        title: t('hardwareWalletErrorTitleConnectYourDevice', [t(walletType)]),
        recoveryInstructions: [
          t('hardwareWalletErrorRecoveryApp1'),
          t('hardwareWalletErrorRecoveryApp2'),
          t('hardwareWalletErrorRecoveryApp3'),
        ],
      };

    // Device state - Disconnected/Connection issues
    case ErrorCode.DEVICE_STATE_002:
      return {
        icon: IconName.Plug,
        title: t('hardwareWalletErrorTitleConnectYourDevice', [t(walletType)]),
        recoveryInstructions: [
          t('hardwareWalletErrorRecoveryConnection1'),
          t('hardwareWalletErrorRecoveryConnection2'),
          t('hardwareWalletErrorRecoveryConnection3'),
        ],
      };
    case ErrorCode.DEVICE_STATE_003:
    case ErrorCode.DEVICE_STATE_004:
    case ErrorCode.DEVICE_STATE_005:
      return {
        icon: IconName.Plug,
        title: t('hardwareWalletErrorTitleConnectYourDevice', [t(walletType)]),
        recoveryInstructions: [
          t('hardwareWalletErrorRecoveryConnection1'),
          t('hardwareWalletErrorRecoveryConnection2'),
          t('hardwareWalletErrorRecoveryConnection3'),
        ],
      };

    // WebHID transport error
    case ErrorCode.CONN_TRANSPORT_001:
      return {
        icon: IconName.Danger,
        title: t('hardwareWalletErrorTitle'),
        recoveryInstructions: [
          t('hardwareWalletErrorRecoveryWebHID1'),
          t('hardwareWalletErrorRecoveryWebHID2'),
        ],
      };

    // Permission denied
    case ErrorCode.CONFIG_PERM_001:
      return {
        icon: IconName.SecurityKey,
        title: t('hardwareWalletErrorRecoveryPermissionTitle'),
        recoveryInstructions: [
          t('hardwareWalletErrorRecoveryPermission1'),
          t('hardwareWalletErrorRecoveryPermission2'),
          t('hardwareWalletErrorRecoveryPermission3'),
        ],
      };

    // Connection closed
    case ErrorCode.CONN_CLOSED_001:
      return {
        icon: IconName.Close,
        title: t('hardwareWalletErrorRecoveryConnectionTitle'),
        recoveryInstructions: [
          t('hardwareWalletErrorRecoveryConnection1'),
          t('hardwareWalletErrorRecoveryConnection2'),
          t('hardwareWalletErrorRecoveryConnection3'),
        ],
      };

    // Timeout
    case ErrorCode.CONN_TIMEOUT_001:
      return {
        icon: IconName.Clock,
        title: t('hardwareWalletErrorTitle'),
        recoveryInstructions: [
          t('hardwareWalletErrorRecoveryTimeout1'),
          t('hardwareWalletErrorRecoveryTimeout2'),
        ],
      };

    // User cancelled
    case ErrorCode.USER_CANCEL_001:
    case ErrorCode.USER_CANCEL_002:
      return {
        icon: IconName.Close,
        title: t('hardwareWalletErrorTitle'),
        recoveryInstructions: [t('hardwareWalletErrorRecoveryUserCancel')],
      };

    // Unknown/default
    default:
      return {
        icon: IconName.Danger,
        title: t('hardwareWalletErrorTitle'),
        recoveryInstructions: [
          t('hardwareWalletErrorRecoveryDefault1'),
          t('hardwareWalletErrorRecoveryDefault2'),
        ],
      };
  }
}
