import {
  createDeferredPromise,
  Json,
  JsonRpcNotification,
} from '@metamask/utils';
import {
  MESSENGER_SUBSCRIPTION_NOTIFICATION,
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

  const removeOnNotification = jest
    .fn()
    .mockImplementation((listener: NotificationListener) => {
      notificationListeners.delete(listener);
    });

  const submitNotification = (notification: JsonRpcNotification) => {
    notificationListeners.forEach((listener) => listener(notification));
  };

  const messengerSubscribe = jest.fn();

  const messengerUnsubscribe = jest.fn();

  // @ts-expect-error Partial mock.
  setBackgroundConnection({
    onNotification,
    removeOnNotification,
    messengerSubscribe,
    messengerUnsubscribe,
  });

  return {
    submitNotification,
    onNotification,
    removeOnNotification,
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
      removeOnNotification,
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
    expect(removeOnNotification).toHaveBeenCalledWith(expect.any(Function));
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
