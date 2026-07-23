import { serialize } from '@ethersproject/transactions';
import {
  LedgerAction,
  OffscreenCommunicationEvents,
  OffscreenCommunicationTarget,
} from '../../../shared/constants/offscreen-communication';
import { LEDGER_USB_VENDOR_ID } from '../../../shared/constants/hardware-wallets';
import initLegacy, { LedgerLegacyHandler } from './ledger';
import { serializeLedgerError } from './ledger-utils';

// Mock functions - defined before jest.mock calls
const mockTransportClose = jest.fn();
const mockTransportSend = jest.fn();
const mockOpenConnected = jest.fn();
const mockCreate = jest.fn();
const mockGetAppConfiguration = jest.fn();
const mockGetAddress = jest.fn();
const mockClearSignTransaction = jest.fn();
const mockSignTransaction = jest.fn();
const mockSignPersonalMessage = jest.fn();
const mockSignEIP712Message = jest.fn();
const mockSignEIP712HashedMessage = jest.fn();
const mockGetTransactionSelector = jest.fn();

jest.mock('@metamask/eth-sig-util', () => {
  const actual = jest.requireActual('@metamask/eth-sig-util');
  return {
    ...actual,
    TypedDataUtils: {
      ...actual.TypedDataUtils,
      eip712DomainHash: jest.fn(() => Buffer.from('11'.repeat(32), 'hex')),
      hashStruct: jest.fn(() => Buffer.from('22'.repeat(32), 'hex')),
    },
  };
});

const { getTransactionSelector: actualGetTransactionSelector } =
  jest.requireActual(
    '@metamask/eth-ledger-bridge-keyring',
  ) as typeof import('@metamask/eth-ledger-bridge-keyring');

const ERC20_APPROVE_SELECTOR = '0x095ea7b3';
const SET_APPROVAL_FOR_ALL_SELECTOR = '0xa22cb465';
const ERC20_APPROVE_DATA = `${ERC20_APPROVE_SELECTOR}${'00'.repeat(64)}`;
const SET_APPROVAL_FOR_ALL_DATA = `${SET_APPROVAL_FOR_ALL_SELECTOR}${'00'.repeat(
  64,
)}`;

function createRawApproveTransaction(
  type: 'legacy' | 'legacy-unsigned' | 'eip1559',
  data = ERC20_APPROVE_DATA,
): string {
  const common = {
    chainId: 1,
    nonce: 0,
    gasLimit: 21000,
    to: '0x0000000000000000000000000000000000000001',
    value: 0,
    data,
  };

  if (type === 'legacy') {
    return serialize(
      {
        ...common,
        gasPrice: 1,
      },
      {
        v: 27,
        r: `0x${'11'.repeat(32)}`,
        s: `0x${'22'.repeat(32)}`,
      },
    );
  }

  if (type === 'legacy-unsigned') {
    return serialize({
      ...common,
      gasPrice: 1,
    }).slice(2);
  }

  return serialize({
    ...common,
    type: 2,
    maxPriorityFeePerGas: 1,
    maxFeePerGas: 1,
    accessList: [],
  });
}

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
      signTransaction: mockSignTransaction,
      signPersonalMessage: mockSignPersonalMessage,
      signEIP712Message: mockSignEIP712Message,
      signEIP712HashedMessage: mockSignEIP712HashedMessage,
    })),
  };
});

jest.mock('@metamask/eth-ledger-bridge-keyring', () => {
  const actual = jest.requireActual('@metamask/eth-ledger-bridge-keyring');

  return {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    __esModule: true,
    ...actual,
    getTransactionSelector: (...args: unknown[]) =>
      mockGetTransactionSelector(...args),
  };
});

describe('Ledger Offscreen', () => {
  let mockAddEventListener: jest.Mock;
  let mockRemoveEventListener: jest.Mock;
  let mockGetDevices: jest.Mock;
  let mockSendMessage: jest.Mock;
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
    mockGetTransactionSelector.mockReset();

    // Set up navigator.hid mock
    mockAddEventListener = jest.fn((event, callback) => {
      if (event === 'connect') {
        capturedConnectListener = callback;
      } else if (event === 'disconnect') {
        capturedDisconnectListener = callback;
      }
    });
    mockRemoveEventListener = jest.fn();
    mockGetDevices = jest.fn().mockResolvedValue([ledgerDevice]);

    Object.defineProperty(globalThis, 'navigator', {
      value: {
        hid: {
          addEventListener: mockAddEventListener,
          removeEventListener: mockRemoveEventListener,
          getDevices: mockGetDevices,
        },
      },
      writable: true,
      configurable: true,
    });

    // Set up chrome.runtime mock
    mockSendMessage = jest.fn();

    Object.defineProperty(globalThis, 'chrome', {
      value: {
        runtime: {
          sendMessage: mockSendMessage,
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
    it('sets up device listeners', async () => {
      const handler = new LedgerLegacyHandler();
      await handler.init();

      expect(mockAddEventListener).toHaveBeenCalledWith(
        'connect',
        expect.any(Function),
      );
      expect(mockAddEventListener).toHaveBeenCalledWith(
        'disconnect',
        expect.any(Function),
      );
    });

    it('notifies extension when Ledger device is already connected', async () => {
      const handler = new LedgerLegacyHandler();
      await handler.init();

      expect(mockSendMessage).toHaveBeenCalledWith({
        target: OffscreenCommunicationTarget.extension,
        event: OffscreenCommunicationEvents.ledgerDeviceConnect,
        payload: true,
      });
    });

    it('skips device listeners and checks when WebHID is unavailable', async () => {
      const consoleWarnSpy = jest
        .spyOn(console, 'warn')
        .mockImplementation(() => undefined);

      Object.defineProperty(globalThis, 'navigator', {
        value: {},
        writable: true,
        configurable: true,
      });

      const handler = new LedgerLegacyHandler();
      await handler.init();

      expect(mockAddEventListener).not.toHaveBeenCalled();
      expect(mockGetDevices).not.toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'WebHID not supported, skipping device event listeners',
      );
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'WebHID not supported, Ledger functionality will be limited',
      );
      consoleWarnSpy.mockRestore();
    });

    it('logs an error when checking permitted devices fails', async () => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => undefined);
      mockGetDevices.mockRejectedValue(new Error('HID permission denied'));

      const handler = new LedgerLegacyHandler();
      await handler.init();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error checking for permitted Ledger devices:',
        expect.any(Error),
      );
      consoleErrorSpy.mockRestore();
    });
  });

  describe('initLegacy', () => {
    it('returns an uninitialised handler instance', () => {
      const handler = initLegacy();

      expect(handler).toBeInstanceOf(LedgerLegacyHandler);
      expect(mockAddEventListener).not.toHaveBeenCalled();
    });
  });

  describe('destroy', () => {
    it('removes HID listeners and closes transport', async () => {
      const handler = new LedgerLegacyHandler();
      await handler.init();
      await handler.handleAction(LedgerAction.makeApp);

      await handler.destroy();

      expect(mockRemoveEventListener).toHaveBeenCalledWith(
        'connect',
        capturedConnectListener,
      );
      expect(mockRemoveEventListener).toHaveBeenCalledWith(
        'disconnect',
        capturedDisconnectListener,
      );
      expect(mockTransportClose).toHaveBeenCalled();
    });

    it('closes transport even when listeners were never registered', async () => {
      const handler = new LedgerLegacyHandler();
      await handler.handleAction(LedgerAction.makeApp);

      await handler.destroy();

      expect(mockRemoveEventListener).not.toHaveBeenCalled();
      expect(mockTransportClose).toHaveBeenCalled();
    });
  });

  describe('device events', () => {
    let handler: LedgerLegacyHandler;

    beforeEach(async () => {
      handler = new LedgerLegacyHandler();
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

    it('closes transport when Ledger device is unplugged', async () => {
      // handleAction closes transport in its finally block, so seed an open
      // transport to verify the disconnect listener cleans up stale state.
      (handler as unknown as { transport: typeof mockTransport }).transport =
        mockTransport;
      mockTransportClose.mockClear();

      capturedDisconnectListener({ device: ledgerDevice });

      await new Promise((resolve) => setTimeout(resolve, 0));

      expect(mockTransportClose).toHaveBeenCalled();
    });

    it('ignores non-Ledger devices', () => {
      capturedConnectListener({ device: nonLedgerDevice });
      capturedDisconnectListener({ device: nonLedgerDevice });

      expect(mockSendMessage).not.toHaveBeenCalled();
    });
  });

  describe('message handling', () => {
    let handler: LedgerLegacyHandler;

    beforeEach(async () => {
      handler = new LedgerLegacyHandler();
      await handler.init();
      mockSendMessage.mockClear();
    });

    const sendAction = async (
      action: LedgerAction,
      params?: Record<string, unknown>,
    ): Promise<{ success: boolean; payload: unknown }> => {
      try {
        const result = await handler.handleAction(action, params);
        return { success: true, payload: result };
      } catch (error) {
        return {
          success: false,
          payload: { error: serializeLedgerError(error) },
        };
      }
    };

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

    describe('getAppConfiguration', () => {
      it('returns app configuration from the device', async () => {
        const mockConfiguration = {
          arbitraryDataEnabled: 1,
          version: '1.0.0',
        };
        mockGetAppConfiguration.mockResolvedValue(mockConfiguration);

        const response = await sendAction(LedgerAction.getAppConfiguration);

        expect(response.success).toBe(true);
        expect(response.payload).toEqual(mockConfiguration);
        expect(mockGetAppConfiguration).toHaveBeenCalled();
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
        // approve() is shared by ERC20 and ERC721, so it should only set erc20.
        mockGetTransactionSelector.mockReturnValue(ERC20_APPROVE_SELECTOR);
      });

      it('signs transaction and returns signature', async () => {
        const response = await sendAction(LedgerAction.signTransaction, {
          hdPath: "m/44'/60'/0'/0/0",
          tx: 'f86c0a8502540be400825208...',
        });

        expect(response.success).toBe(true);
        expect(response.payload).toEqual(defaultSignature);
      });

      it('calls clearSignTransaction with "erc20: true" for ERC20 approve selector', async () => {
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

      it('detects ERC20 approve selector from a legacy serialized transaction', async () => {
        mockGetTransactionSelector.mockImplementation(
          actualGetTransactionSelector,
        );

        await sendAction(LedgerAction.signTransaction, {
          hdPath: "m/44'/60'/0'/0/0",
          tx: createRawApproveTransaction('legacy'),
        });

        expect(mockClearSignTransaction).toHaveBeenCalledWith(
          "m/44'/60'/0'/0/0",
          expect.any(String),
          expect.objectContaining({
            externalPlugins: true,
            erc20: true,
            nft: false,
          }),
        );
      });

      it('detects ERC20 approve selector from an unsigned legacy serialized transaction', async () => {
        mockGetTransactionSelector.mockImplementation(
          actualGetTransactionSelector,
        );

        await sendAction(LedgerAction.signTransaction, {
          hdPath: "m/44'/60'/0'/0/0",
          tx: createRawApproveTransaction('legacy-unsigned'),
        });

        expect(mockClearSignTransaction).toHaveBeenCalledWith(
          "m/44'/60'/0'/0/0",
          expect.any(String),
          expect.objectContaining({
            externalPlugins: true,
            erc20: true,
            nft: false,
          }),
        );
      });

      it('detects NFT-only selector from an unsigned legacy serialized transaction', async () => {
        mockGetTransactionSelector.mockImplementation(
          actualGetTransactionSelector,
        );

        await sendAction(LedgerAction.signTransaction, {
          hdPath: "m/44'/60'/0'/0/0",
          tx: createRawApproveTransaction(
            'legacy-unsigned',
            SET_APPROVAL_FOR_ALL_DATA,
          ),
        });

        expect(mockClearSignTransaction).toHaveBeenCalledWith(
          "m/44'/60'/0'/0/0",
          expect.any(String),
          expect.objectContaining({
            externalPlugins: true,
            erc20: false,
            nft: true,
          }),
        );
      });

      it('detects ERC20 approve selector from an EIP-1559 serialized transaction', async () => {
        mockGetTransactionSelector.mockImplementation(
          actualGetTransactionSelector,
        );

        await sendAction(LedgerAction.signTransaction, {
          hdPath: "m/44'/60'/0'/0/0",
          tx: createRawApproveTransaction('eip1559'),
        });

        expect(mockClearSignTransaction).toHaveBeenCalledWith(
          "m/44'/60'/0'/0/0",
          expect.any(String),
          expect.objectContaining({
            externalPlugins: true,
            erc20: true,
            nft: false,
          }),
        );
      });

      it('calls clearSignTransaction with "nft: true" for setApprovalForAll selector', async () => {
        mockGetTransactionSelector.mockReturnValue(
          SET_APPROVAL_FOR_ALL_SELECTOR,
        );

        await sendAction(LedgerAction.signTransaction, {
          hdPath: "m/44'/60'/0'/0/0",
          tx: '0xabc',
        });

        expect(mockClearSignTransaction).toHaveBeenCalledWith(
          "m/44'/60'/0'/0/0",
          '0xabc',
          expect.objectContaining({ erc20: false, nft: true }),
        );
      });

      it('calls clearSignTransaction with "erc20: false" for non-ERC20 selectors', async () => {
        mockGetTransactionSelector.mockReturnValue('0xdeadbeef');

        await sendAction(LedgerAction.signTransaction, {
          hdPath: "m/44'/60'/0'/0/0",
          tx: '0xfeedbeef',
        });

        expect(mockClearSignTransaction).toHaveBeenCalledWith(
          "m/44'/60'/0'/0/0",
          '0xfeedbeef',
          expect.objectContaining({
            externalPlugins: true,
            erc20: false,
            nft: false,
          }),
        );
      });

      it('calls clearSignTransaction with "erc20: false" when no selector is detected', async () => {
        mockGetTransactionSelector.mockReturnValue(undefined);

        await sendAction(LedgerAction.signTransaction, {
          hdPath: "m/44'/60'/0'/0/0",
          tx: '0x1234',
        });

        expect(mockClearSignTransaction).toHaveBeenCalledWith(
          "m/44'/60'/0'/0/0",
          '0x1234',
          expect.objectContaining({
            externalPlugins: true,
            erc20: false,
            nft: false,
          }),
        );
      });

      it('falls back to blind signTransaction when clearSignTransaction fails (GH 41602)', async () => {
        const consoleWarnSpy = jest
          .spyOn(console, 'warn')
          .mockImplementation(() => undefined);
        const blindSignature = {
          v: '1c',
          r: 'deadbeef',
          s: 'cafebabe',
        };
        mockClearSignTransaction.mockRejectedValue(
          new Error('Plugin data is not available for this transaction'),
        );
        mockSignTransaction.mockResolvedValue(blindSignature);

        const response = await sendAction(LedgerAction.signTransaction, {
          hdPath: "m/44'/60'/0'/0/0",
          tx: '0xdeadbeef',
        });

        expect(mockClearSignTransaction).toHaveBeenCalledTimes(1);
        expect(mockSignTransaction).toHaveBeenCalledWith(
          "m/44'/60'/0'/0/0",
          '0xdeadbeef',
          null,
        );
        expect(response.success).toBe(true);
        expect(response.payload).toEqual(blindSignature);
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          expect.stringContaining('clearSignTransaction failed'),
          expect.any(Error),
        );
        consoleWarnSpy.mockRestore();
      });

      it('does not fall back when the device rejects the transaction (0x6985)', async () => {
        const consoleErrorSpy = jest
          .spyOn(console, 'error')
          .mockImplementation(() => undefined);
        const rejection = Object.assign(
          new Error('CONDITIONS_OF_USE_NOT_SATISFIED'),
          {
            statusCode: 0x6985,
            statusText: 'CONDITIONS_OF_USE_NOT_SATISFIED',
          },
        );
        mockClearSignTransaction.mockRejectedValue(rejection);

        const response = await sendAction(LedgerAction.signTransaction, {
          hdPath: "m/44'/60'/0'/0/0",
          tx: '0xdeadbeef',
        });

        expect(mockSignTransaction).not.toHaveBeenCalled();
        expect(response.success).toBe(false);
        expect(response.payload).toEqual({
          error: expect.objectContaining({
            message: 'User rejected action on device',
            statusCode: 0x6985,
          }),
        });
        consoleErrorSpy.mockRestore();
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
      const typedDataMessage = {
        domain: { name: 'Test', version: '1', chainId: 1 },
        types: {
          EIP712Domain: [
            { name: 'name', type: 'string' },
            { name: 'version', type: 'string' },
            { name: 'chainId', type: 'uint256' },
          ],
          Test: [{ name: 'value', type: 'string' }],
        },
        primaryType: 'Test',
        message: { value: 'test' },
      };

      const defaultSignature = {
        v: 28,
        r: 'abcd1234',
        s: 'efgh5678',
      };

      it('signs EIP-712 typed data via clear signing', async () => {
        mockSignEIP712Message.mockResolvedValue(defaultSignature);

        const response = await sendAction(LedgerAction.signTypedData, {
          hdPath: "m/44'/60'/0'/0/0",
          message: typedDataMessage,
        });

        expect(response.success).toBe(true);
        expect(mockSignEIP712Message).toHaveBeenCalledWith(
          "m/44'/60'/0'/0/0",
          typedDataMessage,
        );
        expect(mockSignEIP712HashedMessage).not.toHaveBeenCalled();
      });

      it('falls back to hashed signing when device returns INS_NOT_SUPPORTED', async () => {
        const insError = new Error('INS_NOT_SUPPORTED');
        (insError as Error & { statusText: string }).statusText =
          'INS_NOT_SUPPORTED';
        mockSignEIP712Message.mockRejectedValue(insError);
        mockSignEIP712HashedMessage.mockResolvedValue(defaultSignature);

        const response = await sendAction(LedgerAction.signTypedData, {
          hdPath: "m/44'/60'/0'/0/0",
          message: typedDataMessage,
        });

        expect(response.success).toBe(true);
        expect(response.payload).toEqual(defaultSignature);
        expect(mockSignEIP712HashedMessage).toHaveBeenCalledWith(
          "m/44'/60'/0'/0/0",
          expect.any(String),
          expect.any(String),
        );
      });

      it('re-throws non-INS_NOT_SUPPORTED errors without falling back', async () => {
        const consoleSpy = jest
          .spyOn(console, 'error')
          .mockImplementation(() => undefined);
        mockSignEIP712Message.mockRejectedValue(new Error('Device locked'));

        const response = await sendAction(LedgerAction.signTypedData, {
          hdPath: "m/44'/60'/0'/0/0",
          message: typedDataMessage,
        });

        expect(response.success).toBe(false);
        expect(response.payload).toEqual({
          error: expect.objectContaining({
            message: 'Device locked',
          }),
        });
        expect(mockSignEIP712HashedMessage).not.toHaveBeenCalled();
        consoleSpy.mockRestore();
      });
    });

    describe('signDelegationAuthorization', () => {
      it('returns an explicit error when the Legacy handler is active', async () => {
        const consoleSpy = jest
          .spyOn(console, 'error')
          .mockImplementation(() => undefined);

        const response = await sendAction(
          LedgerAction.signDelegationAuthorization,
          {
            hdPath: "m/44'/60'/0'/0/0",
            chainId: 1,
            contractAddress: '0x1234',
            nonce: 2,
          },
        );

        expect(response.success).toBe(false);
        expect(response.payload).toEqual({
          error: expect.objectContaining({
            message:
              'Ledger delegation authorization signing requires DMK mode',
          }),
        });
        consoleSpy.mockRestore();
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
          error: expect.objectContaining({
            message: 'Device locked',
            statusCode: 0x6b0c,
          }),
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
