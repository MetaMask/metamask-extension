import { waitFor } from '@testing-library/react';
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

  it('repairs a consolidated wallet when Basic Functionality is disabled after the remote flag is turned off', async () => {
    renderHookWithProvider(() => useBasicFunctionalityConsolidation(), {
      metamask: {
        completedOnboarding: true,
        isUnlocked: true,
        useExternalServices: false,
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
