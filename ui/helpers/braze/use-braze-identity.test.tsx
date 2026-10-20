import { it } from '@jest/globals';
import { KeyringTypes } from '@metamask/keyring-controller';
import { act } from '@testing-library/react';
import { renderHookWithProviderTyped } from '../../../test/lib/render-helpers-navigate';
import { UPDATE_METAMASK_STATE } from '../../store/actionConstants';
import { clearBrazeUser, identifyBrazeUser } from './identify-braze-user';
import { useBrazeIdentity } from './use-braze-identity';

jest.mock('./identify-braze-user');

const arrangeState = () => ({
  metamask: {
    completedOnboarding: true,
    isUnlocked: true,
    useExternalServices: true,
    isSignedIn: true,
    keyrings: [
      {
        type: KeyringTypes.hd,
        accounts: [],
        metadata: { id: 'entropy-1', name: '' },
      },
    ],
    srpSessionData: {
      'entropy-1': { profile: { canonicalProfileId: 'canonical-123' } },
    },
  },
});

describe('useBrazeIdentity', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('identifies an unlocked, signed-in wallet with basic functionality enabled', () => {
    renderHookWithProviderTyped(() => useBrazeIdentity(), arrangeState());

    expect(identifyBrazeUser).toHaveBeenCalledWith('canonical-123');
    expect(clearBrazeUser).not.toHaveBeenCalled();
  });

  it.each([false, undefined])(
    'does not identify before onboarding completion is confirmed (%s)',
    (completedOnboarding) => {
      const state = arrangeState();

      renderHookWithProviderTyped(() => useBrazeIdentity(), {
        metamask: { ...state.metamask, completedOnboarding },
      });

      expect(identifyBrazeUser).not.toHaveBeenCalled();
    },
  );

  it('waits for the canonical profile ID', () => {
    const state = arrangeState();
    const { store } = renderHookWithProviderTyped(() => useBrazeIdentity(), {
      metamask: { ...state.metamask, srpSessionData: {} },
    });
    expect(identifyBrazeUser).not.toHaveBeenCalled();

    act(() => {
      store.dispatch({
        type: UPDATE_METAMASK_STATE,
        value: { srpSessionData: arrangeState().metamask.srpSessionData },
      });
    });

    expect(identifyBrazeUser).toHaveBeenCalledWith('canonical-123');
    expect(clearBrazeUser).not.toHaveBeenCalled();
  });

  it('waits for unlock before identifying', () => {
    const state = arrangeState();
    state.metamask.isUnlocked = false;
    const { store } = renderHookWithProviderTyped(
      () => useBrazeIdentity(),
      state,
    );
    expect(identifyBrazeUser).not.toHaveBeenCalled();

    act(() => {
      store.dispatch({
        type: UPDATE_METAMASK_STATE,
        value: { isUnlocked: true },
      });
    });

    expect(identifyBrazeUser).toHaveBeenCalledWith('canonical-123');
    expect(clearBrazeUser).not.toHaveBeenCalled();
  });

  it.each(['isSignedIn', 'useExternalServices'] as const)(
    'clears an active SDK instead of identifying when %s is off on mount',
    (gate) => {
      const state = arrangeState();
      state.metamask[gate] = false;

      renderHookWithProviderTyped(() => useBrazeIdentity(), state);

      expect(identifyBrazeUser).not.toHaveBeenCalled();
      expect(clearBrazeUser).toHaveBeenCalledTimes(1);
    },
  );

  it('does not repeat identity synchronization on unrelated store updates', () => {
    const { store } = renderHookWithProviderTyped(
      () => useBrazeIdentity(),
      arrangeState(),
    );

    act(() => {
      store.dispatch({
        type: UPDATE_METAMASK_STATE,
        value: { isUnlocked: true },
      });
    });

    expect(identifyBrazeUser).toHaveBeenCalledTimes(1);
  });

  it('re-identifies when the canonical profile ID changes', () => {
    const { store } = renderHookWithProviderTyped(
      () => useBrazeIdentity(),
      arrangeState(),
    );

    act(() => {
      store.dispatch({
        type: UPDATE_METAMASK_STATE,
        value: {
          srpSessionData: {
            'entropy-1': { profile: { canonicalProfileId: 'canonical-456' } },
          },
        },
      });
    });

    expect(identifyBrazeUser).toHaveBeenLastCalledWith('canonical-456');
    expect(clearBrazeUser).not.toHaveBeenCalled();
  });

  it('does not wipe when the wallet locks after identifying', () => {
    const { store } = renderHookWithProviderTyped(
      () => useBrazeIdentity(),
      arrangeState(),
    );

    act(() => {
      store.dispatch({
        type: UPDATE_METAMASK_STATE,
        value: { isUnlocked: false, keyrings: [] },
      });
    });

    expect(clearBrazeUser).not.toHaveBeenCalled();
    expect(identifyBrazeUser).toHaveBeenCalledTimes(1);
  });

  it.each(['isSignedIn', 'useExternalServices'] as const)(
    'clears when %s turns off and identifies again when it turns on',
    (gate) => {
      const { store } = renderHookWithProviderTyped(
        () => useBrazeIdentity(),
        arrangeState(),
      );

      act(() => {
        store.dispatch({
          type: UPDATE_METAMASK_STATE,
          value: { [gate]: false },
        });
      });
      expect(clearBrazeUser).toHaveBeenCalledTimes(1);

      act(() => {
        store.dispatch({
          type: UPDATE_METAMASK_STATE,
          value: { [gate]: true },
        });
      });

      expect(identifyBrazeUser).toHaveBeenCalledTimes(2);
      expect(identifyBrazeUser).toHaveBeenLastCalledWith('canonical-123');
    },
  );
});
