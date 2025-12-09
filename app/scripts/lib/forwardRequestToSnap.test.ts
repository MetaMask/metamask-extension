import type { WalletMiddlewareContext } from '@metamask/eth-json-rpc-middleware';
import { Hex, JsonRpcRequest } from '@metamask/utils';
import { HandlerType } from '@metamask/snaps-utils';
import { InternalError, type SnapId } from '@metamask/snaps-sdk';

import { forwardRequestToSnap } from './forwardRequestToSnap';

describe('forwardRequestToSnap', () => {
  const SNAP_ID_MOCK = 'local:test-snap' as SnapId;
  const ID_MOCK = '0x1234' as Hex;
  const ORIGIN_MOCK = 'test.com';

  const REQUEST_MOCK = {
    id: 1,
    jsonrpc: '2.0',
    method: 'test_method',
    params: { test: 'value' },
  } as JsonRpcRequest;

  const CONTEXT_MOCK = new Map([
    ['origin', ORIGIN_MOCK],
  ]) as WalletMiddlewareContext;

  const INVOKE_RESULT_MOCK = { result: { success: true } } as Record<
    string,
    unknown
  >;

  const handleRequestMock = jest.fn();

  beforeEach(() => {
    jest.resetAllMocks();
    handleRequestMock.mockResolvedValue(INVOKE_RESULT_MOCK);
  });

  describe('when snapId is provided', () => {
    it('forwards the request to the snap with correct arguments', async () => {
      const result = await forwardRequestToSnap(
        { handleRequest: handleRequestMock, snapId: SNAP_ID_MOCK },
        { id: ID_MOCK },
        REQUEST_MOCK,
        CONTEXT_MOCK,
      );

      expect(handleRequestMock).toHaveBeenCalledWith({
        snapId: SNAP_ID_MOCK,
        origin: ORIGIN_MOCK,
        handler: HandlerType.OnRpcRequest,
        request: {
          jsonrpc: '2.0',
          method: 'test_method',
          params: { test: 'value' },
        },
      });

      expect(result).toBe(INVOKE_RESULT_MOCK);
    });

    it('forwards the request with empty params when params are not provided', async () => {
      const requestWithoutParams = {
        id: 1,
        jsonrpc: '2.0',
        method: 'test_method',
      } as JsonRpcRequest;

      const result = await forwardRequestToSnap(
        { handleRequest: handleRequestMock, snapId: SNAP_ID_MOCK },
        { id: ID_MOCK },
        requestWithoutParams,
        CONTEXT_MOCK,
      );

      expect(handleRequestMock).toHaveBeenCalledWith({
        snapId: SNAP_ID_MOCK,
        origin: ORIGIN_MOCK,
        handler: HandlerType.OnRpcRequest,
        request: {
          jsonrpc: '2.0',
          method: 'test_method',
          params: undefined,
        },
      });

      expect(result).toBe(INVOKE_RESULT_MOCK);
    });

    it('returns the response from the snap', async () => {
      const customResponse = { custom: 'response' };
      handleRequestMock.mockResolvedValue(customResponse);

      const result = await forwardRequestToSnap(
        { handleRequest: handleRequestMock, snapId: SNAP_ID_MOCK },
        { id: ID_MOCK },
        REQUEST_MOCK,
        CONTEXT_MOCK,
      );

      expect(result).toBe(customResponse);
    });

    it('propagates errors from the snap', async () => {
      const error = new Error('Snap error');
      handleRequestMock.mockRejectedValue(error);

      await expect(
        forwardRequestToSnap(
          { handleRequest: handleRequestMock, snapId: SNAP_ID_MOCK },
          { id: ID_MOCK },
          REQUEST_MOCK,
          CONTEXT_MOCK,
        ),
      ).rejects.toThrow('Snap error');
    });
  });

  describe('when snapId is not provided', () => {
    it('throws InternalError with method name', async () => {
      await expect(
        forwardRequestToSnap(
          { handleRequest: handleRequestMock, snapId: '' as SnapId },
          { id: ID_MOCK },
          REQUEST_MOCK,
          CONTEXT_MOCK,
        ),
      ).rejects.toThrow(
        new InternalError('No snapId configured for method test_method'),
      );
    });

    it('throws InternalError with method name for falsy snapId', async () => {
      await expect(
        forwardRequestToSnap(
          {
            handleRequest: handleRequestMock,
            snapId: null as unknown as SnapId,
          },
          { id: ID_MOCK },
          REQUEST_MOCK,
          CONTEXT_MOCK,
        ),
      ).rejects.toThrow(
        new InternalError('No snapId configured for method test_method'),
      );
    });

    it('throws InternalError with method name for undefined snapId', async () => {
      await expect(
        forwardRequestToSnap(
          {
            handleRequest: handleRequestMock,
            snapId: undefined as unknown as SnapId,
          },
          { id: ID_MOCK },
          REQUEST_MOCK,
          CONTEXT_MOCK,
        ),
      ).rejects.toThrow(
        new InternalError('No snapId configured for method test_method'),
      );
    });

    it('throws InternalError with method name for undefined origin', async () => {
      const emptyContextMock = new Map() as WalletMiddlewareContext;

      await expect(
        forwardRequestToSnap(
          { handleRequest: handleRequestMock, snapId: SNAP_ID_MOCK },
          { id: ID_MOCK },
          { ...REQUEST_MOCK },
          emptyContextMock,
        ),
      ).rejects.toThrow(
        new InternalError('No origin specified for method test_method'),
      );
    });

    it('includes the correct method name in error message', async () => {
      const customMethodRequest = {
        ...REQUEST_MOCK,
        method: 'custom_method',
      };

      await expect(
        forwardRequestToSnap(
          { handleRequest: handleRequestMock, snapId: '' as SnapId },
          { id: ID_MOCK },
          customMethodRequest,
          CONTEXT_MOCK,
        ),
      ).rejects.toThrow(
        new InternalError('No snapId configured for method custom_method'),
      );
    });
  });

  describe('request structure', () => {
    it('preserves the original request structure in the forwarded request', async () => {
      const complexRequest = {
        id: 1,
        jsonrpc: '2.0',
        method: 'complex_method',
        params: {
          nested: {
            value: 'test',
            array: [1, 2, 3],
          },
        },
      } as JsonRpcRequest;

      await forwardRequestToSnap(
        { handleRequest: handleRequestMock, snapId: SNAP_ID_MOCK },
        { id: ID_MOCK },
        complexRequest,
        CONTEXT_MOCK,
      );

      expect(handleRequestMock).toHaveBeenCalledWith({
        snapId: SNAP_ID_MOCK,
        origin: ORIGIN_MOCK,
        handler: HandlerType.OnRpcRequest,
        request: {
          jsonrpc: '2.0',
          method: 'complex_method',
          params: {
            nested: {
              value: 'test',
              array: [1, 2, 3],
            },
          },
        },
      });
    });

    it('always uses HandlerType.OnRpcRequest', async () => {
      await forwardRequestToSnap(
        { handleRequest: handleRequestMock, snapId: SNAP_ID_MOCK },
        { id: ID_MOCK },
        REQUEST_MOCK,
        CONTEXT_MOCK,
      );

      expect(handleRequestMock).toHaveBeenCalledWith(
        expect.objectContaining({
          handler: HandlerType.OnRpcRequest,
        }),
      );
    });

    it('always sets jsonrpc to 2.0 in the forwarded request', async () => {
      await forwardRequestToSnap(
        { handleRequest: handleRequestMock, snapId: SNAP_ID_MOCK },
        { id: ID_MOCK },
        REQUEST_MOCK,
        CONTEXT_MOCK,
      );

      expect(handleRequestMock).toHaveBeenCalledWith(
        expect.objectContaining({
          request: expect.objectContaining({
            jsonrpc: '2.0',
          }),
        }),
      );
    });
  });
});
