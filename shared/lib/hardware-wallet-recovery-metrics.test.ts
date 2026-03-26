/* eslint-disable @typescript-eslint/naming-convention, camelcase -- Segment-shaped assertions and destructuring match analytics schema */
import {
  Category,
  ErrorCode,
  HardwareWalletError,
  Severity,
} from '@metamask/hw-wallet-sdk';
import {
  MetaMetricsHardwareWalletDeviceType,
  MetaMetricsHardwareWalletRecoveryErrorType,
  MetaMetricsHardwareWalletRecoveryLocation,
} from '../constants/metametrics';
import {
  buildHardwareWalletRecoverySegmentProperties,
  extractHardwareWalletRecoveryErrorCodeAndMessage,
  getHardwareWalletMetricDeviceModel,
  HARDWARE_WALLET_RECOVERY_SEGMENT_PAYLOAD_KEYS,
  mapHardwareWalletRecoveryErrorType,
  mapHardwareWalletTypeToMetricDeviceType,
} from './hardware-wallet-recovery-metrics';

describe('hardware-wallet-recovery-metrics', () => {
  describe('mapHardwareWalletTypeToMetricDeviceType', () => {
    it('maps known wallet types to Segment device_type values', () => {
      expect(mapHardwareWalletTypeToMetricDeviceType('ledger')).toBe(
        MetaMetricsHardwareWalletDeviceType.Ledger,
      );
      expect(mapHardwareWalletTypeToMetricDeviceType('trezor')).toBe(
        MetaMetricsHardwareWalletDeviceType.Trezor,
      );
      expect(mapHardwareWalletTypeToMetricDeviceType('qr')).toBe(
        MetaMetricsHardwareWalletDeviceType.QrHardware,
      );
      expect(mapHardwareWalletTypeToMetricDeviceType('lattice')).toBe(
        MetaMetricsHardwareWalletDeviceType.Lattice,
      );
    });

    it('returns null for unknown or schema-unlisted wallet types', () => {
      expect(mapHardwareWalletTypeToMetricDeviceType(undefined)).toBeNull();
      expect(mapHardwareWalletTypeToMetricDeviceType(null)).toBeNull();
      expect(mapHardwareWalletTypeToMetricDeviceType('unknown')).toBeNull();
    });
  });

  describe('mapHardwareWalletRecoveryErrorType', () => {
    it('maps locked device errors from numeric code', () => {
      expect(
        mapHardwareWalletRecoveryErrorType({
          code: ErrorCode.AuthenticationDeviceLocked,
        }),
      ).toBe(MetaMetricsHardwareWalletRecoveryErrorType.DeviceLocked);
    });

    it('maps blind signing errors from numeric code', () => {
      expect(
        mapHardwareWalletRecoveryErrorType({
          code: ErrorCode.DeviceStateBlindSignNotSupported,
        }),
      ).toBe(MetaMetricsHardwareWalletRecoveryErrorType.BlindSigningNotEnabled);
    });

    it('maps connection transport missing to DeviceDisconnected', () => {
      expect(
        mapHardwareWalletRecoveryErrorType({
          code: ErrorCode.ConnectionTransportMissing,
        }),
      ).toBe(MetaMetricsHardwareWalletRecoveryErrorType.DeviceDisconnected);
    });

    it('maps device blocked to DeviceLocked', () => {
      expect(
        mapHardwareWalletRecoveryErrorType({
          code: ErrorCode.AuthenticationDeviceBlocked,
        }),
      ).toBe(MetaMetricsHardwareWalletRecoveryErrorType.DeviceLocked);
    });

    it('maps connection timeout to DeviceDisconnected', () => {
      expect(
        mapHardwareWalletRecoveryErrorType({
          code: ErrorCode.ConnectionTimeout,
        }),
      ).toBe(MetaMetricsHardwareWalletRecoveryErrorType.DeviceDisconnected);
    });

    it('maps Ethereum app closed to EthereumAppNotOpened', () => {
      expect(
        mapHardwareWalletRecoveryErrorType({
          code: ErrorCode.DeviceStateEthAppClosed,
        }),
      ).toBe(MetaMetricsHardwareWalletRecoveryErrorType.EthereumAppNotOpened);
    });

    it('maps unrecognized codes to GenericError', () => {
      expect(
        mapHardwareWalletRecoveryErrorType({ code: ErrorCode.Unknown }),
      ).toBe(MetaMetricsHardwareWalletRecoveryErrorType.GenericError);
    });

    it('maps missing code to GenericError', () => {
      expect(mapHardwareWalletRecoveryErrorType({})).toBe(
        MetaMetricsHardwareWalletRecoveryErrorType.GenericError,
      );
      expect(mapHardwareWalletRecoveryErrorType('oops')).toBe(
        MetaMetricsHardwareWalletRecoveryErrorType.GenericError,
      );
    });
  });

  describe('getHardwareWalletMetricDeviceModel', () => {
    it('reads device model from metadata when present', () => {
      const err = new HardwareWalletError('x', {
        code: ErrorCode.Unknown,
        severity: Severity.Info,
        category: Category.Unknown,
        userMessage: 'x',
        metadata: { deviceModel: 'Nano X' },
      });
      expect(getHardwareWalletMetricDeviceModel(err)).toBe('Nano X');
    });

    it('prefers device_model then model in metadata', () => {
      expect(
        getHardwareWalletMetricDeviceModel(
          new HardwareWalletError('x', {
            code: ErrorCode.Unknown,
            severity: Severity.Info,
            category: Category.Unknown,
            userMessage: 'x',
            metadata: { device_model: 'Model A' },
          }),
        ),
      ).toBe('Model A');
      expect(
        getHardwareWalletMetricDeviceModel(
          new HardwareWalletError('x', {
            code: ErrorCode.Unknown,
            severity: Severity.Info,
            category: Category.Unknown,
            userMessage: 'x',
            metadata: { model: 'Model B' },
          }),
        ),
      ).toBe('Model B');
    });

    it('returns N/A when error is not HardwareWalletError or metadata missing', () => {
      expect(getHardwareWalletMetricDeviceModel(new Error('x'))).toBe('N/A');
      expect(
        getHardwareWalletMetricDeviceModel(
          new HardwareWalletError('x', {
            code: ErrorCode.Unknown,
            severity: Severity.Info,
            category: Category.Unknown,
            userMessage: 'x',
          }),
        ),
      ).toBe('N/A');
    });
  });

  describe('extractHardwareWalletRecoveryErrorCodeAndMessage', () => {
    it('serializes HardwareWalletError code and user message', () => {
      const err = new HardwareWalletError('msg', {
        code: ErrorCode.DeviceDisconnected,
        severity: Severity.Err,
        category: Category.Connection,
        userMessage: 'user facing',
      });
      const { error_code, error_message } =
        extractHardwareWalletRecoveryErrorCodeAndMessage(err);
      expect(error_code).toBe(ErrorCode[ErrorCode.DeviceDisconnected]);
      expect(error_message).toContain('user facing');
    });

    it('uses message when userMessage is absent on HardwareWalletError', () => {
      const err = new HardwareWalletError('internal', {
        code: ErrorCode.Unknown,
        severity: Severity.Info,
        category: Category.Unknown,
        userMessage: '',
      });
      const { error_message } =
        extractHardwareWalletRecoveryErrorCodeAndMessage(err);
      expect(error_message).toContain('internal');
    });

    it('extracts code and message from plain Error and object shapes', () => {
      expect(
        extractHardwareWalletRecoveryErrorCodeAndMessage(
          new Error('plain failure'),
        ),
      ).toMatchObject({
        error_code: '',
        error_message: 'plain failure',
      });

      expect(
        extractHardwareWalletRecoveryErrorCodeAndMessage({
          code: ErrorCode.ConnectionClosed,
          message: 'lost',
        }),
      ).toMatchObject({
        error_code: ErrorCode[ErrorCode.ConnectionClosed],
        error_message: 'lost',
      });
    });

    it('truncates long messages and stringifies unknown primitives', () => {
      const long = `${'x'.repeat(520)}`;
      const { error_message } =
        extractHardwareWalletRecoveryErrorCodeAndMessage(long);
      expect(error_message.endsWith('…')).toBe(true);
      expect(error_message.length).toBeLessThanOrEqual(502);

      expect(
        extractHardwareWalletRecoveryErrorCodeAndMessage(404),
      ).toMatchObject({
        error_code: '',
        error_message: '404',
      });
    });
  });

  describe('buildHardwareWalletRecoverySegmentProperties', () => {
    it('returns Segment-shaped property keys', () => {
      const err = new HardwareWalletError('msg', {
        code: ErrorCode.AuthenticationDeviceLocked,
        severity: Severity.Err,
        category: Category.Authentication,
        userMessage: 'unlock',
      });
      const props = buildHardwareWalletRecoverySegmentProperties({
        location: MetaMetricsHardwareWalletRecoveryLocation.Send,
        deviceType: MetaMetricsHardwareWalletDeviceType.Ledger,
        deviceModel: 'Nano S',
        errorType: MetaMetricsHardwareWalletRecoveryErrorType.DeviceLocked,
        errorTypeViewCount: 2,
        error: err,
      });
      expect(props).toMatchObject({
        location: MetaMetricsHardwareWalletRecoveryLocation.Send,
        device_type: MetaMetricsHardwareWalletDeviceType.Ledger,
        device_model: 'Nano S',
        error_type: MetaMetricsHardwareWalletRecoveryErrorType.DeviceLocked,
        error_type_view_count: 2,
      });
      expect(props.error_code).toBeTruthy();
      expect(props.error_message).toBeTruthy();
    });

    it('exposes only snake_case keys that match segment-schema hardware wallet + recovery globals', () => {
      const err = new HardwareWalletError('x', {
        code: ErrorCode.Unknown,
        severity: Severity.Info,
        category: Category.Unknown,
        userMessage: 'x',
      });
      const props = buildHardwareWalletRecoverySegmentProperties({
        location: MetaMetricsHardwareWalletRecoveryLocation.Swaps,
        deviceType: MetaMetricsHardwareWalletDeviceType.Trezor,
        deviceModel: 'N/A',
        errorType: MetaMetricsHardwareWalletRecoveryErrorType.GenericError,
        errorTypeViewCount: 1,
        error: err,
      });
      expect(Object.keys(props).sort()).toStrictEqual(
        [...HARDWARE_WALLET_RECOVERY_SEGMENT_PAYLOAD_KEYS].sort(),
      );
    });
  });
});
