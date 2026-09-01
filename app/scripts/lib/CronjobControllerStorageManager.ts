import { isValidJson, type Json } from '@metamask/utils';
import type {
  StorageAdapter,
  StorageGetResult,
} from '@metamask/storage-service';
import browser from 'webextension-polyfill';
import { IndexedDBStore } from '../../../shared/lib/stores/indexeddb-store';

export const CronjobControllerStorageKey = 'temp-cronjob-storage';

/**
 * The namespace the per-event next-run dates are stored under.
 */
export const CronjobControllerEventDateNamespace = 'CronjobController';

/**
 * The IndexedDB database holding per-event next-run dates.
 *
 * Deliberately NOT `browser.storage.local`, and deliberately not the database
 * the state backup uses. Rescheduling is this controller's most frequent
 * write, and `browser.storage.local` is one LevelDB instance shared by every
 * key the extension stores, the vault included. LevelDB compaction re-packs
 * keys into blocks, and a block damaged by an interrupted compaction fails the
 * checksum for whatever else shares it — so write volume under any key is
 * corruption exposure for every key. Keeping this traffic out of that database
 * is the point of storing dates separately at all; making them smaller within
 * it would leave the compaction pressure where it is.
 */
export const CronjobControllerEventDateDatabase = 'CronjobControllerEventDates';

/**
 * An {@link IndexedDBStore}-backed date store.
 *
 * Presents the same four methods as a `StorageAdapter` so the two are
 * interchangeable, and opens lazily so construction stays synchronous.
 */
export class IndexedDBEventDateStore
  implements CronjobControllerEventDateStore
{
  readonly #db = new IndexedDBStore();

  #opened: Promise<void> | null = null;

  async #open() {
    this.#opened ??= this.#db.open(CronjobControllerEventDateDatabase, 1);
    await this.#opened;
  }

  #makeKey(namespace: string, key: string) {
    return `${namespace}:${key}`;
  }

  async getItem(namespace: string, key: string): Promise<StorageGetResult> {
    try {
      await this.#open();
      const [value] = await this.#db.get([this.#makeKey(namespace, key)]);
      return value === undefined ? {} : { result: value as Json };
    } catch (error) {
      return { error: error as Error };
    }
  }

  async setItem(namespace: string, key: string, value: Json): Promise<void> {
    await this.#open();
    await this.#db.set({ [this.#makeKey(namespace, key)]: value });
  }

  async removeItem(namespace: string, key: string): Promise<void> {
    await this.#open();
    await this.#db.remove([this.#makeKey(namespace, key)]);
  }

  async getAllKeys(namespace: string): Promise<string[]> {
    await this.#open();
    const prefix = `${namespace}:`;
    const keys = await this.#db.getAllKeys();
    return keys
      .filter((key) => key.startsWith(prefix))
      .map((key) => key.slice(prefix.length));
  }
}

/**
 * The subset of the `StorageService` / `StorageAdapter` surface used to store
 * per-event dates.
 *
 * `StorageService` and `StorageAdapter` declare identical signatures for these
 * four methods, so either satisfies this type structurally.
 */
export type CronjobControllerEventDateStore = Pick<
  StorageAdapter,
  'getItem' | 'setItem' | 'removeItem' | 'getAllKeys'
>;

/**
 * A JSON object.
 */
type JsonRecord = Record<string, Json>;

/**
 * Check whether a JSON value is a JSON object.
 *
 * @param value - The value to check.
 * @returns Whether the value is a non-array JSON object.
 */
function isJsonRecord(value: Json): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

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
 * State is split across two stores, in two different storage engines:
 *
 * - The main blob, under {@link CronjobControllerStorageKey}, holds the whole
 * event map. It is rewritten when events are added, cancelled or cleaned up.
 * - The date store, under the {@link CronjobControllerEventDateNamespace}
 * namespace, holds one ISO date per event id. It is written on every
 * reschedule, which for a frequently recurring event is far more often than
 * the main blob changes.
 *
 * Splitting them means a reschedule writes a single date rather than the whole
 * event map. This does not change which database the data lands in — both
 * paths write to `browser.storage.local` — it reduces the bytes written per
 * reschedule.
 *
 * Because the two stores are written at different rates they can drift; see
 * {@link CronjobControllerStorageManager.init}, which reconciles them before
 * the controller ever sees the state.
 *
 * @deprecated This is a temporary fix, please do not use this class (or any
 * similar patterns) elsewhere.
 */
export class CronjobControllerStorageManager {
  /**
   * The initial CronjobController data.
   */
  #initialStorage: Json = null;

  /**
   * Whether the storage manager has been initialized or not.
   */
  #initialized = false;

  /**
   * The store holding one next-run date per event id.
   */
  readonly #dateStore: CronjobControllerEventDateStore;

  /**
   * Construct a CronjobControllerStorageManager.
   *
   * @param dateStore - The store to hold per-event dates in. Defaults to a
   * dedicated IndexedDB database, so this controller's rescheduling traffic
   * does not land in the LevelDB that holds the vault.
   */
  constructor(
    dateStore: CronjobControllerEventDateStore = new IndexedDBEventDateStore(),
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
   * Loads the main blob, then reconciles it against the date store so that the
   * controller only ever receives healed state. Reconciliation happens here
   * rather than in `getInitialState`, which is synchronous.
   */
  async init() {
    const initialStorage = (
      await browser.storage.local.get(CronjobControllerStorageKey)
    )[CronjobControllerStorageKey];
    this.#initialStorage = isValidJson(initialStorage) ? initialStorage : null;
    this.#initialized = true;

    try {
      await this.#reconcileEventDates();
    } catch (error) {
      // A failed reconciliation must not stop the wallet from starting. The
      // unreconciled main blob still carries a `date` per event, so the
      // controller degrades to the pre-split behavior.
      console.error(error);
    }
  }

  /**
   * Reconcile the main blob against the date store.
   *
   * Three drift states are handled:
   *
   * - An event present in both: the date store value wins, because it is
   * written on every reschedule and the blob's copy is not.
   * - An event present only in the blob: its date was lost, or it predates the
   * split. Fall back to the blob's own `date`; drop the event if that is
   * absent or unparseable.
   * - An id present only in the date store: an orphan left by an event that
   * was cancelled or fired before `deleteEventDate` existed. Remove the key,
   * otherwise the namespace grows without bound.
   *
   * If the main blob is present but is not shaped like an event map, nothing
   * is reconciled and nothing is deleted — an unrecognized shape is not
   * evidence that the date store is garbage.
   */
  async #reconcileEventDates() {
    const state = this.#initialStorage;

    // `stateRecord` is non-null only when the main blob holds an event map we
    // can safely rewrite. When there is plainly no state at all, orphans are
    // still swept but nothing is written back. A blob of an unrecognized shape
    // is left completely alone — an unreadable blob is not evidence that the
    // date store is garbage.
    let stateRecord: JsonRecord | null = null;
    let events: JsonRecord = {};

    if (isJsonRecord(state) && isJsonRecord(state.events)) {
      stateRecord = state;
      events = state.events;
    } else if (state !== null) {
      return;
    }

    const storedIds = await this.#dateStore.getAllKeys(
      CronjobControllerEventDateNamespace,
    );
    const storedIdSet = new Set(storedIds);
    const eventIds = new Set(Object.keys(events));

    const reconciledEvents: JsonRecord = {};

    for (const [id, event] of Object.entries(events)) {
      if (!isJsonRecord(event)) {
        continue;
      }

      if (storedIdSet.has(id)) {
        const { result } = await this.#dateStore.getItem(
          CronjobControllerEventDateNamespace,
          id,
        );

        if (isParseableDate(result)) {
          reconciledEvents[id] = { ...event, date: result };
          continue;
        }
      }

      if (isParseableDate(event.date)) {
        reconciledEvents[id] = event;
        continue;
      }

      // SEAM: a fourth recovery tier belongs here — rebuild the date from the
      // event's immutable `schedule` and `scheduledAt` fields via the
      // `recoverEventDate` helper being added in `@metamask/snaps-controllers`.
      // That helper is not published yet, and its schedule parsing must not be
      // reimplemented here. Until it lands, an event with no usable date in
      // either store is dropped.
    }

    const orphanedIds = storedIds.filter((id) => !eventIds.has(id));

    await Promise.all(
      orphanedIds.map(async (id) =>
        this.#dateStore.removeItem(CronjobControllerEventDateNamespace, id),
      ),
    );

    if (stateRecord) {
      this.#initialStorage = { ...stateRecord, events: reconciledEvents };
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
   * Set the next run date of a single event.
   *
   * @param id - The id of the event.
   * @param date - The ISO 8601 date the event is next scheduled for.
   */
  setEventDate(id: string, date: string) {
    this.#assertInitialized();
    this.#dateStore
      .setItem(CronjobControllerEventDateNamespace, id, date)
      .catch(console.error);
  }

  /**
   * Delete the stored date of a single event, because it was cancelled or has
   * fired.
   *
   * @param id - The id of the event.
   */
  deleteEventDate(id: string) {
    this.#assertInitialized();
    this.#dateStore
      .removeItem(CronjobControllerEventDateNamespace, id)
      .catch(console.error);
  }
}
