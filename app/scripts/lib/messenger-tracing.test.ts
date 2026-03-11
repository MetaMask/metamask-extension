import { Messenger } from '@metamask/messenger';
import { getActiveSpan, trace, TraceName } from '../../../shared/lib/trace';
import { wrapMessengerWithTracing } from './messenger-tracing';

jest.mock('../../../shared/lib/trace', () => ({
  getActiveSpan: jest.fn(),
  trace: jest.fn((_request: unknown, fn: () => unknown) => fn()),
  TraceName: { MessengerCall: 'Messenger Call' },
}));

type TestGetStateAction = {
  type: 'Test:getState';
  handler: () => string;
};

type TestDoWorkAction = {
  type: 'Test:doWork';
  handler: (arg1: string, arg2: string) => string;
};

type TestFailAction = {
  type: 'Test:fail';
  handler: () => void;
};

type TestActions = TestGetStateAction | TestDoWorkAction | TestFailAction;

describe('wrapMessengerWithTracing', () => {
  const traceMock = trace as jest.Mock;
  const getActiveSpanMock = getActiveSpan as jest.Mock;

  beforeEach(() => {
    getActiveSpanMock.mockReturnValue({}); // Active span present
    traceMock.mockClear();
    traceMock.mockImplementation((_request: unknown, fn: () => unknown) =>
      fn(),
    );
  });

  it('skips trace when no active span (avoids overhead when tracing disabled)', () => {
    getActiveSpanMock.mockReturnValue(null);
    const messenger = new Messenger<'Test', TestActions, never>({
      namespace: 'Test',
    });
    const handler = jest.fn().mockReturnValue('result');
    messenger.registerActionHandler('Test:getState', handler);

    const wrapped = wrapMessengerWithTracing(messenger);
    const result = wrapped.call('Test:getState');

    expect(traceMock).not.toHaveBeenCalled();
    expect(result).toBe('result');
  });

  it('wraps messenger.call with tracing', () => {
    const messenger = new Messenger<'Test', TestActions, never>({
      namespace: 'Test',
    });
    const handler = jest.fn().mockReturnValue('result');
    messenger.registerActionHandler('Test:getState', handler);

    const wrapped = wrapMessengerWithTracing(messenger);
    const result = wrapped.call('Test:getState');

    expect(traceMock).toHaveBeenCalledTimes(1);
    expect(traceMock).toHaveBeenCalledWith(
      expect.objectContaining({
        name: `${TraceName.MessengerCall}: Test:getState`,
        op: 'messenger.call',
        data: { action: 'Test:getState' },
      }),
      expect.any(Function),
    );
    expect(result).toBe('result');
  });

  it('returns the same messenger instance', () => {
    const messenger = new Messenger<'Test', TestActions, never>({
      namespace: 'Test',
    });
    const result = wrapMessengerWithTracing(messenger);
    expect(result).toBe(messenger);
  });

  it('passes through arguments to the original call', () => {
    const messenger = new Messenger<'Test', TestActions, never>({
      namespace: 'Test',
    });
    const handler = jest.fn().mockReturnValue('done');
    messenger.registerActionHandler('Test:doWork', handler);

    wrapMessengerWithTracing(messenger);
    messenger.call('Test:doWork', 'arg1', 'arg2');

    expect(handler).toHaveBeenCalledWith('arg1', 'arg2');
  });

  it('propagates errors from the original call', () => {
    const messenger = new Messenger<'Test', TestActions, never>({
      namespace: 'Test',
    });
    const handler = jest.fn().mockImplementation(() => {
      throw new Error('handler error');
    });
    messenger.registerActionHandler('Test:fail', handler);

    wrapMessengerWithTracing(messenger);
    expect(() => messenger.call('Test:fail')).toThrow('handler error');
  });
});
