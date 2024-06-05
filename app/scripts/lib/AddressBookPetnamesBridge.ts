import { AddressBookController } from '@metamask/address-book-controller';
import {
  NameController,
  NameType,
  NameOrigin,
} from '@metamask/name-controller';
import {
  AbstractPetnamesBridge,
  PetnamesBridgeMessenger,
  ChangeType,
  PetnameEntry,
} from './AbstractPetnamesBridge';

export class AddressBookPetnamesBridge extends AbstractPetnamesBridge {
  #addressBookController: AddressBookController;

  constructor({
    addressBookController,
    nameController,
    messenger,
  }: {
    addressBookController: AddressBookController;
    nameController: NameController;
    messenger: PetnamesBridgeMessenger<never, never>;
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
      // TODO: Replace `any` with type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const chainEntries = state.addressBook[chainId as any];

      for (const address of Object.keys(chainEntries)) {
        // TODO: Replace `any` with type
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const entry = state.addressBook[chainId as any][address];
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
      // TODO: Replace `any` with type
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.#addressBookController.delete(entry.variation as any, entry.value);
    } else {
      this.#addressBookController.set(
        entry.value,
        // TODO: Replace `any` with type
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        entry.name as any,
        // TODO: Replace `any` with type
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        entry.variation as any,
      );
    }
  }

  /**
   * @override
   */
  onSourceChange(listener: () => void): void {
    this.#addressBookController.subscribe(listener);
  }
}
