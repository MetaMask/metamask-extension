/* eslint-disable @typescript-eslint/naming-convention, camelcase -- Segment analytics payload keys use snake_case */
import { ErrorCode, HardwareWalletError } from '@metamask/hw-wallet-sdk';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  MetaMetricsHardwareWalletDeviceType,
  MetaMetricsHardwareWalletRecoveryErrorType,
  MetaMetricsHardwareWalletRecoveryLocation,
} from '../../../../shared/constants/metametrics';
import { HARDWARE_WALLET_RECOVERY_SEGMENT_PAYLOAD_KEYS } from '../../../../shared/lib/hardware-wallet-recovery-metrics';
import { CameraReadyState } from './base-reader.types';
import {
  cameraReadyStateToErrorCode,
  createQrCameraSyntheticError,
  buildQrCameraRecoveryTrackEventArgs,
} from './base-reader-utils';

describe('base-reader-utils', () => {
  describe('cameraReadyStateToErrorCode', () => {
    it('maps CameraAccessBlocked to PermissionCameraDenied', () => {
      expect(
        cameraReadyStateToErrorCode(CameraReadyState.CameraAccessBlocked),
      ).toBe(ErrorCode.PermissionCameraDenied);
    });

    it('maps CameraAccessNeeded to PermissionCameraPromptDismissed', () => {
      expect(
        cameraReadyStateToErrorCode(CameraReadyState.CameraAccessNeeded),
      ).toBe(ErrorCode.PermissionCameraPromptDismissed);
    });

    it('returns null for AccessingCamera', () => {
      expect(
        cameraReadyStateToErrorCode(CameraReadyState.AccessingCamera),
      ).toBeNull();
    });

    it('returns null for Ready', () => {
      expect(cameraReadyStateToErrorCode(CameraReadyState.Ready)).toBeNull();
    });
  });

  describe('createQrCameraSyntheticError', () => {
    it('returns a HardwareWalletError with the given error code', () => {
      const error = createQrCameraSyntheticError(
        ErrorCode.PermissionCameraDenied,
      );
      expect(error).toBeInstanceOf(HardwareWalletError);
      expect(error.code).toBe(ErrorCode.PermissionCameraDenied);
    });

    it('attaches QR wallet type in metadata', () => {
      const error = createQrCameraSyntheticError(
        ErrorCode.PermissionCameraPromptDismissed,
      );
      expect((error.metadata as { walletType?: string })?.walletType).toBe(
        'qr',
      );
    });
  });

  describe('buildQrCameraRecoveryTrackEventArgs', () => {
    it('returns correct category and event name', () => {
      const args = buildQrCameraRecoveryTrackEventArgs(
        MetaMetricsEventName.HardwareWalletRecoveryModalViewed,
        ErrorCode.PermissionCameraDenied,
        1,
      );
      expect(args.category).toBe(MetaMetricsEventCategory.Accounts);
      expect(args.event).toBe(
        MetaMetricsEventName.HardwareWalletRecoveryModalViewed,
      );
    });

    it('sets QR-specific constants in properties', () => {
      const { properties } = buildQrCameraRecoveryTrackEventArgs(
        MetaMetricsEventName.HardwareWalletRecoveryModalViewed,
        ErrorCode.PermissionCameraDenied,
        1,
      );
      expect(properties.device_type).toBe(
        MetaMetricsHardwareWalletDeviceType.QrHardware,
      );
      expect(properties.device_model).toBe('N/A');
      expect(properties.location).toBe(
        MetaMetricsHardwareWalletRecoveryLocation.Connection,
      );
    });

    it('derives CameraPermissionDenied error_type for PermissionCameraDenied', () => {
      const { properties } = buildQrCameraRecoveryTrackEventArgs(
        MetaMetricsEventName.HardwareWalletRecoveryModalViewed,
        ErrorCode.PermissionCameraDenied,
        1,
      );
      expect(properties.error_type).toBe(
        MetaMetricsHardwareWalletRecoveryErrorType.CameraPermissionDenied,
      );
      expect(properties.error_code).toBe('PermissionCameraDenied');
    });

    it('derives CameraPermissionPromptDismissed error_type for PermissionCameraPromptDismissed', () => {
      const { properties } = buildQrCameraRecoveryTrackEventArgs(
        MetaMetricsEventName.HardwareWalletRecoveryCtaClicked,
        ErrorCode.PermissionCameraPromptDismissed,
        3,
      );
      expect(properties.error_type).toBe(
        MetaMetricsHardwareWalletRecoveryErrorType.CameraPermissionPromptDismissed,
      );
      expect(properties.error_code).toBe('PermissionCameraPromptDismissed');
    });

    it('passes through the error_type_view_count', () => {
      const { properties } = buildQrCameraRecoveryTrackEventArgs(
        MetaMetricsEventName.HardwareWalletRecoveryModalViewed,
        ErrorCode.PermissionCameraDenied,
        5,
      );
      expect(properties.error_type_view_count).toBe(5);
    });

    it('produces only the canonical Segment payload keys', () => {
      const { properties } = buildQrCameraRecoveryTrackEventArgs(
        MetaMetricsEventName.HardwareWalletRecoverySuccessModalViewed,
        ErrorCode.PermissionCameraDenied,
        1,
      );
      expect(Object.keys(properties).sort()).toStrictEqual(
        [...HARDWARE_WALLET_RECOVERY_SEGMENT_PAYLOAD_KEYS].sort(),
      );
    });

    it('works with different event names', () => {
      const ctaArgs = buildQrCameraRecoveryTrackEventArgs(
        MetaMetricsEventName.HardwareWalletRecoveryCtaClicked,
        ErrorCode.PermissionCameraDenied,
        2,
      );
      expect(ctaArgs.event).toBe(
        MetaMetricsEventName.HardwareWalletRecoveryCtaClicked,
      );

      const successArgs = buildQrCameraRecoveryTrackEventArgs(
        MetaMetricsEventName.HardwareWalletRecoverySuccessModalViewed,
        ErrorCode.PermissionCameraPromptDismissed,
        1,
      );
      expect(successArgs.event).toBe(
        MetaMetricsEventName.HardwareWalletRecoverySuccessModalViewed,
      );
    });
  });
});
