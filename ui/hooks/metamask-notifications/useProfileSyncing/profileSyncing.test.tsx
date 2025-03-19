import { act } from '@testing-library/react-hooks';
import { renderHookWithProviderTyped } from '../../../../test/lib/render-helpers';
import { MetamaskNotificationsProvider } from '../../../contexts/metamask-notifications';
import * as actions from '../../../store/actions';
import {
  useDisableProfileSyncing,
  useEnableProfileSyncing,
  useShouldDispatchProfileSyncing,
} from './profileSyncing';

type ArrangeMocksMetamaskStateOverrides = {
  isSignedIn?: boolean;
  isProfileSyncingEnabled?: boolean;
  isUnlocked?: boolean;
  useExternalServices?: boolean;
  completedOnboarding?: boolean;
};

const initialMetamaskState: ArrangeMocksMetamaskStateOverrides = {
  isSignedIn: false,
  isProfileSyncingEnabled: false,
  isUnlocked: true,
  useExternalServices: true,
  completedOnboarding: true,
};

const arrangeMockState = (
  metamaskStateOverrides?: ArrangeMocksMetamaskStateOverrides,
) => {
  const state = {
    metamask: {
      ...initialMetamaskState,
      ...metamaskStateOverrides,
    },
  };

  return { state };
};

describe('useEnableProfileSyncing()', () => {
  it('should enable profile syncing', async () => {
    const mockEnableProfileSyncingAction = jest.spyOn(
      actions,
      'enableProfileSyncing',
    );

    const { state } = arrangeMockState();
    const { result } = renderHookWithProviderTyped(
      () => useEnableProfileSyncing(),
      state,
    );
    await act(async () => {
      await result.current.enableProfileSyncing();
    });

    expect(mockEnableProfileSyncingAction).toHaveBeenCalled();
  });
});

describe('useDisableProfileSyncing()', () => {
  it('should disable profile syncing', async () => {
    const mockDisableProfileSyncingAction = jest.spyOn(
      actions,
      'disableProfileSyncing',
    );

    const { state } = arrangeMockState();

    const { result } = renderHookWithProviderTyped(
      () => useDisableProfileSyncing(),
      state,
      undefined,
      MetamaskNotificationsProvider,
    );

    await act(async () => {
      await result.current.disableProfileSyncing();
    });

    expect(mockDisableProfileSyncingAction).toHaveBeenCalled();
  });
});

describe('useShouldDispatchProfileSyncing()', () => {
  const testCases = (() => {
    const properties = [
      'isSignedIn',
      'isProfileSyncingEnabled',
      'isUnlocked',
      'useExternalServices',
      'completedOnboarding',
    ] as const;
    const baseState = {
      isSignedIn: true,
      isProfileSyncingEnabled: true,
      isUnlocked: true,
      useExternalServices: true,
      completedOnboarding: true,
    };

    const failureStateCases: {
      state: ArrangeMocksMetamaskStateOverrides;
      failingField: string;
    }[] = [];

    // Generate test cases by toggling each property
    properties.forEach((property) => {
      const state = { ...baseState, [property]: false };
      failureStateCases.push({ state, failingField: property });
    });

    const successTestCase = { state: baseState };

    return { successTestCase, failureStateCases };
  })();

  it('should return true if all conditions are met', () => {
    const { state } = arrangeMockState(testCases.successTestCase.state);
    const hook = renderHookWithProviderTyped(
      () => useShouldDispatchProfileSyncing(),
      state,
    );
    expect(hook.result.current).toBe(true);
  });

  testCases.failureStateCases.forEach(({ state, failingField }) => {
    it(`should return false if not all conditions are met [${failingField} = false]`, () => {
      const { state: newState } = arrangeMockState(state);
      const hook = renderHookWithProviderTyped(
        () => useShouldDispatchProfileSyncing(),
        newState,
      );
      expect(hook.result.current).toBe(false);
    });
  });
});
