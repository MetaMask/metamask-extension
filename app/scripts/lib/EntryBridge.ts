/**
 * The type of change that occurred.
 */
export type ChangeType = 'added' | 'updated' | 'deleted';

/**
 * A callback that applies a change to an entry to a destination.
 */
export type ApplyChangeCallback<Entry> = (type: ChangeType, entry: Entry) => void;

/**
 * A list of changes.
 */
type ChangeList<Entry> = Record<ChangeType, Entry[]>;

/**
 * An object containing comparison functions for entries.
 *
 * @param getKey - A function that returns a string key for an entry.
 * @param areEqual - A function that returns whether two entries are equal (have the same key and value).
 */
export type EntryComparators<Entry> = {
  getKey: (entry: Entry) => string;
  areEqual: (a: Entry, b: Entry) => boolean;
};

/**
 * Generates a list of changes between two arrays of entries.
 *
 * @param prevEntries - The previous array of entries.
 * @param newEntries - The new array of entries.
 * @param comparators - The object containing comparison functions.
 * @returns An object categorizing the changes into added, updated, and deleted.
 */
function computeChangeList<Entry>(
  prevEntries: Entry[],
  newEntries: Entry[],
  comparators: EntryComparators<Entry>,
): ChangeList<Entry> {
  const { getKey, areEqual } = comparators;
  const added: Entry[] = [];
  const updated: Entry[] = [];
  const deleted: Entry[] = [];

  const prevEntriesMap = new Map(prevEntries.map((e) => [getKey(e), e]));
  const newEntriesMap = new Map(newEntries.map((e) => [getKey(e), e]));

  newEntriesMap.forEach((newEntry, newKey) => {
    const oldEntry = prevEntriesMap.get(newKey);
    if (oldEntry) {
      if (!areEqual(newEntry, oldEntry)) {
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

  return { added, updated, deleted };
}

/**
 * Applies the changes from a ChangeList to a given function.
 *
 * @param changeList - The list of changes.
 * @param applyChange - The function to apply changes.
 */
function applyChangeList<Entry>(
  changeList: ChangeList<Entry>,
  applyChange: ApplyChangeCallback<Entry>,
): void {
  const { added, updated, deleted } = changeList;
  added.forEach((entry) => applyChange('added', entry));
  updated.forEach((entry) => applyChange('updated', entry));
  deleted.forEach((entry) => applyChange('deleted', entry));
}

/**
 * Configuration for a one-way bridge between entries in a source and entries
 * in a destination.
 *
 * @param comparators - The object containing comparison functions.
 * @param getSourceEntries - A function that returns the entries from the
 * source.
 * @param applyChangeToDestination - A function that applies a change to the
 * destination.
 */
export type OneWayBridgeConfig<Entry> = {
  comparators: EntryComparators<Entry>;
  getSourceEntries: () => Entry[];
  applyChangeToDestination: ApplyChangeCallback<Entry>;
};

/**
 * A one-way bridge between the entries in a source and the entries in
 * a destination.
 */
export class OneWayBridge<Entry> {
  #comparators: EntryComparators<Entry>;

  #getSourceEntries: () => Entry[];

  #applyChangeToDestination: ApplyChangeCallback<Entry>;

  #prevEntries: Entry[];

  constructor({
    comparators,
    getSourceEntries,
    applyChangeToDestination,
  }: OneWayBridgeConfig<Entry>) {
    this.#comparators = comparators;
    this.#getSourceEntries = getSourceEntries;
    this.#applyChangeToDestination = applyChangeToDestination;
    this.#prevEntries = getSourceEntries();
  }

  public synchronize(): void {
    const newEntries = this.#getSourceEntries();
    const changeList = computeChangeList(
      this.#prevEntries,
      newEntries,
      this.#comparators,
    );
    applyChangeList(changeList, this.#applyChangeToDestination);
    this.#prevEntries = newEntries;
  }
}

type Direction = 'L->R' | 'R->L';

type TwoWayBridgeConfig<Entry> = {
  comparators: EntryComparators<Entry>;
  leftEntries: () => Entry[];
  rightEntries: () => Entry[];
  applyChangeToLeft: (type: ChangeType, entry: Entry) => void;
  applyChangeToRight: (type: ChangeType, entry: Entry) => void;
};

// Manages a two-way bridge for entries, preventing recursive updates
export class TwoWayBridge<Entry> {
  #updatingDirection: Direction | 'NONE' = 'NONE';

  #comparators: EntryComparators<Entry>;

  #leftEntries: () => Entry[];

  #rightEntries: () => Entry[];

  #applyChangeToLeft: (type: ChangeType, entry: Entry) => void;

  #applyChangeToRight: (type: ChangeType, entry: Entry) => void;

  constructor({
    comparators,
    leftEntries,
    rightEntries,
    applyChangeToLeft,
    applyChangeToRight,
  }: TwoWayBridgeConfig<Entry>) {
    this.#comparators = comparators;
    this.#leftEntries = leftEntries;
    this.#rightEntries = rightEntries;
    this.#applyChangeToLeft = applyChangeToLeft;
    this.#applyChangeToRight = applyChangeToRight;
  }

  public synchronize(direction: Direction) {
    if (this.#updatingDirection === direction) {
      throw new Error(
        `synchronize(${direction.toUpperCase()}) called recursively in same direction`,
      );
    }
    if (this.#updatingDirection !== 'NONE') {
      return; // Ignore calls while updating in the opposite direction
    }
    this.#updatingDirection = direction;

    const prevEntries =
      direction === 'L->R' ? this.#leftEntries() : this.#rightEntries();
    const newEntries =
      direction === 'L->R' ? this.#rightEntries() : this.#leftEntries();
    const applyChange =
      direction === 'L->R' ? this.#applyChangeToRight : this.#applyChangeToLeft;

    const changeList = computeChangeList(
      prevEntries,
      newEntries,
      this.#comparators,
    );
    applyChangeList(changeList, applyChange);

    this.#updatingDirection = 'NONE';
  }
}
