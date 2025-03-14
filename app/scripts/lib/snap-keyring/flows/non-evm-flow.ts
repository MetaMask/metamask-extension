import { SnapId } from '@metamask/snaps-sdk';
import { assertIsValidSnapId } from '@metamask/snaps-utils';
import {
  MetaMetricsEventAccountType,
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../../shared/constants/metametrics';
import { SnapKeyringBuilderMessenger } from '../types';
import { getSnapName } from '../snaps';
import { SnapKeyringActions } from '../actions';
import { SnapKeyringFlow } from './flow';

export class SnapKeyringNonEvmFlow implements SnapKeyringFlow {
  readonly #messenger: SnapKeyringBuilderMessenger;

  readonly #actions: SnapKeyringActions;

  constructor(
    messenger: SnapKeyringBuilderMessenger,
    actions: SnapKeyringActions,
  ) {
    this.#messenger = messenger;
    this.#actions = actions;
  }

  #getTrackSnapAccountEvent(
    snapId: SnapId,
  ): (event: MetaMetricsEventName) => void {
    const snapName = getSnapName(snapId, this.#messenger);

    return (event: MetaMetricsEventName) => {
      this.#actions.trackEvent({
        event,
        category: MetaMetricsEventCategory.Accounts,
        properties: {
          account_type: MetaMetricsEventAccountType.Snap,
          snap_id: snapId,
          snap_name: snapName,
        },
      });
    };
  }

  async onAddAccount(
    _address: string,
    snapId: string,
    handleUserInput: (accepted: boolean) => Promise<void>,
  ) {
    assertIsValidSnapId(snapId);

    const trackSnapAccountEvent = this.#getTrackSnapAccountEvent(snapId);

    // We auto-accept the account creation for this flow.
    await handleUserInput(true);
    await this.#actions.persistAccountsState();

    trackSnapAccountEvent(MetaMetricsEventName.AccountAdded);
  }

  async onRemoveAccount(
    address: string,
    snapId: string,
    handleUserInput: (accepted: boolean) => Promise<void>,
  ) {
    assertIsValidSnapId(snapId);

    const trackSnapAccountEvent = this.#getTrackSnapAccountEvent(snapId);

    // Since we use this in the finally, better to give it a default value if the controller call fails
    try {
      await this.#actions.removeAccount(address);
      // We auto-accept the account removal for this flow.
      await handleUserInput(true);
      await this.#actions.persistAccountsState();

      trackSnapAccountEvent(MetaMetricsEventName.AccountRemoved);
    } catch (error) {
      trackSnapAccountEvent(MetaMetricsEventName.AccountRemoveFailed);

      throw new Error(`Error occurred while removing snap account: ${error}`);
    }
  }
}
