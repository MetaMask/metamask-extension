/* eslint-disable @typescript-eslint/naming-convention, camelcase -- Segment analytics payload keys use snake_case */
import { ErrorCode, HardwareWalletError } from '@metamask/hw-wallet-sdk';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventName,
  MetaMetricsHardwareWalletDeviceType,
  MetaMetricsHardwareWalletRecoveryErrorType,
  MetaMetricsHardwareWalletRecoveryLocation,
} from '../../../../../shared/constants/metametrics';
import { HARDWARE_WALLET_RECOVERY_SEGMENT_PAYLOAD_KEYS } from '../../../../../shared/lib/hardware-wallet-recovery-metrics';
import { QrErrorFlowContext } from '../qr-error-content';
import {
  ScanErrorCategory,
  type ScanErrorClassification,
} from '../qr-utils/qr-utils';
import { CameraReadyState } from './base-qr-reader.types';
import {
  cameraReadyStateToErrorCode,
  createQrCameraSyntheticError,
  buildQrCameraRecoveryTrackEventArgs,
  buildQrScanFailedTrackEventArgs,
} from './base-qr-reader-utils';

describe('base-qr-reader-utils', () => {
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
      expect(args.properties.category).toBe(MetaMetricsEventCategory.Accounts);
      expect(args.name).toBe(
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
        [...HARDWARE_WALLET_RECOVERY_SEGMENT_PAYLOAD_KEYS, 'category'].sort(),
      );
    });

    it('works with different event names', () => {
      const ctaArgs = buildQrCameraRecoveryTrackEventArgs(
        MetaMetricsEventName.HardwareWalletRecoveryCtaClicked,
        ErrorCode.PermissionCameraDenied,
        2,
      );
      expect(ctaArgs.name).toBe(
        MetaMetricsEventName.HardwareWalletRecoveryCtaClicked,
      );

      const successArgs = buildQrCameraRecoveryTrackEventArgs(
        MetaMetricsEventName.HardwareWalletRecoverySuccessModalViewed,
        ErrorCode.PermissionCameraPromptDismissed,
        1,
      );
      expect(successArgs.name).toBe(
        MetaMetricsEventName.HardwareWalletRecoverySuccessModalViewed,
      );
    });
  });

  describe('buildQrScanFailedTrackEventArgs', () => {
    it('returns QrHardwareScanFailed event with Accounts category', () => {
      const classification: ScanErrorClassification = {
        category: ScanErrorCategory.NonUrQrScanned,
        isUrFormat: false,
      };
      const args = buildQrScanFailedTrackEventArgs(
        classification,
        QrErrorFlowContext.Pairing,
      );
      expect(args.name).toBe(MetaMetricsEventName.QrHardwareScanFailed);
      expect(args.properties.category).toBe(MetaMetricsEventCategory.Accounts);
    });

    it('includes error_category, is_ur_format, and flow for non_ur_qr_scanned', () => {
      const classification: ScanErrorClassification = {
        category: ScanErrorCategory.NonUrQrScanned,
        isUrFormat: false,
      };
      const { properties } = buildQrScanFailedTrackEventArgs(
        classification,
        QrErrorFlowContext.Pairing,
      );
      expect(properties).toStrictEqual({
        category: MetaMetricsEventCategory.Accounts,
        device_type: MetaMetricsHardwareWalletDeviceType.QrHardware,
        error_category: 'non_ur_qr_scanned',
        is_ur_format: false,
        flow: 'pairing',
      });
    });

    it('includes received_ur_type only for wrong_ur_type', () => {
      const classification: ScanErrorClassification = {
        category: ScanErrorCategory.WrongUrType,
        isUrFormat: true,
        receivedUrType: 'eth-signature',
      };
      const { properties } = buildQrScanFailedTrackEventArgs(
        classification,
        QrErrorFlowContext.Pairing,
      );
      expect(properties).toStrictEqual({
        category: MetaMetricsEventCategory.Accounts,
        device_type: MetaMetricsHardwareWalletDeviceType.QrHardware,
        error_category: 'wrong_ur_type',
        is_ur_format: true,
        flow: 'pairing',
        received_ur_type: 'eth-signature',
      });
    });

    it('includes raw_message only for scan_exception', () => {
      const classification: ScanErrorClassification = {
        category: ScanErrorCategory.ScanException,
        isUrFormat: true,
        rawMessage: 'cbor decode failure',
      };
      const { properties } = buildQrScanFailedTrackEventArgs(
        classification,
        QrErrorFlowContext.Signing,
      );
      expect(properties).toStrictEqual({
        category: MetaMetricsEventCategory.Accounts,
        device_type: MetaMetricsHardwareWalletDeviceType.QrHardware,
        error_category: 'scan_exception',
        is_ur_format: true,
        flow: 'signing',
        raw_message: 'cbor decode failure',
      });
    });

    it('includes only base properties for ur_decode_error', () => {
      const classification: ScanErrorClassification = {
        category: ScanErrorCategory.UrDecodeError,
        isUrFormat: true,
      };
      const { properties } = buildQrScanFailedTrackEventArgs(
        classification,
        QrErrorFlowContext.Signing,
      );
      expect(properties).toStrictEqual({
        category: MetaMetricsEventCategory.Accounts,
        device_type: MetaMetricsHardwareWalletDeviceType.QrHardware,
        error_category: 'ur_decode_error',
        is_ur_format: true,
        flow: 'signing',
      });
    });

    it('is_ur_format is boolean for every category', () => {
      const categories: ScanErrorClassification[] = [
        { category: ScanErrorCategory.NonUrQrScanned, isUrFormat: false },
        {
          category: ScanErrorCategory.WrongUrType,
          isUrFormat: true,
          receivedUrType: 'crypto-hdkey',
        },
        { category: ScanErrorCategory.UrDecodeError, isUrFormat: true },
        {
          category: ScanErrorCategory.ScanException,
          isUrFormat: true,
          rawMessage: 'error',
        },
      ];

      for (const classification of categories) {
        const { properties } = buildQrScanFailedTrackEventArgs(
          classification,
          QrErrorFlowContext.Pairing,
        );
        expect(typeof properties.is_ur_format).toBe('boolean');
      }
    });
  });
});
