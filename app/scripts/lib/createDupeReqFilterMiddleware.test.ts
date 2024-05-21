import { jsonrpc2 } from '@metamask/utils';
import createDupeReqFilterMiddleware, {
  THREE_MINUTES,
} from './createDupeReqFilterMiddleware';

describe('createDupeReqFilterMiddleware', () => {
  const getMockRequest = (id: number | string) => ({
    jsonrpc: jsonrpc2,
    id,
    method: 'foo',
  });
  const getMockResponse = () => ({ jsonrpc: jsonrpc2, id: 'foo' });

  beforeEach(() => {
    jest.useFakeTimers({ now: 10 });
  });

  it('forwards requests with ids seen for the first time', () => {
    const filterFn = createDupeReqFilterMiddleware();
    const nextMock = jest.fn();
    const endMock = jest.fn();

    filterFn(getMockRequest(1), getMockResponse(), nextMock, endMock);

    expect(nextMock).toHaveBeenCalledTimes(1);
    expect(endMock).not.toHaveBeenCalled();
  });

  it('ends the request if the id has been seen before', () => {
    const filterFn = createDupeReqFilterMiddleware();
    const nextMock = jest.fn();
    const endMock = jest.fn();

    filterFn(getMockRequest(1), getMockResponse(), nextMock, endMock);

    expect(nextMock).toHaveBeenCalledTimes(1);
    expect(endMock).not.toHaveBeenCalled();

    const response = getMockResponse();
    filterFn(getMockRequest(1), response, nextMock, endMock);
    expect('result' in response).toBe(false);
    expect(nextMock).toHaveBeenCalledTimes(1);
    expect(endMock).toHaveBeenCalledTimes(1);
  });

  it('forwards JSON-RPC notifications (requests without ids)', () => {
    const filterFn = createDupeReqFilterMiddleware();
    const nextMock = jest.fn();
    const endMock = jest.fn();

    const notification = getMockRequest(1);
    // @ts-expect-error Intentional destructive testing
    delete notification.id;
    filterFn(notification, getMockResponse(), nextMock, endMock);
    filterFn(notification, getMockResponse(), nextMock, endMock);

    expect(nextMock).toHaveBeenCalledTimes(2);
    expect(endMock).not.toHaveBeenCalled();
  });

  it('expires single id after three minutes', () => {
    const filterFn = createDupeReqFilterMiddleware();
    const nextMock = jest.fn();
    const endMock = jest.fn();

    filterFn(getMockRequest(0), getMockResponse(), nextMock, endMock);

    jest.advanceTimersByTime(THREE_MINUTES);

    filterFn(getMockRequest(0), getMockResponse(), nextMock, endMock);

    expect(nextMock).toHaveBeenCalledTimes(2);
    expect(endMock).not.toHaveBeenCalled();
  });

  it('expires multiple ids after three minutes', () => {
    const filterFn = createDupeReqFilterMiddleware();
    const nextMock = jest.fn();
    const endMock = jest.fn();

    filterFn(getMockRequest(0), getMockResponse(), nextMock, endMock);
    filterFn(getMockRequest(1), getMockResponse(), nextMock, endMock);

    jest.advanceTimersByTime(1);

    filterFn(getMockRequest(2), getMockResponse(), nextMock, endMock);

    jest.advanceTimersByTime(THREE_MINUTES);

    filterFn(getMockRequest(0), getMockResponse(), nextMock, endMock);
    filterFn(getMockRequest(1), getMockResponse(), nextMock, endMock);
    // This should be ignored since id 2 has yet to expire.
    filterFn(getMockRequest(2), getMockResponse(), nextMock, endMock);

    expect(nextMock).toHaveBeenCalledTimes(5);
    expect(endMock).toHaveBeenCalledTimes(1);
  });

  it('expires single id in three minute intervals', () => {
    const filterFn = createDupeReqFilterMiddleware();
    const nextMock = jest.fn();
    const endMock = jest.fn();

    filterFn(getMockRequest(0), getMockResponse(), nextMock, endMock);

    jest.advanceTimersByTime(THREE_MINUTES);

    filterFn(getMockRequest(0), getMockResponse(), nextMock, endMock);
    // This should be ignored
    filterFn(getMockRequest(0), getMockResponse(), nextMock, endMock);

    expect(nextMock).toHaveBeenCalledTimes(2);
    expect(endMock).toHaveBeenCalledTimes(1);

    jest.advanceTimersByTime(THREE_MINUTES);

    filterFn(getMockRequest(0), getMockResponse(), nextMock, endMock);

    expect(nextMock).toHaveBeenCalledTimes(3);
    expect(endMock).toHaveBeenCalledTimes(1);
  });

  it('handles running expiry job without seeing any ids', () => {
    const filterFn = createDupeReqFilterMiddleware();
    const nextMock = jest.fn();
    const endMock = jest.fn();

    jest.advanceTimersByTime(THREE_MINUTES + 1);

    filterFn(getMockRequest(0), getMockResponse(), nextMock, endMock);

    expect(nextMock).toHaveBeenCalledTimes(1);
    expect(endMock).not.toHaveBeenCalled();
  });
});
