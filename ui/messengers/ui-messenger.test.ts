import {
  Messenger,
  MOCK_ANY_NAMESPACE,
  type MockAnyNamespace,
} from '@metamask/messenger';
import {
  submitRequestToBackground,
  subscribeToMessengerEvent,
} from '../store/background-connection';
import {
  UIMessenger,
  type UIMessengerActions,
  type UIMessengerEvents,
} from './ui-messenger';

jest.mock('../store/background-connection', () => ({
  submitRequestToBackground: jest.fn(),
  subscribeToMessengerEvent: jest.fn(),
}));

const mockSubmitRequestToBackground = jest.mocked(submitRequestToBackground);
const mockSubscribeToMessengerEvent = jest.mocked(subscribeToMessengerEvent);

/**
 * Create a delegatee messenger for testing. Uses MOCK_ANY_NAMESPACE to avoid
 * namespace restrictions.
 */
function createDelegatee() {
  return new Messenger<MockAnyNamespace, UIMessengerActions, UIMessengerEvents>(
    { namespace: MOCK_ANY_NAMESPACE },
  );
}

describe('UIMessenger', () => {
  let uiMessenger: UIMessenger;

  beforeEach(() => {
    jest.clearAllMocks();
    uiMessenger = new UIMessenger();
    mockSubmitRequestToBackground.mockResolvedValue(undefined);
    mockSubscribeToMessengerEvent.mockResolvedValue(jest.fn());
  });

  describe('delegate', () => {
    describe('actions', () => {
      it('registers a handler on the delegatee that routes to the background', async () => {
        const delegatee = createDelegatee();
        mockSubmitRequestToBackground.mockResolvedValue('result');

        await uiMessenger.delegate({
          actions: ['SnapController:installSnaps'],
          messenger: delegatee,
        });

        const result = await delegatee.call('SnapController:installSnaps', {
          'npm:my-snap': {},
        });

        expect(mockSubmitRequestToBackground).toHaveBeenCalledWith(
          'messengerCall',
          ['SnapController:installSnaps', [{ 'npm:my-snap': {} }]],
        );
        expect(result).toBe('result');
      });

      it('throws if an excluded action is called', async () => {
        const delegatee = createDelegatee();

        await uiMessenger.delegate({
          actions: ['KeyringController:addKeyring'],
          messenger: delegatee,
        });

        expect(() => delegatee.call('KeyringController:addKeyring')).toThrow(
          'The action "KeyringController:addKeyring" has not been exposed to the UI.',
        );
      });

      it('throws if the same action is delegated to the same messenger twice', async () => {
        const delegatee = createDelegatee();

        await uiMessenger.delegate({
          actions: ['SnapController:installSnaps'],
          messenger: delegatee,
        });

        await expect(
          uiMessenger.delegate({
            actions: ['SnapController:installSnaps'],
            messenger: delegatee,
          }),
        ).rejects.toThrow(
          'The action "SnapController:installSnaps" has already been delegated to this messenger.',
        );
      });

      it('allows the same action to be delegated to different messengers', async () => {
        const delegatee1 = createDelegatee();
        const delegatee2 = createDelegatee();

        await expect(
          Promise.all([
            uiMessenger.delegate({
              actions: ['SnapController:installSnaps'],
              messenger: delegatee1,
            }),
            uiMessenger.delegate({
              actions: ['SnapController:installSnaps'],
              messenger: delegatee2,
            }),
          ]),
        ).resolves.not.toThrow();
      });
    });

    describe('events', () => {
      it('subscribes to the event via the background connection', async () => {
        const delegatee = createDelegatee();

        await uiMessenger.delegate({
          events: ['SnapController:snapInstalled'],
          messenger: delegatee,
        });

        expect(mockSubscribeToMessengerEvent).toHaveBeenCalledWith(
          'SnapController:snapInstalled',
          expect.any(Function),
        );
      });

      it('publishes background events to the delegatee', async () => {
        const delegatee = createDelegatee();
        const handler = jest.fn();
        delegatee.subscribe('SnapController:snapInstalled', handler);

        let capturedCallback!: (...args: unknown[]) => void;
        mockSubscribeToMessengerEvent.mockImplementation(
          async (_event, callback) => {
            capturedCallback = callback as (...args: unknown[]) => void;
            return jest.fn();
          },
        );

        await uiMessenger.delegate({
          events: ['SnapController:snapInstalled'],
          messenger: delegatee,
        });

        const payload = { snapId: 'npm:my-snap', version: '1.0.0' };
        capturedCallback(payload);

        expect(handler).toHaveBeenCalledWith(payload);
      });

      it('throws if the same event is delegated to the same messenger twice', async () => {
        const delegatee = createDelegatee();

        await uiMessenger.delegate({
          events: ['SnapController:snapInstalled'],
          messenger: delegatee,
        });

        await expect(
          uiMessenger.delegate({
            events: ['SnapController:snapInstalled'],
            messenger: delegatee,
          }),
        ).rejects.toThrow(
          "The event 'SnapController:snapInstalled' has already been delegated to this messenger",
        );
      });

      it('creates independent background subscriptions for different messengers', async () => {
        const delegatee1 = createDelegatee();
        const delegatee2 = createDelegatee();

        await uiMessenger.delegate({
          events: ['SnapController:snapInstalled'],
          messenger: delegatee1,
        });
        await uiMessenger.delegate({
          events: ['SnapController:snapInstalled'],
          messenger: delegatee2,
        });

        expect(mockSubscribeToMessengerEvent).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('revoke', () => {
    describe('actions', () => {
      it('unregisters the action handler from the delegatee', async () => {
        const delegatee = createDelegatee();

        await uiMessenger.delegate({
          actions: ['SnapController:installSnaps'],
          messenger: delegatee,
        });
        await uiMessenger.revoke({
          actions: ['SnapController:installSnaps'],
          messenger: delegatee,
        });

        expect(() =>
          delegatee.call('SnapController:installSnaps', { 'npm:my-snap': {} }),
        ).toThrow();
      });

      it('silently ignores actions that have not been delegated', async () => {
        const delegatee = createDelegatee();

        await expect(
          uiMessenger.revoke({
            actions: ['SnapController:installSnaps'],
            messenger: delegatee,
          }),
        ).resolves.not.toThrow();
      });

      it('allows re-delegation after revoking', async () => {
        const delegatee = createDelegatee();

        await uiMessenger.delegate({
          actions: ['SnapController:installSnaps'],
          messenger: delegatee,
        });
        await uiMessenger.revoke({
          actions: ['SnapController:installSnaps'],
          messenger: delegatee,
        });

        await expect(
          uiMessenger.delegate({
            actions: ['SnapController:installSnaps'],
            messenger: delegatee,
          }),
        ).resolves.not.toThrow();
      });
    });

    describe('events', () => {
      it('calls the unsubscribe function for the event', async () => {
        const delegatee = createDelegatee();
        const mockUnsubscribe = jest.fn().mockResolvedValue(undefined);
        mockSubscribeToMessengerEvent.mockResolvedValue(mockUnsubscribe);

        await uiMessenger.delegate({
          events: ['SnapController:snapInstalled'],
          messenger: delegatee,
        });
        await uiMessenger.revoke({
          events: ['SnapController:snapInstalled'],
          messenger: delegatee,
        });

        expect(mockUnsubscribe).toHaveBeenCalled();
      });

      it('allows re-delegation after revoking', async () => {
        const delegatee = createDelegatee();

        await uiMessenger.delegate({
          events: ['SnapController:snapInstalled'],
          messenger: delegatee,
        });
        await uiMessenger.revoke({
          events: ['SnapController:snapInstalled'],
          messenger: delegatee,
        });

        await expect(
          uiMessenger.delegate({
            events: ['SnapController:snapInstalled'],
            messenger: delegatee,
          }),
        ).resolves.not.toThrow();
      });

      it('silently ignores events that have not been delegated', async () => {
        const delegatee = createDelegatee();

        await expect(
          uiMessenger.revoke({
            events: ['SnapController:snapInstalled'],
            messenger: delegatee,
          }),
        ).resolves.not.toThrow();
      });
    });
  });
});
