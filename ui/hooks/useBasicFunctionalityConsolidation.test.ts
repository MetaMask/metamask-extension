import { waitFor } from '@testing-library/react';
import { FirstTimeFlowType } from '../../shared/constants/onboarding';
import { renderHookWithProvider } from '../../test/lib/render-helpers-navigate';
import { consolidateBasicFunctionality } from '../store/actions';
import { useBasicFunctionalityConsolidation } from './useBasicFunctionalityConsolidation';

jest.mock('../store/actions', () => ({
  consolidateBasicFunctionality: jest.fn(() => () => Promise.resolve()),
}));

describe('useBasicFunctionalityConsolidation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
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

  it('does not consolidate an unmarked wallet when the remote flag is disabled', () => {
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

    expect(consolidateBasicFunctionality).not.toHaveBeenCalled();
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
