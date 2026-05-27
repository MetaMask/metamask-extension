import { Json, JsonRpcNotification } from '@metamask/utils';
// @ts-expect-error No type declarations for through2.
import { obj as createThoughStream } from 'through2';
import { MESSENGER_SUBSCRIPTION_NOTIFICATION } from '../../shared/constants/messages';
// eslint-disable-next-line import-x/no-restricted-paths
import metaRPCClientFactory from '../../app/scripts/lib/metaRPCClientFactory';
import {
  setBackgroundConnection,
  subscribeToMessengerEvent,
} from './background-connection';

// TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31973
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Api = Record<string, (...args: any[]) => any>;

type OutgoingRequest = {
  id: number;
  method: string;
  params: unknown[];
};

function isOutgoingRequest(chunk: unknown): chunk is OutgoingRequest {
  return (
    chunk !== null &&
    typeof chunk === 'object' &&
    'method' in chunk &&
    'id' in chunk &&
    typeof (chunk as { method: unknown }).method === 'string' &&
    typeof (chunk as { id: unknown }).id === 'number'
  );
}

const event = 'ExampleController:stateChange';

function setup() {
  const outgoingRequests: OutgoingRequest[] = [];
  const rejectNextFor = new Map<string, Error>();
  const deferNextFor = new Map<string, (id: number) => void>();

  const streamTest = createThoughStream();
  const client = metaRPCClientFactory<Api>(streamTest);
  const onNotificationSpy = jest.spyOn(client, 'onNotification');
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  setBackgroundConnection(client);

  streamTest.on('data', (chunk: unknown) => {
    if (!isOutgoingRequest(chunk)) {
      return;
    }
    outgoingRequests.push(chunk);

    const rejectError = rejectNextFor.get(chunk.method);
    if (rejectError) {
      rejectNextFor.delete(chunk.method);
      process.nextTick(() => {
        streamTest.write({
          jsonrpc: '2.0',
          id: chunk.id,
          error: { code: -1, message: rejectError.message },
        });
      });
      return;
    }

    const onArrival = deferNextFor.get(chunk.method);
    if (onArrival) {
      deferNextFor.delete(chunk.method);
      onArrival(chunk.id);
      return;
    }

    process.nextTick(() => {
      streamTest.write({
        jsonrpc: '2.0',
        id: chunk.id,
        result: undefined,
      });
    });
  });

  // Returns how many outgoing RPC requests have been issued for the given method.
  const callCountOf = (method: string) =>
    outgoingRequests.filter((r) => r.method === method).length;

  // Inject a JSON-RPC notification (no id) into the stream so the client
  // picks it up via its notification channel.
  const submitNotification = (notification: JsonRpcNotification) => {
    streamTest.write(notification);
  };

  // Make the next call to the given method reject with the given error;
  // subsequent calls resolve normally.
  const rejectNext = (method: string, error: Error) => {
    rejectNextFor.set(method, error);
  };

  // Hold the next call to the given method open. Returns `releaseDeferred()`
  // which sends the success response and lets the awaiter resume.
  const deferNext = (method: string) => {
    let releaseFn: (() => void) | undefined;
    deferNextFor.set(method, (id) => {
      releaseFn = () => {
        streamTest.write({ jsonrpc: '2.0', id, result: undefined });
      };
    });
    return {
      releaseDeferred: () => {
        if (!releaseFn) {
          throw new Error(
            `Deferred call to ${method} has not been issued yet.`,
          );
        }
        releaseFn();
      },
    };
  };

  return {
    client,
    streamTest,
    onNotificationSpy,
    submitNotification,
    callCountOf,
    rejectNext,
    deferNext,
  };
}

describe('subscribeToMessengerEvent', () => {
  it('invokes callback when JSON-RPC notifications are received', async () => {
    const { submitNotification } = setup();

    const received: Json[] = [];
    await subscribeToMessengerEvent<[Json]>(event, ([state]) =>
      received.push(state),
    );

    submitNotification({
      jsonrpc: '2.0',
      method: MESSENGER_SUBSCRIPTION_NOTIFICATION,
      params: [event, [{ foo: 'bar' }, []]],
    });

    expect(received).toStrictEqual([{ foo: 'bar' }]);
  });

  it('unsubscribes when the cleanup function is called', async () => {
    const { submitNotification, callCountOf, onNotificationSpy } = setup();

    const listener = jest.fn();
    const unsubscribe = await subscribeToMessengerEvent(event, listener);

    expect(callCountOf('messengerSubscribe')).toBe(1);
    expect(onNotificationSpy).toHaveBeenCalledTimes(1);

    await unsubscribe();

    submitNotification({
      jsonrpc: '2.0',
      method: MESSENGER_SUBSCRIPTION_NOTIFICATION,
      params: [event, [{ foo: 'bar' }, []]],
    });

    expect(listener).not.toHaveBeenCalled();
    expect(callCountOf('messengerUnsubscribe')).toBe(1);
  });

  it('only calls messengerSubscribe once if there are multiple subscriptions for the same event requested', async () => {
    const { submitNotification, callCountOf, onNotificationSpy } = setup();

    const listenerA = jest.fn();
    const listenerB = jest.fn();

    await subscribeToMessengerEvent(event, listenerA);
    await subscribeToMessengerEvent(event, listenerB);

    expect(callCountOf('messengerSubscribe')).toBe(1);
    expect(onNotificationSpy).toHaveBeenCalledTimes(1);

    submitNotification({
      jsonrpc: '2.0',
      method: MESSENGER_SUBSCRIPTION_NOTIFICATION,
      params: [event, [{ foo: 'bar' }, []]],
    });

    expect(listenerA).toHaveBeenCalledWith([{ foo: 'bar' }, []]);
    expect(listenerB).toHaveBeenCalledWith([{ foo: 'bar' }, []]);
  });

  it('does not resolve subscribe calls until the upstream messengerSubscribe call resolves', async () => {
    const { deferNext } = setup();

    const { releaseDeferred } = deferNext('messengerSubscribe');

    let resolvedA = false;
    let resolvedB = false;

    const subscribeA = subscribeToMessengerEvent(event, jest.fn()).then(() => {
      resolvedA = true;
    });
    const subscribeB = subscribeToMessengerEvent(event, jest.fn()).then(() => {
      resolvedB = true;
    });

    // Let any already-scheduled microtasks run; neither subscribe call
    // should have resolved yet because both await the same in-flight call.
    await new Promise((r) => setImmediate(r));

    expect(resolvedA).toBe(false);
    expect(resolvedB).toBe(false);

    releaseDeferred();

    await subscribeA;
    await subscribeB;

    expect(resolvedA).toBe(true);
    expect(resolvedB).toBe(true);
  });

  it('refcounts subscribers and only unsubscribes upstream on the last unsubscribe', async () => {
    const { submitNotification, callCountOf } = setup();

    const listenerA = jest.fn();
    const listenerB = jest.fn();

    const unsubscribeA = await subscribeToMessengerEvent(event, listenerA);
    const unsubscribeB = await subscribeToMessengerEvent(event, listenerB);

    await unsubscribeA();

    expect(callCountOf('messengerUnsubscribe')).toBe(0);

    submitNotification({
      jsonrpc: '2.0',
      method: MESSENGER_SUBSCRIPTION_NOTIFICATION,
      params: [event, [{ foo: 'bar' }, []]],
    });

    expect(listenerA).not.toHaveBeenCalled();
    expect(listenerB).toHaveBeenCalledWith([{ foo: 'bar' }, []]);

    await unsubscribeB();

    expect(callCountOf('messengerUnsubscribe')).toBe(1);
  });

  it('ignores other JSON-RPC notifications', async () => {
    const { submitNotification } = setup();

    const listener = jest.fn();
    await subscribeToMessengerEvent(event, listener);

    submitNotification({
      jsonrpc: '2.0',
      method: 'foo',
      params: [],
    });

    expect(listener).not.toHaveBeenCalled();
  });

  it('clears the entry when the upstream messengerSubscribe call rejects, allowing retry', async () => {
    const { callCountOf, rejectNext } = setup();

    rejectNext('messengerSubscribe', new Error('subscribe failed'));

    const listener = jest.fn();

    await expect(subscribeToMessengerEvent(event, listener)).rejects.toThrow(
      'subscribe failed',
    );

    // A fresh subscribe attempt should send a new messengerSubscribe call,
    // not silently reuse a rejected entry.
    await subscribeToMessengerEvent(event, listener);

    expect(callCountOf('messengerSubscribe')).toBe(2);
  });

  it('rejects all concurrent subscribers when the upstream messengerSubscribe call rejects', async () => {
    const { callCountOf, rejectNext } = setup();

    rejectNext('messengerSubscribe', new Error('subscribe failed'));

    const listenerA = jest.fn();
    const listenerB = jest.fn();

    const subscribeA = subscribeToMessengerEvent(event, listenerA);
    const subscribeB = subscribeToMessengerEvent(event, listenerB);

    await expect(subscribeA).rejects.toThrow('subscribe failed');
    await expect(subscribeB).rejects.toThrow('subscribe failed');

    expect(callCountOf('messengerSubscribe')).toBe(1);

    // Entry is cleared, so a retry sends a fresh messengerSubscribe call.
    await subscribeToMessengerEvent(event, listenerA);
    expect(callCountOf('messengerSubscribe')).toBe(2);
  });

  it('continues invoking remaining callbacks when one callback throws', async () => {
    const { submitNotification } = setup();

    const consoleErrorSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => undefined);

    const throwingListener = jest.fn(() => {
      throw new Error('callback boom');
    });
    const otherListener = jest.fn();

    await subscribeToMessengerEvent(event, throwingListener);
    await subscribeToMessengerEvent(event, otherListener);

    submitNotification({
      jsonrpc: '2.0',
      method: MESSENGER_SUBSCRIPTION_NOTIFICATION,
      params: [event, [{ foo: 'bar' }, []]],
    });

    expect(throwingListener).toHaveBeenCalledTimes(1);
    expect(otherListener).toHaveBeenCalledTimes(1);
    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.any(Error));

    consoleErrorSpy.mockRestore();
  });

  it('is idempotent when the same unsubscribe function is called twice', async () => {
    const { callCountOf } = setup();

    const listener = jest.fn();
    const unsubscribe = await subscribeToMessengerEvent(event, listener);

    await unsubscribe();
    await unsubscribe();

    expect(callCountOf('messengerUnsubscribe')).toBe(1);
  });

  it('keeps subscriptions to different events independent', async () => {
    const { submitNotification, callCountOf } = setup();

    const otherEvent = 'OtherController:stateChange';

    const listenerA = jest.fn();
    const listenerB = jest.fn();

    await subscribeToMessengerEvent(event, listenerA);
    await subscribeToMessengerEvent(otherEvent, listenerB);

    expect(callCountOf('messengerSubscribe')).toBe(2);

    submitNotification({
      jsonrpc: '2.0',
      method: MESSENGER_SUBSCRIPTION_NOTIFICATION,
      params: [event, [{ foo: 'bar' }, []]],
    });

    expect(listenerA).toHaveBeenCalledTimes(1);
    expect(listenerB).not.toHaveBeenCalled();
  });

  it('collapses to one slot when the same callback is subscribed twice to the same event', async () => {
    const { submitNotification, callCountOf } = setup();

    const listener = jest.fn();

    const unsubscribeFirst = await subscribeToMessengerEvent(event, listener);
    const unsubscribeSecond = await subscribeToMessengerEvent(event, listener);

    submitNotification({
      jsonrpc: '2.0',
      method: MESSENGER_SUBSCRIPTION_NOTIFICATION,
      params: [event, [{ foo: 'bar' }, []]],
    });

    // Set-by-reference: a notification fires the callback exactly once,
    // not once per subscribe call.
    expect(listener).toHaveBeenCalledTimes(1);

    // The first unsubscribe empties the set, so the upstream
    // messengerUnsubscribe call is sent.
    await unsubscribeFirst();
    expect(callCountOf('messengerUnsubscribe')).toBe(1);

    // The second unsubscribe finds nothing to remove and is a no-op.
    await unsubscribeSecond();
    expect(callCountOf('messengerUnsubscribe')).toBe(1);
  });

  it('ignores subscription notifications that have no params', async () => {
    const { submitNotification } = setup();

    const listener = jest.fn();
    await subscribeToMessengerEvent(event, listener);

    submitNotification({
      jsonrpc: '2.0',
      method: MESSENGER_SUBSCRIPTION_NOTIFICATION,
      // No params field.
    });

    expect(listener).not.toHaveBeenCalled();
  });

  it('propagates messengerUnsubscribe rejection to the awaiter', async () => {
    const { rejectNext } = setup();

    const listener = jest.fn();
    const unsubscribe = await subscribeToMessengerEvent(event, listener);

    rejectNext('messengerUnsubscribe', new Error('unsubscribe failed'));

    await expect(unsubscribe()).rejects.toThrow('unsubscribe failed');
  });

  it('dispatches notifications that arrive before the upstream messengerSubscribe call resolves', async () => {
    const { deferNext, submitNotification } = setup();

    const { releaseDeferred } = deferNext('messengerSubscribe');

    const listener = jest.fn();
    const subscribePromise = subscribeToMessengerEvent(event, listener);

    // Let the subscribe call populate state and the request reach the
    // auto-responder.
    await new Promise((r) => setImmediate(r));

    // The upstream call is still pending, but the notification router is
    // attached and the callback set is populated. A notification arriving
    // now must still reach the listener.
    submitNotification({
      jsonrpc: '2.0',
      method: MESSENGER_SUBSCRIPTION_NOTIFICATION,
      params: [event, [{ foo: 'bar' }, []]],
    });

    expect(listener).toHaveBeenCalledWith([{ foo: 'bar' }, []]);

    releaseDeferred();
    await subscribePromise;
  });

  it('starts with fresh subscription state when setBackgroundConnection is called with a new connection', async () => {
    const first = setup();

    const firstListener = jest.fn();
    await subscribeToMessengerEvent(event, firstListener);

    expect(first.callCountOf('messengerSubscribe')).toBe(1);
    expect(first.onNotificationSpy).toHaveBeenCalledTimes(1);

    // Replace the background connection with a new client instance. The new
    // client must have its own subscription state, so a subscribe for the
    // same event sends a fresh upstream call against it.
    const second = setup();

    const secondListener = jest.fn();
    await subscribeToMessengerEvent(event, secondListener);

    expect(second.callCountOf('messengerSubscribe')).toBe(1);
    expect(second.onNotificationSpy).toHaveBeenCalledTimes(1);

    second.submitNotification({
      jsonrpc: '2.0',
      method: MESSENGER_SUBSCRIPTION_NOTIFICATION,
      params: [event, [{ foo: 'bar' }, []]],
    });

    expect(secondListener).toHaveBeenCalledWith([{ foo: 'bar' }, []]);
    expect(firstListener).not.toHaveBeenCalled();
  });
});
