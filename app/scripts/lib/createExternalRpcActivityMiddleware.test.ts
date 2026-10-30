import { SubjectType } from '@metamask/permission-controller';
import { JsonRpcRequest, PendingJsonRpcResponse } from '@metamask/utils';
import {
  recordDappRpc,
  recordExternalExtensionRpc,
  recordSnapRpc,
} from '../../../shared/lib/telemetry/last-activity';
import createExternalRpcActivityMiddleware from './createExternalRpcActivityMiddleware';

jest.mock('../../../shared/lib/telemetry/last-activity', () => ({
  recordDappRpc: jest.fn(),
  recordExternalExtensionRpc: jest.fn(),
  recordSnapRpc: jest.fn(),
}));

const request: JsonRpcRequest = {
  id: 1,
  jsonrpc: '2.0',
  method: 'eth_chainId',
};

const response: PendingJsonRpcResponse<null> = {
  id: 1,
  jsonrpc: '2.0',
};

describe('createExternalRpcActivityMiddleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('records a website request and calls next', () => {
    const next = jest.fn();

    createExternalRpcActivityMiddleware(SubjectType.Website)(
      request,
      response,
      next,
    );

    expect(recordDappRpc).toHaveBeenCalledTimes(1);
    expect(recordSnapRpc).not.toHaveBeenCalled();
    expect(recordExternalExtensionRpc).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('records a Snap request and calls next', () => {
    const next = jest.fn();

    createExternalRpcActivityMiddleware(SubjectType.Snap)(
      request,
      response,
      next,
    );

    expect(recordSnapRpc).toHaveBeenCalledTimes(1);
    expect(recordDappRpc).not.toHaveBeenCalled();
    expect(recordExternalExtensionRpc).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('records an external extension request and calls next', () => {
    const next = jest.fn();

    createExternalRpcActivityMiddleware(SubjectType.Extension)(
      request,
      response,
      next,
    );

    expect(recordExternalExtensionRpc).toHaveBeenCalledTimes(1);
    expect(recordDappRpc).not.toHaveBeenCalled();
    expect(recordSnapRpc).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('ignores an internal subject and still calls next', () => {
    const next = jest.fn();

    createExternalRpcActivityMiddleware(SubjectType.Internal)(
      request,
      response,
      next,
    );

    expect(recordDappRpc).not.toHaveBeenCalled();
    expect(recordSnapRpc).not.toHaveBeenCalled();
    expect(recordExternalExtensionRpc).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });
});
