import type { StorageAdapter } from '@metamask/storage-service';
import { isObject, isValidJson, type Json } from '@metamask/utils';
import browser from 'webextension-polyfill';
import { StorageAdapter as ExtensionStorageAdapter } from '../wallet-init/instance-options/storage-service';

export const CronjobControllerStorageKey = 'temp-cronjob-storage';

/**
 * The namespace per-event next-run dates are stored under.
 */
export const CronjobControllerEventDateNamespace = 'CronjobController';

/**
 * The part of the `StorageAdapter` surface used to hold per-event dates.
 *
 * Narrowed to four methods so tests can supply a plain object, and so it is
 * obvious that nothing here needs the rest of the adapter.
 */
export type CronjobControllerEventDateStore = Pick<
  StorageAdapter,
  'getItem' | 'setItem' | 'removeItem' | 'getAllKeys'
>;

/**
 * Check whether a value is a parseable date string.
 *
 * @param value - The value to check.
 * @returns Whether the value is a string that parses to a valid date.
 */
function isParseableDate(value: unknown): value is string {
  return typeof value === 'string' && !Number.isNaN(new Date(value).getTime());
}

/**
 * A storage manager for CronjobController state.
 *
 * State is split across two stores with different durability:
 *
 * - The event map, under {@link CronjobControllerStorageKey}, stays in
 * `browser.storage.local` alongside the rest of controller state. Losing it
 * silently stops every cronjob — `CronjobController.init` only reschedules
 * what is already in state and does not re-derive events from Snap manifests
 * — so it does not belong in a store that may be discarded.
 * - Per-event next-run dates go to the `StorageService` adapter, which is
 * IndexedDB everywhere except Firefox. Rescheduling is by far the most
 * frequent write this controller makes, a date is reconstructible from the
 * event's `schedule` and `scheduledAt`, and `storage.local` is the store that
 * also holds the vault.
 *
 * The two can therefore drift, and `init` reconciles them before the
 * controller sees any state.
 *
 * @deprecated This is a temporary fix, please do not use this class (or any
 * similar patterns) elsewhere.
 */
export class CronjobControllerStorageManager {
  /**
   * The initial CronjobController data, reconciled against the date store.
   */
  #initialStorage: Json = null;

  /**
   * Whether the storage manager has been initialized or not.
   */
  #initialized = false;

  /**
   * The store holding one next-run date per event ID.
   */
  readonly #dateStore: CronjobControllerEventDateStore;

  /**
   * Construct a CronjobControllerStorageManager.
   *
   * @param dateStore - The store to hold per-event dates in. Defaults to the
   * same adapter `StorageService` is built with, so dates land where the rest
   * of the Snaps data does rather than in `storage.local`.
   */
  constructor(
    dateStore: CronjobControllerEventDateStore = new ExtensionStorageAdapter(),
  ) {
    this.#dateStore = dateStore;
  }

  /**
   * Assert that the storage manager has been initialized.
   */
  #assertInitialized() {
    if (!this.#initialized) {
      throw new Error('CronjobControllerStorageManager not yet initialized');
    }
  }

  /**
   * Initialize the storage manager.
   *
   * Loads the event map, then reconciles it against the date store so the
   * controller only ever receives usable dates. Reconciliation happens here
   * rather than in `getInitialState`, which is synchronous.
   */
  async init() {
    const initialStorage = (
      await browser.storage.local.get(CronjobControllerStorageKey)
    )[CronjobControllerStorageKey];

    const state = isValidJson(initialStorage) ? initialStorage : null;
    this.#initialStorage = await this.#reconcile(state);
    this.#initialized = true;
  }

  /**
   * Reconcile the event map against the date store.
   *
   * Three ways the two can disagree, and what each means:
   *
   * - An event with a date in the date store: healthy. The date store wins,
   * because the event map's copy is only rewritten when events are added or
   * removed and is stale by design.
   * - An event with no date in the date store: the date was lost, or the event
   * predates dates being stored separately. Falls back to the event map's own
   * `date`; where that is absent or unparseable the event is dropped, because
   * an event with no usable date can neither fire nor be cleared.
   * - A date with no matching event: an orphan left by an event that was
   * cancelled or fired. Removed, or the date store grows without bound.
   *
   * @param state - The event map loaded from `browser.storage.local`.
   * @returns The reconciled state.
   */
  async #reconcile(state: Json): Promise<Json> {
    if (!isObject(state) || !isObject(state.events)) {
      return state;
    }

    const events: Record<string, Json> = {};

    for (const [id, event] of Object.entries(state.events)) {
      if (!isObject(event)) {
        continue;
      }

      const { result } = await this.#dateStore.getItem(
        CronjobControllerEventDateNamespace,
        id,
      );

      const date = isParseableDate(result) ? result : event.date;

      if (!isParseableDate(date)) {
        continue;
      }

      events[id] = { ...event, date };
    }

    await this.#sweepOrphanedDates(Object.keys(events));

    return { ...state, events };
  }

  /**
   * Remove dates that no longer have a matching event.
   *
   * @param liveIds - The IDs of events present in the reconciled state.
   */
  async #sweepOrphanedDates(liveIds: string[]) {
    // Best-effort. `getAllKeys` and `removeItem` reject on adapter failure —
    // unlike `getItem`, which reports one as a miss — and this runs from `init`
    // on the boot path. A leftover key wastes space in a store whose contents
    // are reconstructible; letting it reject would stop the wallet starting
    // while the durable event map is still perfectly usable.
    try {
      const live = new Set(liveIds);
      const stored = await this.#dateStore.getAllKeys(
        CronjobControllerEventDateNamespace,
      );

      await Promise.all(
        stored
          .filter((id) => !live.has(id))
          .map(async (id) =>
            this.#dateStore.removeItem(CronjobControllerEventDateNamespace, id),
          ),
      );
    } catch (error) {
      console.error('Failed to sweep orphaned cronjob event dates', error);
    }
  }

  /**
   * Get the initial CronjobController state.
   *
   * @returns The initial CronjobController state.
   */
  getInitialState() {
    this.#assertInitialized();
    return this.#initialStorage;
  }

  /**
   * Set the CronjobController state.
   *
   * @param data - The CronjobController state to set.
   */
  set(data: Json) {
    this.#assertInitialized();
    browser.storage.local
      .set({ [CronjobControllerStorageKey]: data })
      .catch(console.error);
  }

  /**
   * Persist a single event's next execution date.
   *
   * @param id - The ID of the event.
   * @param date - The next execution date, as an ISO 8601 string.
   */
  setEventDate(id: string, date: string) {
    this.#assertInitialized();
    this.#dateStore
      .setItem(CronjobControllerEventDateNamespace, id, date)
      .catch(console.error);
  }

  /**
   * Remove an event's persisted date.
   *
   * @param id - The ID of the event whose date should be removed.
   */
  deleteEventDate(id: string) {
    this.#assertInitialized();
    this.#dateStore
      .removeItem(CronjobControllerEventDateNamespace, id)
      .catch(console.error);
  }
}
