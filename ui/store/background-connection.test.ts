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

  const messengerSubscribe = jest.fn();

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

  it('sends only one messengerSubscribe IPC for multiple subscribers to the same event', async () => {
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
});
