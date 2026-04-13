import { JsonRpcRequest } from '@metamask/utils';
import { MESSAGE_TYPE } from '../../../../shared/constants/app';
import {
  isWalletSendCalls,
  hasValidSendCallsParams,
} from './trust-signals-util';

const createMockRequest = (
  method: string,
  params?: unknown[],
): JsonRpcRequest => ({
  method,
  params,
  id: 1,
  jsonrpc: '2.0' as const,
});

describe('trust-signals-util', () => {
  describe('isWalletSendCalls', () => {
    it('returns true for wallet_sendCalls', () => {
      const req = createMockRequest(MESSAGE_TYPE.WALLET_SEND_CALLS);
      expect(isWalletSendCalls(req)).toBe(true);
    });

    it('returns false for eth_sendTransaction', () => {
      const req = createMockRequest(MESSAGE_TYPE.ETH_SEND_TRANSACTION);
      expect(isWalletSendCalls(req)).toBe(false);
    });

    it('returns false for unrelated methods', () => {
      const req = createMockRequest('eth_getBalance');
      expect(isWalletSendCalls(req)).toBe(false);
    });
  });

  describe('hasValidSendCallsParams', () => {
    it('returns false when request has no params property', () => {
      const req = {
        method: 'test',
        id: 1,
        jsonrpc: '2.0',
      } as unknown as JsonRpcRequest;
      expect(hasValidSendCallsParams(req)).toBe(false);
    });

    it('returns false when params is null', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const req = createMockRequest('test', null as any);
      expect(hasValidSendCallsParams(req)).toBe(false);
    });

    it('returns false when params is undefined', () => {
      const req = createMockRequest('test', undefined);
      expect(hasValidSendCallsParams(req)).toBe(false);
    });

    it('returns false when params is not an array', () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const req = createMockRequest('test', 'invalid' as any);
      expect(hasValidSendCallsParams(req)).toBe(false);
    });

    it('returns false when params is an empty array', () => {
      const req = createMockRequest('test', []);
      expect(hasValidSendCallsParams(req)).toBe(false);
    });

    it('returns false when first param is null', () => {
      const req = createMockRequest('test', [null]);
      expect(hasValidSendCallsParams(req)).toBe(false);
    });

    it('returns false when first param is a string', () => {
      const req = createMockRequest('test', ['invalid']);
      expect(hasValidSendCallsParams(req)).toBe(false);
    });

    it('returns false when first param has no calls property', () => {
      const req = createMockRequest('test', [{}]);
      expect(hasValidSendCallsParams(req)).toBe(false);
    });

    it('returns false when calls is not an array', () => {
      const req = createMockRequest('test', [{ calls: 'not-array' }]);
      expect(hasValidSendCallsParams(req)).toBe(false);
    });

    it('returns true for valid calls array (empty)', () => {
      const req = createMockRequest('test', [{ calls: [] }]);
      expect(hasValidSendCallsParams(req)).toBe(true);
    });

    it('returns true for valid calls array (populated)', () => {
      const req = createMockRequest('test', [{ calls: [{ to: '0x123' }] }]);
      expect(hasValidSendCallsParams(req)).toBe(true);
    });
  });
});
