import { SimulationData } from '@metamask/transaction-controller';
import { ORIGIN_METAMASK } from '@metamask/controller-utils';
import { genUnapprovedContractInteractionConfirmation } from '../../../../../test/data/confirmations/contract-interaction';
import { getMockConfirmStateForTransaction } from '../../../../../test/data/confirmations/helper';
import { renderHookWithConfirmContextProvider } from '../../../../../test/lib/confirmations/render-helpers';
import { useIsEnforcedSimulationsSupported } from './useIsEnforcedSimulationsSupported';

function renderHook({
  isUpgraded = true,
  origin = 'test.com',
  simulationData = {
    nativeBalanceChange: {
      difference: '0x1',
      isDecrease: false,
      previousBalance: '0x0',
      newBalance: '0x1',
    },
    tokenBalanceChanges: [],
  },
}: {
  isUpgraded?: boolean;
  origin?: string;
  simulationData?: SimulationData;
} = {}) {
  const state = getMockConfirmStateForTransaction(
    genUnapprovedContractInteractionConfirmation({
      delegationAddress: isUpgraded ? '0x123' : undefined,
      origin,
      simulationData,
    }),
  );

  const result = renderHookWithConfirmContextProvider(
    useIsEnforcedSimulationsSupported,
    state,
  );

  return result;
}

describe('useIsEnforcedSimulationsSupported', () => {
  beforeEach(() => {
    process.env.ENABLE_ENFORCED_SIMULATIONS = true as never;
  });

  it('returns true if supported', () => {
    const { result } = renderHook();
    expect(result.current).toBe(true);
  });

  it('returns false if not upgraded', () => {
    const { result } = renderHook({ isUpgraded: false });
    expect(result.current).toBe(false);
  });

  it('returns false if internal origin', () => {
    const { result } = renderHook({ origin: ORIGIN_METAMASK });
    expect(result.current).toBe(false);
  });

  it('returns false if no balance changes', () => {
    const { result } = renderHook({
      simulationData: { tokenBalanceChanges: [] },
    });
    expect(result.current).toBe(false);
  });
});
