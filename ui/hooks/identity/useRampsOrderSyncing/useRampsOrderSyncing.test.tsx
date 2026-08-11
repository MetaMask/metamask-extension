import { waitFor } from '@testing-library/react';
import { renderHookWithProviderTyped } from '../../../../test/lib/render-helpers-navigate';
import * as rampsControllerActions from '../../../store/controller-actions/ramps-controller';
import { MetamaskIdentityProvider } from '../../../contexts/identity';
import {
  useRampsOrderSyncing,
  useShouldDispatchRampsOrderSyncing,
} from './useRampsOrderSyncing';

type StateOverrides = {
  isSignedIn?: boolean;
  isBackupAndSyncEnabled?: boolean;
  isRampsSyncingEnabled?: boolean;
  isUnlocked?: boolean;
  useExternalServices?: boolean;
  completedOnboarding?: boolean;
};

const defaultState: Required<StateOverrides> = {
  isSignedIn: true,
  isBackupAndSyncEnabled: true,
  isRampsSyncingEnabled: true,
  isUnlocked: true,
  useExternalServices: true,
  completedOnboarding: true,
};

const arrangeState = (overrides: StateOverrides = {}) => ({
  state: { metamask: { ...defaultState, ...overrides, keyrings: [] } },
});

describe('useShouldDispatchRampsOrderSyncing()', () => {
  const gateKeys = Object.keys(defaultState) as (keyof typeof defaultState)[];

  it('returns true when all gates pass', () => {
    const { state } = arrangeState();
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
  it.each(gateKeys)(
    'returns false when %s is false',
    (key: keyof typeof defaultState) => {
      const { state } = arrangeState({ [key]: false });
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
  const arrange = (overrides: StateOverrides = defaultState) => {
    const mockSync = jest
      .spyOn(rampsControllerActions, 'syncRampsOrdersWithUserStorage')
      .mockResolvedValue(undefined);
    const { state } = arrangeState(overrides);
    const { result } = renderHookWithProviderTyped(
      () => useRampsOrderSyncing(),
      state,
      undefined,
      MetamaskIdentityProvider,
    );
    return { mockSync, ...result.current };
  };

  it('dispatches when conditions are met', async () => {
    const {
      mockSync,
      dispatchRampsOrderSyncing,
      shouldDispatchRampsOrderSyncing,
    } = arrange();
    dispatchRampsOrderSyncing();
    await waitFor(() => {
      expect(mockSync).toHaveBeenCalled();
      expect(shouldDispatchRampsOrderSyncing).toBe(true);
    });
  });

  it('does not dispatch when conditions fail', async () => {
    const {
      mockSync,
      dispatchRampsOrderSyncing,
      shouldDispatchRampsOrderSyncing,
    } = arrange({ isRampsSyncingEnabled: false });
    dispatchRampsOrderSyncing();
    await waitFor(() => {
      expect(mockSync).not.toHaveBeenCalled();
      expect(shouldDispatchRampsOrderSyncing).toBe(false);
    });
  });
});
