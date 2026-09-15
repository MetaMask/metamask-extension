'use strict';

// origin: ai-synthesis (MWPE-316)

/**
 * Files allowed to write to `storage.local` directly, enforced by
 * `persistence/no-direct-storage-local-write` (see
 * `development/eslint-rules/no-direct-storage-local-write.js`).
 *
 * Every other file persists controller state through PersistenceManager and
 * large non-state data through StorageService. Each entry names the owning
 * team from `.github/CODEOWNERS`; `owner: null` means no CODEOWNERS line
 * matches the file yet. An entry is reported as stale once its file stops
 * writing to `storage.local`, so remove entries rather than leaving them.
 *
 * @type {{ file: string, owner: string | null, reason: string }[]}
 */
const storageLocalWriteAllowlist = [
  // Persistence layer: the approved path itself.
  {
    file: 'shared/lib/stores/extension-store.ts',
    owner: null,
    reason:
      'PersistenceManager backend that writes controller state to storage.local.',
  },
  {
    file: 'shared/lib/stores/browser-storage-adapter.ts',
    owner: null,
    reason:
      'StorageService adapter used on Firefox, where StorageService data stays in storage.local.',
  },
  {
    file: 'shared/lib/stores/fixture-extension-store.ts',
    owner: null,
    reason:
      'Fixture store used instead of ExtensionStore in test builds (IN_TEST); seeds StorageService data.',
  },

  // Migrations: one-time data moves that run before PersistenceManager owns the data.
  {
    file: 'app/scripts/migrations/190.ts',
    owner: null,
    reason:
      'Moves tokensChainsCache out of controller state into StorageService keys in storage.local.',
  },
  {
    file: 'app/scripts/migrations/223.ts',
    owner: null,
    reason:
      'Moves StorageService data from storage.local to IndexedDB on Chrome, then removes the storage.local copies.',
  },

  // Low-level boundaries outside the persistence layer.
  {
    file: 'app/scripts/lib/critical-error/critical-error-tab-handoff.ts',
    owner: null,
    reason:
      'Stores the critical-error restore key, which must survive runtime.reload(); storage.session does not.',
  },
  {
    file: 'ui/pages/settings/debug-tab/debug-content/migrate-to-split-state-test.tsx',
    owner: '@MetaMask/core-extension-ux',
    reason:
      'Debug-tab toggles for the split-state migration, read back by app/scripts/lib/use-split-state-storage.ts. The tab ships only when ENABLE_SETTINGS_PAGE_DEV_OPTIONS or IN_TEST is set.',
  },

  // Temporary: delete this entry with the file (cronjob-storage task, #44256).
  {
    file: 'app/scripts/lib/CronjobControllerStorageManager.ts',
    owner: null,
    reason:
      'Deprecated temporary store for CronjobController state (temp-cronjob-storage).',
  },
];

module.exports = { storageLocalWriteAllowlist };
