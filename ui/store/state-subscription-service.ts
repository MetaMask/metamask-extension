import type { Patch } from 'immer';
import type { StateConstraint } from '@metamask/base-controller';
import { ControllerStateProxy } from './controller-state-proxy';

/**
 * Registry of {@link ControllerStateProxy} instances. Orchestrates
 * initialization, batch updates, and the two-phase apply/notify protocol.
 *
 * **Two-phase apply/notify:**
 *
 * 1. `applyBatch` iterates the keyed update map and calls `applyPatches` or
 *    `setState` on each affected proxy. No subscribers fire.
 * 2. `flush` notifies subscribers of all proxies that changed. A component
 *    reading from ControllerA and ControllerB always sees both updates together.
 *
 * This prevents torn reads: without the two-phase protocol, a component could
 * see ControllerA's new state with ControllerB's old state within the same
 * render.
 */
export class StateSubscriptionService {
  #proxies: Map<string, ControllerStateProxy> = new Map();

  /**
   * Initialize all proxies from keyed initial state.
   * Called once during `START_UI_SYNC` with the full controller state map.
   *
   * @param keyedState - Map of controller name → initial state.
   */
  initialize(keyedState: Record<string, StateConstraint>): void {
    this.#proxies.clear();
    for (const [name, state] of Object.entries(keyedState)) {
      this.#proxies.set(name, new ControllerStateProxy(state));
    }
  }

  /**
   * Reinitialize from fresh keyed state (e.g., after port reconnect).
   *
   * Updates existing proxies in place (preserving subscriber lists) and
   * creates new proxies for any controllers not previously registered.
   * Automatically flushes after applying all updates.
   *
   * @param keyedState - Map of controller name → fresh state.
   */
  reinitialize(keyedState: Record<string, StateConstraint>): void {
    for (const [name, state] of Object.entries(keyedState)) {
      const existing = this.#proxies.get(name);
      if (existing) {
        existing.setState(state);
      } else {
        this.#proxies.set(name, new ControllerStateProxy(state));
      }
    }
    this.flush();
  }

  /**
   * Get a typed proxy by controller name.
   *
   * @param controllerName - The controller's registered name (e.g.,
   *   `'PreferencesController'`).
   * @returns The proxy for that controller's state.
   * @throws If no proxy is registered for the given name.
   */
  getProxy<S extends StateConstraint>(
    controllerName: string,
  ): ControllerStateProxy<S> {
    const proxy = this.#proxies.get(controllerName);
    if (!proxy) {
      throw new Error(
        `StateSubscriptionService: no proxy registered for controller "${controllerName}". ` +
          `Available controllers: ${[...this.#proxies.keys()].join(', ')}`,
      );
    }
    return proxy as ControllerStateProxy<S>;
  }

  /**
   * Check whether a proxy exists for the given controller.
   *
   * @param controllerName - The controller name to check.
   * @returns `true` if a proxy is registered.
   */
  hasProxy(controllerName: string): boolean {
    return this.#proxies.has(controllerName);
  }

  /**
   * Phase 1 of the two-phase protocol.
   *
   * Apply updates to all affected proxies without notifying subscribers.
   * Each entry is either an `Immer.Patch[]` (extension: across process boundary)
   * or a direct state reference (mobile: in-process).
   *
   * @param updates - Map of controller name → patches or state.
   */
  applyBatch(updates: Record<string, Patch[] | StateConstraint>): void {
    for (const [name, update] of Object.entries(updates)) {
      const proxy = this.#proxies.get(name);
      if (!proxy) {
        continue; // Skip unknown controllers gracefully
      }

      if (Array.isArray(update)) {
        proxy.applyPatches(update as Patch[]);
      } else {
        proxy.setState(update);
      }
    }
  }

  /**
   * Phase 2 of the two-phase protocol.
   *
   * Notify all subscribers of proxies that changed since the last flush.
   * Safe to call even if no proxies are dirty — it is a no-op in that case.
   */
  flush(): void {
    for (const proxy of this.#proxies.values()) {
      proxy.notify();
    }
  }

  /**
   * Get a snapshot of all controller state.
   * Useful for Sentry captures, state logs, and debug tools.
   *
   * @returns Map of controller name → current state snapshot.
   */
  getAllSnapshots(): Record<string, StateConstraint> {
    const result: Record<string, StateConstraint> = {};
    for (const [name, proxy] of this.#proxies) {
      result[name] = proxy.getSnapshot();
    }
    return result;
  }
}
