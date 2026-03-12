import { ErrorCode } from '@metamask/hw-wallet-sdk';
import { IconName } from '../../../component-library';
import { HardwareWalletType } from '../../../../contexts/hardware-wallets/types';
import { IconColor } from '../../../../helpers/constants/design-system';
import { getHardwareWalletErrorCode } from '../../../../contexts/hardware-wallets';
import { getBrowserName } from '../../../../../shared/lib/browser-runtime.utils';
import {
  PLATFORM_BRAVE,
  PLATFORM_FIREFOX,
  PLATFORM_EDGE,
} from '../../../../../shared/constants/app';

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

  // QR wallet: camera permission denied (camera = transport for QR wallets).
  // Handled before the switch so non-QR ConnectionTransportMissing falls
  // through to the default case.
  if (
    errorCode === ErrorCode.ConnectionTransportMissing &&
    walletType === HardwareWalletType.Qr
  ) {
    const browser = getBrowserName();
    let browserInstruction: string;
    if (browser === PLATFORM_BRAVE) {
      browserInstruction = t('qrHardwareCameraPermissionInstructionsBrave');
    } else if (browser === PLATFORM_FIREFOX) {
      browserInstruction = t(
        'qrHardwareCameraPermissionInstructionsFirefox',
      );
    } else if (browser === PLATFORM_EDGE) {
      browserInstruction = t('qrHardwareCameraPermissionInstructionsEdge');
    } else {
      browserInstruction = t(
        'qrHardwareCameraPermissionInstructionsChrome',
      );
    }
    return {
      variant: 'recovery',
      icon: IconName.Camera,
      iconColor: IconColor.iconDefault,
      title: t('qrHardwareCameraPermissionBlockedTitle'),
      recoveryInstructions: [
        t('qrHardwareCameraPermissionBlockedDescription'),
        browserInstruction,
        t('qrHardwareCameraPermissionAutoRecover'),
      ],
    };
  }

  switch (errorCode) {
    // Locked device errors
    case ErrorCode.AuthenticationDeviceLocked:
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
        title: t('hardwareWalletErrorTitleConnectYourDevice', [t(walletType)]),
        recoveryInstructions: [t('hardwareWalletEthAppNotOpenDescription')],
      };

    case ErrorCode.DeviceStateBlindSignNotSupported:
      return {
        variant: 'recovery',
        title: t('hardwareWalletErrorTitleConnectYourDevice', [t(walletType)]),
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
    case ErrorCode.ConnectionClosed:
      return {
        variant: 'recovery',
        title: t('hardwareWalletErrorTitleConnectYourDevice', [t(walletType)]),
        recoveryInstructions: [
          t('hardwareWalletErrorRecoveryUnlock1'),
          t('hardwareWalletErrorRecoveryUnlock2'),
        ],
      };

    // Unknown/default
    default:
      return {
        variant: 'description',
        icon: IconName.Danger,
        iconColor: IconColor.warningDefault,
        title: t('hardwareWalletErrorUnknownErrorTitle'),
        description: t('hardwareWalletErrorUnknownErrorDescription', [
          t(walletType),
        ]),
      };
  }
}
