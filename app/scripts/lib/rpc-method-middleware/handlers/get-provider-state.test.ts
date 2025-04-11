import type { JsonRpcEngineEndCallback } from '@metamask/json-rpc-engine';
import type { PendingJsonRpcResponse } from '@metamask/utils';

import type {
  GetProviderState,
  ProviderStateHandlerResult,
} from './get-provider-state';
import getProviderState from './get-provider-state';
import type { HandlerRequestType } from './types';

describe('getProviderState', () => {
  let mockEnd: JsonRpcEngineEndCallback;
  let mockGetProviderState: GetProviderState;

  beforeEach(() => {
    mockEnd = jest.fn();
    mockGetProviderState = jest.fn().mockResolvedValue({
      chainId: '0x539',
      isUnlocked: true,
      networkVersion: '',
      accounts: [],
    });
  });

  it('should call getProviderState when the handler is invoked', async () => {
    const req: HandlerRequestType = {
      origin: 'testOrigin',
      params: [],
      id: '22',
      jsonrpc: '2.0',
      method: 'metamask_getProviderState',
    };

    const res: PendingJsonRpcResponse<ProviderStateHandlerResult> = {
      id: '22',
      jsonrpc: '2.0',
      result: {
        chainId: '0x539',
        isUnlocked: true,
        networkVersion: '',
        accounts: [],
      },
    };

    await getProviderState.implementation(req, res, jest.fn(), mockEnd, {
      getProviderState: mockGetProviderState,
    });

    expect(mockGetProviderState).toHaveBeenCalledWith(req.origin);
    expect(res.result).toStrictEqual({
      chainId: '0x539',
      isUnlocked: true,
      networkVersion: '',
      accounts: [],
    });
    expect(mockEnd).toHaveBeenCalled();
  });
});
