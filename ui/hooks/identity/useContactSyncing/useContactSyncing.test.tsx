import { waitFor } from '@testing-library/react';
import { renderHookWithProviderTyped } from '../../../../test/lib/render-helpers';
import * as actions from '../../../store/actions';
import { MetamaskIdentityProvider } from '../../../contexts/identity';
import {
  useContactSyncing,
  useShouldDispatchContactSyncing,
} from './useContactSyncing';

type ArrangeMocksMetamaskStateOverrides = {
  isSignedIn?: boolean;
  isBackupAndSyncEnabled?: boolean;
  isContactSyncingEnabled?: boolean;
  isUnlocked?: boolean;
  useExternalServices?: boolean;
  completedOnboarding?: boolean;
};

const initialMetamaskState: ArrangeMocksMetamaskStateOverrides = {
  isSignedIn: true,
  isBackupAndSyncEnabled: true,
  isContactSyncingEnabled: true,
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
      keyrings: [],
    },
  };

  return { state };
};

describe('useShouldDispatchContactSyncing()', () => {
  const testCases = (() => {
    const properties = [
      'isSignedIn',
      'isBackupAndSyncEnabled',
      'isContactSyncingEnabled',
      'isUnlocked',
      'useExternalServices',
      'completedOnboarding',
    ] as const;
    const baseState = {
      isSignedIn: true,
      isBackupAndSyncEnabled: true,
      isContactSyncingEnabled: true,
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
      () => useShouldDispatchContactSyncing(),
      state,
      undefined,
      MetamaskIdentityProvider,
    );
    expect(hook.result.current).toBe(true);
  });

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  it.each(testCases.failureStateCases)(
    'should return false if not all conditions are met [%s = false]',
    ({
      state: failureState,
    }: (typeof testCases)['failureStateCases'][number]) => {
      const { state } = arrangeMockState(failureState);
      const hook = renderHookWithProviderTyped(
        () => useShouldDispatchContactSyncing(),
        state,
        undefined,
        MetamaskIdentityProvider,
      );
      expect(hook.result.current).toBe(false);
    },
  );
});

describe('useContactSyncing', () => {
  const arrangeMocks = () => {
    const mockSyncContactsAction = jest.spyOn(
      actions,
      'syncContactsWithUserStorage',
    );
    return {
      mockSyncContactsAction,
    };
  };

  const arrangeAndAct = (
    stateOverrides: ArrangeMocksMetamaskStateOverrides = initialMetamaskState,
  ) => {
    const mocks = arrangeMocks();
    const { state } = arrangeMockState(stateOverrides);

    const { result } = renderHookWithProviderTyped(
      () => useContactSyncing(),
      state,
      undefined,
      MetamaskIdentityProvider,
    );
    const { dispatchContactSyncing, shouldDispatchContactSyncing } =
      result.current;

    return { mocks, dispatchContactSyncing, shouldDispatchContactSyncing };
  };

  it('should dispatch if conditions are met', async () => {
    const { mocks, dispatchContactSyncing, shouldDispatchContactSyncing } =
      arrangeAndAct();

    await dispatchContactSyncing();

    await waitFor(() => {
      expect(mocks.mockSyncContactsAction).toHaveBeenCalled();
      expect(shouldDispatchContactSyncing).toBe(true);
    });
  });

  it('should not dispatch conditions are not met', async () => {
    const { mocks, dispatchContactSyncing, shouldDispatchContactSyncing } =
      arrangeAndAct({ isContactSyncingEnabled: false });

    await dispatchContactSyncing();

    await waitFor(() => {
      expect(mocks.mockSyncContactsAction).not.toHaveBeenCalled();
      expect(shouldDispatchContactSyncing).toBe(false);
    });
  });
});
