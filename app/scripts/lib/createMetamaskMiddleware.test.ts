import { rpcErrors } from '@metamask/rpc-errors';
import createMetamaskMiddleware from './createMetamaskMiddleware';

describe('createMetamaskMiddleware', () => {
  describe('error handling', () => {
    it('converts errors from getAccounts to proper JSON-RPC errors', async () => {
      const mockGetAccounts = jest
        .fn()
        .mockRejectedValue(new Error('Test error'));
      const mockProcessTransaction = jest.fn();
      const mockGetPendingNonce = jest.fn();
      const mockGetPendingTransactionByHash = jest.fn();

      const middleware = createMetamaskMiddleware({
        version: '1.0.0',
        getAccounts: mockGetAccounts,
        processTransaction: mockProcessTransaction,
        processTypedMessage: jest.fn(),
        processTypedMessageV3: jest.fn(),
        processTypedMessageV4: jest.fn(),
        processPersonalMessage: jest.fn(),
        processDecryptMessage: jest.fn(),
        processEncryptionPublicKey: jest.fn(),
        getPendingNonce: mockGetPendingNonce,
        getPendingTransactionByHash: mockGetPendingTransactionByHash,
        processRequestExecutionPermissions: jest.fn(),
        processGetSupportedExecutionPermissions: jest.fn(),
        processGetGrantedExecutionPermissions: jest.fn(),
      });

      const req = {
        id: 1,
        jsonrpc: '2.0' as const,
        method: 'eth_coinbase',
        params: [],
        origin: 'test-origin',
      };

      const res = { jsonrpc: '2.0' as const, id: 1 };
      const next = jest.fn();
      const end = jest.fn();

      await middleware(req, res, next, end);

      // Should call end with an error
      expect(end).toHaveBeenCalled();
      const errorArg = end.mock.calls[0][0];
      expect(errorArg).toBeInstanceOf(Error);
      expect(errorArg).toHaveProperty('code');
    });

    it('converts errors from processTransaction to proper JSON-RPC errors', async () => {
      const mockGetAccounts = jest.fn().mockResolvedValue(['0x123']);
      const mockProcessTransaction = jest
        .fn()
        .mockRejectedValue(new Error('Transaction processing failed'));
      const mockGetPendingNonce = jest.fn();
      const mockGetPendingTransactionByHash = jest.fn();

      const middleware = createMetamaskMiddleware({
        version: '1.0.0',
        getAccounts: mockGetAccounts,
        processTransaction: mockProcessTransaction,
        processTypedMessage: jest.fn(),
        processTypedMessageV3: jest.fn(),
        processTypedMessageV4: jest.fn(),
        processPersonalMessage: jest.fn(),
        processDecryptMessage: jest.fn(),
        processEncryptionPublicKey: jest.fn(),
        getPendingNonce: mockGetPendingNonce,
        getPendingTransactionByHash: mockGetPendingTransactionByHash,
        processRequestExecutionPermissions: jest.fn(),
        processGetSupportedExecutionPermissions: jest.fn(),
        processGetGrantedExecutionPermissions: jest.fn(),
      });

      const req = {
        id: 1,
        jsonrpc: '2.0' as const,
        method: 'eth_sendTransaction',
        params: [
          {
            from: '0x123',
            to: '0x456',
            value: '0x0',
          },
        ],
        origin: 'test-origin',
      };

      const res = { jsonrpc: '2.0' as const, id: 1 };
      const next = jest.fn();
      const end = jest.fn();

      await middleware(req, res, next, end);

      // Should call end with an error
      expect(end).toHaveBeenCalled();
      const errorArg = end.mock.calls[0][0];
      expect(errorArg).toBeInstanceOf(Error);
      expect(errorArg).toHaveProperty('code');
    });

    it('preserves existing RPC errors', async () => {
      const rpcError = rpcErrors.invalidParams('Invalid parameters');
      const mockGetAccounts = jest.fn().mockRejectedValue(rpcError);
      const mockGetPendingNonce = jest.fn();
      const mockGetPendingTransactionByHash = jest.fn();

      const middleware = createMetamaskMiddleware({
        version: '1.0.0',
        getAccounts: mockGetAccounts,
        processTransaction: jest.fn(),
        processTypedMessage: jest.fn(),
        processTypedMessageV3: jest.fn(),
        processTypedMessageV4: jest.fn(),
        processPersonalMessage: jest.fn(),
        processDecryptMessage: jest.fn(),
        processEncryptionPublicKey: jest.fn(),
        getPendingNonce: mockGetPendingNonce,
        getPendingTransactionByHash: mockGetPendingTransactionByHash,
        processRequestExecutionPermissions: jest.fn(),
        processGetSupportedExecutionPermissions: jest.fn(),
        processGetGrantedExecutionPermissions: jest.fn(),
      });

      const req = {
        id: 1,
        jsonrpc: '2.0' as const,
        method: 'eth_coinbase',
        params: [],
        origin: 'test-origin',
      };

      const res = { jsonrpc: '2.0' as const, id: 1 };
      const next = jest.fn();
      const end = jest.fn();

      await middleware(req, res, next, end);

      // Should preserve the original RPC error
      expect(end).toHaveBeenCalled();
      const errorArg = end.mock.calls[0][0];
      expect(errorArg).toBe(rpcError);
    });

    it('handles successful requests without interfering', async () => {
      const mockGetAccounts = jest.fn().mockResolvedValue(['0x123']);
      const mockGetPendingNonce = jest.fn();
      const mockGetPendingTransactionByHash = jest.fn();

      const middleware = createMetamaskMiddleware({
        version: '1.0.0',
        getAccounts: mockGetAccounts,
        processTransaction: jest.fn(),
        processTypedMessage: jest.fn(),
        processTypedMessageV3: jest.fn(),
        processTypedMessageV4: jest.fn(),
        processPersonalMessage: jest.fn(),
        processDecryptMessage: jest.fn(),
        processEncryptionPublicKey: jest.fn(),
        getPendingNonce: mockGetPendingNonce,
        getPendingTransactionByHash: mockGetPendingTransactionByHash,
        processRequestExecutionPermissions: jest.fn(),
        processGetSupportedExecutionPermissions: jest.fn(),
        processGetGrantedExecutionPermissions: jest.fn(),
      });

      const req = {
        id: 1,
        jsonrpc: '2.0' as const,
        method: 'eth_coinbase',
        params: [],
        origin: 'test-origin',
      };

      const res = { jsonrpc: '2.0' as const, id: 1 };
      const next = jest.fn();
      const end = jest.fn();

      await middleware(req, res, next, end);

      // Should handle the request successfully
      expect(mockGetAccounts).toHaveBeenCalledWith('test-origin');
      // Either end was called with result or next was called
      expect(end.mock.calls.length + next.mock.calls.length).toBeGreaterThan(0);
    });
  });

  describe('version info', () => {
    it('includes version in web3_clientVersion', async () => {
      const mockGetAccounts = jest.fn().mockResolvedValue([]);
      const mockGetPendingNonce = jest.fn();
      const mockGetPendingTransactionByHash = jest.fn();

      const middleware = createMetamaskMiddleware({
        version: '11.0.0',
        getAccounts: mockGetAccounts,
        processTransaction: jest.fn(),
        processTypedMessage: jest.fn(),
        processTypedMessageV3: jest.fn(),
        processTypedMessageV4: jest.fn(),
        processPersonalMessage: jest.fn(),
        processDecryptMessage: jest.fn(),
        processEncryptionPublicKey: jest.fn(),
        getPendingNonce: mockGetPendingNonce,
        getPendingTransactionByHash: mockGetPendingTransactionByHash,
        processRequestExecutionPermissions: jest.fn(),
        processGetSupportedExecutionPermissions: jest.fn(),
        processGetGrantedExecutionPermissions: jest.fn(),
      });

      const req = {
        id: 1,
        jsonrpc: '2.0' as const,
        method: 'web3_clientVersion',
        params: [],
      };

      const res: { jsonrpc: '2.0'; id: number; result?: string } = {
        jsonrpc: '2.0' as const,
        id: 1,
      };
      const next = jest.fn();
      const end = jest.fn();

      await middleware(req, res, next, end);

      // Should return version info in response
      expect(res.result).toBeDefined();
      expect(res.result).toContain('MetaMask/v11.0.0');
    });
  });
});
