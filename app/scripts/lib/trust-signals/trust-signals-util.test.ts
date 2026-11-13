import { JsonRpcRequest } from '@metamask/utils';
import { MESSAGE_TYPE } from '../../../../shared/constants/app';
import {
  isEthSendTransaction,
  hasValidTransactionParams,
  isEthSignTypedData,
  hasValidTypedDataParams,
  isConnected,
  connectScreenHasBeenPrompted,
  getWrappedRequestMethod,
  isCaipConnected,
  isWalletSendCalls,
  hasValidSendCallsParams,
} from './trust-signals-util';

describe('trust-signals-util', () => {
  describe('isEthSendTransaction', () => {
    it('should return true for eth_sendTransaction method', () => {
      const req: JsonRpcRequest = {
        method: MESSAGE_TYPE.ETH_SEND_TRANSACTION,
        params: [],
        id: 1,
        jsonrpc: '2.0',
      };
      expect(isEthSendTransaction(req)).toBe(true);
    });

    it('should return false for other methods', () => {
      const req: JsonRpcRequest = {
        method: 'eth_getBalance',
        params: [],
        id: 1,
        jsonrpc: '2.0',
      };
      expect(isEthSendTransaction(req)).toBe(false);
    });
  });

  describe('hasValidTransactionParams', () => {
    it('should return true for valid transaction params with "to" field', () => {
      const req: JsonRpcRequest = {
        method: MESSAGE_TYPE.ETH_SEND_TRANSACTION,
        params: [
          {
            to: '0x1234567890123456789012345678901234567890',
            from: '0xabcdef0123456789012345678901234567890123',
            value: '0x0',
            chainId: '0x1',
          },
        ],
        id: 1,
        jsonrpc: '2.0',
      };
      expect(hasValidTransactionParams(req)).toBe(true);
    });

    it('should return false when params is not present', () => {
      const req: JsonRpcRequest = {
        method: MESSAGE_TYPE.ETH_SEND_TRANSACTION,
        id: 1,
        jsonrpc: '2.0',
      } as JsonRpcRequest;
      expect(hasValidTransactionParams(req)).toBe(false);
    });

    it('should return false when params is not an array', () => {
      const req: JsonRpcRequest = {
        method: MESSAGE_TYPE.ETH_SEND_TRANSACTION,
        params: null as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        id: 1,
        jsonrpc: '2.0',
      };
      expect(hasValidTransactionParams(req)).toBe(false);
    });

    it('should return false when params array is empty', () => {
      const req: JsonRpcRequest = {
        method: MESSAGE_TYPE.ETH_SEND_TRANSACTION,
        params: [],
        id: 1,
        jsonrpc: '2.0',
      };
      expect(hasValidTransactionParams(req)).toBe(false);
    });

    it('should return false when first param is not an object', () => {
      const req: JsonRpcRequest = {
        method: MESSAGE_TYPE.ETH_SEND_TRANSACTION,
        params: ['not an object'],
        id: 1,
        jsonrpc: '2.0',
      };
      expect(hasValidTransactionParams(req)).toBe(false);
    });

    it('should return false when first param is null', () => {
      const req: JsonRpcRequest = {
        method: MESSAGE_TYPE.ETH_SEND_TRANSACTION,
        params: [null],
        id: 1,
        jsonrpc: '2.0',
      };
      expect(hasValidTransactionParams(req)).toBe(false);
    });

    it('should return false when "to" field is missing', () => {
      const req: JsonRpcRequest = {
        method: MESSAGE_TYPE.ETH_SEND_TRANSACTION,
        params: [
          {
            from: '0xabcdef0123456789012345678901234567890123',
            value: '0x0',
            chainId: '0x1',
          },
        ],
        id: 1,
        jsonrpc: '2.0',
      };
      expect(hasValidTransactionParams(req)).toBe(false);
    });
  });

  describe('isEthSignTypedData', () => {
    it('should return true for ETH_SIGN_TYPED_DATA', () => {
      const req: JsonRpcRequest = {
        method: MESSAGE_TYPE.ETH_SIGN_TYPED_DATA,
        params: [],
        id: 1,
        jsonrpc: '2.0',
      };
      expect(isEthSignTypedData(req)).toBe(true);
    });

    it('should return true for ETH_SIGN_TYPED_DATA_V1', () => {
      const req: JsonRpcRequest = {
        method: MESSAGE_TYPE.ETH_SIGN_TYPED_DATA_V1,
        params: [],
        id: 1,
        jsonrpc: '2.0',
      };
      expect(isEthSignTypedData(req)).toBe(true);
    });

    it('should return true for ETH_SIGN_TYPED_DATA_V3', () => {
      const req: JsonRpcRequest = {
        method: MESSAGE_TYPE.ETH_SIGN_TYPED_DATA_V3,
        params: [],
        id: 1,
        jsonrpc: '2.0',
      };
      expect(isEthSignTypedData(req)).toBe(true);
    });

    it('should return true for ETH_SIGN_TYPED_DATA_V4', () => {
      const req: JsonRpcRequest = {
        method: MESSAGE_TYPE.ETH_SIGN_TYPED_DATA_V4,
        params: [],
        id: 1,
        jsonrpc: '2.0',
      };
      expect(isEthSignTypedData(req)).toBe(true);
    });

    it('should return false for other methods', () => {
      const req: JsonRpcRequest = {
        method: MESSAGE_TYPE.ETH_SEND_TRANSACTION,
        params: [],
        id: 1,
        jsonrpc: '2.0',
      };
      expect(isEthSignTypedData(req)).toBe(false);
    });
  });

  describe('hasValidTypedDataParams', () => {
    it('should return true for valid typed data params', () => {
      const req: JsonRpcRequest = {
        method: MESSAGE_TYPE.ETH_SIGN_TYPED_DATA_V4,
        params: ['0xaddress', { domain: {}, message: {} }],
        id: 1,
        jsonrpc: '2.0',
      };
      expect(hasValidTypedDataParams(req)).toBe(true);
    });

    it('should return true when second param is a string', () => {
      const req: JsonRpcRequest = {
        method: MESSAGE_TYPE.ETH_SIGN_TYPED_DATA_V4,
        params: ['0xaddress', '{"domain":{}}'],
        id: 1,
        jsonrpc: '2.0',
      };
      expect(hasValidTypedDataParams(req)).toBe(true);
    });

    it('should return false when params is not present', () => {
      const req: JsonRpcRequest = {
        method: MESSAGE_TYPE.ETH_SIGN_TYPED_DATA_V4,
        id: 1,
        jsonrpc: '2.0',
      } as JsonRpcRequest;
      expect(hasValidTypedDataParams(req)).toBe(false);
    });

    it('should return false when params is not an array', () => {
      const req: JsonRpcRequest = {
        method: MESSAGE_TYPE.ETH_SIGN_TYPED_DATA_V4,
        params: null as any, // eslint-disable-line @typescript-eslint/no-explicit-any
        id: 1,
        jsonrpc: '2.0',
      };
      expect(hasValidTypedDataParams(req)).toBe(false);
    });

    it('should return false when params has less than 2 elements', () => {
      const req: JsonRpcRequest = {
        method: MESSAGE_TYPE.ETH_SIGN_TYPED_DATA_V4,
        params: ['0xaddress'],
        id: 1,
        jsonrpc: '2.0',
      };
      expect(hasValidTypedDataParams(req)).toBe(false);
    });

    it('should return false when second param is undefined', () => {
      const req: JsonRpcRequest = {
        method: MESSAGE_TYPE.ETH_SIGN_TYPED_DATA_V4,
        params: ['0xaddress', undefined as any], // eslint-disable-line @typescript-eslint/no-explicit-any
        id: 1,
        jsonrpc: '2.0',
      };
      expect(hasValidTypedDataParams(req)).toBe(false);
    });

    it('should return false when second param is null', () => {
      const req: JsonRpcRequest = {
        method: MESSAGE_TYPE.ETH_SIGN_TYPED_DATA_V4,
        params: ['0xaddress', null],
        id: 1,
        jsonrpc: '2.0',
      };
      expect(hasValidTypedDataParams(req)).toBe(false);
    });
  });

  describe('isConnected', () => {
    it('returns true when the user is connected', () => {
      const req: JsonRpcRequest & { origin?: string } = {
        method: MESSAGE_TYPE.ETH_ACCOUNTS,
        origin: 'https://example.com',
      } as JsonRpcRequest & { origin?: string };
      const getPermittedAccounts = jest.fn().mockReturnValue(['0x123']);
      expect(isConnected(req, getPermittedAccounts)).toBe(true);
    });

    it('returns false when the user is not connected', () => {
      const req: JsonRpcRequest & { origin?: string } = {
        method: MESSAGE_TYPE.ETH_ACCOUNTS,
        origin: 'https://example.com',
      } as JsonRpcRequest & { origin?: string };
      const getPermittedAccounts = jest.fn().mockReturnValue([]);
      expect(isConnected(req, getPermittedAccounts)).toBe(false);
    });

    it('returns false when the method is not eth_accounts', () => {
      const req: JsonRpcRequest & { origin?: string } = {
        method: MESSAGE_TYPE.ETH_SEND_TRANSACTION,
        origin: 'https://example.com',
      } as JsonRpcRequest & { origin?: string };
      const getPermittedAccounts = jest.fn().mockReturnValue(['0x123']);
      expect(isConnected(req, getPermittedAccounts)).toBe(false);
    });

    it('returns false when the origin is not present', () => {
      const req: JsonRpcRequest & { origin?: string } = {
        method: MESSAGE_TYPE.ETH_ACCOUNTS,
      } as JsonRpcRequest & { origin?: string };
      const getPermittedAccounts = jest.fn().mockReturnValue(['0x123']);
      expect(isConnected(req, getPermittedAccounts)).toBe(false);
    });
    it('returns false even if connected but different method', () => {
      const req: JsonRpcRequest & { origin?: string } = {
        method: MESSAGE_TYPE.ETH_SEND_TRANSACTION,
        origin: 'https://example.com',
      } as JsonRpcRequest & { origin?: string };
      const getPermittedAccounts = jest.fn().mockReturnValue(['0x123']);
      expect(isConnected(req, getPermittedAccounts)).toBe(false);
    });
  });

  describe('connectScreenHasBeenPrompted', () => {
    it('returns true when the method is eth_request_accounts', () => {
      const req: JsonRpcRequest = {
        method: MESSAGE_TYPE.ETH_REQUEST_ACCOUNTS,
        id: 1,
        jsonrpc: '2.0',
      } as JsonRpcRequest;
      expect(connectScreenHasBeenPrompted(req)).toBe(true);
    });

    it('returns true when the method is wallet_request_permissions', () => {
      const req: JsonRpcRequest = {
        method: MESSAGE_TYPE.WALLET_REQUEST_PERMISSIONS,
        id: 1,
        jsonrpc: '2.0',
      } as JsonRpcRequest;
      expect(connectScreenHasBeenPrompted(req)).toBe(true);
    });

    it('returns false when the method is not eth_request_accounts or wallet_request_permissions', () => {
      const req: JsonRpcRequest = {
        method: MESSAGE_TYPE.ETH_SEND_TRANSACTION,
        id: 1,
        jsonrpc: '2.0',
      } as JsonRpcRequest;
      expect(connectScreenHasBeenPrompted(req)).toBe(false);
    });
  });

  describe('isWalletSendCalls', () => {
    it('returns true when the method is wallet_sendCalls', () => {
      const req: JsonRpcRequest = {
        method: MESSAGE_TYPE.WALLET_SEND_CALLS,
        id: 1,
        jsonrpc: '2.0',
      } as JsonRpcRequest;
      expect(isWalletSendCalls(req)).toBe(true);
    });

    it('returns false for other methods', () => {
      const req: JsonRpcRequest = {
        method: MESSAGE_TYPE.ETH_SEND_TRANSACTION,
        id: 1,
        jsonrpc: '2.0',
      } as JsonRpcRequest;
      expect(isWalletSendCalls(req)).toBe(false);
    });
  });

  describe('hasValidSendCallsParams', () => {
    const createRequest = (params?: unknown): JsonRpcRequest =>
      ({
        method: MESSAGE_TYPE.WALLET_SEND_CALLS,
        params,
        id: 1,
        jsonrpc: '2.0',
      }) as JsonRpcRequest;

    it('returns true when params contain a calls array of objects', () => {
      const req = createRequest([
        {
          version: '2.0.0',
          chainId: '0x1',
          calls: [{ to: '0x1234', data: '0x' }, { data: '0x' }],
        },
      ]);
      expect(hasValidSendCallsParams(req)).toBe(true);
    });

    it('returns true when calls is empty', () => {
      const req = createRequest([{ calls: [] }]);
      expect(hasValidSendCallsParams(req)).toBe(true);
    });

    it('returns false when params are missing', () => {
      const req = createRequest(undefined);
      expect(hasValidSendCallsParams(req)).toBe(false);
    });

    it('returns false when params are an empty array', () => {
      const req = createRequest([]);
      expect(hasValidSendCallsParams(req)).toBe(false);
    });

    it('returns false when the first param is not an object', () => {
      const req = createRequest(['not-an-object']);
      expect(hasValidSendCallsParams(req)).toBe(false);
    });

    it('returns false when calls is missing', () => {
      const req = createRequest([{ version: '2.0.0' }]);
      expect(hasValidSendCallsParams(req)).toBe(false);
    });

    it('returns false when calls is not an array', () => {
      const req = createRequest([{ calls: 'not-an-array' }]);
      expect(hasValidSendCallsParams(req)).toBe(false);
    });

    it('returns true when a call entry is not an object', () => {
      // Entry-level validation is the caller's job (per-call skip), so one
      // malformed entry does not invalidate the batch for scanning purposes.
      const req = createRequest([{ calls: [{ to: '0x1234' }, null] }]);
      expect(hasValidSendCallsParams(req)).toBe(true);
    });
  });

  describe('getWrappedRequestMethod', () => {
    const createRequest = (method: string, params: unknown) =>
      ({
        method,
        params,
        id: 1,
        jsonrpc: '2.0',
      }) as unknown as JsonRpcRequest;

    it('returns the inner method of a wallet_invokeMethod request', () => {
      const req = createRequest(MESSAGE_TYPE.WALLET_INVOKE_METHOD, {
        scope: 'eip155:1',
        request: { method: MESSAGE_TYPE.ETH_SEND_TRANSACTION, params: [] },
      });
      expect(getWrappedRequestMethod(req)).toBe(
        MESSAGE_TYPE.ETH_SEND_TRANSACTION,
      );
    });

    it('returns undefined for any other method', () => {
      const req = createRequest(MESSAGE_TYPE.ETH_SEND_TRANSACTION, []);
      expect(getWrappedRequestMethod(req)).toBeUndefined();
    });

    (
      [
        ['missing params', undefined],
        ['missing request', { scope: 'eip155:1' }],
        ['missing inner method', { scope: 'eip155:1', request: {} }],
        [
          'non-string inner method',
          { scope: 'eip155:1', request: { method: 42 } },
        ],
      ] as [string, unknown][]
    ).forEach(([label, params]) => {
      it(`returns undefined for a request with ${label}`, () => {
        const req = createRequest(MESSAGE_TYPE.WALLET_INVOKE_METHOD, params);
        expect(getWrappedRequestMethod(req)).toBeUndefined();
      });
    });
  });

  describe('isCaipConnected', () => {
    const createRequest = (method: string, origin?: string) =>
      ({
        method,
        params: [],
        id: 1,
        jsonrpc: '2.0',
        origin,
      }) as JsonRpcRequest & { origin?: string };

    it('returns true for wallet_getSession when the origin holds a CAIP-25 permission', () => {
      const req = createRequest(
        MESSAGE_TYPE.WALLET_GET_SESSION,
        'https://example.com',
      );
      expect(isCaipConnected(req, () => true)).toBe(true);
    });

    it('returns false for wallet_getSession when the origin holds no CAIP-25 permission', () => {
      const req = createRequest(
        MESSAGE_TYPE.WALLET_GET_SESSION,
        'https://example.com',
      );
      expect(isCaipConnected(req, () => false)).toBe(false);
    });

    it('returns false when the request has no origin', () => {
      const req = createRequest(MESSAGE_TYPE.WALLET_GET_SESSION);
      expect(isCaipConnected(req, () => true)).toBe(false);
    });

    it('returns false for any other method', () => {
      const req = createRequest(
        MESSAGE_TYPE.WALLET_CREATE_SESSION,
        'https://example.com',
      );
      expect(isCaipConnected(req, () => true)).toBe(false);
    });
  });
});
