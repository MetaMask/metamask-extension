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

  it('forwards requests whose methods are not in the list of unsupported methods', () => {
    const middleware = createUnsupportedMethodMiddleware(new Set());
    const nextMock = jest.fn();
    const endMock = jest.fn();

    middleware(getMockRequest('foo'), getMockResponse(), nextMock, endMock);

    expect(nextMock).toHaveBeenCalledTimes(1);
    expect(endMock).not.toHaveBeenCalled();
  });

  // @ts-expect-error This function is missing from the Mocha type definitions
  it.each([...UNSUPPORTED_RPC_METHODS])(
    'ends requests for default unsupported rpc methods when no list is provided: %s',
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

  const unsupportedMethods = new Set(['foo', 'bar']);

  // @ts-expect-error This function is missing from the Mocha type definitions
  it.each([...unsupportedMethods])(
    'ends requests for methods that are in the provided list of unsupported methods: %s',
    (method: string) => {
      const middleware = createUnsupportedMethodMiddleware(unsupportedMethods);
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
