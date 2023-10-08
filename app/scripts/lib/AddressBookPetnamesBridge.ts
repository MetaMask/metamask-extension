import {
  AddressBookController,
  AddressBookState,
} from '@metamask/address-book-controller';
import { RestrictedControllerMessenger } from '@metamask/base-controller';
import {
  NameController,
  NameControllerState,
  NameStateChange,
  NameType,
} from '@metamask/name-controller';
import { cloneDeep } from 'lodash';
import log from 'loglevel';

type Entry = {
  address: string;
  name: string;
  chainId: string;
  isEns: boolean;
};

type AllowedEvents = NameStateChange;

export type AddressBookPetnamesBridgeMessenger = RestrictedControllerMessenger<
  'AddressBookPetnamesBridge',
  never,
  AllowedEvents,
  never,
  AllowedEvents['type']
>;

export class AddressBookPetnamesBridge {
  #addressBookController: AddressBookController;

  #addressBookState: AddressBookState;

  #nameController: NameController;

  #nameState: NameControllerState;

  #messenger: AddressBookPetnamesBridgeMessenger;

  #updating: boolean;

  constructor({
    addressBookController,
    nameController,
    messenger,
  }: {
    addressBookController: AddressBookController;
    nameController: NameController;
    messenger: AddressBookPetnamesBridgeMessenger;
  }) {
    this.#addressBookController = addressBookController;
    this.#addressBookState = addressBookController.state;
    this.#nameController = nameController;
    this.#nameState = nameController.state;
    this.#messenger = messenger;
    this.#updating = false;
  }

  init() {
    this.#addressBookController.subscribe((state) => {
      try {
        this.#onAddressBookStateChange(state);
      } catch (error) {
        log.debug(
          'Error synchronising address book update with petnames',
          error,
        );
      }
    });

    this.#messenger.subscribe('NameController:stateChange', (state) => {
      try {
        this.#onPetnameStateChange(state);
      } catch (error) {
        log.debug('Error synchronising petname update with petnames', error);
      }
    });
  }

  #onPetnameStateChange(newState: NameControllerState) {
    if (this.#updating) {
      return;
    }

    this.#updating = true;

    const newEntries = this.#getPetnameEntries(newState);
    const oldEntries = this.#getAddressBookEntries(this.#addressBookState);

    const { added, updated, deleted } = this.#groupEntries(
      oldEntries,
      newEntries,
    );

    for (const entry of [...added, ...updated]) {
      this.#addressBookController.set(
        entry.address,
        entry.name,
        entry.chainId as any,
      );

      log.debug('Updated address book following petname update', entry);
    }

    for (const entry of deleted) {
      this.#addressBookController.delete(entry.chainId as any, entry.address);
      log.debug('Removed address book entry following petname removal', entry);
    }

    this.#addressBookState = cloneDeep(this.#addressBookController.state);
    this.#nameState = cloneDeep(newState);
    this.#updating = false;
  }

  #onAddressBookStateChange(newState: AddressBookState) {
    if (this.#updating) {
      return;
    }

    this.#updating = true;

    const newEntries = this.#getAddressBookEntries(newState);
    const oldEntries = this.#getPetnameEntries(this.#nameState);

    const { added, updated, deleted } = this.#groupEntries(
      oldEntries,
      newEntries,
    );

    for (const entry of [...added, ...updated]) {
      this.#nameController.setName({
        value: entry.address,
        type: NameType.ETHEREUM_ADDRESS,
        name: entry.name,
        sourceId: entry.isEns ? 'ens' : undefined,
        variation: entry.chainId,
      });

      log.debug('Updated petname following address book update', entry);
    }

    for (const entry of deleted) {
      this.#nameController.setName({
        value: entry.address,
        type: NameType.ETHEREUM_ADDRESS,
        name: null,
        variation: entry.chainId,
      });

      log.debug('Removed petname following address book removal', entry);
    }

    this.#addressBookState = cloneDeep(newState);
    this.#nameState = cloneDeep(this.#nameController.state);
    this.#updating = false;
  }

  #groupEntries(oldEntries: Entry[], newEntries: Entry[]) {
    const added = newEntries.filter(
      (newEntry) =>
        !oldEntries.some(
          (oldEntry) =>
            oldEntry.address === newEntry.address &&
            oldEntry.chainId === newEntry.chainId,
        ),
    );

    const updated = newEntries.filter((newEntry) =>
      oldEntries.some(
        (oldEntry) =>
          oldEntry.address === newEntry.address &&
          oldEntry.chainId === newEntry.chainId &&
          oldEntry.name !== newEntry.name,
      ),
    );

    const deleted = oldEntries.filter(
      (oldEntry) =>
        !newEntries.some(
          (newEntry) =>
            newEntry.address === oldEntry.address &&
            newEntry.chainId === oldEntry.chainId,
        ),
    );

    return { added, updated, deleted };
  }

  #getPetnameEntries(state: NameControllerState): Entry[] {
    const entries: Entry[] = [];

    for (const address of Object.keys(state.names.ethereumAddress)) {
      const addressEntries = state.names.ethereumAddress[address];

      for (const chainId of Object.keys(addressEntries)) {
        const entry = state.names.ethereumAddress[address][chainId as any];
        const normalizedAddress = address.toLowerCase();
        const normalizedChainId = chainId.toLowerCase();
        const { sourceId, name } = entry;

        if (!name?.length) {
          continue;
        }

        entries.push({
          address: normalizedAddress,
          name,
          chainId: normalizedChainId,
          isEns: sourceId === 'ens',
        });
      }
    }

    return entries;
  }

  #getAddressBookEntries(state: AddressBookState): Entry[] {
    const entries: Entry[] = [];

    for (const chainId of Object.keys(state.addressBook)) {
      const chainEntries = state.addressBook[chainId as any];

      for (const address of Object.keys(chainEntries)) {
        const entry = state.addressBook[chainId as any][address];
        const normalizedAddress = address.toLowerCase();
        const normalizedChainId = chainId.toLowerCase();
        const { name, isEns } = entry;

        if (!name?.length || !normalizedAddress?.length) {
          continue;
        }

        entries.push({
          address: normalizedAddress,
          name,
          chainId: normalizedChainId,
          isEns,
        });
      }
    }

    return entries;
  }
}
