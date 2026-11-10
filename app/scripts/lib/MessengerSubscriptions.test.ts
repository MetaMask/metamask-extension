import {
  Messenger,
  MOCK_ANY_NAMESPACE,
  MockAnyNamespace,
} from '@metamask/messenger';
import { Transform } from 'readable-stream';
import { JsonRpcNotification } from '@metamask/utils';
import { ControllerStateChangeEvent } from '@metamask/base-controller';
import { MESSENGER_SUBSCRIPTION_NOTIFICATION } from '../../../shared/constants/messages';
import { MessengerSubscriptions } from './MessengerSubscriptions';

const MOCK_STATE_CHANGE = {
  event: 'ExampleController:stateChange' as const,
  state: { foo: 'bar' },
  patches: [],
};

type ExampleControllerStateChangeEvent = ControllerStateChangeEvent<
  'ExampleController',
  { foo: string }
>;

function setup(flushPendingState?: () => void) {
  const messenger = new Messenger<
    MockAnyNamespace,
    never,
    ExampleControllerStateChangeEvent
  >({ namespace: MOCK_ANY_NAMESPACE });
  const stream = new Transform({
    objectMode: true,
    transform(_chunk: JsonRpcNotification, _, callback) {
      callback();
    },
  });
  const subscriptions = new MessengerSubscriptions(
    messenger,
    stream,
    flushPendingState,
  );

  return { messenger, stream, subscriptions };
}

describe('MessengerSubscriptions', () => {
  it('sends JSON-RPC notifications for subscribed events', () => {
    const { messenger, stream, subscriptions } = setup();
    const subscribeSpy = jest.spyOn(messenger, 'subscribe');
    const writeSpy = jest.spyOn(stream, 'write');

    const { event, state, patches } = MOCK_STATE_CHANGE;

    subscriptions.subscribe(event);

    expect(subscribeSpy).toHaveBeenCalledWith(event, expect.any(Function));

    messenger.publish(event, state, patches);

    expect(writeSpy).toHaveBeenCalledWith({
      jsonrpc: '2.0',
      method: MESSENGER_SUBSCRIPTION_NOTIFICATION,
      params: [event, [{ foo: 'bar' }, []]],
    });
  });

  it('drains pending state before writing the notification', () => {
    // A subscriber that reads state in its handler must not see a world older than
    // the event: the notification is written at publish time, the state behind it
    // rides the 200ms-debounced `sendUpdate`, so the order on the stream is what
    // decides whether the two can be read together.
    const order: string[] = [];
    const flushPendingState = jest.fn(() => order.push('flush'));
    const { messenger, stream, subscriptions } = setup(flushPendingState);
    jest.spyOn(stream, 'write').mockImplementation(() => {
      order.push('notification');
      return true;
    });

    const { event, state, patches } = MOCK_STATE_CHANGE;
    subscriptions.subscribe(event);
    messenger.publish(event, state, patches);

    expect(flushPendingState).toHaveBeenCalledTimes(1);
    expect(order).toStrictEqual(['flush', 'notification']);
  });

  it('drains once per published event', () => {
    const flushPendingState = jest.fn();
    const { messenger, subscriptions } = setup(flushPendingState);
    const { event, state, patches } = MOCK_STATE_CHANGE;

    subscriptions.subscribe(event);
    messenger.publish(event, state, patches);
    messenger.publish(event, state, patches);

    expect(flushPendingState).toHaveBeenCalledTimes(2);
  });

  it('does not drain when the stream is no longer writable', () => {
    const flushPendingState = jest.fn();
    const { messenger, stream, subscriptions } = setup(flushPendingState);
    const { event, state, patches } = MOCK_STATE_CHANGE;

    subscriptions.subscribe(event);
    stream.destroy();
    messenger.publish(event, state, patches);

    expect(flushPendingState).not.toHaveBeenCalled();
  });
  it('stops sending notifications for a given event when all subscriptions are removed', () => {
    const { messenger, stream, subscriptions } = setup();
    const subscribeSpy = jest.spyOn(messenger, 'subscribe');
    const unsubscribeSpy = jest.spyOn(messenger, 'unsubscribe');
    const writeSpy = jest.spyOn(stream, 'write');

    const { event, state, patches } = MOCK_STATE_CHANGE;

    subscriptions.subscribe(event);
    subscriptions.subscribe(event);

    messenger.publish(event, state, patches);

    subscriptions.unsubscribe(event);
    subscriptions.unsubscribe(event);

    messenger.publish(event, state, patches);

    expect(writeSpy).toHaveBeenCalledTimes(1);
    expect(subscribeSpy).toHaveBeenCalledTimes(1);
    expect(unsubscribeSpy).toHaveBeenCalledTimes(1);
  });

  it('unsubscribes from all events when cleared', () => {
    const { messenger, stream, subscriptions } = setup();
    const subscribeSpy = jest.spyOn(messenger, 'subscribe');
    const unsubscribeSpy = jest.spyOn(messenger, 'unsubscribe');
    const writeSpy = jest.spyOn(stream, 'write');

    const { event, state, patches } = MOCK_STATE_CHANGE;

    subscriptions.subscribe(event);
    subscriptions.subscribe(event);
    subscriptions.subscribe('AccountsController:stateChange');
    subscriptions.subscribe('SnapController:stateChange');

    subscriptions.clear();

    messenger.publish(event, state, patches);

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
