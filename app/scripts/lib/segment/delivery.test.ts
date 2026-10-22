import { AnalyticsController } from '@metamask/analytics-controller';
import { Messenger } from '@metamask/messenger';
import { MetaMetricsEventName } from '../../../../shared/constants/metametrics';
import { getRootMessenger } from '../messenger';
import { getAnalyticsControllerMessenger } from '../../messenger-client-init/messengers/analytics-controller-messenger';
import {
  createSegmentDeliveryGate,
  type SegmentDeliveryState,
} from './delivery';
import type { SegmentClient } from '.';

describe('createSegmentDeliveryGate', () => {
  const onboardedState: SegmentDeliveryState = {
    OnboardingController: { completedOnboarding: true },
    PreferencesController: { useExternalServices: true },
    AnalyticsController: { analyticsId: 'user', optedIn: true },
  };

  function setup(state?: SegmentDeliveryState) {
    const client: jest.Mocked<SegmentClient> = {
      track: jest.fn(),
      identify: jest.fn(),
      page: jest.fn(),
      flush: jest.fn().mockResolvedValue(undefined),
    };
    const gate = createSegmentDeliveryGate(client);
    if (state) {
      gate.updateState(state);
    }
    return { ...gate, client };
  }

  it('holds events and their delivery callbacks until onboarding completes', async () => {
    const { segment, client, updateState } = setup({
      ...onboardedState,
      OnboardingController: { completedOnboarding: false },
    });
    const callback = jest.fn();
    const payload = { userId: 'user', event: 'Wallet Created' };

    segment.track(payload, callback);
    await segment.flush();

    expect(client.track).not.toHaveBeenCalled();
    expect(client.flush).not.toHaveBeenCalled();
    expect(callback).not.toHaveBeenCalled();

    updateState(onboardedState);
    updateState(onboardedState);

    expect(client.track).toHaveBeenCalledTimes(1);
    expect(client.track).toHaveBeenCalledWith(payload, callback);
    expect(callback).not.toHaveBeenCalled();
  });

  it('holds early events until background state is available', () => {
    const { segment, client, updateState } = setup();
    segment.track({ userId: 'user', event: 'Migration Succeeded' });

    expect(client.track).not.toHaveBeenCalled();

    updateState(onboardedState);

    expect(client.track).toHaveBeenCalledTimes(1);
  });

  it('uses persisted state for early diagnostics without replacing newer live state', () => {
    const { segment, client, initializeState, updateState } = setup();
    initializeState(onboardedState);
    segment.track({ userId: 'user', event: 'Early Diagnostic' });
    expect(client.track).toHaveBeenCalledTimes(1);

    updateState({
      ...onboardedState,
      OnboardingController: { completedOnboarding: false },
    });
    initializeState(onboardedState);
    segment.track({ userId: 'user', event: 'Onboarding Event' });
    expect(client.track).toHaveBeenCalledTimes(1);
  });

  it.each(['track', 'identify', 'page'] as const)(
    'gates %s delivery',
    (method) => {
      const { segment, client, updateState } = setup();
      const payload = { userId: 'user', event: 'Event', name: 'Page' };

      segment[method](payload);
      expect(client[method]).not.toHaveBeenCalled();

      updateState(onboardedState);
      expect(client[method]).toHaveBeenCalledTimes(1);
      expect(client[method]).toHaveBeenCalledWith(payload, undefined);
    },
  );

  it('discards queued events when Basic Functionality is disabled', () => {
    const { segment, client, updateState } = setup();
    const callback = jest.fn();
    segment.track({ userId: 'user', event: 'Event' }, callback);

    updateState({
      ...onboardedState,
      PreferencesController: { useExternalServices: false },
    });
    updateState(onboardedState);

    expect(client.track).not.toHaveBeenCalled();
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('discards deferred controller events removed after consent is revoked', () => {
    const { segment, client, updateState } = setup();
    const callback = jest.fn();
    segment.track({ userId: 'user', messageId: 'removed' }, callback);

    updateState(onboardedState);

    expect(client.track).not.toHaveBeenCalled();
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('discards early events belonging to a previous wallet', () => {
    const { segment, client, updateState } = setup();
    segment.track({ userId: 'old-user', event: 'Event' });

    updateState(onboardedState);

    expect(client.track).not.toHaveBeenCalled();
  });

  it('refreshes consent and removes marketing parameters before releasing an event', () => {
    const { segment, client, updateState } = setup();
    const consent = {
      categoryPreferences: { product: true, marketing: false },
    };
    segment.track({
      userId: 'user',
      messageId: 'queued',
      // eslint-disable-next-line @typescript-eslint/naming-convention
      properties: { utm_source: 'campaign', category: 'Onboarding' },
      context: {
        consent: { categoryPreferences: { product: true, marketing: true } },
      },
    });

    updateState({
      ...onboardedState,
      AnalyticsController: {
        analyticsId: 'user',
        optedIn: true,
        eventQueue: { queued: { context: { consent } } },
      },
    });

    expect(client.track).toHaveBeenCalledWith(
      expect.objectContaining({
        properties: { category: 'Onboarding' },
        context: { consent },
      }),
      undefined,
    );
  });

  it('preserves the explicit Metrics Opt Out event after onboarding', () => {
    const { segment, client, updateState } = setup();
    segment.track({
      userId: 'user',
      event: MetaMetricsEventName.MetricsOptOut,
    });

    updateState({
      ...onboardedState,
      AnalyticsController: { analyticsId: 'user', optedIn: false },
    });

    expect(client.track).toHaveBeenCalledTimes(1);
  });

  it('waits for background delivery readiness after onboarding completes', () => {
    const { segment, client, updateState } = setup();
    updateState(onboardedState, false);
    segment.track({ userId: 'user', event: 'Wallet Created' });

    expect(client.track).not.toHaveBeenCalled();

    updateState(onboardedState);

    expect(client.track).toHaveBeenCalledTimes(1);
  });

  it('keeps onboarding events persisted across a restart until successful delivery', async () => {
    function startSession(state?: AnalyticsController['state']) {
      const gate = setup();
      const root = getRootMessenger();
      const configMessenger = new Messenger({
        namespace: 'ConfigRegistryController',
        parent: root,
      });
      configMessenger.registerActionHandler(
        'ConfigRegistryController:getState',
        () => ({
          configs: { networks: {} },
          version: null,
          lastFetched: null,
          etag: null,
        }),
      );
      const controller = new AnalyticsController({
        messenger: getAnalyticsControllerMessenger(root),
        platformAdapter: {
          skipUUIDv4Check: true,
          onSetupCompleted: () => undefined,
          track: (event, properties, context, options) =>
            gate.segment.track(
              {
                event,
                properties,
                context,
                userId: 'user',
                messageId: options?.messageId,
                timestamp: options?.timestamp,
              },
              options?.callback,
            ),
          identify: jest.fn(),
          view: jest.fn(),
        },
        state: state ?? { analyticsId: 'user' },
        isEventQueuePersistenceEnabled: true,
        isPreConsentQueueEnabled: true,
      });
      const syncState = (completedOnboarding = false) =>
        gate.updateState({
          ...onboardedState,
          OnboardingController: { completedOnboarding },
          AnalyticsController: controller.state,
        });
      root.subscribe('AnalyticsController:stateChanged', () => syncState());
      syncState();
      return { ...gate, controller, syncState };
    }
    const first = startSession();
    await first.controller.init();
    first.controller.trackEvent({
      name: 'Wallet Setup Started',
      hasProperties: false,
      properties: {},
      sensitiveProperties: {},
      saveDataRecording: false,
    });
    expect(
      Object.keys(first.controller.state.preConsentEventQueue ?? {}),
    ).toHaveLength(1);

    await first.controller.optIn();

    expect(first.client.track).not.toHaveBeenCalled();
    expect(Object.keys(first.controller.state.eventQueue ?? {})).toHaveLength(
      1,
    );

    const restarted = startSession(first.controller.state);
    await restarted.controller.init();
    expect(restarted.client.track).not.toHaveBeenCalled();

    restarted.syncState(true);

    expect(restarted.client.track).toHaveBeenCalledTimes(1);
    expect(
      Object.keys(restarted.controller.state.eventQueue ?? {}),
    ).toHaveLength(1);
    restarted.client.track.mock.calls[0][1]?.();
    expect(restarted.controller.state.eventQueue).toEqual({});
  });
});
