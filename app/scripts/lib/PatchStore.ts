import type { Patch } from 'immer';

/**
 * Accumulates Immer patches keyed by controller name.
 *
 * Designed for microtask-batched state sync: callers add patches as
 * controller `stateChange` events fire within a synchronous cascade,
 * then flush once per microtask to produce a single keyed-patch message.
 *
 * This class only accumulates — scheduling and transport are the caller's
 * responsibility.
 */
export class PatchStore {
  #pending: Map<string, Patch[]> = new Map();

  /**
   * Add patches for a controller key. If patches already exist for
   * this key in the current batch, the new patches are appended.
   *
   * @param controllerKey - The controller config key (e.g. 'TokensController').
   * @param patches - Immer patches from a single `stateChange` event.
   */
  add(controllerKey: string, patches: Patch[]): void {
    if (patches.length === 0) {
      return;
    }

    const existing = this.#pending.get(controllerKey);
    if (existing) {
      existing.push(...patches);
    } else {
      this.#pending.set(controllerKey, [...patches]);
    }
  }

  /**
   * Drain all accumulated patches and return them as a keyed record.
   * Returns `null` if nothing has been accumulated since the last flush.
   *
   * @returns Keyed patches or `null` if empty.
   */
  flush(): Record<string, Patch[]> | null {
    if (this.#pending.size === 0) {
      return null;
    }

    const result: Record<string, Patch[]> = {};
    for (const [key, patches] of this.#pending) {
      result[key] = patches;
    }
    this.#pending.clear();
    return result;
  }

  /**
   * Whether the accumulator has pending patches.
   */
  get hasPending(): boolean {
    return this.#pending.size > 0;
  }

  /**
   * Discard all accumulated patches without returning them.
   */
  destroy(): void {
    this.#pending.clear();
  }
}
