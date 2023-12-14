import {
  NameController,
  NameStateChange,
  NameType,
  SetNameRequest,
} from '@metamask/name-controller';
import { RestrictedControllerMessenger } from '@metamask/base-controller';

// Use the same type for both the source entries and the argument to NameController::setName.
export type PetnameEntry = SetNameRequest;

// The type of change that occurred.
export enum ChangeType {
  ADDED = 'ADDED',
  UPDATED = 'UPDATED',
  DELETED = 'DELETED',
}

type SyncDirection = 'Source->Petnames' | 'Petnames->Source';

// A list of changes, grouped by type.
type ChangeList = Record<ChangeType, PetnameEntry[]>;

type AllowedEvents = NameStateChange;

export type PetnamesBridgeMessenger = RestrictedControllerMessenger<
  'PetnamesBridge',
  never,
  AllowedEvents,
  never,
  AllowedEvents['type']
>;

/**
 * Abstract class representing a bridge between petnames and a data source.
 * Provides methods for synchronizing petnames with the data source and handling changes.
 */
export abstract class AbstractPetnamesBridge {
  #isTwoWay: boolean;

  #nameController: NameController;

  #synchronizingDirection: SyncDirection | 'NONE' = 'NONE';

  #messenger: PetnamesBridgeMessenger;

  /**
   * @param options
   * @param options.isTwoWay - Indicates whether the bridge is two-way or not. One-way bridges are Source->Petnames only.
   * @param options.nameController
   * @param options.messenger
   */
  constructor({
    isTwoWay,
    nameController,
    messenger,
  }: {
    isTwoWay: boolean;
    nameController: NameController;
    messenger: PetnamesBridgeMessenger;
  }) {
    this.#isTwoWay = isTwoWay;
    this.#nameController = nameController;
    this.#messenger = messenger;
  }

  // Initializes listeners
  init(): void {
    if (this.#isTwoWay) {
      this.#messenger.subscribe('NameController:stateChange', () =>
        this.#synchronize('Petnames->Source'),
      );
    }
    this.onSourceChange(() => this.#synchronize('Source->Petnames'));
  }

  /**
   * Adds a listener for source change events.
   *
   * @param listener - The listener function to be called when a source change event occurs.
   */
  protected abstract onSourceChange(listener: () => void): void;

  /**
   * Retrieves the source entries.
   *
   * @returns An array of PetnameEntry objects representing the source entries.
   */
  protected abstract getSourceEntries(): PetnameEntry[];

  /**
   * Update the Source with the given entry. To be overridden by subclasses.
   *
   * @param type
   * @param entry
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected updateSourceEntry(type: ChangeType, entry: PetnameEntry): void {
    throw new Error('updateSourceEntry must be overriden for two-way bridges');
  }

  /**
   * Synchronizes Petnames with the Source or vice versa, depending on the direction.
   *
   * @param direction - The direction to synchronize in.
   */
  #synchronize(direction: SyncDirection): void {
    if (this.#synchronizingDirection === direction) {
      throw new Error(
        `synchronize(${direction.toUpperCase()}) called recursively in same direction`,
      );
    }
    if (this.#synchronizingDirection !== 'NONE') {
      return; // Ignore calls while updating in the opposite direction
    }

    this.#synchronizingDirection = direction;

    const prevEntries =
      direction === 'Source->Petnames'
        ? this.getSourceEntries()
        : this.#getPetnameEntries();
    const newEntries =
      direction === 'Source->Petnames'
        ? this.#getPetnameEntries()
        : this.getSourceEntries();

    const changeList = this.#computeChangeList(prevEntries, newEntries);
    this.#applyChangeList(changeList);

    this.#synchronizingDirection = 'NONE';
  }

  /**
   * Extract PetnameEntry objects from the name controller state.
   */
  #getPetnameEntries(): PetnameEntry[] {
    const { names } = this.#nameController.state;
    const entries: PetnameEntry[] = [];
    for (const type of Object.values(NameType)) {
      for (const variation of Object.keys(names[type])) {
        for (const value of Object.keys(names[type][variation])) {
          const entry = names[type][variation][value];
          entries.push({
            value,
            type,
            name: entry.name,
            sourceId: entry.sourceId,
            variation,
          } as SetNameRequest);
        }
      }
    }
    return entries;
  }

  /**
   * Updates Petnames with the given entry.
   *
   * @param type - The type of change that occurred.
   * @param entry - The entry to update the name controller with.
   */
  #updatePetnameEntry(type: ChangeType, entry: PetnameEntry): void {
    if (type === ChangeType.DELETED) {
      this.#nameController.setName({ ...entry, name: null });
    } else {
      // ADDED or UPDATED
      this.#nameController.setName(entry);
    }
  }

  /**
   * Get a string key for the given entry.
   *
   * @param entry
   */
  #getKey(entry: PetnameEntry): string {
    return `${entry.type}/${entry.variation}/${entry.value}`;
  }

  /**
   * Computes the list of changes between the previous and new entries.
   *
   * @param prevEntries - The previous entries.
   * @param newEntries - The new entries.
   * @returns A ChangeList object representing the changes that occurred between prevEntries and newEntries.
   */
  #computeChangeList(
    prevEntries: PetnameEntry[],
    newEntries: PetnameEntry[],
  ): ChangeList {
    const added: PetnameEntry[] = [];
    const updated: PetnameEntry[] = [];
    const deleted: PetnameEntry[] = [];

    const prevEntriesMap = new Map(
      prevEntries.map((e) => [this.#getKey(e), e]),
    );
    const newEntriesMap = new Map(newEntries.map((e) => [this.#getKey(e), e]));

    newEntriesMap.forEach((newEntry, newKey) => {
      const oldEntry = prevEntriesMap.get(newKey);
      if (oldEntry) {
        if (newEntry.name !== oldEntry.name) {
          updated.push(newEntry);
        }
      } else {
        added.push(newEntry);
      }
    });

    if (!this.#isTwoWay) {
      prevEntriesMap.forEach((oldEntry, oldKey) => {
        if (!newEntriesMap.has(oldKey)) {
          deleted.push(oldEntry);
        }
      });
    }

    return {
      [ChangeType.ADDED]: added,
      [ChangeType.UPDATED]: updated,
      [ChangeType.DELETED]: deleted,
    };
  }

  /**
   * Applies the given change list to either the Petnames or Source, depending on the current synchrnoization direction.
   *
   * @param changeList
   */
  #applyChangeList(changeList: ChangeList): void {
    const applyChange =
      this.#synchronizingDirection === 'Source->Petnames'
        ? this.updateSourceEntry.bind(this)
        : this.#updatePetnameEntry.bind(this);

    for (const type of Object.values(ChangeType)) {
      for (const entry of changeList[type]) {
        applyChange(type, entry);
      }
    }
  }
}
