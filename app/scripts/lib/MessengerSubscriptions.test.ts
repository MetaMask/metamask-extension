import {
  Messenger,
  MOCK_ANY_NAMESPACE,
  NamespacedName,
} from '@metamask/messenger';
import { Transform } from 'readable-stream';
import { JsonRpcNotification } from '@metamask/utils';
import { MessengerSubscriptions } from './MessengerSubscriptions';

function setup() {
  const messenger = new Messenger({ namespace: MOCK_ANY_NAMESPACE });
  const stream = new Transform({
    objectMode: true,
    transform(_chunk: JsonRpcNotification, _, callback) {
      callback();
    },
  });
  const subscriptions = new MessengerSubscriptions(messenger, stream);

  return { messenger, stream, subscriptions };
}

const MOCK_STATE_CHANGE = {
  event: 'ExampleController:stateChange' as NamespacedName,
  params: [{ foo: 'bar' }, []],
};

describe('MessengerSubscriptions', () => {
  it('sends JSON-RPC notifications for subscribed events', () => {
    const { messenger, stream, subscriptions } = setup();
    const subscribeSpy = jest.spyOn(messenger, 'subscribe');
    const writeSpy = jest.spyOn(stream, 'write');

    const { event, params } = MOCK_STATE_CHANGE;

    subscriptions.subscribe(event);

    expect(subscribeSpy).toHaveBeenCalledWith(event, expect.any(Function));

    messenger.publish(event, ...params);

    expect(writeSpy).toHaveBeenCalledWith({
      jsonrpc: '2.0',
      method: 'messengerSubscription',
      params: [event, [{ foo: 'bar' }, []]],
    });
  });

  it('stops sending notifications for a given event when all subscriptions are removed', () => {
    const { messenger, stream, subscriptions } = setup();
    const subscribeSpy = jest.spyOn(messenger, 'subscribe');
    const unsubscribeSpy = jest.spyOn(messenger, 'unsubscribe');
    const writeSpy = jest.spyOn(stream, 'write');

    const { event, params } = MOCK_STATE_CHANGE;

    subscriptions.subscribe(event);
    subscriptions.subscribe(event);

    messenger.publish(event, ...params);

    subscriptions.unsubscribe(event);
    subscriptions.unsubscribe(event);

    messenger.publish(event, ...params);

    expect(writeSpy).toHaveBeenCalledTimes(1);
    expect(subscribeSpy).toHaveBeenCalledTimes(1);
    expect(unsubscribeSpy).toHaveBeenCalledTimes(1);
  });

  it('unsubscribes from all events when cleared', () => {
    const { messenger, stream, subscriptions } = setup();
    const subscribeSpy = jest.spyOn(messenger, 'subscribe');
    const unsubscribeSpy = jest.spyOn(messenger, 'unsubscribe');
    const writeSpy = jest.spyOn(stream, 'write');

    const { event, params } = MOCK_STATE_CHANGE;

    subscriptions.subscribe(event);
    subscriptions.subscribe(event);
    subscriptions.subscribe('AccountsController:stateChange');
    subscriptions.subscribe('SnapController:stateChange');

    subscriptions.clear();

    messenger.publish(event, ...params);

    expect(subscribeSpy).toHaveBeenCalledTimes(3);
    expect(unsubscribeSpy).toHaveBeenCalledTimes(3);
    expect(writeSpy).toHaveBeenCalledTimes(0);
  });

  it('throws when attempting to unsubscribe without existing subscription', () => {
    const { subscriptions } = setup();
    const { event } = MOCK_STATE_CHANGE;

    expect(() => subscriptions.unsubscribe(event)).toThrow(
      'No active subscriptions found for: "ExampleController:stateChange".',
    );
  });
});
