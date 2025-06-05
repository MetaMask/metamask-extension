import browser from 'webextension-polyfill';
import { OperationSafener } from './operation-safener';
import { PersistenceManager } from './stores/persistence-manager';

export function getRequestSafeReload(persistenceManager: PersistenceManager) {
  const operationSafener = new OperationSafener({
    op: persistenceManager.set.bind(persistenceManager),
    wait: 1000,
  });

  return {
    update: async (...params: Parameters<PersistenceManager['set']>) => {
      return operationSafener.execute(...params);
    },
    requestSafeReload: async () => {
      await operationSafener.evacuate();
      browser.runtime.reload();
    },
  };
}
