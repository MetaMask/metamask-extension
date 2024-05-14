import { jsonrpc2 } from '@metamask/utils';
import createDupeReqFilterMiddleware from './createDupeReqFilterMiddleware';

describe('createDupeReqFilterMiddleware', () => {
  const getMockRequest = (id: number | string) => ({
    jsonrpc: jsonrpc2,
    id,
    method: 'foo',
  });
  const getMockResponse = () => ({ jsonrpc: jsonrpc2, id: 'foo' });

  it('call function next if request is seen first time', () => {
    const filterFn = createDupeReqFilterMiddleware();
    const nextMock = jest.fn();
    const endMock = jest.fn();

    filterFn(getMockRequest(1), getMockResponse(), nextMock, endMock);

    expect(nextMock).toHaveBeenCalledTimes(1);
    expect(endMock).not.toHaveBeenCalled();
  });

  it('call function end if request is seen second time', () => {
    const filterFn = createDupeReqFilterMiddleware();
    const nextMock = jest.fn();
    const endMock = jest.fn();

    filterFn(getMockRequest(1), getMockResponse(), nextMock, endMock);
    expect(nextMock).toHaveBeenCalledTimes(1);
    expect(endMock).not.toHaveBeenCalled();

    filterFn(getMockRequest(1), getMockResponse(), nextMock, endMock);
    expect(nextMock).toHaveBeenCalledTimes(1);
    expect(endMock).toHaveBeenCalledTimes(1);
  });
});
