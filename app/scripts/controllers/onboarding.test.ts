import { deriveStateFromMetadata } from '@metamask/base-controller';
import {
  MOCK_ANY_NAMESPACE,
  Messenger,
  MessengerActions,
  MessengerEvents,
  MockAnyNamespace,
} from '@metamask/messenger';
import { FirstTimeFlowType } from '../../../shared/constants/onboarding';
import { getIsSeedlessOnboardingFeatureEnabled } from '../../../shared/lib/environment';
import { TraceName } from '../../../shared/lib/trace';
import {
  OnboardingController,
  OnboardingControllerMessenger,
  getDefaultOnboardingControllerState,
} from './onboarding';

jest.mock('../../../shared/lib/environment', () => ({
  ...jest.requireActual('../../../shared/lib/environment'),
  getIsSeedlessOnboardingFeatureEnabled: jest.fn(() => false),
}));

const isSeedlessOnboardingEnabled = jest.mocked(
  getIsSeedlessOnboardingFeatureEnabled,
);

function setupController({
  addTabRemovedListener = jest.fn(),
  bufferedTrace = jest.fn(),
  bufferedEndTrace = jest.fn(),
  observeTabRemoval = true,
}: {
  addTabRemovedListener?: jest.Mock;
  bufferedTrace?: jest.Mock;
  bufferedEndTrace?: jest.Mock;
  observeTabRemoval?: boolean;
} = {}): OnboardingController {
  const messenger = new Messenger<
    MockAnyNamespace,
    MessengerActions<OnboardingControllerMessenger>,
    MessengerEvents<OnboardingControllerMessenger>
  >({ namespace: MOCK_ANY_NAMESPACE });
  messenger.registerActionHandler(
    'SentryTracingService:bufferedTrace',
    bufferedTrace,
  );
  messenger.registerActionHandler(
    'SentryTracingService:bufferedEndTrace',
    bufferedEndTrace,
  );
  const onboardingControllerMessenger: OnboardingControllerMessenger =
    new Messenger({
      namespace: 'OnboardingController',
      parent: messenger,
    });
  messenger.delegate({
    messenger: onboardingControllerMessenger,
    actions: [
      'SentryTracingService:bufferedTrace',
      'SentryTracingService:bufferedEndTrace',
    ],
    events: [],
  });
  const onboardingController = new OnboardingController({
    messenger: onboardingControllerMessenger,
    state: getDefaultOnboardingControllerState(),
    platform: (observeTabRemoval ? { addTabRemovedListener } : {}) as never,
  });
  return onboardingController;
}

describe('OnboardingController', () => {
  it('should set the seedPhraseBackedUp property', () => {
    const controller = setupController();
    const newSeedPhraseBackUpState = true;
    controller.setSeedPhraseBackedUp(newSeedPhraseBackUpState);
    expect(controller.state.seedPhraseBackedUp).toBe(newSeedPhraseBackUpState);
  });

  it('should set the firstTimeFlowType property', () => {
    const controller = setupController();
    const type: FirstTimeFlowType = FirstTimeFlowType.create;
    controller.setFirstTimeFlowType(type);
    expect(controller.state.firstTimeFlowType).toBe(type);
  });

  it('should set the hasSeenOnboardingCompletionPage property', () => {
    const controller = setupController();
    controller.setHasSeenOnboardingCompletionPage(true);
    expect(controller.state.hasSeenOnboardingCompletionPage).toBe(true);
  });

  it('should reset hasSeenOnboardingCompletionPage when onboarding is reset', () => {
    const controller = setupController();
    controller.setHasSeenOnboardingCompletionPage(true);
    controller.resetOnboarding();
    expect(controller.state.hasSeenOnboardingCompletionPage).toBe(false);
  });

  it('should register a site for onboarding', async () => {
    const controller = setupController();
    const location = 'example.com';
    const tabId = '123';
    await controller.registerOnboarding(location, tabId);
    expect(controller.state.onboardingTabs?.[location]).toBe(tabId);
  });

  it('marks onboarding complete', () => {
    const controller = setupController();

    expect(controller.completeOnboarding()).toBe(true);
    expect(controller.state.completedOnboarding).toBe(true);
  });

  it('constructs when the platform does not observe tab removal', () => {
    expect(() => setupController({ observeTabRemoval: false })).not.toThrow();
  });

  describe('registerOnboarding', () => {
    it('ignores registration after onboarding is complete', async () => {
      const controller = setupController();
      controller.completeOnboarding();

      await controller.registerOnboarding('example.com', '123');

      expect(controller.state.onboardingTabs).toEqual({});
    });

    it('keeps the existing registration when the same tab registers again', async () => {
      const controller = setupController();
      await controller.registerOnboarding('example.com', '123');
      const { onboardingTabs } = controller.state;

      await controller.registerOnboarding('example.com', '123');

      expect(controller.state.onboardingTabs).toBe(onboardingTabs);
    });

    it('replaces the tab registered for a location', async () => {
      const controller = setupController();
      await controller.registerOnboarding('example.com', '123');

      await controller.registerOnboarding('example.com', '456');

      expect(controller.state.onboardingTabs).toEqual({
        'example.com': '456',
      });
    });
  });

  describe('getIsSocialLoginFlow', () => {
    afterEach(() => {
      isSeedlessOnboardingEnabled.mockReset();
      isSeedlessOnboardingEnabled.mockReturnValue(false);
    });

    it('returns false when seedless onboarding is disabled', () => {
      isSeedlessOnboardingEnabled.mockReturnValue(false);
      const controller = setupController();
      controller.setFirstTimeFlowType(FirstTimeFlowType.socialCreate);

      expect(controller.getIsSocialLoginFlow()).toBe(false);
    });

    // @ts-expect-error This function is missing from the Mocha type definitions
    it.each([FirstTimeFlowType.socialCreate, FirstTimeFlowType.socialImport])(
      'returns true for %s when seedless onboarding is enabled',
      (flowType: FirstTimeFlowType) => {
        isSeedlessOnboardingEnabled.mockReturnValue(true);
        const controller = setupController();
        controller.setFirstTimeFlowType(flowType);

        expect(controller.getIsSocialLoginFlow()).toBe(true);
      },
    );

    it('returns false for a non-social flow when seedless onboarding is enabled', () => {
      isSeedlessOnboardingEnabled.mockReturnValue(true);
      const controller = setupController();
      controller.setFirstTimeFlowType(FirstTimeFlowType.create);

      expect(controller.getIsSocialLoginFlow()).toBe(false);
    });
  });

  it('clears onboarding progress when onboarding is reset', async () => {
    const controller = setupController();
    controller.setSeedPhraseBackedUp(true);
    controller.setFirstTimeFlowType(FirstTimeFlowType.import);
    controller.setHasSeenOnboardingCompletionPage(true);
    await controller.registerOnboarding('example.com', '123');
    controller.completeOnboarding();

    controller.resetOnboarding();

    expect(controller.state).toMatchObject({
      completedOnboarding: false,
      hasSeenOnboardingCompletionPage: false,
      onboardingJourneyEnded: false,
      firstTimeFlowType: null,
      seedPhraseBackedUp: null,
      onboardingTabs: {},
    });
  });

  describe('onboarding journey tracing', () => {
    it('resumes a journey on reload and ends it when its tab is removed', () => {
      const addTabRemovedListener = jest.fn();
      const bufferedTrace = jest.fn();
      const bufferedEndTrace = jest.fn();
      const controller = setupController({
        addTabRemovedListener,
        bufferedTrace,
        bufferedEndTrace,
      });
      const tabRemovedListener = addTabRemovedListener.mock.calls[0][0] as (
        tabId: number,
      ) => void;

      const traceId = controller.startOnboardingJourney({
        tabId: '1',
        lastStep: 'welcome',
      });

      expect(
        controller.startOnboardingJourney({
          tabId: '1',
          lastStep: 'create-password',
        }),
      ).toBe(traceId);
      expect(bufferedTrace).toHaveBeenCalledTimes(1);

      tabRemovedListener(1);

      expect(bufferedEndTrace).toHaveBeenCalledWith({
        name: TraceName.OnboardingJourneyOverall,
        id: traceId,
        data: {
          success: false,
          abandoned: true,
          // eslint-disable-next-line @typescript-eslint/naming-convention
          last_step: 'create-password',
          // eslint-disable-next-line @typescript-eslint/naming-convention
          perf_fix: 'trace-registry-v1',
        },
      });
    });

    it('traces a journey when the tab ID is unavailable', () => {
      const bufferedTrace = jest.fn();
      const bufferedEndTrace = jest.fn();
      const controller = setupController({
        bufferedTrace,
        bufferedEndTrace,
      });

      const traceId = controller.startOnboardingJourney({
        lastStep: 'welcome',
      });
      controller.endOnboardingJourney({
        lastStep: 'welcome',
        success: true,
      });

      expect(bufferedTrace).toHaveBeenCalledWith(
        expect.objectContaining({ id: traceId }),
      );
      expect(bufferedEndTrace).toHaveBeenCalledWith(
        expect.objectContaining({
          id: traceId,
          data: expect.objectContaining({ success: true }),
        }),
      );
    });

    it('does not open a new journey after a successful end', () => {
      const addTabRemovedListener = jest.fn();
      const bufferedTrace = jest.fn();
      const bufferedEndTrace = jest.fn();
      const controller = setupController({
        addTabRemovedListener,
        bufferedTrace,
        bufferedEndTrace,
      });
      const tabRemovedListener = addTabRemovedListener.mock.calls[0][0] as (
        tabId: number,
      ) => void;

      controller.startOnboardingJourney({
        tabId: '1',
        lastStep: 'welcome',
      });
      controller.endOnboardingJourney({
        tabId: '1',
        lastStep: 'metametrics',
        success: true,
      });
      bufferedTrace.mockClear();
      bufferedEndTrace.mockClear();

      expect(
        controller.startOnboardingJourney({
          tabId: '1',
          lastStep: 'metametrics',
        }),
      ).toBeUndefined();
      expect(bufferedTrace).not.toHaveBeenCalled();

      tabRemovedListener(1);

      expect(bufferedEndTrace).not.toHaveBeenCalled();
      expect(controller.state.onboardingJourneyEnded).toBe(true);
    });

    it('does not open a journey when onboarding is already complete', () => {
      const addTabRemovedListener = jest.fn();
      const bufferedTrace = jest.fn();
      const bufferedEndTrace = jest.fn();
      const controller = setupController({
        addTabRemovedListener,
        bufferedTrace,
        bufferedEndTrace,
      });
      const tabRemovedListener = addTabRemovedListener.mock.calls[0][0] as (
        tabId: number,
      ) => void;

      controller.completeOnboarding();

      expect(
        controller.startOnboardingJourney({
          tabId: '1',
          lastStep: 'completion',
        }),
      ).toBeUndefined();
      expect(bufferedTrace).not.toHaveBeenCalled();

      tabRemovedListener(1);

      expect(bufferedEndTrace).not.toHaveBeenCalled();
    });

    it('opens a new journey after an abandoned end', () => {
      const addTabRemovedListener = jest.fn();
      const bufferedTrace = jest.fn();
      const controller = setupController({
        addTabRemovedListener,
        bufferedTrace,
      });
      const tabRemovedListener = addTabRemovedListener.mock.calls[0][0] as (
        tabId: number,
      ) => void;

      const firstTraceId = controller.startOnboardingJourney({
        tabId: '1',
        lastStep: 'welcome',
      });
      tabRemovedListener(1);

      const secondTraceId = controller.startOnboardingJourney({
        tabId: '2',
        lastStep: 'welcome',
      });

      expect(secondTraceId).toEqual(expect.any(String));
      expect(secondTraceId).not.toBe(firstTraceId);
      expect(bufferedTrace).toHaveBeenCalledTimes(2);
      expect(controller.state.onboardingJourneyEnded).toBe(false);
    });

    it('ends an in-progress journey and allows a new one after reset', () => {
      const bufferedTrace = jest.fn();
      const bufferedEndTrace = jest.fn();
      const controller = setupController({
        bufferedTrace,
        bufferedEndTrace,
      });

      const traceId = controller.startOnboardingJourney({
        tabId: '1',
        lastStep: 'welcome',
      });
      controller.resetOnboarding();

      expect(bufferedEndTrace).toHaveBeenCalledWith(
        expect.objectContaining({
          id: traceId,
          data: expect.objectContaining({
            success: false,
            abandoned: true,
          }),
        }),
      );
      expect(controller.state.onboardingJourneyEnded).toBe(false);

      const nextTraceId = controller.startOnboardingJourney({
        tabId: '1',
        lastStep: 'welcome',
      });

      expect(nextTraceId).toEqual(expect.any(String));
      expect(nextTraceId).not.toBe(traceId);
      expect(bufferedTrace).toHaveBeenCalledTimes(2);
    });

    it('does not end a completed journey when its tab is removed', () => {
      const addTabRemovedListener = jest.fn();
      const bufferedEndTrace = jest.fn();
      const controller = setupController({
        addTabRemovedListener,
        bufferedEndTrace,
      });
      const tabRemovedListener = addTabRemovedListener.mock.calls[0][0] as (
        tabId: number,
      ) => void;

      controller.startOnboardingJourney({
        tabId: '1',
        lastStep: 'welcome',
      });
      controller.endOnboardingJourney({
        tabId: '1',
        lastStep: 'welcome',
        success: true,
      });

      tabRemovedListener(1);

      expect(bufferedEndTrace).toHaveBeenCalledTimes(1);
      expect(bufferedEndTrace).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            success: true,
          }),
        }),
      );
    });

    it('keeps journeys for different tabs isolated', () => {
      const addTabRemovedListener = jest.fn();
      const bufferedEndTrace = jest.fn();
      const controller = setupController({
        addTabRemovedListener,
        bufferedEndTrace,
      });
      const tabRemovedListener = addTabRemovedListener.mock.calls[0][0] as (
        tabId: number,
      ) => void;

      controller.startOnboardingJourney({
        tabId: '1',
        lastStep: 'welcome',
      });
      controller.startOnboardingJourney({
        tabId: '2',
        lastStep: 'create-password',
      });

      tabRemovedListener(1);
      tabRemovedListener(2);

      expect(bufferedEndTrace).toHaveBeenCalledTimes(2);
      expect(bufferedEndTrace.mock.calls[0][0].data.last_step).toBe('welcome');
      expect(bufferedEndTrace.mock.calls[1][0].data.last_step).toBe(
        'create-password',
      );
    });

    it('updates the last step of a live journey', () => {
      const addTabRemovedListener = jest.fn();
      const bufferedEndTrace = jest.fn();
      const controller = setupController({
        addTabRemovedListener,
        bufferedEndTrace,
      });
      const tabRemovedListener = addTabRemovedListener.mock.calls[0][0] as (
        tabId: number,
      ) => void;

      controller.startOnboardingJourney({
        tabId: '1',
        lastStep: 'welcome',
      });
      controller.updateOnboardingJourney({
        tabId: '1',
        lastStep: 'create-password',
      });

      tabRemovedListener(1);

      expect(bufferedEndTrace.mock.calls[0][0].data.last_step).toBe(
        'create-password',
      );
    });

    it('ignores a journey update when that tab has no journey', () => {
      const bufferedTrace = jest.fn();
      const controller = setupController({ bufferedTrace });

      controller.updateOnboardingJourney({
        tabId: 'missing',
        lastStep: 'welcome',
      });

      expect(bufferedTrace).not.toHaveBeenCalled();
    });

    it('ignores ending a journey that is not open', () => {
      const bufferedEndTrace = jest.fn();
      const controller = setupController({ bufferedEndTrace });

      controller.endOnboardingJourney({
        tabId: 'missing',
        lastStep: 'welcome',
        success: false,
      });

      expect(bufferedEndTrace).not.toHaveBeenCalled();
    });

    it('ends a journey that has no tab id when onboarding is reset', () => {
      const bufferedEndTrace = jest.fn();
      const controller = setupController({ bufferedEndTrace });
      const traceId = controller.startOnboardingJourney({
        lastStep: 'welcome',
      });

      controller.resetOnboarding();

      expect(bufferedEndTrace).toHaveBeenCalledWith(
        expect.objectContaining({
          id: traceId,
          data: expect.objectContaining({
            success: false,
            abandoned: true,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            last_step: 'welcome',
          }),
        }),
      );
    });

    it('ignores removal of a tab that has no journey', () => {
      const addTabRemovedListener = jest.fn();
      const bufferedEndTrace = jest.fn();
      const controller = setupController({
        addTabRemovedListener,
        bufferedEndTrace,
      });
      const tabRemovedListener = addTabRemovedListener.mock.calls[0][0] as (
        tabId: number,
      ) => void;

      tabRemovedListener(99);

      expect(bufferedEndTrace).not.toHaveBeenCalled();
      expect(controller.state.onboardingJourneyEnded).toBe(false);
    });
  });

  describe('metadata', () => {
    it('includes expected state in debug snapshots', () => {
      const controller = setupController();

      expect(
        deriveStateFromMetadata(
          controller.state,
          controller.metadata,
          'includeInDebugSnapshot',
        ),
      ).toMatchInlineSnapshot(`
        {
          "completedOnboarding": false,
          "firstTimeFlowType": null,
          "hasSeenOnboardingCompletionPage": false,
          "onboardingJourneyEnded": false,
          "seedPhraseBackedUp": null,
        }
      `);
    });

    it('includes expected state in state logs', () => {
      const controller = setupController();

      expect(
        deriveStateFromMetadata(
          controller.state,
          controller.metadata,
          'includeInStateLogs',
        ),
      ).toMatchInlineSnapshot(`
        {
          "completedOnboarding": false,
          "firstTimeFlowType": null,
          "hasSeenOnboardingCompletionPage": false,
          "onboardingJourneyEnded": false,
          "onboardingTabs": {},
          "seedPhraseBackedUp": null,
        }
      `);
    });

    it('persists expected state', () => {
      const controller = setupController();

      expect(
        deriveStateFromMetadata(
          controller.state,
          controller.metadata,
          'persist',
        ),
      ).toMatchInlineSnapshot(`
        {
          "completedOnboarding": false,
          "firstTimeFlowType": null,
          "hasSeenOnboardingCompletionPage": false,
          "onboardingJourneyEnded": false,
          "seedPhraseBackedUp": null,
        }
      `);
    });

    it('exposes expected state to UI', () => {
      const controller = setupController();

      expect(
        deriveStateFromMetadata(
          controller.state,
          controller.metadata,
          'usedInUi',
        ),
      ).toMatchInlineSnapshot(`
        {
          "completedOnboarding": false,
          "firstTimeFlowType": null,
          "hasSeenOnboardingCompletionPage": false,
          "onboardingTabs": {},
          "seedPhraseBackedUp": null,
        }
      `);
    });
  });
});
