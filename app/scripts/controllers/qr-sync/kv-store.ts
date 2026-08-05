import type { IKVStore } from '@metamask/mobile-wallet-protocol-core';

/**
 * Ephemeral in-memory implementation of {@link IKVStore} for MWP session data.
 * Nothing is persisted; call {@link InMemoryKvStore.clear} when the session ends.
 */
export class InMemoryKvStore implements IKVStore {
  readonly #storage = new Map<string, string>();

  readonly #prefix: string;

  constructor(prefix: string = 'qr-sync-') {
    this.#prefix = prefix;
  }

  async get(key: string): Promise<string | null> {
    return this.#storage.get(this.#getKey(key)) ?? null;
  }

  async set(key: string, value: string): Promise<void> {
    this.#storage.set(this.#getKey(key), value);
  }

  async delete(key: string): Promise<void> {
    this.#storage.delete(this.#getKey(key));
  }

  /**
   * Removes all stored entries for this store instance.
   */
  clear(): void {
    this.#storage.clear();
  }

  #getKey(key: string): string {
    return `${this.#prefix}${key}`;
  }
}
