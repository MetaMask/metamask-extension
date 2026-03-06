import {
  BACKUP_DB_NAME,
  BACKUP_DB_VERSION,
  backedUpStateKeys,
  hasVault,
  safeGetVaultBackup,
  SAFE_GET_VAULT_BACKUP_TIMEOUT_MS,
  type Backup,
} from './backup';

describe('backup', () => {
  describe('constants', () => {
    it('exports backup DB name and version', () => {
      expect(BACKUP_DB_NAME).toBe('metamask-backup');
      expect(BACKUP_DB_VERSION).toBe(1);
    });

    it('exports safe get vault backup timeout', () => {
      expect(SAFE_GET_VAULT_BACKUP_TIMEOUT_MS).toStrictEqual(5_000);
    });

    it('exports backedUpStateKeys', () => {
      expect(backedUpStateKeys).toStrictEqual([
        'KeyringController',
        'AppMetadataController',
        'MetaMetricsController',
      ]);
    });
  });

  describe('safeGetVaultBackup', () => {
    it('returns null when timeout is 0 (timeout wins the race)', async () => {
      const result = await safeGetVaultBackup(0);
      expect(result).toBeNull();
    });
  });

  describe('hasVault', () => {
    it('returns false for null', () => {
      expect(hasVault(null)).toBe(false);
    });

    it('returns false for undefined backup', () => {
      expect(hasVault(undefined as unknown as Backup | null)).toBe(false);
    });

    it('returns false when KeyringController is missing', () => {
      expect(hasVault({})).toBe(false);
      expect(hasVault({ meta: {} })).toBe(false);
    });

    it('returns false when KeyringController has no vault', () => {
      expect(hasVault({ KeyringController: {} })).toBe(false);
      expect(hasVault({ KeyringController: { vault: null } })).toBe(false);
      expect(hasVault({ KeyringController: { vault: '' } })).toBe(false);
    });

    it('returns true when KeyringController has a vault', () => {
      expect(hasVault({ KeyringController: { vault: 'encrypted' } })).toBe(
        true,
      );
      expect(hasVault({ KeyringController: { vault: {} } })).toBe(true);
    });
  });
});
