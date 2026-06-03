import { MiddlewareContext } from '@metamask/json-rpc-engine/v2';
import type { TransactionMeta } from '@metamask/transaction-controller';
import type { JsonRpcRequest } from '@metamask/utils';

import { txMetaStub } from '../../../../test/stub/tx-meta-stub';
import { formatTxMetaForRpcResult } from '../util';
import {
  createPendingNonceMiddleware,
  createPendingTxMiddleware,
} from './pending';

const address = '0xF231D46dD78806E1DD93442cf33C7671f8538748';

const createRequest = (method: string, params: string[]) =>
  ({ id: 1, jsonrpc: '2.0', method, params }) as JsonRpcRequest;
const createContext = () =>
  new MiddlewareContext<Record<PropertyKey, unknown>>({
    networkClientId: 'testNetworkClientId',
  });

describe('PendingNonceMiddleware', () => {
  describe('#createPendingNonceMiddleware', () => {
    it('should call next if not a eth_getTransactionCount request', async () => {
      const getPendingNonce = jest
        .fn()
        .mockRejectedValue(new Error('should not have been called'));
      const pendingNonceMiddleware = createPendingNonceMiddleware({
        getPendingNonce,
      });

      const request = createRequest('eth_getBlockByNumber', []);
      const next = jest.fn();

      const result = await pendingNonceMiddleware({
        request,
        context: createContext(),
        next,
      });

      expect(next).toHaveBeenCalledTimes(1);
      expect(result).toBeUndefined();
    });

    it('should call next if not a "pending" block request', async () => {
      const getPendingNonce = jest
        .fn()
        .mockRejectedValue(new Error('should not have been called'));
      const pendingNonceMiddleware = createPendingNonceMiddleware({
        getPendingNonce,
      });

      const request = createRequest('eth_getTransactionCount', [address]);
      const next = jest.fn();

      const result = await pendingNonceMiddleware({
        request,
        context: createContext(),
        next,
      });

      expect(next).toHaveBeenCalledTimes(1);
      expect(result).toBeUndefined();
    });

    it('should fill the result with a the "pending" nonce', async () => {
      const getPendingNonce = jest.fn().mockResolvedValue(2);
      const pendingNonceMiddleware = createPendingNonceMiddleware({
        getPendingNonce,
      });

      const request = createRequest('eth_getTransactionCount', [
        address,
        'pending',
      ]);
      const next = jest.fn();

      const result = await pendingNonceMiddleware({
        request,
        context: createContext(),
        next,
      });

      expect(result).toBe(2);
      expect(getPendingNonce).toHaveBeenCalledTimes(1);
      expect(getPendingNonce).toHaveBeenCalledWith(
        address,
        'testNetworkClientId',
      );
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe('#createPendingTxMiddleware', () => {
    it('should call next if not a eth_getTransactionByHash request', async () => {
      const getPendingTransactionByHash = jest
        .fn()
        .mockRejectedValue(new Error('should not have been called'));
      const pendingTxMiddleware = createPendingTxMiddleware({
        getPendingTransactionByHash,
      });

      const request = createRequest('eth_getBlockByNumber', []);
      const next = jest.fn();

      const result = await pendingTxMiddleware({
        request,
        context: createContext(),
        next,
      });

      expect(result).toBeUndefined();
      expect(next).toHaveBeenCalledTimes(1);
    });

    it('should call next if no pending txMeta is in history', async () => {
      const getPendingTransactionByHash = jest
        .fn()
        .mockReturnValueOnce(undefined);
      const pendingTxMiddleware = createPendingTxMiddleware({
        getPendingTransactionByHash,
      });

      const request = createRequest('eth_getTransactionByHash', [address]);
      const next = jest.fn();

      const result = await pendingTxMiddleware({
        request,
        context: createContext(),
        next,
      });

      expect(result).toBeUndefined();
      expect(next).toHaveBeenCalledTimes(1);
    });

    it('should fill the result with a the "pending" tx the result should match the rpc spec', async () => {
      const getPendingTransactionByHash = jest
        .fn()
        .mockReturnValueOnce(txMetaStub as unknown as TransactionMeta);
      const pendingTxMiddleware = createPendingTxMiddleware({
        getPendingTransactionByHash,
      });

      const request = createRequest('eth_getTransactionByHash', [
        address,
        'pending',
      ]);
      const next = jest.fn();

      const result = await pendingTxMiddleware({
        request,
        context: createContext(),
        next,
      });

      // @ts-expect-error - txMetaStub is not a valid TransactionMeta
      expect(result).toStrictEqual(formatTxMetaForRpcResult({ ...txMetaStub }));
      expect(next).not.toHaveBeenCalled();
    });
  });
});
