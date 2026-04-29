import { act } from '@testing-library/react-hooks';
import { renderHookWithProviderTyped } from '../../../../test/lib/render-helpers-navigate';
import * as actions from '../../../store/actions';
import { MetamaskIdentityProvider } from '../../../contexts/identity';
import { useAutoProfilePairing } from './useAutoProfilePairing';

type ArrangeMocksMetamaskStateOverrides = {
  isUnlocked: boolean;
  useExternalServices: boolean;
  completedOnboarding: boolean;
  hasPairedAtLeastOnce: boolean;
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
  const mockPerformProfilePairingAction = jest.spyOn(
    actions,
    'performProfilePairing',
  );
  return {
    mockPerformProfilePairingAction,
  };
};

const prerequisitesStateKeys = [
  'isUnlocked',
  'useExternalServices',
  'completedOnboarding',
  'hasPairedAtLeastOnce',
];

const shouldAutoPairTestCases: ArrangeMocksMetamaskStateOverrides[] = [];
const shouldNotAutoPairTestCases: ArrangeMocksMetamaskStateOverrides[] = [];

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

generateCombinations(prerequisitesStateKeys).forEach((combinedState) => {
  if (
    combinedState.isUnlocked &&
    combinedState.useExternalServices &&
    combinedState.completedOnboarding &&
    !combinedState.hasPairedAtLeastOnce
  ) {
    shouldAutoPairTestCases.push(combinedState);
  } else {
    shouldNotAutoPairTestCases.push(combinedState);
  }
});

describe('useAutoProfilePairing', () => {
  it('should initialize correctly', () => {
    const state = arrangeMockState({
      isUnlocked: false,
      completedOnboarding: false,
      useExternalServices: false,
      hasPairedAtLeastOnce: false,
    });
    arrangeMocks();
    const hook = renderHookWithProviderTyped(
      () => useAutoProfilePairing(),
      state,
      undefined,
      MetamaskIdentityProvider,
    );

    expect(hook.result.current.autoProfilePairing).toBeDefined();
    expect(hook.result.current.shouldAutoProfilePairing).toBeDefined();
  });

  shouldNotAutoPairTestCases.forEach((stateOverrides) => {
    it(`should not call performProfilePairing if conditions are not met`, async () => {
      const state = arrangeMockState(stateOverrides);
      const { mockPerformProfilePairingAction } = arrangeMocks();
      const hook = renderHookWithProviderTyped(
        () => useAutoProfilePairing(),
        state,
        undefined,
        MetamaskIdentityProvider,
      );

      await act(async () => {
        await hook.result.current.autoProfilePairing();
      });

      expect(mockPerformProfilePairingAction).not.toHaveBeenCalled();
    });
  });

  shouldAutoPairTestCases.forEach((stateOverrides) => {
    it(`should call performProfilePairing if conditions are met`, async () => {
      const state = arrangeMockState(stateOverrides);
      const { mockPerformProfilePairingAction } = arrangeMocks();
      const hook = renderHookWithProviderTyped(
        () => useAutoProfilePairing(),
        state,
        undefined,
        MetamaskIdentityProvider,
      );

      await act(async () => {
        await hook.result.current.autoProfilePairing();
      });

      expect(mockPerformProfilePairingAction).toHaveBeenCalled();
    });
  });
});
