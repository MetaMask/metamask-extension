import { deriveStateFromMetadata } from '@metamask/base-controller';
import {
  MOCK_ANY_NAMESPACE,
  Messenger,
  MessengerActions,
  MessengerEvents,
  MockAnyNamespace,
} from '@metamask/messenger';
import { FirstTimeFlowType } from '../../../shared/constants/onboarding';
import { TraceName } from '../../../shared/lib/trace';
import {
  OnboardingController,
  OnboardingControllerMessenger,
  getDefaultOnboardingControllerState,
} from './onboarding';

function setupController({
  addTabRemovedListener = jest.fn(),
  bufferedTrace = jest.fn(),
  bufferedEndTrace = jest.fn(),
}: {
  addTabRemovedListener?: jest.Mock;
  bufferedTrace?: jest.Mock;
  bufferedEndTrace?: jest.Mock;
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
    platform: { addTabRemovedListener } as never,
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
