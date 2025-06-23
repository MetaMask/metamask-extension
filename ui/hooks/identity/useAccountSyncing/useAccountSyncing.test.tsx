import { waitFor } from '@testing-library/react';
import { renderHookWithProviderTyped } from '../../../../test/lib/render-helpers';
import * as actions from '../../../store/actions';
import { MetamaskIdentityProvider } from '../../../contexts/identity';
import {
  useAccountSyncing,
  useDeleteAccountSyncingDataFromUserStorage,
  useShouldDispatchAccountSyncing,
} from './useAccountSyncing';

type ArrangeMocksMetamaskStateOverrides = {
  isSignedIn?: boolean;
  isBackupAndSyncEnabled?: boolean;
  isAccountSyncingEnabled?: boolean;
  isUnlocked?: boolean;
  useExternalServices?: boolean;
  completedOnboarding?: boolean;
  isAccountSyncingReadyToBeDispatched?: boolean;
};

const initialMetamaskState: ArrangeMocksMetamaskStateOverrides = {
  isSignedIn: true,
  isBackupAndSyncEnabled: true,
  isAccountSyncingEnabled: true,
  isUnlocked: true,
  useExternalServices: true,
  completedOnboarding: true,
  isAccountSyncingReadyToBeDispatched: true,
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

describe('useShouldDispatchAccountSyncing()', () => {
  const testCases = (() => {
    const properties = [
      'isSignedIn',
      'isBackupAndSyncEnabled',
      'isAccountSyncingEnabled',
      'isUnlocked',
      'useExternalServices',
      'completedOnboarding',
      'isAccountSyncingReadyToBeDispatched',
    ] as const;
    const baseState = {
      isSignedIn: true,
      isBackupAndSyncEnabled: true,
      isAccountSyncingEnabled: true,
      isUnlocked: true,
      useExternalServices: true,
      completedOnboarding: true,
      isAccountSyncingReadyToBeDispatched: true,
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
      () => useShouldDispatchAccountSyncing(),
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
        () => useShouldDispatchAccountSyncing(),
        state,
        undefined,
        MetamaskIdentityProvider,
      );
      expect(hook.result.current).toBe(false);
    },
  );
});

describe('useAccountSyncing', () => {
  const arrangeMocks = () => {
    const mockSyncAccountsAction = jest.spyOn(
      actions,
      'syncInternalAccountsWithUserStorage',
    );
    return {
      mockSyncAccountsAction,
    };
  };

  const arrangeAndAct = (
    stateOverrides: ArrangeMocksMetamaskStateOverrides = initialMetamaskState,
  ) => {
    const mocks = arrangeMocks();
    const { state } = arrangeMockState(stateOverrides);

    const { result } = renderHookWithProviderTyped(
      () => useAccountSyncing(),
      state,
      undefined,
      MetamaskIdentityProvider,
    );
    const { dispatchAccountSyncing, shouldDispatchAccountSyncing } =
      result.current;

    return { mocks, dispatchAccountSyncing, shouldDispatchAccountSyncing };
  };

  it('should dispatch if conditions are met', async () => {
    const { mocks, dispatchAccountSyncing, shouldDispatchAccountSyncing } =
      arrangeAndAct();

    await dispatchAccountSyncing();

    await waitFor(() => {
      expect(mocks.mockSyncAccountsAction).toHaveBeenCalled();
      expect(shouldDispatchAccountSyncing).toBe(true);
    });
  });

  it('should not dispatch conditions are not met', async () => {
    const { mocks, dispatchAccountSyncing, shouldDispatchAccountSyncing } =
      arrangeAndAct({ isAccountSyncingReadyToBeDispatched: false });

    await dispatchAccountSyncing();

    await waitFor(() => {
      expect(mocks.mockSyncAccountsAction).not.toHaveBeenCalled();
      expect(shouldDispatchAccountSyncing).toBe(false);
    });
  });
});

describe('useDeleteAccountSyncingDataFromUserStorage()', () => {
  it('should dispatch account sync data deletion', async () => {
    const mockDeleteAccountSyncAction = jest.spyOn(
      actions,
      'deleteAccountSyncingDataFromUserStorage',
    );

    const { result } = renderHookWithProviderTyped(
      () => useDeleteAccountSyncingDataFromUserStorage(),
      arrangeMockState().state,
      undefined,
      MetamaskIdentityProvider,
    );

    await result.current.dispatchDeleteAccountSyncingData();

    expect(mockDeleteAccountSyncAction).toHaveBeenCalled();
  });
});
