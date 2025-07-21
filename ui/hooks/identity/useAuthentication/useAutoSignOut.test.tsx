import { act } from '@testing-library/react-hooks';
import { renderHookWithProviderTyped } from '../../../../test/lib/render-helpers';
import * as actions from '../../../store/actions';
import { MetamaskIdentityProvider } from '../../../contexts/identity';
import { useAutoSignOut } from './useAutoSignOut';

type ArrangeMocksMetamaskStateOverrides = {
  isUnlocked: boolean;
  useExternalServices: boolean;
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
  const mockPerformSignInAction = jest.spyOn(actions, 'performSignOut');
  return {
    mockPerformSignInAction,
  };
};

const prerequisitesStateKeys = [
  'isUnlocked',
  'useExternalServices',
  'isSignedIn',
];

const shouldAutoSignOutTestCases: ArrangeMocksMetamaskStateOverrides[] = [];
const shouldNotAutoSignOutTestCases: ArrangeMocksMetamaskStateOverrides[] = [];

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
    !combinedState.useExternalServices &&
    combinedState.isSignedIn
  ) {
    shouldAutoSignOutTestCases.push(combinedState);
  } else {
    shouldNotAutoSignOutTestCases.push(combinedState);
  }
});

describe('useAutoSignOut', () => {
  it('should initialize correctly', () => {
    const state = arrangeMockState({
      isUnlocked: false,
      isSignedIn: false,
      useExternalServices: false,
    });
    arrangeMocks();
    const hook = renderHookWithProviderTyped(
      () => useAutoSignOut(),
      state,
      undefined,
      MetamaskIdentityProvider,
    );

    expect(hook.result.current.autoSignOut).toBeDefined();
    expect(hook.result.current.shouldAutoSignOut).toBeDefined();
  });

  shouldNotAutoSignOutTestCases.forEach((stateOverrides) => {
    it(`should not call performSignOut if conditions are not met`, async () => {
      const state = arrangeMockState(stateOverrides);
      const { mockPerformSignInAction } = arrangeMocks();
      const hook = renderHookWithProviderTyped(
        () => useAutoSignOut(),
        state,
        undefined,
        MetamaskIdentityProvider,
      );

      await act(async () => {
        await hook.result.current.autoSignOut();
      });

      expect(mockPerformSignInAction).not.toHaveBeenCalled();
    });
  });

  shouldAutoSignOutTestCases.forEach((stateOverrides) => {
    it(`should call performSignOut if conditions are met`, async () => {
      const state = arrangeMockState(stateOverrides);
      const { mockPerformSignInAction } = arrangeMocks();
      const hook = renderHookWithProviderTyped(
        () => useAutoSignOut(),
        state,
        undefined,
        MetamaskIdentityProvider,
      );

      await act(async () => {
        await hook.result.current.autoSignOut();
      });

      expect(mockPerformSignInAction).toHaveBeenCalled();
    });
  });
});
