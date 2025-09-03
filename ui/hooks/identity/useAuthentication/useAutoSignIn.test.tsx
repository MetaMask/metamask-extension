import { act } from '@testing-library/react-hooks';
import { renderHookWithProviderTyped } from '../../../../test/lib/render-helpers';
import * as actions from '../../../store/actions';
import { MetamaskIdentityProvider } from '../../../contexts/identity';
import { useAutoSignIn } from './useAutoSignIn';

type ArrangeMocksMetamaskStateOverrides = {
  isUnlocked: boolean;
  useExternalServices: boolean;
  isSignedIn: boolean;
  completedOnboarding: boolean;
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

const prerequisitesStateKeys = [
  'isUnlocked',
  'useExternalServices',
  'isSignedIn',
  'completedOnboarding',
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
  if (
    combinedState.isUnlocked &&
    combinedState.useExternalServices &&
    combinedState.completedOnboarding &&
    !combinedState.isSignedIn
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
});
