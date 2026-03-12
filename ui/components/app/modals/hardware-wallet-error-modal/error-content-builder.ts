import { ErrorCode } from '@metamask/hw-wallet-sdk';
import { IconName } from '../../../component-library';
import { HardwareWalletType } from '../../../../contexts/hardware-wallets/types';
import { IconColor } from '../../../../helpers/constants/design-system';
import { getHardwareWalletErrorCode } from '../../../../contexts/hardware-wallets';

/**
 * Error content structure
 */
type ErrorContentBase = {
  title: string;
};

type ErrorContentWithRecovery = ErrorContentBase & {
  variant: 'recovery';
  recoveryInstructions: string[];
};

type ErrorContentWithIcon = ErrorContentWithRecovery & {
  icon: IconName;
  iconColor: IconColor;
};

type ErrorContentWithoutIcon = ErrorContentWithRecovery & {
  icon?: undefined;
  iconColor?: undefined;
};

type ErrorContentWithDescription = ErrorContentBase & {
  variant: 'description';
  description: string;
  icon: IconName;
  iconColor: IconColor;
};

export type ErrorContent =
  | ErrorContentWithIcon
  | ErrorContentWithoutIcon
  | ErrorContentWithDescription;

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
  const errorCode = getHardwareWalletErrorCode(error);
  const unknownErrorContent: ErrorContent = {
    variant: 'description',
    icon: IconName.Danger,
    iconColor: IconColor.warningDefault,
    title: t('hardwareWalletErrorUnknownErrorTitle'),
    description: t('hardwareWalletErrorUnknownErrorDescription', [
      t(walletType),
    ]),
  };
  const errorMessage =
    typeof error === 'object' &&
    error !== null &&
    'message' in error &&
    typeof error.message === 'string'
      ? error.message
      : undefined;

  switch (errorCode) {
    // Locked device errors
    case ErrorCode.AuthenticationDeviceLocked:
      if (walletType === HardwareWalletType.Trezor) {
        return {
          variant: 'recovery',
          icon: IconName.Lock,
          iconColor: IconColor.iconDefault,
          title: t('hardwareWalletErrorTitleDeviceLocked', [t(walletType)]),
          recoveryInstructions: [
            t('hardwareWalletErrorTrezorUnlockInstruction1'),
            t('hardwareWalletErrorTrezorUnlockInstruction2'),
          ],
        };
      }

      return {
        variant: 'recovery',
        icon: IconName.Lock,
        iconColor: IconColor.iconDefault,
        title: t('hardwareWalletErrorTitleDeviceLocked', [t(walletType)]),
        recoveryInstructions: [
          t('hardwareWalletErrorRecoveryUnlock1'),
          t('hardwareWalletErrorRecoveryUnlock2'),
        ],
      };

    // Device state - Wrong app
    case ErrorCode.DeviceStateEthAppClosed:
      return {
        variant: 'recovery',
        title: t('hardwareWalletTitleEthAppNotOpen'),
        recoveryInstructions: [t('hardwareWalletEthAppNotOpenDescription')],
      };

    case ErrorCode.DeviceNotReady:
      if (walletType === HardwareWalletType.Trezor) {
        return {
          variant: 'recovery',
          title: t('hardwareWalletErrorTrezorNotInitializedTitle'),
          recoveryInstructions: [
            t('hardwareWalletErrorTrezorNotInitializedInstruction1'),
            t('hardwareWalletErrorTrezorNotInitializedInstruction2'),
          ],
        };
      }
      return unknownErrorContent;

    case ErrorCode.DeviceStateBlindSignNotSupported:
      return {
        variant: 'recovery',
        title: t('hardwareWalletErrorTitleBlindSignNotSupported'),
        recoveryInstructions: [
          t('hardwareWalletErrorTitleBlindSignNotSupportedInstruction1'),
          t('hardwareWalletErrorTitleBlindSignNotSupportedInstruction2'),
        ],
      };

    // Device state - Disconnected/Connection issues
    case ErrorCode.DeviceDisconnected:
      return {
        variant: 'recovery',
        title: t('hardwareWalletErrorTitleConnectYourDevice', [t(walletType)]),
        recoveryInstructions: [
          t('hardwareWalletErrorRecoveryConnection1'),
          t('hardwareWalletErrorRecoveryConnection2'),
          t('hardwareWalletErrorRecoveryConnection3'),
        ],
      };

    // Usually bolos will yield this result
    case ErrorCode.ConnectionClosed: {
      // No default case, allow it to fall through to unknown error
      switch (walletType) {
        case HardwareWalletType.Trezor:
          return {
            variant: 'recovery',
            title: t('hardwareWalletErrorTrezorPopupClosedTitle', [
              t(walletType),
            ]),
            recoveryInstructions: [
              t('hardwareWalletErrorTrezorPopupClosedDescription'),
            ],
          };
        case HardwareWalletType.Ledger:
          return {
            variant: 'recovery',
            title: t('hardwareWalletErrorTitleConnectYourDevice', [
              t(walletType),
            ]),
            recoveryInstructions: [
              t('hardwareWalletErrorRecoveryUnlock1'),
              t('hardwareWalletErrorRecoveryUnlock2'),
            ],
          };
      }
    }

    case ErrorCode.DeviceMissingCapability:
      if (walletType === HardwareWalletType.Trezor) {
        return {
          variant: 'description',
          icon: IconName.Danger,
          iconColor: IconColor.warningDefault,
          title: t('hardwareWalletErrorTrezorMessageTooLargeTitle'),
          description:
            errorMessage ??
            t('hardwareWalletErrorTrezorMessageTooLargeDescription'),
        };
      }
      return unknownErrorContent;

    // Unknown/default
    default:
      return unknownErrorContent;
  }
}
