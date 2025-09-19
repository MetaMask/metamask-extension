import { Messenger, deriveStateFromMetadata } from '@metamask/base-controller';
import { FirstTimeFlowType } from '../../../shared/constants/onboarding';
import OnboardingController, {
  getDefaultOnboardingControllerState,
} from './onboarding';

function setupController(): OnboardingController {
  const messenger = new Messenger();
  const onboardingControllerMessenger = messenger.getRestricted({
    name: 'OnboardingController',
    allowedActions: [],
    allowedEvents: [],
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
          'anonymous',
        ),
      ).toMatchInlineSnapshot(`
        {
          "completedOnboarding": false,
          "firstTimeFlowType": null,
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
          "onboardingTabs": {},
          "seedPhraseBackedUp": null,
        }
      `);
    });
  });
});
