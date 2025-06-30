import { act } from '@testing-library/react-hooks';
import { renderHookWithProviderTyped } from '../../../../test/lib/render-helpers';
import * as actions from '../../../store/actions';
import { MetamaskIdentityProvider } from '../../../contexts/identity';
import { useSignIn } from './useSignIn';

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
  const mockPerformSignInAction = jest.spyOn(actions, 'performSignIn');

  return {
    mockPerformSignInAction,
  };
};

describe('useSignIn', () => {
  it('should initialize correctly', () => {
    const state = arrangeMockState({
      isSignedIn: false,
    });
    arrangeMocks();
    const hook = renderHookWithProviderTyped(
      () => useSignIn(),
      state,
      undefined,
      MetamaskIdentityProvider,
    );

    expect(hook.result.current.signIn).toBeDefined();
  });

  it('should call performSignIn if a user is not already signed in', async () => {
    const state = arrangeMockState({
      isSignedIn: false,
    });
    const { mockPerformSignInAction } = arrangeMocks();
    const hook = renderHookWithProviderTyped(
      () => useSignIn(),
      state,
      undefined,
      MetamaskIdentityProvider,
    );

    await act(async () => {
      await hook.result.current.signIn();
    });

    expect(mockPerformSignInAction).toHaveBeenCalled();
  });

  it('should not call performSignIn if a user is already signed in', async () => {
    const state = arrangeMockState({
      isSignedIn: true,
    });
    const { mockPerformSignInAction } = arrangeMocks();
    const hook = renderHookWithProviderTyped(
      () => useSignIn(),
      state,
      undefined,
      MetamaskIdentityProvider,
    );

    await act(async () => {
      await hook.result.current.signIn();
    });

    expect(mockPerformSignInAction).not.toHaveBeenCalled();
  });
});
