import type { JsonRpcEngineEndCallback } from '@metamask/json-rpc-engine';
import type { PendingJsonRpcResponse } from '@metamask/utils';
import getStateLogs, { HandleGetStateLogsRequest } from './get-state-logs';

describe('getStateLogs', () => {
  let mockEnd: JsonRpcEngineEndCallback;
  let mockHandleGetStateLogsRequest: HandleGetStateLogsRequest;

  beforeEach(() => {
    mockEnd = jest.fn();
    mockHandleGetStateLogsRequest = jest
      .fn()
      .mockResolvedValue('{"metamask":{"isInitialized":true}}');
  });

  it('calls handleGetStateLogsRequest with origin and returns state logs', async () => {
    const req = {
      origin: 'https://support.metamask.io',
      id: '22',
      jsonrpc: '2.0',
      method: 'metamask_getStateLogs',
    };

    const res: PendingJsonRpcResponse<string> = {
      id: '22',
      jsonrpc: '2.0',
      result: '',
    };

    await getStateLogs.implementation(req, res, jest.fn(), mockEnd, {
      handleGetStateLogsRequest: mockHandleGetStateLogsRequest,
    });

    expect(mockHandleGetStateLogsRequest).toHaveBeenCalledWith(req.origin);
    expect(res.result).toBe('{"metamask":{"isInitialized":true}}');
    expect(mockEnd).toHaveBeenCalledWith();
  });
});
