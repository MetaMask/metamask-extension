import { TrezorOffscreenBridge } from './trezor-offscreen-bridge';

// Mock chrome runtime API
global.chrome = {
  runtime: {
    onMessage: {
      addListener: jest.fn(),
    },
    sendMessage: jest.fn(),
  },
} as any;

describe('TrezorOffscreenBridge', () => {
  let bridge: TrezorOffscreenBridge;

  beforeEach(() => {
    bridge = new TrezorOffscreenBridge();
    jest.clearAllMocks();
  });

  describe('ethereumSignTransaction', () => {
    it('should add type 2 for EIP-1559 transactions', async () => {
      const mockParams = {
        transaction: {
          to: '0x1234567890123456789012345678901234567890',
          value: '0x0',
          data: '0x',
          nonce: '0x0',
          gasLimit: '0x5208',
          chainId: 1,
          maxFeePerGas: '0x3b9aca00',
          maxPriorityFeePerGas: '0x3b9aca00',
        },
        path: "m/44'/60'/0'/0/0",
      };

      // Mock sendMessage to capture params
      (global.chrome.runtime.sendMessage as jest.Mock).mockImplementation(
        (message: any, callback: any) => {
          expect(message.params.transaction.type).toBe(2);
          callback({ success: true });
        },
      );

      await bridge.ethereumSignTransaction(mockParams);

      expect(global.chrome.runtime.sendMessage).toHaveBeenCalled();
    });

    it('should add type 1 for EIP-2930 transactions', async () => {
      const mockParams = {
        transaction: {
          to: '0x1234567890123456789012345678901234567890',
          value: '0x0',
          data: '0x',
          nonce: '0x0',
          gasLimit: '0x5208',
          gasPrice: '0x3b9aca00',
          chainId: 1,
          accessList: [],
        },
        path: "m/44'/60'/0'/0/0",
      };

      (global.chrome.runtime.sendMessage as jest.Mock).mockImplementation(
        (message: any, callback: any) => {
          expect(message.params.transaction.type).toBe(1);
          callback({ success: true });
        },
      );

      await bridge.ethereumSignTransaction(mockParams);

      expect(global.chrome.runtime.sendMessage).toHaveBeenCalled();
    });

    it('should add type 0 for legacy transactions', async () => {
      const mockParams = {
        transaction: {
          to: '0x1234567890123456789012345678901234567890',
          value: '0x0',
          data: '0x',
          nonce: '0x0',
          gasLimit: '0x5208',
          gasPrice: '0x3b9aca00',
          chainId: 1,
        },
        path: "m/44'/60'/0'/0/0",
      };

      (global.chrome.runtime.sendMessage as jest.Mock).mockImplementation(
        (message: any, callback: any) => {
          expect(message.params.transaction.type).toBe(0);
          callback({ success: true });
        },
      );

      await bridge.ethereumSignTransaction(mockParams);

      expect(global.chrome.runtime.sendMessage).toHaveBeenCalled();
    });

    it('should preserve existing type field if already set', async () => {
      const mockParams = {
        transaction: {
          to: '0x1234567890123456789012345678901234567890',
          value: '0x0',
          data: '0x',
          nonce: '0x0',
          gasLimit: '0x5208',
          gasPrice: '0x3b9aca00',
          chainId: 1,
          type: 2, // Explicitly set type
          maxFeePerGas: '0x3b9aca00',
          maxPriorityFeePerGas: '0x3b9aca00',
        },
        path: "m/44'/60'/0'/0/0",
      };

      (global.chrome.runtime.sendMessage as jest.Mock).mockImplementation(
        (message: any, callback: any) => {
          expect(message.params.transaction.type).toBe(2);
          callback({ success: true });
        },
      );

      await bridge.ethereumSignTransaction(mockParams);

      expect(global.chrome.runtime.sendMessage).toHaveBeenCalled();
    });
  });
});
