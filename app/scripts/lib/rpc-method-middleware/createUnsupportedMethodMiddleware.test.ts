import { jsonrpc2 } from '@metamask/utils';
import { UNSUPPORTED_RPC_METHODS } from '../../../../shared/constants/network';
import { createUnsupportedMethodMiddleware } from '.';

describe('createUnsupportedMethodMiddleware', () => {
  const getMockRequest = (method: string) => ({
    jsonrpc: jsonrpc2,
    id: 1,
    method,
  });
  const getMockResponse = () => ({ jsonrpc: jsonrpc2, id: 'foo' });

  it('forwards requests whose methods are not on the list of unsupported methods', () => {
    const middleware = createUnsupportedMethodMiddleware();
    const nextMock = jest.fn();
    const endMock = jest.fn();

    middleware(getMockRequest('foo'), getMockResponse(), nextMock, endMock);

    expect(nextMock).toHaveBeenCalledTimes(1);
    expect(endMock).not.toHaveBeenCalled();
  });

  // @ts-expect-error This function is missing from the Mocha type definitions
  it.each([...UNSUPPORTED_RPC_METHODS.keys()])(
    'ends requests for methods that are on the list of unsupported methods: %s',
    (method: string) => {
      const middleware = createUnsupportedMethodMiddleware();
      const nextMock = jest.fn();
      const endMock = jest.fn();

      const response = getMockResponse();
      middleware(getMockRequest(method), response, nextMock, endMock);

      expect('result' in response).toBe(false);
      expect(nextMock).not.toHaveBeenCalled();
      expect(endMock).toHaveBeenCalledTimes(1);
    },
  );
});
