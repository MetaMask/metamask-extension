// The reason why we alias this is because we want to

import {
  NameController,
  NameControllerState,
  NameStateChange,
  NameType,
  SetNameRequest,
} from '@metamask/name-controller';
import { RestrictedControllerMessenger } from '@metamask/base-controller';
import {
  ApplyChangeCallback,
  EntryComparators,
  OneWayBridge,
  TwoWayBridge,
} from './EntryBridge';

// Use the same type for both the source entries and the argument to NameController::setName.
export type NameEntry = SetNameRequest;

/**
 * Returns a string key for the given name entry.
 *
 * @param entry
 * @returns
 */
function getKey(entry: NameEntry): string {
  return `${entry.type}/${entry.variation}/${entry.value}`;
}

const NameBridgeEntryComparators: EntryComparators<NameEntry> = {
  getKey,
  areEqual: (a, b) => getKey(a) === getKey(b) && a.name === b.name,
};

/**
 * A one-way bridge between the name entries in another source and the name entries in
 * the name controller.
 *
 * @param nameController - The name controller to update.
 * @param getSourceEntries - A function that returns the name entries from the
 * other source.
 */
export class OneWayNameBridge extends OneWayBridge<NameEntry> {
  constructor(
    nameController: NameController,
    getSourceEntries: () => NameEntry[],
  ) {
    super({
      comparators: NameBridgeEntryComparators,
      getSourceEntries,
      applyChangeToDestination: (type, entry) => {
        if (type === 'deleted') {
          nameController.setName({ ...entry, name: null });
        } else {
          nameController.setName(entry);
        }
      },
    });
  }
}

type AllowedEvents = NameStateChange;

export type BridgeMessenger<Namespace extends string> =
  RestrictedControllerMessenger<
    Namespace,
    never,
    AllowedEvents,
    never,
    AllowedEvents['type']
  >;

export type TwoWayNameBridgeConfig<Namespace extends string> = {
  nameController: NameController;
  getSourceEntries: () => NameEntry[];
  applyChangeToSource: ApplyChangeCallback<NameEntry>;
  messenger: BridgeMessenger<Namespace>;
};

/**
 * Selects the name entries from the NameController state.
 *
 * @param nameControllerState
 * @returns
 */
function selectNameEntries(
  nameControllerState: NameControllerState,
): NameEntry[] {
  const { names } = nameControllerState;
  const entries: NameEntry[] = [];
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
 * A two-way bridge between the name entries in another source and the name entries in
 * the name controller.
 */
export class TwoWayNameBridge {
  #bridge: TwoWayBridge<NameEntry>;

  constructor({
    nameController,
    getSourceEntries,
    applyChangeToSource,
    messenger,
  }: TwoWayNameBridgeConfig<string>) {
    this.#bridge = new TwoWayBridge<NameEntry>({
      comparators: NameBridgeEntryComparators,
      leftEntries: getSourceEntries,
      applyChangeToLeft: applyChangeToSource,
      rightEntries: () => selectNameEntries(nameController.state),
      applyChangeToRight: (type, entry) => {
        if (type === 'deleted') {
          nameController.setName({ ...entry, name: null });
        } else {
          nameController.setName(entry);
        }
      },
    });

    messenger.subscribe('NameController:stateChange', () =>
      this.#bridge.synchronize('R->L'),
    );
  }

  onSourceChange() {
    this.#bridge.synchronize('L->R');
  }
}
