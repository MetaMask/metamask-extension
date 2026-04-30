import { act } from '@testing-library/react-hooks';
import { renderHookWithProviderTyped } from '../../../../test/lib/render-helpers-navigate';
import * as actions from '../../../store/actions';
import { MetamaskIdentityProvider } from '../../../contexts/identity';
import { useAutoSignIn } from './useAutoSignIn';

type ArrangeMocksMetamaskStateOverrides = {
  isUnlocked: boolean;
  useExternalServices: boolean;
  isSignedIn: boolean;
  completedOnboarding: boolean;
  needsProfilePairing: boolean;
};

const arrangeMockState = (
  stateOverrides: ArrangeMocksMetamaskStateOverrides,
  keyrings: {
    type: string;
    accounts: string[];
    metadata: { id: string };
  }[] = [],
) => {
  return {
    metamask: {
      ...stateOverrides,
      keyrings,
    },
  };
};

const arrangeMocks = () => {
  const mockPerformSignInAction = jest.spyOn(actions, 'performSignIn');
  const mockRequestProfilePairing = jest.spyOn(
    actions,
    'requestProfilePairing',
  );
  return {
    mockPerformSignInAction,
    mockRequestProfilePairing,
  };
};

const prerequisitesStateKeys = [
  'isUnlocked',
  'useExternalServices',
  'isSignedIn',
  'completedOnboarding',
  'needsProfilePairing',
];

const shouldAutoSignInTestCases: ArrangeMocksMetamaskStateOverrides[] = [];
const shouldNotAutoSignInTestCases: ArrangeMocksMetamaskStateOverrides[] = [];

// We generate all possible combinations of the prerequisites here
const generateCombinations = (keys: string[]) => {
  const result: ArrangeMocksMetamaskStateOverrides[] = [];
  const total = 2 ** keys.length;
  for (let i = 0; i < total; i++) {
    const state = {} as ArrangeMocksMetamaskStateOverrides;
    keys.forEach((key, index) => {
      state[key as keyof ArrangeMocksMetamaskStateOverrides] = Boolean(
        Math.floor(i / 2 ** index) % 2,
      );
    });
    result.push(state);
  }
  return result;
};

const prerequisiteCombinations = generateCombinations(prerequisitesStateKeys);

prerequisiteCombinations.forEach((combinedState) => {
  // Mirror the gate in the hook:
  //   (!isSignedIn || needsProfilePairing) &&
  //   isUnlocked && useExternalServices && completedOnboarding
  if (
    combinedState.isUnlocked &&
    combinedState.useExternalServices &&
    combinedState.completedOnboarding &&
    (!combinedState.isSignedIn || combinedState.needsProfilePairing)
  ) {
    shouldAutoSignInTestCases.push(combinedState);
  } else {
    shouldNotAutoSignInTestCases.push(combinedState);
  }
});

describe('useAutoSignIn', () => {
  it('should initialize correctly', () => {
    const state = arrangeMockState({
      isUnlocked: false,
      isSignedIn: false,
      completedOnboarding: false,
      useExternalServices: false,
      needsProfilePairing: false,
    });
    arrangeMocks();
    const hook = renderHookWithProviderTyped(
      () => useAutoSignIn(),
      state,
      undefined,
      MetamaskIdentityProvider,
    );

    expect(hook.result.current.autoSignIn).toBeDefined();
    expect(hook.result.current.shouldAutoSignIn).toBeDefined();
  });

  shouldNotAutoSignInTestCases.forEach((stateOverrides) => {
    it(`should not call performSignIn if conditions are not met`, async () => {
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
    });
  });

  shouldAutoSignInTestCases.forEach((stateOverrides) => {
    it(`should call performSignIn if conditions are met`, async () => {
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

      expect(mockPerformSignInAction).toHaveBeenCalled();
    });
  });

  it('forces sign-in when needsProfilePairing flips, even if already signed in', async () => {
    const state = arrangeMockState({
      isUnlocked: true,
      useExternalServices: true,
      completedOnboarding: true,
      isSignedIn: true,
      needsProfilePairing: true,
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

    // `signIn(true)` is called: the hook passes `true` to force a fresh
    // `performSignIn` so the controller re-runs pairing.
    expect(mockPerformSignInAction).toHaveBeenCalled();
  });

  it('does NOT dispatch requestProfilePairing on initial mount with stable keyrings', async () => {
    const stateOverrides: ArrangeMocksMetamaskStateOverrides = {
      isUnlocked: true,
      useExternalServices: true,
      completedOnboarding: true,
      isSignedIn: true,
      needsProfilePairing: false,
    };
    const { mockRequestProfilePairing } = arrangeMocks();
    const initialState = arrangeMockState(stateOverrides, [
      { type: 'HD Key Tree', accounts: ['0x1'], metadata: { id: 'k1' } },
    ]);
    renderHookWithProviderTyped(
      () => useAutoSignIn(),
      initialState,
      undefined,
      MetamaskIdentityProvider,
    );

    // Initial mount baselines the keyring count via `useRef`; no dispatch
    // should fire until the count actually changes between renders.
    expect(mockRequestProfilePairing).not.toHaveBeenCalled();
  });
});
