import { deriveStateFromMetadata } from '@metamask/base-controller';
import {
  MOCK_ANY_NAMESPACE,
  Messenger,
  MessengerActions,
  MessengerEvents,
  MockAnyNamespace,
} from '@metamask/messenger';
import { FirstTimeFlowType } from '../../../shared/constants/onboarding';
import {
  OnboardingController,
  OnboardingControllerMessenger,
  getDefaultOnboardingControllerState,
} from './onboarding';

function setupController(): OnboardingController {
  const messenger = new Messenger<
    MockAnyNamespace,
    MessengerActions<OnboardingControllerMessenger>,
    MessengerEvents<OnboardingControllerMessenger>
  >({ namespace: MOCK_ANY_NAMESPACE });
  const onboardingControllerMessenger: OnboardingControllerMessenger =
    new Messenger({
      namespace: 'OnboardingController',
      parent: messenger,
    });
  const onboardingController = new OnboardingController({
    messenger: onboardingControllerMessenger,
    state: getDefaultOnboardingControllerState(),
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
