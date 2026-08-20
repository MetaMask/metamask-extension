import {
  createDeferredPromise,
  Json,
  JsonRpcNotification,
} from '@metamask/utils';
import { MESSENGER_SUBSCRIPTION_NOTIFICATION } from '../../shared/constants/messages';
import {
  setBackgroundConnection,
  subscribeToMessengerEvent,
} from './background-connection';

type NotificationListener = (data: JsonRpcNotification) => void;

function setup() {
  const notificationListeners = new Set<NotificationListener>();

  const onNotification = jest
    .fn()
    .mockImplementation((listener: NotificationListener) => {
      notificationListeners.add(listener);
    });

  const submitNotification = (notification: JsonRpcNotification) => {
    notificationListeners.forEach((listener) => listener(notification));
  };

  const messengerSubscribe = jest.fn().mockResolvedValue(undefined);

  const messengerUnsubscribe = jest.fn();

  // @ts-expect-error Partial mock.
  setBackgroundConnection({
    onNotification,
    messengerSubscribe,
    messengerUnsubscribe,
  });

  return {
    submitNotification,
    onNotification,
    messengerSubscribe,
    messengerUnsubscribe,
  };
}

const event = 'ExampleController:stateChange';

describe('subscribeToMessengerEvent', () => {
  it('invokes callback when JSON-RPC notifications are received', async () => {
    const { submitNotification, messengerSubscribe } = setup();

    const { promise, resolve } = createDeferredPromise<Json>();

    await subscribeToMessengerEvent<[Json]>(event, ([state]) => resolve(state));

    expect(messengerSubscribe).toHaveBeenCalledWith(event);

    submitNotification({
      jsonrpc: '2.0',
      method: MESSENGER_SUBSCRIPTION_NOTIFICATION,
      params: [event, [{ foo: 'bar' }, []]],
    });

    const result = await promise;

    expect(result).toStrictEqual({ foo: 'bar' });
  });

  it('unsubscribes when the cleanup function is called', async () => {
    const {
      submitNotification,
      messengerSubscribe,
      messengerUnsubscribe,
      onNotification,
    } = setup();

    const listener = jest.fn();

    const unsubscribe = await subscribeToMessengerEvent(event, listener);

    expect(messengerSubscribe).toHaveBeenCalledWith(event);
    expect(onNotification).toHaveBeenCalledWith(expect.any(Function));

    await unsubscribe();

    submitNotification({
      jsonrpc: '2.0',
      method: MESSENGER_SUBSCRIPTION_NOTIFICATION,
      params: [event, [{ foo: 'bar' }, []]],
    });

    expect(listener).not.toHaveBeenCalled();

    expect(messengerUnsubscribe).toHaveBeenCalledWith(event);
  });

  it('only calls messengerSubscribe once if there are multiple subscriptions for the same event requested', async () => {
    const { submitNotification, messengerSubscribe, onNotification } = setup();

    const listenerA = jest.fn();
    const listenerB = jest.fn();

    await subscribeToMessengerEvent(event, listenerA);
    await subscribeToMessengerEvent(event, listenerB);

    expect(messengerSubscribe).toHaveBeenCalledTimes(1);
    expect(messengerSubscribe).toHaveBeenCalledWith(event);
    expect(onNotification).toHaveBeenCalledTimes(1);

    submitNotification({
      jsonrpc: '2.0',
      method: MESSENGER_SUBSCRIPTION_NOTIFICATION,
      params: [event, [{ foo: 'bar' }, []]],
    });

    expect(listenerA).toHaveBeenCalledWith([{ foo: 'bar' }, []]);
    expect(listenerB).toHaveBeenCalledWith([{ foo: 'bar' }, []]);
  });

  it('does not resolve subscribe calls until the upstream messengerSubscribe call resolves', async () => {
    const { messengerSubscribe } = setup();

    const { promise: subscribeRpcPromise, resolve: resolveSubscribe } =
      createDeferredPromise<void>();
    messengerSubscribe.mockReturnValueOnce(subscribeRpcPromise);

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

    resolveSubscribe();

    await subscribeA;
    await subscribeB;

    expect(resolvedA).toBe(true);
    expect(resolvedB).toBe(true);
  });

  it('refcounts subscribers and only unsubscribes upstream on the last unsubscribe', async () => {
    const { submitNotification, messengerUnsubscribe } = setup();

    const listenerA = jest.fn();
    const listenerB = jest.fn();

    const unsubscribeA = await subscribeToMessengerEvent(event, listenerA);
    const unsubscribeB = await subscribeToMessengerEvent(event, listenerB);

    await unsubscribeA();

    expect(messengerUnsubscribe).not.toHaveBeenCalled();

    submitNotification({
      jsonrpc: '2.0',
      method: MESSENGER_SUBSCRIPTION_NOTIFICATION,
      params: [event, [{ foo: 'bar' }, []]],
    });

    expect(listenerA).not.toHaveBeenCalled();
    expect(listenerB).toHaveBeenCalledWith([{ foo: 'bar' }, []]);

    await unsubscribeB();

    expect(messengerUnsubscribe).toHaveBeenCalledTimes(1);
    expect(messengerUnsubscribe).toHaveBeenCalledWith(event);
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
    const { messengerSubscribe } = setup();

    messengerSubscribe.mockRejectedValueOnce(new Error('subscribe failed'));
    messengerSubscribe.mockResolvedValueOnce(undefined);

    const listener = jest.fn();

    await expect(subscribeToMessengerEvent(event, listener)).rejects.toThrow(
      'subscribe failed',
    );

    // A fresh subscribe attempt should send a new messengerSubscribe call,
    // not silently reuse a rejected entry.
    await subscribeToMessengerEvent(event, listener);

    expect(messengerSubscribe).toHaveBeenCalledTimes(2);
  });

  it('rejects all concurrent subscribers when the upstream messengerSubscribe RPC rejects', async () => {
    const { messengerSubscribe } = setup();

    messengerSubscribe.mockRejectedValueOnce(new Error('subscribe failed'));

    const listenerA = jest.fn();
    const listenerB = jest.fn();

    const subscribeA = subscribeToMessengerEvent(event, listenerA);
    const subscribeB = subscribeToMessengerEvent(event, listenerB);

    expect(messengerSubscribe).toHaveBeenCalledTimes(1);

    await expect(subscribeA).rejects.toThrow('subscribe failed');
    await expect(subscribeB).rejects.toThrow('subscribe failed');

    // Entry is cleared, so a retry sends a fresh messengerSubscribe call.
    messengerSubscribe.mockResolvedValueOnce(undefined);
    await subscribeToMessengerEvent(event, listenerA);
    expect(messengerSubscribe).toHaveBeenCalledTimes(2);
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
    const { messengerUnsubscribe } = setup();

    const listener = jest.fn();
    const unsubscribe = await subscribeToMessengerEvent(event, listener);

    await unsubscribe();
    await unsubscribe();

    expect(messengerUnsubscribe).toHaveBeenCalledTimes(1);
  });

  it('keeps subscriptions to different events independent', async () => {
    const { submitNotification, messengerSubscribe } = setup();

    const otherEvent = 'OtherController:stateChange';

    const listenerA = jest.fn();
    const listenerB = jest.fn();

    await subscribeToMessengerEvent(event, listenerA);
    await subscribeToMessengerEvent(otherEvent, listenerB);

    expect(messengerSubscribe).toHaveBeenCalledTimes(2);

    submitNotification({
      jsonrpc: '2.0',
      method: MESSENGER_SUBSCRIPTION_NOTIFICATION,
      params: [event, [{ foo: 'bar' }, []]],
    });

    expect(listenerA).toHaveBeenCalledTimes(1);
    expect(listenerB).not.toHaveBeenCalled();
  });

  it('treats two subscriptions sharing the same callback reference as independent', async () => {
    const { submitNotification, messengerUnsubscribe } = setup();

    const listener = jest.fn();

    const unsubscribeFirst = await subscribeToMessengerEvent(event, listener);
    const unsubscribeSecond = await subscribeToMessengerEvent(event, listener);

    submitNotification({
      jsonrpc: '2.0',
      method: MESSENGER_SUBSCRIPTION_NOTIFICATION,
      params: [event, [{ foo: 'bar' }, []]],
    });

    // Each subscribe call is an independent registration, so a notification
    // fires the shared callback once per registration.
    expect(listener).toHaveBeenCalledTimes(2);

    // Unsubscribing one registration leaves the other intact, so no upstream
    // unsubscribe yet and the remaining registration still receives events.
    await unsubscribeFirst();
    expect(messengerUnsubscribe).not.toHaveBeenCalled();

    listener.mockClear();
    submitNotification({
      jsonrpc: '2.0',
      method: MESSENGER_SUBSCRIPTION_NOTIFICATION,
      params: [event, [{ foo: 'bar' }, []]],
    });
    expect(listener).toHaveBeenCalledTimes(1);

    // Removing the last registration sends the upstream unsubscribe.
    await unsubscribeSecond();
    expect(messengerUnsubscribe).toHaveBeenCalledTimes(1);
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
    const { messengerUnsubscribe } = setup();

    messengerUnsubscribe.mockRejectedValueOnce(new Error('unsubscribe failed'));

    const listener = jest.fn();
    const unsubscribe = await subscribeToMessengerEvent(event, listener);

    await expect(unsubscribe()).rejects.toThrow('unsubscribe failed');
  });

  it('dispatches notifications that arrive before the upstream messengerSubscribe RPC resolves', async () => {
    const { messengerSubscribe, submitNotification } = setup();

    const { promise: subscribeRpcPromise, resolve: resolveSubscribe } =
      createDeferredPromise<void>();
    messengerSubscribe.mockReturnValueOnce(subscribeRpcPromise);

    const listener = jest.fn();
    const subscribePromise = subscribeToMessengerEvent(event, listener);

    // The upstream RPC is still pending, but the notification router is
    // attached and the callback set is populated. A notification arriving
    // now must still reach the listener.
    submitNotification({
      jsonrpc: '2.0',
      method: MESSENGER_SUBSCRIPTION_NOTIFICATION,
      params: [event, [{ foo: 'bar' }, []]],
    });

    expect(listener).toHaveBeenCalledWith([{ foo: 'bar' }, []]);

    resolveSubscribe();
    await subscribePromise;
  });

  it('clears subscription state when setBackgroundConnection is called again', async () => {
    const firstConnection = setup();

    const firstListener = jest.fn();
    await subscribeToMessengerEvent(event, firstListener);

    expect(firstConnection.messengerSubscribe).toHaveBeenCalledTimes(1);
    expect(firstConnection.onNotification).toHaveBeenCalledTimes(1);

    // Replace the background connection. The new connection should start
    // with no in-memory subscription state — a subscribe for the same
    // event must send a fresh upstream messengerSubscribe call and attach a
    // fresh notification router.
    const secondConnection = setup();

    const secondListener = jest.fn();
    await subscribeToMessengerEvent(event, secondListener);

    expect(secondConnection.messengerSubscribe).toHaveBeenCalledTimes(1);
    expect(secondConnection.messengerSubscribe).toHaveBeenCalledWith(event);
    expect(secondConnection.onNotification).toHaveBeenCalledTimes(1);

    secondConnection.submitNotification({
      jsonrpc: '2.0',
      method: MESSENGER_SUBSCRIPTION_NOTIFICATION,
      params: [event, [{ foo: 'bar' }, []]],
    });

    expect(secondListener).toHaveBeenCalledWith([{ foo: 'bar' }, []]);
    expect(firstListener).not.toHaveBeenCalled();
  });
});
