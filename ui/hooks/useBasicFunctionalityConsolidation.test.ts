import { waitFor } from '@testing-library/react';
import { FirstTimeFlowType } from '../../shared/constants/onboarding';
import { renderHookWithProvider } from '../../test/lib/render-helpers-navigate';
import { consolidateBasicFunctionality } from '../store/actions';
import { useBasicFunctionalityConsolidation } from './useBasicFunctionalityConsolidation';

jest.mock('../store/actions', () => ({
  consolidateBasicFunctionality: jest.fn(() => () => Promise.resolve()),
}));

const mockGetIsBasicFunctionalityConsolidationEnabledInBuild = jest.fn(
  () => false,
);
jest.mock('../../shared/lib/environment', () => ({
  ...jest.requireActual('../../shared/lib/environment'),
  getIsBasicFunctionalityConsolidationEnabledInBuild: () =>
    mockGetIsBasicFunctionalityConsolidationEnabledInBuild(),
}));

describe('useBasicFunctionalityConsolidation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetIsBasicFunctionalityConsolidationEnabledInBuild.mockReturnValue(
      false,
    );
  });

  it('repairs a consolidated social-login wallet when Basic Functionality is disabled', async () => {
    renderHookWithProvider(() => useBasicFunctionalityConsolidation(), {
      metamask: {
        completedOnboarding: true,
        isUnlocked: true,
        useExternalServices: false,
        firstTimeFlowType: FirstTimeFlowType.socialCreate,
        remoteFeatureFlags: {
          extensionBasicFunctionalityToggle: false,
        },
        preferences: {
          isBasicFunctionalityConsolidatedEnabled: true,
        },
      },
    });

    await waitFor(() => {
      expect(consolidateBasicFunctionality).toHaveBeenCalledTimes(1);
    });
  });

  it('does not repair a consolidated non-social wallet when Basic Functionality is disabled', () => {
    renderHookWithProvider(() => useBasicFunctionalityConsolidation(), {
      metamask: {
        completedOnboarding: true,
        isUnlocked: true,
        useExternalServices: false,
        firstTimeFlowType: FirstTimeFlowType.create,
        remoteFeatureFlags: {
          extensionBasicFunctionalityToggle: false,
        },
        preferences: {
          isBasicFunctionalityConsolidatedEnabled: true,
        },
      },
    });

    expect(consolidateBasicFunctionality).not.toHaveBeenCalled();
  });

  it('does not consolidate an unmarked BF-on wallet when the remote flag is disabled', () => {
    renderHookWithProvider(() => useBasicFunctionalityConsolidation(), {
      metamask: {
        completedOnboarding: true,
        isUnlocked: true,
        useExternalServices: true,
        remoteFeatureFlags: {
          extensionBasicFunctionalityToggle: false,
        },
        preferences: {
          isBasicFunctionalityConsolidatedEnabled: false,
        },
      },
    });

    expect(consolidateBasicFunctionality).not.toHaveBeenCalled();
  });

  it('consolidates an unmarked BF-off wallet when the build flag is on', async () => {
    mockGetIsBasicFunctionalityConsolidationEnabledInBuild.mockReturnValue(
      true,
    );

    renderHookWithProvider(() => useBasicFunctionalityConsolidation(), {
      metamask: {
        completedOnboarding: true,
        isUnlocked: true,
        useExternalServices: false,
        remoteFeatureFlags: {
          extensionBasicFunctionalityToggle: false,
        },
        preferences: {
          isBasicFunctionalityConsolidatedEnabled: false,
        },
      },
    });

    await waitFor(() => {
      expect(consolidateBasicFunctionality).toHaveBeenCalledTimes(1);
    });
  });

  it('waits for auth sign-in before repairing an imported wallet without local social state', () => {
    renderHookWithProvider(() => useBasicFunctionalityConsolidation(), {
      metamask: {
        completedOnboarding: true,
        isUnlocked: true,
        isSignedIn: false,
        useExternalServices: true,
        firstTimeFlowType: FirstTimeFlowType.import,
        needsSocialPairing: true,
        remoteFeatureFlags: {
          extensionBasicFunctionalityToggle: true,
        },
        preferences: {
          isBasicFunctionalityConsolidatedEnabled: true,
          hasLinkedSocialLoginProfile: false,
        },
      },
    });

    expect(consolidateBasicFunctionality).not.toHaveBeenCalled();
  });

  it('repairs after linked-social profile is detected for an imported wallet', async () => {
    renderHookWithProvider(() => useBasicFunctionalityConsolidation(), {
      metamask: {
        completedOnboarding: true,
        isUnlocked: true,
        isSignedIn: true,
        needsSocialPairing: false,
        useExternalServices: true,
        firstTimeFlowType: FirstTimeFlowType.import,
        remoteFeatureFlags: {
          extensionBasicFunctionalityToggle: true,
        },
        preferences: {
          isBasicFunctionalityConsolidatedEnabled: true,
          hasLinkedSocialLoginProfile: true,
        },
      },
    });

    await waitFor(() => {
      expect(consolidateBasicFunctionality).toHaveBeenCalledTimes(1);
    });
  });

  it('does not recheck a healthy consolidated wallet', () => {
    renderHookWithProvider(() => useBasicFunctionalityConsolidation(), {
      metamask: {
        completedOnboarding: true,
        isUnlocked: true,
        useExternalServices: true,
        remoteFeatureFlags: {
          extensionBasicFunctionalityToggle: true,
        },
        preferences: {
          isBasicFunctionalityConsolidatedEnabled: true,
        },
      },
    });

    expect(consolidateBasicFunctionality).not.toHaveBeenCalled();
  });
});
