import { act } from '@testing-library/react-hooks';
import { renderHookWithProviderTyped } from '../../../../test/lib/render-helpers';
import * as actions from '../../../store/actions';
import { MetamaskIdentityProvider } from '../../../contexts/identity';
import { useAutoSignIn } from './useAutoSignIn';

type ArrangeMocksMetamaskStateOverrides = {
  isUnlocked: boolean;
  completedOnboarding: boolean;
  isSignedIn: boolean;
  isProfileSyncingEnabled: boolean;
  participateInMetaMetrics: boolean;
};

const arrangeMockState = (
  stateOverrides: ArrangeMocksMetamaskStateOverrides,
) => {
  return {
    metamask: {
      ...stateOverrides,
    },
  };
};

const arrangeMocks = () => {
  const mockPerformSignInAction = jest.spyOn(actions, 'performSignIn');
  return {
    mockPerformSignInAction,
  };
};

describe('useAutoSignIn', () => {
  it('should initialize correctly', () => {
    const state = arrangeMockState({
      isUnlocked: false,
      completedOnboarding: false,
      isProfileSyncingEnabled: false,
      isSignedIn: false,
      participateInMetaMetrics: false,
    });
    arrangeMocks();
    const hook = renderHookWithProviderTyped(
      () => useAutoSignIn(),
      state,
      undefined,
      MetamaskIdentityProvider,
    );

    expect(hook.result.current.autoSignIn).toBeDefined();
  });

  // @ts-expect-error This is missing from the Mocha type definitions
  it.each`
    isUnlocked | completedOnboarding | isSignedIn | isProfileSyncingEnabled | participateInMetaMetrics
    ${false}   | ${false}            | ${false}   | ${true}                 | ${true}
    ${true}    | ${false}            | ${false}   | ${true}                 | ${true}
    ${false}   | ${true}             | ${false}   | ${true}                 | ${true}
  `(
    'should not call performSignIn if isUnlocked: $isUnlocked, completedOnboarding: $completedOnboarding',
    async (stateOverrides: ArrangeMocksMetamaskStateOverrides) => {
      const state = arrangeMockState(stateOverrides);
      const { mockPerformSignInAction } = arrangeMocks();
      const hook = renderHookWithProviderTyped(
        () => useAutoSignIn(),
        state,
        undefined,
        MetamaskIdentityProvider,
      );

      await act(async () => {
        await hook.result.current.autoSignIn();
      });

      expect(mockPerformSignInAction).not.toHaveBeenCalled();
    },
  );

  it('should call performSignIn if all conditions are met', async () => {
    const state = arrangeMockState({
      isUnlocked: true,
      completedOnboarding: true,
      // These values ensure that shouldSignIn from the useSignIn hook returns true
      isProfileSyncingEnabled: true,
      isSignedIn: false,
      participateInMetaMetrics: true,
    });
    const { mockPerformSignInAction } = arrangeMocks();
    const hook = renderHookWithProviderTyped(
      () => useAutoSignIn(),
      state,
      undefined,
      MetamaskIdentityProvider,
    );

    await act(async () => {
      await hook.result.current.autoSignIn();
    });

    expect(mockPerformSignInAction).toHaveBeenCalled();
  });
});
