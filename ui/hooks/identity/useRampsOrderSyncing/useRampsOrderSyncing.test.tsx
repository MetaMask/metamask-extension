import { waitFor } from '@testing-library/react';
import { renderHookWithProviderTyped } from '../../../../test/lib/render-helpers-navigate';
import * as rampsControllerActions from '../../../store/controller-actions/ramps-controller';
import { MetamaskIdentityProvider } from '../../../contexts/identity';
import {
  useRampsOrderSyncing,
  useShouldDispatchRampsOrderSyncing,
} from './useRampsOrderSyncing';

type ArrangeMocksMetamaskStateOverrides = {
  isSignedIn?: boolean;
  isBackupAndSyncEnabled?: boolean;
  isRampsSyncingEnabled?: boolean;
  isUnlocked?: boolean;
  useExternalServices?: boolean;
  completedOnboarding?: boolean;
};

const initialMetamaskState: ArrangeMocksMetamaskStateOverrides = {
  isSignedIn: true,
  isBackupAndSyncEnabled: true,
  isRampsSyncingEnabled: true,
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

describe('useShouldDispatchRampsOrderSyncing()', () => {
  const testCases = (() => {
    const properties = [
      'isSignedIn',
      'isBackupAndSyncEnabled',
      'isRampsSyncingEnabled',
      'isUnlocked',
      'useExternalServices',
      'completedOnboarding',
    ] as const;
    const baseState = {
      isSignedIn: true,
      isBackupAndSyncEnabled: true,
      isRampsSyncingEnabled: true,
      isUnlocked: true,
      useExternalServices: true,
      completedOnboarding: true,
    };

    const failureStateCases: {
      state: ArrangeMocksMetamaskStateOverrides;
      failingField: string;
    }[] = [];

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
      () => useShouldDispatchRampsOrderSyncing(),
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
        () => useShouldDispatchRampsOrderSyncing(),
        state,
        undefined,
        MetamaskIdentityProvider,
      );
      expect(hook.result.current).toBe(false);
    },
  );
});

describe('useRampsOrderSyncing', () => {
  const arrangeMocks = () => {
    const mockSyncRampsOrdersAction = jest
      .spyOn(rampsControllerActions, 'syncRampsOrdersWithUserStorage')
      .mockResolvedValue(undefined);
    return {
      mockSyncRampsOrdersAction,
    };
  };

  const arrangeAndAct = (
    stateOverrides: ArrangeMocksMetamaskStateOverrides = initialMetamaskState,
  ) => {
    const mocks = arrangeMocks();
    const { state } = arrangeMockState(stateOverrides);

    const { result } = renderHookWithProviderTyped(
      () => useRampsOrderSyncing(),
      state,
      undefined,
      MetamaskIdentityProvider,
    );
    const { dispatchRampsOrderSyncing, shouldDispatchRampsOrderSyncing } =
      result.current;

    return { mocks, dispatchRampsOrderSyncing, shouldDispatchRampsOrderSyncing };
  };

  it('should dispatch if conditions are met', async () => {
    const { mocks, dispatchRampsOrderSyncing, shouldDispatchRampsOrderSyncing } =
      arrangeAndAct();

    dispatchRampsOrderSyncing();

    await waitFor(() => {
      expect(mocks.mockSyncRampsOrdersAction).toHaveBeenCalled();
      expect(shouldDispatchRampsOrderSyncing).toBe(true);
    });
  });

  it('should not dispatch conditions are not met', async () => {
    const { mocks, dispatchRampsOrderSyncing, shouldDispatchRampsOrderSyncing } =
      arrangeAndAct({ isRampsSyncingEnabled: false });

    dispatchRampsOrderSyncing();

    await waitFor(() => {
      expect(mocks.mockSyncRampsOrdersAction).not.toHaveBeenCalled();
      expect(shouldDispatchRampsOrderSyncing).toBe(false);
    });
  });
});
