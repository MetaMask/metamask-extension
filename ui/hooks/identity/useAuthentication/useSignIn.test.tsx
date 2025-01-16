import { act } from '@testing-library/react-hooks';
import { renderHookWithProviderTyped } from '../../../../test/lib/render-helpers';
import * as actions from '../../../store/actions';
import { MetamaskIdentityProvider } from '../../../contexts/identity';
import { useSignIn } from './useSignIn';

type ArrangeMocksMetamaskStateOverrides = {
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

  const mockDisableProfileSyncingAction = jest.spyOn(
    actions,
    'disableProfileSyncing',
  );
  return {
    mockPerformSignInAction,
    mockDisableProfileSyncingAction,
  };
};

describe('useSignIn', () => {
  it('should initialize correctly', () => {
    const state = arrangeMockState({
      isProfileSyncingEnabled: false,
      isSignedIn: false,
      participateInMetaMetrics: false,
    });
    arrangeMocks();
    const hook = renderHookWithProviderTyped(
      () => useSignIn(),
      state,
      undefined,
      MetamaskIdentityProvider,
    );

    expect(hook.result.current.signIn).toBeDefined();
    expect(hook.result.current.shouldSignIn).toBeDefined();
  });

  // @ts-expect-error This is missing from the Mocha type definitions
  it.each`
    isSignedIn | isProfileSyncingEnabled | participateInMetaMetrics
    ${false}   | ${false}                | ${false}
    ${true}    | ${true}                 | ${false}
    ${true}    | ${false}                | ${true}
    ${true}    | ${true}                 | ${true}
  `(
    'should return false for shouldSignIn if alreadySignedIn: $alreadySignedIn, profileSyncingEnabled: $profileSyncingEnabled, metaMetricsEnabled: $metaMetricsEnabled',
    (stateOverrides: ArrangeMocksMetamaskStateOverrides) => {
      const state = arrangeMockState(stateOverrides);
      arrangeMocks();
      const hook = renderHookWithProviderTyped(
        () => useSignIn(),
        state,
        undefined,
        MetamaskIdentityProvider,
      );

      expect(hook.result.current.shouldSignIn()).toBe(false);
    },
  );

  // @ts-expect-error This is missing from the Mocha type definitions
  it.each`
    isSignedIn | isProfileSyncingEnabled | participateInMetaMetrics
    ${false}   | ${true}                 | ${false}
    ${false}   | ${false}                | ${true}
    ${false}   | ${true}                 | ${true}
  `(
    'should return true for shouldSignIn if alreadySignedIn: $alreadySignedIn, profileSyncingEnabled: $profileSyncingEnabled, metaMetricsEnabled: $metaMetricsEnabled',
    (stateOverrides: ArrangeMocksMetamaskStateOverrides) => {
      const state = arrangeMockState(stateOverrides);
      arrangeMocks();
      const hook = renderHookWithProviderTyped(
        () => useSignIn(),
        state,
        undefined,
        MetamaskIdentityProvider,
      );

      expect(hook.result.current.shouldSignIn()).toBe(true);
    },
  );

  it('should call performSignIn if shouldSignIn returns true', async () => {
    // This state is set up so that shouldSignIn returns true
    const state = arrangeMockState({
      isSignedIn: false,
      isProfileSyncingEnabled: true,
      participateInMetaMetrics: false,
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
});
