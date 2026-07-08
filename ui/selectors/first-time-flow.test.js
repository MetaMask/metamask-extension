import { FirstTimeFlowType } from '../../shared/constants/onboarding';
import {
  ONBOARDING_COMPLETION_ROUTE,
  ONBOARDING_CREATE_PASSWORD_ROUTE,
  ONBOARDING_IMPORT_WITH_SRP_ROUTE,
} from '../helpers/constants/routes';
import {
  getFirstTimeFlowTypeRouteAfterUnlock,
  getShouldUnlockBeforeOnboardingCompletion,
} from './first-time-flow';

describe('getFirstTimeFlowTypeRouteAfterUnlock', () => {
  it('returns the completion route when the user has seen it but onboarding is unfinished', () => {
    const state = {
      metamask: {
        firstTimeFlowType: FirstTimeFlowType.create,
        hasSeenOnboardingCompletionPage: true,
        completedOnboarding: false,
      },
    };

    expect(getFirstTimeFlowTypeRouteAfterUnlock(state)).toBe(
      ONBOARDING_COMPLETION_ROUTE,
    );
  });

  it('returns the flow-specific route when onboarding completion has not been seen', () => {
    const createState = {
      metamask: {
        firstTimeFlowType: FirstTimeFlowType.create,
        hasSeenOnboardingCompletionPage: false,
        completedOnboarding: false,
      },
    };
    const importState = {
      metamask: {
        firstTimeFlowType: FirstTimeFlowType.import,
        hasSeenOnboardingCompletionPage: false,
        completedOnboarding: false,
      },
    };

    expect(getFirstTimeFlowTypeRouteAfterUnlock(createState)).toBe(
      ONBOARDING_CREATE_PASSWORD_ROUTE,
    );
    expect(getFirstTimeFlowTypeRouteAfterUnlock(importState)).toBe(
      ONBOARDING_IMPORT_WITH_SRP_ROUTE,
    );
  });
});

describe('getShouldUnlockBeforeOnboardingCompletion', () => {
  it('returns true for a locked return visit to onboarding completion', () => {
    const state = {
      metamask: {
        hasSeenOnboardingCompletionPage: true,
        completedOnboarding: false,
        isUnlocked: false,
        isInitialized: true,
        isWalletResetInProgress: false,
      },
    };

    expect(getShouldUnlockBeforeOnboardingCompletion(state)).toBe(true);
  });

  it('returns false when the wallet is already unlocked', () => {
    const state = {
      metamask: {
        hasSeenOnboardingCompletionPage: true,
        completedOnboarding: false,
        isUnlocked: true,
        isInitialized: true,
        isWalletResetInProgress: false,
      },
    };

    expect(getShouldUnlockBeforeOnboardingCompletion(state)).toBe(false);
  });
});
