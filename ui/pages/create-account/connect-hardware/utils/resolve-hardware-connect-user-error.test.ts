import { it as jestIt } from '@jest/globals';
import {
  Category,
  ErrorCode,
  HardwareWalletError,
  Severity,
} from '@metamask/hw-wallet-sdk';
import {
  HardwareConnectLegacyErrorMessage,
  HARDWARE_CONNECT_LEDGER_LOCKED_MESSAGES,
  HARDWARE_CONNECT_TIMEOUT_MESSAGE_SUBSTRING,
  HardwareDeviceNames,
  LEDGER_ERRORS_CODES,
  U2F_ERROR,
} from '../../../../../shared/constants/hardware-wallets';
import { tEn } from '../../../../../test/lib/i18n-helpers';
import {
  HardwareWalletType,
  toHardwareWalletError,
} from '../../../../contexts/hardware-wallets';
import type { HardwareConnectErrorResolution } from './resolve-hardware-connect-user-error';
import {
  HardwareConnectErrorResolutionKind,
  resolveHardwareConnectUserError,
} from './resolve-hardware-connect-user-error';

jest.mock('../../../../contexts/hardware-wallets', () => ({
  ...jest.requireActual('../../../../contexts/hardware-wallets'),
  toHardwareWalletError: jest.fn(),
}));

const mockToHardwareWalletError =
  toHardwareWalletError as jest.MockedFunction<typeof toHardwareWalletError>;

const createHwError = (
  code: ErrorCode,
  userMessage: string,
): HardwareWalletError =>
  new HardwareWalletError(userMessage, {
    code,
    severity: Severity.Err,
    category: Category.Unknown,
    userMessage,
  });

const createUnknownHwError = () =>
  createHwError(ErrorCode.Unknown, 'Unknown error');

const expectErrorResolution = (
  message: string,
): HardwareConnectErrorResolution => ({
  kind: HardwareConnectErrorResolutionKind.Error,
  message,
});

describe('resolveHardwareConnectUserError', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockToHardwareWalletError.mockReturnValue(createUnknownHwError());
  });

  describe('sdk mapped errors', () => {
    it('returns the sdk user message for mapped hardware wallet errors', () => {
      mockToHardwareWalletError.mockReturnValue(
        createHwError(
          ErrorCode.AuthenticationDeviceLocked,
          'Ledger is locked',
        ),
      );

      expect(
        resolveHardwareConnectUserError(
          new Error('raw error'),
          HardwareDeviceNames.ledger,
          tEn,
        ),
      ).toStrictEqual(expectErrorResolution('Ledger is locked'));
      expect(mockToHardwareWalletError).toHaveBeenCalledWith(
        expect.any(Error),
        HardwareWalletType.Ledger,
      );
    });

    it('maps trezor devices to the trezor wallet type', () => {
      mockToHardwareWalletError.mockReturnValue(
        createHwError(ErrorCode.DeviceDisconnected, 'Device disconnected'),
      );

      resolveHardwareConnectUserError(
        new Error('trezor error'),
        HardwareDeviceNames.trezor,
        tEn,
      );

      expect(mockToHardwareWalletError).toHaveBeenCalledWith(
        expect.any(Error),
        HardwareWalletType.Trezor,
      );
    });

    it('returns ledgerTimeout for sdk connection timeout errors', () => {
      mockToHardwareWalletError.mockReturnValue(
        createHwError(ErrorCode.ConnectionTimeout, 'Timed out'),
      );

      expect(
        resolveHardwareConnectUserError(
          new Error('timeout'),
          HardwareDeviceNames.ledger,
          tEn,
        ),
      ).toStrictEqual(expectErrorResolution(tEn('ledgerTimeout')));
    });

    it('falls through to legacy handling for unknown sdk errors', () => {
      mockToHardwareWalletError.mockReturnValue(createUnknownHwError());

      expect(
        resolveHardwareConnectUserError(
          new Error('Unhandled connect error'),
          HardwareDeviceNames.ledger,
          tEn,
        ),
      ).toStrictEqual(expectErrorResolution('Unhandled connect error'));
    });

    it('falls through to legacy handling for connection closed sdk errors', () => {
      mockToHardwareWalletError.mockReturnValue(
        createHwError(ErrorCode.ConnectionClosed, 'Connection closed'),
      );

      expect(
        resolveHardwareConnectUserError(
          new Error('Connection closed by device'),
          HardwareDeviceNames.ledger,
          tEn,
        ),
      ).toStrictEqual(expectErrorResolution('Connection closed by device'));
    });
  });

  describe('legacy ledger locked tokens', () => {
    jestIt.each([...HARDWARE_CONNECT_LEDGER_LOCKED_MESSAGES])(
      'returns ledgerLocked for legacy token %s',
      (legacyMessage: (typeof HARDWARE_CONNECT_LEDGER_LOCKED_MESSAGES)[number]) => {
        expect(
          resolveHardwareConnectUserError(
            new Error(legacyMessage),
            HardwareDeviceNames.trezor,
            tEn,
          ),
        ).toStrictEqual(expectErrorResolution(tEn('ledgerLocked')));
      },
    );
  });

  describe('legacy ledger hex codes', () => {
    it('appends a localized message for known ledger hex codes', () => {
      const hexCode = '0x5515';
      const rawMessage = `Ledger device locked (${hexCode})`;

      expect(
        resolveHardwareConnectUserError(
          new Error(rawMessage),
          HardwareDeviceNames.trezor,
          tEn,
        ),
      ).toStrictEqual(
        expectErrorResolution(
          `${rawMessage} - ${tEn(LEDGER_ERRORS_CODES[hexCode])}`,
        ),
      );
    });
  });

  describe('legacy timeout messages', () => {
    it('returns ledgerTimeout when the message contains the timeout substring', () => {
      expect(
        resolveHardwareConnectUserError(
          new Error(
            `Connection ${HARDWARE_CONNECT_TIMEOUT_MESSAGE_SUBSTRING} occurred`,
          ),
          HardwareDeviceNames.lattice,
          tEn,
        ),
      ).toStrictEqual(expectErrorResolution(tEn('ledgerTimeout')));
    });
  });

  describe('u2f errors', () => {
    it('returns the u2f error token when the message includes u2f', () => {
      expect(
        resolveHardwareConnectUserError(
          new Error(`Something ${U2F_ERROR}`),
          HardwareDeviceNames.ledger,
          tEn,
        ),
      ).toStrictEqual(expectErrorResolution(U2F_ERROR));
    });
  });

  describe('keystone errors', () => {
    it('returns QRHardwarePubkeyAccountOutOfRange for out of range errors', () => {
      expect(
        resolveHardwareConnectUserError(
          new Error(
            HardwareConnectLegacyErrorMessage.KeystonePubkeyAccountOutOfRange,
          ),
          HardwareDeviceNames.qr,
          tEn,
        ),
      ).toStrictEqual(
        expectErrorResolution(tEn('QRHardwarePubkeyAccountOutOfRange')),
      );
    });
  });

  describe('suppressed errors', () => {
    jestIt.each([
      HardwareConnectLegacyErrorMessage.WindowClosed,
      HardwareConnectLegacyErrorMessage.PopupClosed,
      HardwareConnectLegacyErrorMessage.KeystoneSyncCancel,
    ])(
      'suppresses legacy dismiss token %s',
      (
        legacyMessage:
          | typeof HardwareConnectLegacyErrorMessage.WindowClosed
          | typeof HardwareConnectLegacyErrorMessage.PopupClosed
          | typeof HardwareConnectLegacyErrorMessage.KeystoneSyncCancel,
      ) => {
        expect(
          resolveHardwareConnectUserError(
            new Error(legacyMessage),
            HardwareDeviceNames.ledger,
            tEn,
          ),
        ).toStrictEqual({
          kind: HardwareConnectErrorResolutionKind.Suppress,
        });
      },
    );
  });

  describe('browser blocked errors', () => {
    it('returns browser blocked for window blocked errors', () => {
      expect(
        resolveHardwareConnectUserError(
          new Error(HardwareConnectLegacyErrorMessage.WindowBlocked),
          HardwareDeviceNames.trezor,
          tEn,
        ),
      ).toStrictEqual({
        kind: HardwareConnectErrorResolutionKind.BrowserBlocked,
      });
    });
  });
});
