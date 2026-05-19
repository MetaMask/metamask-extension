import { ORIGIN_METAMASK } from '@metamask/controller-utils';
import {
  SimulationData,
  SimulationTokenStandard,
} from '@metamask/transaction-controller';
import {
  isEnforcedSimulationsEligible,
  getEnforcedSimulationsSlippage,
} from './enforced-simulations';

describe('enforced-simulations', () => {
  describe('isEnforcedSimulationsEligible', () => {
    beforeEach(() => {
      process.env.ENABLE_ENFORCED_SIMULATIONS = 'true';
    });

    afterEach(() => {
      delete process.env.ENABLE_ENFORCED_SIMULATIONS;
    });

    const baseSimulationData: SimulationData = {
      nativeBalanceChange: {
        difference: '0x1' as const,
        isDecrease: false,
        previousBalance: '0x0' as const,
        newBalance: '0x1' as const,
      },
      tokenBalanceChanges: [],
    };

    const baseMeta = {
      delegationAddress: '0x123' as const,
      origin: 'https://some-dapp.com',
      simulationData: baseSimulationData,
    };

    it('returns true when all conditions are met', () => {
      expect(isEnforcedSimulationsEligible(baseMeta)).toBe(true);
    });

    it('returns false when env flag is not set', () => {
      delete process.env.ENABLE_ENFORCED_SIMULATIONS;

      expect(isEnforcedSimulationsEligible(baseMeta)).toBe(false);
    });

    it('returns false when origin is undefined', () => {
      expect(
        isEnforcedSimulationsEligible({ ...baseMeta, origin: undefined }),
      ).toBe(false);
    });

    it('returns false when origin is MetaMask internal', () => {
      expect(
        isEnforcedSimulationsEligible({
          ...baseMeta,
          origin: ORIGIN_METAMASK,
        }),
      ).toBe(false);
    });

    it('returns false when delegation address is missing', () => {
      expect(
        isEnforcedSimulationsEligible({
          ...baseMeta,
          delegationAddress: undefined,
        }),
      ).toBe(false);
    });

    it('returns false when simulation data is undefined', () => {
      expect(
        isEnforcedSimulationsEligible({
          ...baseMeta,
          simulationData: undefined,
        }),
      ).toBe(false);
    });

    it('returns false when simulation data is null', () => {
      expect(
        isEnforcedSimulationsEligible({
          ...baseMeta,
          simulationData: null as unknown as SimulationData,
        }),
      ).toBe(false);
    });

    it('returns false when simulation data has no balance changes', () => {
      expect(
        isEnforcedSimulationsEligible({
          ...baseMeta,
          simulationData: { tokenBalanceChanges: [] },
        }),
      ).toBe(false);
    });

    it('returns true when simulation data has only token balance changes', () => {
      expect(
        isEnforcedSimulationsEligible({
          ...baseMeta,
          simulationData: {
            tokenBalanceChanges: [
              {
                address: '0xabc' as const,
                standard: SimulationTokenStandard.erc20,
                difference: '0x1' as const,
                isDecrease: true,
                previousBalance: '0x2' as const,
                newBalance: '0x1' as const,
              },
            ],
          },
        }),
      ).toBe(true);
    });
  });

  describe('getEnforcedSimulationsSlippage', () => {
    it('returns the default slippage percentage', () => {
      expect(getEnforcedSimulationsSlippage()).toBe(10);
    });
  });
});
