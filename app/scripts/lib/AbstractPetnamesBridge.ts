import {
  NameController,
  NameStateChange,
  NameType,
  SetNameRequest,
} from '@metamask/name-controller';
import {
  ActionConstraint,
  EventConstraint,
  RestrictedControllerMessenger,
} from '@metamask/base-controller';

// Use the same type for both the source entries and the argument to NameController::setName.
export type PetnameEntry = SetNameRequest & {
  // Name cannot be null in a PetnameEntry, as opposed to in a SetNameRequest,
  // where a null name indicates deletion.
  name: string;
};

// The type of change that occurred.
export enum ChangeType {
  ADDED = 'ADDED',
  UPDATED = 'UPDATED',
  DELETED = 'DELETED',
}

enum SyncDirection {
  SOURCE_TO_PETNAMES = 'Source->Petnames',
  PETNAMES_TO_SOURCE = 'Petnames->Source',
}

// A list of changes, grouped by type.
type ChangeList = Record<ChangeType, PetnameEntry[]>;

type PetnamesBridgeAllowedEvents = NameStateChange;

export type PetnamesBridgeMessenger<
  Event extends EventConstraint = never,
  Action extends ActionConstraint = never,
> = RestrictedControllerMessenger<
  'PetnamesBridge',
  Action,
  PetnamesBridgeAllowedEvents | Event,
  Action['type'],
  (PetnamesBridgeAllowedEvents | Event)['type']
>;

/**
 * Get a string key for the given entry.
 *
 * @param entry
 * @param entry.type
 * @param entry.variation
 * @param entry.value
 */
function getKey({ type, variation, value }: PetnameEntry): string {
  const normalizedValue =
    type === NameType.ETHEREUM_ADDRESS ? value.toLowerCase() : value;
  return `${type}/${variation}/${normalizedValue}`;
}

/**
 * Abstract class representing a bridge between petnames and a data source.
 * Provides methods for synchronizing petnames with the data source and handling changes.
 */
export abstract class AbstractPetnamesBridge<
  Event extends EventConstraint = never,
  Action extends ActionConstraint = never,
> {
  #isTwoWay: boolean;

  #nameController: NameController;

  #synchronizingDirection: SyncDirection | null = null;

  protected messenger: PetnamesBridgeMessenger<Event, Action>;

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
    messenger: PetnamesBridgeMessenger<Event, Action>;
  }) {
    this.#isTwoWay = isTwoWay;
    this.#nameController = nameController;
    this.messenger = messenger;
  }

  // Initializes listeners
  init(): void {
    if (this.#isTwoWay) {
      this.messenger.subscribe('NameController:stateChange', () =>
        this.#synchronize(SyncDirection.PETNAMES_TO_SOURCE),
      );
    }
    this.onSourceChange(() =>
      this.#synchronize(SyncDirection.SOURCE_TO_PETNAMES),
    );
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
   * Update the Source with the given entry. To be overridden by two-way subclasses.
   *
   * @param _type
   * @param _entry
   */
  protected updateSourceEntry(_type: ChangeType, _entry: PetnameEntry): void {
    throw new Error('updateSourceEntry must be overridden for two-way bridges');
  }

  /**
   * This predicate describes a subset of Petnames state that is relevant
   * to the bridge.
   *
   * By default, the shouldSyncPetname method returns true for all Petnames,
   * meaning every PetnameEntry in the NameController state is considered for
   * synchronization. This would result in Petnames state being a mirror of
   * the source entries or vice versa after synchronization.
   *
   * If you override this method to return false for some Petnames, those
   * entries are effectively 'masked' or excluded from the synchronization
   * process. This has a couple of implications:
   *
   * Source->Petnames direction: Masked Petname entries will not be deleted.
   * If shouldSyncPetname returns false for some target Petname,that entry
   * will not be deleted from Petnames state during synchronization.
   *
   * Petnames->Source direction: Masked Petname entries will not be added to
   * Source.  If shouldSyncPetname returns false for some Petname, that entry
   * will not be added to the Source list during synchronization.
   *
   * @param _targetEntry - The entry from Petname state to check for membership.
   * @returns true iff the target Petname entry should participate in synchronization.
   */
  protected shouldSyncPetname(_targetEntry: PetnameEntry): boolean {
    // All petname entries are sync participants by default.
    return true;
  }

  /**
   * Synchronizes Petnames with the Source or vice versa, depending on the direction.
   *
   * @param direction - The direction to synchronize in.
   */
  #synchronize(direction: SyncDirection): void {
    if (this.#synchronizingDirection === direction) {
      throw new Error(
        `Attempted to synchronize recursively in same direction: ${direction}`,
      );
    }
    if (this.#synchronizingDirection !== null) {
      return; // Ignore calls while updating in the opposite direction
    }

    this.#synchronizingDirection = direction;

    const [newEntries, prevEntries] =
      direction === 'Source->Petnames'
        ? [this.getSourceEntries(), this.#getPetnameEntries()]
        : [this.#getPetnameEntries(), this.getSourceEntries()];

    const changeList = this.#computeChangeList(prevEntries, newEntries);
    this.#applyChangeList(changeList);

    this.#synchronizingDirection = null;
  }

  /**
   * Extract PetnameEntry objects from the name controller state.
   */
  #getPetnameEntries(): PetnameEntry[] {
    const { names } = this.#nameController.state;
    const entries: PetnameEntry[] = [];
    for (const type of Object.values(NameType)) {
      for (const value of Object.keys(names[type])) {
        for (const variation of Object.keys(names[type][value])) {
          const { name, sourceId, origin } = names[type][value][variation];
          if (!name) {
            continue;
          }
          const entry = {
            value,
            type,
            name,
            variation,
            sourceId: sourceId ?? undefined,
            origin: origin ?? undefined,
          };
          if (this.shouldSyncPetname(entry)) {
            entries.push(entry);
          }
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
      delete entry.sourceId;
      delete entry.origin;
      this.#nameController.setName({
        ...entry,
        name: null,
      });
    } else {
      // ADDED or UPDATED
      this.#nameController.setName(entry);
    }
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

    const prevEntriesMap = new Map(prevEntries.map((e) => [getKey(e), e]));
    const newEntriesMap = new Map(newEntries.map((e) => [getKey(e), e]));

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

    prevEntriesMap.forEach((oldEntry, oldKey) => {
      if (!newEntriesMap.has(oldKey)) {
        deleted.push(oldEntry);
      }
    });

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
      this.#synchronizingDirection === SyncDirection.SOURCE_TO_PETNAMES
        ? this.#updatePetnameEntry.bind(this)
        : this.updateSourceEntry.bind(this);

    for (const type of Object.values(ChangeType)) {
      for (const entry of changeList[type]) {
        applyChange(type, entry);
      }
    }
  }
}
