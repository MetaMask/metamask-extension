import {
  LedgerAction,
  OffscreenCommunicationEvents,
  OffscreenCommunicationTarget,
} from '../../shared/constants/offscreen-communication';
import { LEDGER_USB_VENDOR_ID } from '../../shared/constants/hardware-wallets';
import { LedgerOffscreenHandler } from './ledger';

// Mock functions - defined before jest.mock calls
const mockTransportClose = jest.fn();
const mockTransportSend = jest.fn();
const mockOpenConnected = jest.fn();
const mockCreate = jest.fn();
const mockGetAppConfiguration = jest.fn();
const mockGetAddress = jest.fn();
const mockClearSignTransaction = jest.fn();
const mockSignPersonalMessage = jest.fn();
const mockSignEIP712Message = jest.fn();
const mockParse = jest.fn();

const mockTransport = {
  close: mockTransportClose,
  send: mockTransportSend,
};

jest.mock('@ledgerhq/hw-transport-webhid', () => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  __esModule: true,
  default: {
    openConnected: jest.fn(() => mockOpenConnected()),
    create: jest.fn(() => mockCreate()),
  },
}));

jest.mock('@ledgerhq/hw-app-eth', () => {
  return {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      getAppConfiguration: mockGetAppConfiguration,
      getAddress: mockGetAddress,
      clearSignTransaction: mockClearSignTransaction,
      signPersonalMessage: mockSignPersonalMessage,
      signEIP712Message: mockSignEIP712Message,
    })),
  };
});

jest.mock('@ethersproject/transactions', () => ({
  parse: (...args: unknown[]) => mockParse(...args),
}));

describe('Ledger Offscreen', () => {
  let mockAddEventListener: jest.Mock;
  let mockGetDevices: jest.Mock;
  let mockSendMessage: jest.Mock;
  let mockAddListener: jest.Mock;
  let capturedMessageListener: (
    msg: {
      target: string;
      action: LedgerAction;
      params?: Record<string, unknown>;
    },
    sender: unknown,
    sendResponse: (response: unknown) => void,
  ) => boolean;
  let capturedConnectListener: (event: { device: HIDDevice }) => void;
  let capturedDisconnectListener: (event: { device: HIDDevice }) => void;

  const createMockHidDevice = (vendorId: number): HIDDevice =>
    ({
      vendorId,
      productId: 0x0001,
      productName: 'Ledger Nano X',
    }) as HIDDevice;

  const ledgerDevice = createMockHidDevice(Number(LEDGER_USB_VENDOR_ID));
  const nonLedgerDevice = createMockHidDevice(0x1234);

  beforeEach(() => {
    jest.clearAllMocks();

    // Set up navigator.hid mock
    mockAddEventListener = jest.fn((event, callback) => {
      if (event === 'connect') {
        capturedConnectListener = callback;
      } else if (event === 'disconnect') {
        capturedDisconnectListener = callback;
      }
    });
    mockGetDevices = jest.fn().mockResolvedValue([ledgerDevice]);

    Object.defineProperty(globalThis, 'navigator', {
      value: {
        hid: {
          addEventListener: mockAddEventListener,
          getDevices: mockGetDevices,
        },
      },
      writable: true,
      configurable: true,
    });

    // Set up chrome.runtime mock
    mockSendMessage = jest.fn();
    mockAddListener = jest.fn((callback) => {
      capturedMessageListener = callback;
    });

    Object.defineProperty(globalThis, 'chrome', {
      value: {
        runtime: {
          sendMessage: mockSendMessage,
          onMessage: {
            addListener: mockAddListener,
          },
        },
      },
      writable: true,
      configurable: true,
    });

    // Default mock implementations
    mockOpenConnected.mockResolvedValue(null);
    mockCreate.mockResolvedValue(mockTransport);
  });

  describe('init', () => {
    it('sets up device and message listeners', async () => {
      const handler = new LedgerOffscreenHandler();
      await handler.init();

      expect(mockAddEventListener).toHaveBeenCalledWith(
        'connect',
        expect.any(Function),
      );
      expect(mockAddEventListener).toHaveBeenCalledWith(
        'disconnect',
        expect.any(Function),
      );
      expect(mockAddListener).toHaveBeenCalledWith(expect.any(Function));
    });

    it('notifies extension when Ledger device is already connected', async () => {
      const handler = new LedgerOffscreenHandler();
      await handler.init();

      expect(mockSendMessage).toHaveBeenCalledWith({
        target: OffscreenCommunicationTarget.extension,
        event: OffscreenCommunicationEvents.ledgerDeviceConnect,
        payload: true,
      });
    });
  });

  describe('device events', () => {
    beforeEach(async () => {
      const handler = new LedgerOffscreenHandler();
      await handler.init();
      mockSendMessage.mockClear();
    });

    it('sends connect event when Ledger device is plugged in', () => {
      capturedConnectListener({ device: ledgerDevice });

      expect(mockSendMessage).toHaveBeenCalledWith({
        target: OffscreenCommunicationTarget.extension,
        event: OffscreenCommunicationEvents.ledgerDeviceConnect,
        payload: true,
      });
    });

    it('sends disconnect event when Ledger device is unplugged', () => {
      capturedDisconnectListener({ device: ledgerDevice });

      expect(mockSendMessage).toHaveBeenCalledWith({
        target: OffscreenCommunicationTarget.extension,
        event: OffscreenCommunicationEvents.ledgerDeviceConnect,
        payload: false,
      });
    });

    it('ignores non-Ledger devices', () => {
      capturedConnectListener({ device: nonLedgerDevice });
      capturedDisconnectListener({ device: nonLedgerDevice });

      expect(mockSendMessage).not.toHaveBeenCalled();
    });
  });

  describe('message handling', () => {
    beforeEach(async () => {
      const handler = new LedgerOffscreenHandler();
      await handler.init();
      mockSendMessage.mockClear();
    });

    const sendAction = (
      action: LedgerAction,
      params?: Record<string, unknown>,
    ): Promise<{ success: boolean; payload: unknown }> => {
      return new Promise((resolve) => {
        capturedMessageListener(
          {
            target: OffscreenCommunicationTarget.ledgerOffscreen,
            action,
            params,
          },
          {},
          resolve as (response: unknown) => void,
        );
      });
    };

    it('ignores messages for other targets', () => {
      const sendResponse = jest.fn();
      const result = capturedMessageListener(
        { target: 'other-target', action: LedgerAction.makeApp },
        {},
        sendResponse,
      );

      expect(result).toBe(false);
      expect(sendResponse).not.toHaveBeenCalled();
    });

    describe('makeApp', () => {
      it('creates transport and app', async () => {
        const response = await sendAction(LedgerAction.makeApp);

        expect(response.success).toBe(true);
        expect(mockCreate).toHaveBeenCalled();
      });

      it('returns error when no device is permitted', async () => {
        const consoleSpy = jest
          .spyOn(console, 'error')
          .mockImplementation(() => undefined);
        mockOpenConnected.mockResolvedValue(null);
        mockGetDevices.mockResolvedValue([]);

        const response = await sendAction(LedgerAction.makeApp);

        expect(response.success).toBe(false);
        expect(response.payload).toEqual({
          error: expect.objectContaining({
            message: expect.stringContaining('No permitted Ledger device'),
          }),
        });
        consoleSpy.mockRestore();
      });
    });

    describe('getPublicKey', () => {
      it('returns public key for valid hdPath', async () => {
        mockGetAddress.mockResolvedValue({
          publicKey: '04abcd1234',
          address: '0x1234567890abcdef',
          chainCode: 'chaincode123',
        });

        const response = await sendAction(LedgerAction.getPublicKey, {
          hdPath: "m/44'/60'/0'/0/0",
        });

        expect(response.success).toBe(true);
        expect(response.payload).toEqual({
          publicKey: '04abcd1234',
          address: '0x1234567890abcdef',
          chainCode: 'chaincode123',
        });
      });

      it('returns error when hdPath is missing', async () => {
        const consoleSpy = jest
          .spyOn(console, 'error')
          .mockImplementation(() => undefined);

        const response = await sendAction(LedgerAction.getPublicKey, {});

        expect(response.success).toBe(false);
        expect(response.payload).toEqual({
          error: expect.objectContaining({
            message: 'Missing hdPath parameter',
          }),
        });
        consoleSpy.mockRestore();
      });
    });

    describe('signTransaction', () => {
      const defaultSignature = {
        v: '1b',
        r: 'abcd1234',
        s: 'efgh5678',
      };

      beforeEach(() => {
        mockClearSignTransaction.mockResolvedValue(defaultSignature);
        // Default: parse returns approve selector so nft is false (ERC20/ERC721 shared)
        mockParse.mockReturnValue({
          data: `0x095ea7b3${'00'.repeat(64)}`,
        });
      });

      it('signs transaction and returns signature', async () => {
        const response = await sendAction(LedgerAction.signTransaction, {
          hdPath: "m/44'/60'/0'/0/0",
          tx: 'f86c0a8502540be400825208...',
        });

        expect(response.success).toBe(true);
        expect(response.payload).toEqual(defaultSignature);
      });

      it('calls clearSignTransaction with "nft: false" for ERC20 approve selector', async () => {
        mockParse.mockReturnValue({
          data: `0x095ea7b3${'00'.repeat(64)}`,
        });

        await sendAction(LedgerAction.signTransaction, {
          hdPath: "m/44'/60'/0'/0/0",
          tx: '0xdeadbeef',
        });

        expect(mockClearSignTransaction).toHaveBeenCalledWith(
          "m/44'/60'/0'/0/0",
          '0xdeadbeef',
          expect.objectContaining({
            externalPlugins: true,
            erc20: true,
            nft: false,
          }),
        );
      });

      it('calls clearSignTransaction with "nft: true" for setApprovalForAll selector', async () => {
        mockParse.mockReturnValue({
          data: `0xa22cb465${'00'.repeat(64)}`,
        });

        await sendAction(LedgerAction.signTransaction, {
          hdPath: "m/44'/60'/0'/0/0",
          tx: '0xabc',
        });

        expect(mockClearSignTransaction).toHaveBeenCalledWith(
          "m/44'/60'/0'/0/0",
          '0xabc',
          expect.objectContaining({ nft: true }),
        );
      });

      it('calls clearSignTransaction without "nft: true" when parse throws', async () => {
        mockParse.mockImplementation(() => {
          throw new Error('Invalid RLP');
        });

        await sendAction(LedgerAction.signTransaction, {
          hdPath: "m/44'/60'/0'/0/0",
          tx: 'invalid',
        });

        expect(mockClearSignTransaction).toHaveBeenCalledWith(
          "m/44'/60'/0'/0/0",
          'invalid',
          expect.objectContaining({ externalPlugins: true, erc20: true }),
        );
        expect(mockClearSignTransaction.mock.calls[0][2].nft).not.toBe(true);
      });
    });

    describe('signPersonalMessage', () => {
      it('signs message and strips 0x prefix', async () => {
        mockSignPersonalMessage.mockResolvedValue({
          v: 27,
          r: 'abcd1234',
          s: 'efgh5678',
        });

        await sendAction(LedgerAction.signPersonalMessage, {
          hdPath: "m/44'/60'/0'/0/0",
          message: '0x48656c6c6f',
        });

        expect(mockSignPersonalMessage).toHaveBeenCalledWith(
          "m/44'/60'/0'/0/0",
          '48656c6c6f',
        );
      });
    });

    describe('signTypedData', () => {
      it('signs EIP-712 typed data', async () => {
        const typedDataMessage = {
          domain: { name: 'Test', version: '1' },
          types: { EIP712Domain: [], Test: [] },
          primaryType: 'Test',
          message: { value: 'test' },
        };

        mockSignEIP712Message.mockResolvedValue({
          v: 28,
          r: 'abcd1234',
          s: 'efgh5678',
        });

        const response = await sendAction(LedgerAction.signTypedData, {
          hdPath: "m/44'/60'/0'/0/0",
          message: typedDataMessage,
        });

        expect(response.success).toBe(true);
        expect(mockSignEIP712Message).toHaveBeenCalledWith(
          "m/44'/60'/0'/0/0",
          typedDataMessage,
        );
      });
    });

    describe('transport cleanup', () => {
      const flushPromises = () =>
        new Promise((resolve) => setTimeout(resolve, 0));

      it('closes transport after a successful action', async () => {
        mockGetAddress.mockResolvedValue({
          publicKey: '04abcd1234',
          address: '0x1234567890abcdef',
          chainCode: 'chaincode123',
        });

        await sendAction(LedgerAction.getPublicKey, {
          hdPath: "m/44'/60'/0'/0/0",
        });
        await flushPromises();

        expect(mockTransportClose).toHaveBeenCalled();
      });

      it('closes transport after a failed action', async () => {
        const consoleSpy = jest
          .spyOn(console, 'error')
          .mockImplementation(() => undefined);
        mockGetAddress.mockRejectedValue(new Error('Device error'));

        await sendAction(LedgerAction.getPublicKey, {
          hdPath: "m/44'/60'/0'/0/0",
        });
        await flushPromises();

        expect(mockTransportClose).toHaveBeenCalled();
        consoleSpy.mockRestore();
      });
    });

    describe('error handling', () => {
      it('preserves statusCode for TransportStatusError', async () => {
        const consoleSpy = jest
          .spyOn(console, 'error')
          .mockImplementation(() => undefined);
        const transportError = new Error('Locked device');
        (transportError as Error & { statusCode: number }).statusCode = 0x6b0c;
        mockGetAddress.mockRejectedValue(transportError);

        const response = await sendAction(LedgerAction.getPublicKey, {
          hdPath: "m/44'/60'/0'/0/0",
        });

        expect(response.success).toBe(false);
        expect(response.payload).toEqual({
          error: {
            message: 'Locked device',
            name: 'Error',
            statusCode: 0x6b0c,
          },
        });
        consoleSpy.mockRestore();
      });

      it('returns error for unknown action', async () => {
        const consoleSpy = jest
          .spyOn(console, 'error')
          .mockImplementation(() => undefined);

        const response = await sendAction('unknown-action' as LedgerAction);

        expect(response.success).toBe(false);
        expect(response.payload).toEqual({
          error: expect.objectContaining({
            message: expect.stringContaining('Unknown Ledger action'),
          }),
        });
        consoleSpy.mockRestore();
      });
    });
  });
});
