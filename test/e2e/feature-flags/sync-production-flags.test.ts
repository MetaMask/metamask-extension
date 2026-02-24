import { getProductionRemoteFlagApiResponse } from './feature-flag-registry';
import { compareProductionFlagsToRegistry } from './sync-production-flags';

describe('sync-production-flags', () => {
  describe('compareProductionFlagsToRegistry', () => {
    it('detects new flags in production not in registry', () => {
      const prodResponse = [
        { addSolanaAccount: true },
        { brandNewFlag: { enabled: true } },
      ];
      const result = compareProductionFlagsToRegistry(prodResponse);

      expect(result.newInProduction).toContainEqual({
        name: 'brandNewFlag',
        value: { enabled: true },
      });
      expect(result.hasDrift).toBe(true);
    });

    it('detects value mismatches between registry and production', () => {
      // addSolanaAccount is true in registry - use false in prod to trigger mismatch
      const prodResponse = [
        { addSolanaAccount: false },
        { addBitcoinAccount: false },
      ];
      const result = compareProductionFlagsToRegistry(prodResponse);

      const addSolanaMismatch = result.valueMismatches.find(
        (m) => m.name === 'addSolanaAccount',
      );
      expect(addSolanaMismatch).toBeDefined();
      expect(addSolanaMismatch?.productionValue).toBe(false);
      expect(addSolanaMismatch?.registryValue).toBe(true);
      expect(result.hasDrift).toBe(true);
    });

    it('detects flags in registry no longer in production', () => {
      const prodResponse: Record<string, unknown>[] = [];
      const result = compareProductionFlagsToRegistry(prodResponse);

      expect(result.removedFromProduction.length).toBeGreaterThan(0);
      expect(result.hasDrift).toBe(true);
    });

    it('returns hasDrift false when production matches registry', () => {
      const registryResponse = getProductionRemoteFlagApiResponse();
      const prodResponse = registryResponse as Record<string, unknown>[];

      const result = compareProductionFlagsToRegistry(prodResponse);

      expect(result.newInProduction).toHaveLength(0);
      expect(result.removedFromProduction).toHaveLength(0);
      expect(result.valueMismatches).toHaveLength(0);
      expect(result.hasDrift).toBe(false);
    });

    it('parses production API format (array of single-key objects)', () => {
      const prodResponse = [
        { flagA: true },
        { flagB: { nested: 'value' } },
        { flagC: [1, 2, 3] },
      ];
      const result = compareProductionFlagsToRegistry(prodResponse);

      expect(result.newInProduction).toContainEqual({
        name: 'flagA',
        value: true,
      });
      expect(result.newInProduction).toContainEqual({
        name: 'flagB',
        value: { nested: 'value' },
      });
      expect(result.newInProduction).toContainEqual({
        name: 'flagC',
        value: [1, 2, 3],
      });
    });
  });
});
