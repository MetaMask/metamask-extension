import {
  enablePatches,
  applyPatches as immerApplyPatches,
  type Patch,
} from 'immer';
import type { StateConstraint } from '@metamask/base-controller';

// Idempotent — safe to call multiple times.
enablePatches();

type Listener = () => void;

/**
 * Read-only proxy for a single controller's state on the UI side.
 *
 * Implements the `useSyncExternalStore` contract (`getSnapshot` + `subscribe`)
 * and accepts state updates as either Immer patches (extension — across process
 * boundary) or direct references (mobile — in-process).
 *
 * Subscribers are NOT notified during `applyPatches` or `setState`.
 * Notification is deferred to `notify()`, called by
 * `StateSubscriptionService.flush()`, to enable two-phase apply/notify.
 */
export class ControllerStateProxy<S extends StateConstraint = StateConstraint> {
  #state: S;

  #listeners: Set<Listener> = new Set();

  #dirty = false;

  constructor(initialState: S) {
    this.#state = initialState;
  }

  /**
   * Current state snapshot.
   * Referential identity preserved across no-op updates.
   * Stable reference — safe to pass directly to `useSyncExternalStore`.
   */
  getSnapshot = (): S => {
    return this.#state;
  };

  /**
   * Subscribe to state changes. Returns unsubscribe callback.
   * Stable reference — safe to pass directly to `useSyncExternalStore`.
   */
  subscribe = (listener: Listener): (() => void) => {
    this.#listeners.add(listener);
    return () => {
      this.#listeners.delete(listener);
    };
  };

  /**
   * Apply Immer patches (extension: across process boundary).
   *
   * Uses Immer's `applyPatches`, preserving structural sharing.
   * `===` checks in selectors work correctly because unchanged subtrees
   * keep their references.
   *
   * Does NOT notify subscribers. Call `notify()` after all patches are applied.
   */
  applyPatches(patches: Patch[]): void {
    if (patches.length === 0) {
      return;
    }
    this.#state = immerApplyPatches(this.#state, patches) as S;
    this.#dirty = true;
  }

  /**
   * Replace state directly (in-process: mobile).
   *
   * No cloning — caller and proxy share the same object.
   * Safe because `BaseControllerV2` state is Immer-frozen.
   *
   * Does NOT notify subscribers. Call `notify()` after state is set.
   */
  setState(state: S): void {
    if (state === this.#state) {
      return;
    }
    this.#state = state;
    this.#dirty = true;
  }

  /**
   * Notify all subscribers if state has changed since last notification.
   * Called by `StateSubscriptionService.flush()` during the notify phase.
   *
   * @internal
   */
  notify(): void {
    if (!this.#dirty) {
      return;
    }
    this.#dirty = false;
    for (const listener of this.#listeners) {
      listener();
    }
  }

  /**
   * Whether this proxy has pending changes that haven't been notified.
   *
   * @internal
   */
  get dirty(): boolean {
    return this.#dirty;
  }
}
