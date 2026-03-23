import { getEnforcedSimulationsSlippage } from './enforced-simulations';

describe('enforced-simulations', () => {
  describe('getEnforcedSimulationsSlippage', () => {
    it('returns the default slippage percentage', () => {
      expect(getEnforcedSimulationsSlippage()).toBe(10);
    });
  });
});
