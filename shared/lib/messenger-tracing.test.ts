// eslint-disable-next-line @typescript-eslint/no-shadow
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { Messenger } from '@metamask/messenger';
import { sentryGetActiveSpan, trace } from './trace';
import { shouldSampleWrappers } from './wrapper-sampling';
import {
  isReadOnlyAction,
  wrapMessengerWithTracing,
} from './messenger-tracing';

jest.mock('./trace', () => ({
  sentryGetActiveSpan: jest.fn(),
  trace: jest.fn((_request: unknown, fn: () => unknown) => fn()),
}));

jest.mock('./wrapper-sampling', () => ({
  shouldSampleWrappers: jest.fn(),
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

type TestSetStateAction = {
  type: 'Test:setState';
  handler: (value: string) => void;
};

type TestHasItemAction = {
  type: 'Test:hasItem';
  handler: () => boolean;
};

type TestActions =
  | TestGetStateAction
  | TestDoWorkAction
  | TestFailAction
  | TestSetStateAction
  | TestHasItemAction;

describe('wrapMessengerWithTracing', () => {
  const traceMock = trace as jest.Mock;
  const sentryGetActiveSpanMock = sentryGetActiveSpan as jest.Mock;
  const shouldSampleWrappersMock = shouldSampleWrappers as jest.Mock;

  beforeEach(() => {
    sentryGetActiveSpanMock.mockReturnValue({
      spanContext: () => ({ traceId: 'test-trace-id-deadbeef' }),
    });
    shouldSampleWrappersMock.mockReturnValue(true);
    traceMock.mockClear();
    traceMock.mockImplementation((_request, fn) => (fn as () => unknown)());
  });

  it('skips trace when no active span (avoids overhead when tracing disabled)', () => {
    sentryGetActiveSpanMock.mockReturnValue(null);
    const messenger = new Messenger<'Test', TestActions, never>({
      namespace: 'Test',
    });
    const handler = jest.fn();
    messenger.registerActionHandler('Test:setState', handler);

    const wrapped = wrapMessengerWithTracing(messenger);
    wrapped.call('Test:setState', 'value');

    expect(traceMock).not.toHaveBeenCalled();
    expect(handler).toHaveBeenCalledWith('value');
  });

  it('skips trace for a read-only messenger action (denylist applies)', () => {
    const messenger = new Messenger<'Test', TestActions, never>({
      namespace: 'Test',
    });
    const handler = jest.fn<() => string>().mockReturnValue('result');
    messenger.registerActionHandler('Test:getState', handler);

    const wrapped = wrapMessengerWithTracing(messenger);
    const result = wrapped.call('Test:getState');

    expect(traceMock).not.toHaveBeenCalled();
    expect(result).toBe('result');
  });

  it('traces non-read-only actions with name, op, and action data', () => {
    const messenger = new Messenger<'Test', TestActions, never>({
      namespace: 'Test',
    });
    const handler = jest.fn();
    messenger.registerActionHandler('Test:setState', handler);

    const wrapped = wrapMessengerWithTracing(messenger);
    wrapped.call('Test:setState', 'new-value');

    expect(traceMock).toHaveBeenCalledTimes(1);
    expect(traceMock).toHaveBeenCalledWith(
      expect.objectContaining({
        name: `Messenger Call: Test:setState`,
        op: 'messenger.call',
        data: { action: 'Test:setState' },
      }),
      expect.any(Function),
    );
  });

  it('skips trace when shouldSampleWrappers returns false (sub-sampled out)', () => {
    shouldSampleWrappersMock.mockReturnValue(false);
    const messenger = new Messenger<'Test', TestActions, never>({
      namespace: 'Test',
    });
    const handler = jest.fn();
    messenger.registerActionHandler('Test:setState', handler);

    const wrapped = wrapMessengerWithTracing(messenger);
    wrapped.call('Test:setState', 'value');

    expect(traceMock).not.toHaveBeenCalled();
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
    const handler = jest.fn<() => string>().mockReturnValue('done');
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

describe('isReadOnlyAction', () => {
  it.each([
    'KeyringController:getState',
    'SnapController:getSnap',
    'NetworkController:getNetworkClientById',
    'PermissionController:hasPermissions',
    'WebSocketService:findSubscriptionsByChannelPrefix',
    'Foo:isEnabled',
    'Bar:peekQueue',
  ])('returns true for read-only verb: %s', (actionType) => {
    expect(isReadOnlyAction(actionType)).toBe(true);
  });

  it.each([
    'KeyringController:setState',
    'SnapController:updateSnapState',
    'BackendWebSocketService:connect',
    'WebSocketService:sendMessage',
    'CronjobController:schedule',
    'AccountsController:addAccount',
    'AccountsController:removeAccount',
  ])(
    'returns false for state-changing or boundary action: %s',
    (actionType) => {
      expect(isReadOnlyAction(actionType)).toBe(false);
    },
  );

  it('returns false for action without colon separator', () => {
    expect(isReadOnlyAction('getState')).toBe(false);
  });

  it.each([
    'Foo:getter', // not a method, but still matches verb prefix - acceptable false positive
  ])(
    'matches lowercase-continuation false positives (acceptable): %s',
    (actionType) => {
      expect(isReadOnlyAction(actionType)).toBe(false);
    },
  );
});
