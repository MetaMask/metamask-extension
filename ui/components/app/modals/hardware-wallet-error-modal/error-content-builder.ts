import { ErrorCode } from '@metamask/hw-wallet-sdk';
import { IconName } from '../../../component-library';
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
 * Extract error code from a hardware wallet error.
 * Handles both direct error.code and RPC error format (error.data.code).
 *
 * @param error - The error object
 * @returns The error code or undefined
 */
function getErrorCode(error: unknown): ErrorCode | undefined {
  // Direct code property (HardwareWalletError instances and duck-typed errors)
  const directCode = (error as { code?: number })?.code;
  if (typeof directCode === 'number') {
    return directCode as ErrorCode;
  }

  // RPC error format (from rpcErrors.internal())
  const rpcCode = (error as { data?: { code?: number } })?.data?.code;
  if (typeof rpcCode === 'number') {
    return rpcCode as ErrorCode;
  }

  return undefined;
}

/**
 * Build error content based on error code
 *
 * @param error - The hardware wallet error object
 * @param walletType - The type of hardware wallet
 * @param t - The translation function
 * @returns The formatted error content with icon, title, description, and recovery instructions
 */
export function buildErrorContent(
  error: unknown,
  walletType: HardwareWalletType,
  t: (key: string, substitutions?: string[]) => string,
): ErrorContent {
  const errorCode = getErrorCode(error);

  switch (errorCode) {
    // Locked device errors
    case ErrorCode.AuthenticationDeviceLocked:
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
    case ErrorCode.DeviceStateEthAppClosed:
      return {
        icon: IconName.Apps,
        title: t('hardwareWalletErrorTitleConnectYourDevice', [t(walletType)]),
        recoveryInstructions: [
          t('hardwareWalletErrorRecoveryApp1'),
          t('hardwareWalletErrorRecoveryApp2'),
          t('hardwareWalletErrorRecoveryApp3'),
        ],
      };

    case ErrorCode.DeviceStateBlindSignNotSupported:
      return {
        icon: IconName.Plug,
        title: t('hardwareWalletErrorTitleConnectYourDevice', [t(walletType)]),
        recoveryInstructions: [
          t('hardwareWalletErrorRecoveryConnection1'),
          t('hardwareWalletErrorRecoveryConnection2'),
          t('hardwareWalletErrorRecoveryConnection3'),
        ],
      };
    case ErrorCode.DeviceStateOnlyV4Supported:
      return {
        icon: IconName.Plug,
        title: t('hardwareWalletErrorTitleConnectYourDevice', [t(walletType)]),
        recoveryInstructions: [
          t('hardwareWalletErrorRecoveryConnection1'),
          t('hardwareWalletErrorRecoveryConnection2'),
          t('hardwareWalletErrorRecoveryConnection3'),
        ],
      };

    case ErrorCode.DeviceStateEthAppOutOfDate:
      return {
        icon: IconName.Plug,
        title: t('hardwareWalletErrorTitleConnectYourDevice', [t(walletType)]),
        recoveryInstructions: [
          t('hardwareWalletErrorRecoveryConnection1'),
          t('hardwareWalletErrorRecoveryConnection2'),
          t('hardwareWalletErrorRecoveryConnection3'),
        ],
      };

    // Device state - Disconnected/Connection issues
    case ErrorCode.DeviceDisconnected:
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
    case ErrorCode.ConnectionTransportMissing:
      return {
        icon: IconName.Danger,
        title: t('hardwareWalletErrorTitle'),
        recoveryInstructions: [
          t('hardwareWalletErrorRecoveryWebHID1'),
          t('hardwareWalletErrorRecoveryWebHID2'),
        ],
      };

    case ErrorCode.ConnectionClosed:
      return {
        icon: IconName.Close,
        title: t('hardwareWalletErrorRecoveryConnectionTitle'),
        recoveryInstructions: [
          t('hardwareWalletErrorRecoveryConnection1'),
          t('hardwareWalletErrorRecoveryConnection2'),
          t('hardwareWalletErrorRecoveryConnection3'),
        ],
      };

    case ErrorCode.ConnectionTimeout:
      return {
        icon: IconName.Clock,
        title: t('hardwareWalletErrorTitle'),
        recoveryInstructions: [
          t('hardwareWalletErrorRecoveryTimeout1'),
          t('hardwareWalletErrorRecoveryTimeout2'),
        ],
      };

    case ErrorCode.UserCancelled:
    case ErrorCode.UserRejected:
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
