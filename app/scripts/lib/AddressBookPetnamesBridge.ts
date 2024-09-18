import {
  AddressBookController,
  AddressBookControllerStateChangeEvent,
  AddressBookControllerActions,
} from '@metamask/address-book-controller';
import {
  NameController,
  NameType,
  NameOrigin,
} from '@metamask/name-controller';
import type { Hex } from '@metamask/utils';
import {
  AbstractPetnamesBridge,
  PetnamesBridgeMessenger,
  ChangeType,
  PetnameEntry,
} from './AbstractPetnamesBridge';

export type AddressBookPetnamesBridgeEvens =
  AddressBookControllerStateChangeEvent;
export type AddressBookPetnamesBridgeActions = AddressBookControllerActions;

export type AddressBookPetnamesBridgeMessenger = PetnamesBridgeMessenger<
  AddressBookPetnamesBridgeEvens,
  AddressBookPetnamesBridgeActions
>;

export class AddressBookPetnamesBridge extends AbstractPetnamesBridge<
  AddressBookPetnamesBridgeEvens,
  AddressBookPetnamesBridgeActions
> {
  #addressBookController: AddressBookController;

  constructor({
    addressBookController,
    nameController,
    messenger,
  }: {
    addressBookController: AddressBookController;
    nameController: NameController;
    messenger: AddressBookPetnamesBridgeMessenger;
  }) {
    super({ isTwoWay: true, nameController, messenger });

    this.#addressBookController = addressBookController;
  }

  /**
   * @override
   */
  protected getSourceEntries(): PetnameEntry[] {
    const entries: PetnameEntry[] = [];
    const { state } = this.#addressBookController;
    for (const chainId of Object.keys(state.addressBook)) {
      const chainEntries = state.addressBook[chainId as Hex];

      for (const address of Object.keys(chainEntries)) {
        const entry = state.addressBook[chainId as Hex][address];
        const normalizedChainId = chainId.toLowerCase();
        const { name, isEns } = entry;

        if (!name?.length || !address?.length) {
          continue;
        }

        entries.push({
          value: address,
          name,
          variation: normalizedChainId,
          type: NameType.ETHEREUM_ADDRESS,
          sourceId: isEns ? 'ens' : undefined,
          origin: NameOrigin.ADDRESS_BOOK,
        });
      }
    }
    return entries;
  }

  /**
   * @override
   */
  protected updateSourceEntry(type: ChangeType, entry: PetnameEntry): void {
    if (type === ChangeType.DELETED) {
      this.#addressBookController.delete(
        entry.variation as Hex,
        entry.value as string,
      );
    } else {
      this.#addressBookController.set(
        entry.value as string,
        entry.name as string,
        entry.variation as Hex | undefined,
      );
    }
  }

  /**
   * @override
   */
  onSourceChange(listener: () => void): void {
    this.messenger.subscribe('AddressBookController:stateChange', listener);
  }
}
