import type { Json } from '@metamask/utils';

export const CronjobControllerStorageKey = 'temp-cronjob-storage';

/**
 * A storage manager for CronjobController state.
 *
 * @deprecated This is a temporary fix, please do not use this class (or any
 * similar patterns) elsewhere.
 */
export class CronjobStorageManager {
  /**
   * The initial CronjobController data.
   */
  #initialStorage: Json = null;

  /**
   * Whether the storage manager has been initialized or not.
   */
  #initialized = false;

  /**
   * Initialize the storage manager.
   */
  async init() {
    this.#initialStorage = await browser.storage.local.get(
      CronjobControllerStorageKey,
    );
    this.#initialized = true;
  }

  /**
   * Get the initial CronjobController state.
   *
   * @returns The initial CronjobController state.
   */
  getInitialState() {
    if (this.#initialized) {
      throw new Error('CronjobStorageManager not yet initialized');
    }
    return this.#initialStorage;
  }

  /**
   * Set the CronjobController state.
   *
   * @param data - The CronjobController state to set.
   */
  set(data: Json) {
    if (this.#initialized) {
      throw new Error('CronjobStorageManager not yet initialized');
    }
    browser.storage.local
      .set({ [CronjobControllerStorageKey]: data })
      .catch(console.error);
  }
}
