import { act } from '@testing-library/react-hooks';
import { renderHookWithProviderTyped } from '../../../../test/lib/render-helpers';
import * as actions from '../../../store/actions';
import { MetamaskIdentityProvider } from '../../../contexts/identity';
import { useSignOut } from './useSignOut';

type ArrangeMocksMetamaskStateOverrides = {
  isSignedIn: boolean;
};

const arrangeMockState = (
  stateOverrides: ArrangeMocksMetamaskStateOverrides,
) => {
  return {
    metamask: {
      ...stateOverrides,
      keyrings: [],
    },
  };
};

const arrangeMocks = () => {
  const mockPerformSignOutAction = jest.spyOn(actions, 'performSignOut');

  return {
    mockPerformSignOutAction,
  };
};

describe('useSignOut', () => {
  it('should initialize correctly', () => {
    const state = arrangeMockState({
      isSignedIn: true,
    });
    arrangeMocks();
    const hook = renderHookWithProviderTyped(
      () => useSignOut(),
      state,
      undefined,
      MetamaskIdentityProvider,
    );

    expect(hook.result.current.signOut).toBeDefined();
  });

  it('should call performSignOut if the user is signed in', async () => {
    const state = arrangeMockState({
      isSignedIn: true,
    });
    const { mockPerformSignOutAction } = arrangeMocks();
    const hook = renderHookWithProviderTyped(
      () => useSignOut(),
      state,
      undefined,
      MetamaskIdentityProvider,
    );

    await act(async () => {
      await hook.result.current.signOut();
    });

    expect(mockPerformSignOutAction).toHaveBeenCalled();
  });

  it('should not call performSignOut if the user is already signed out', async () => {
    const state = arrangeMockState({
      isSignedIn: false,
    });
    const { mockPerformSignOutAction } = arrangeMocks();
    const hook = renderHookWithProviderTyped(
      () => useSignOut(),
      state,
      undefined,
      MetamaskIdentityProvider,
    );

    await act(async () => {
      await hook.result.current.signOut();
    });

    expect(mockPerformSignOutAction).not.toHaveBeenCalled();
  });
});
