import { SnapKeyring, SnapKeyringCallbacks } from '@metamask/eth-snap-keyring';
import browser from 'webextension-polyfill';
import { SnapId } from '@metamask/snaps-sdk';
import {
  MetaMetricsEventAccountType,
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES } from '../../../../shared/constants/app';
import { t } from '../../translate';
import MetamaskController from '../../metamask-controller';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { IconName } from '../../../../ui/components/component-library/icon';
import MetaMetricsController from '../../controllers/metametrics-controller';
import { isBlockedUrl } from './utils/isBlockedUrl';
import { showError, showSuccess } from './utils/showResult';
import { SnapKeyringBuilderMessenger } from './types';
import { assertSnapIdIsValid, getSnapName, isSnapPreinstalled } from './snaps';

/**
 * Builder type for the Snap keyring.
 */
export type SnapKeyringBuilder = {
  (): SnapKeyring;
  type: typeof SnapKeyring.type;
};

/**
 * Helpers for the Snap keyring implementation.
 */
export type SnapKeyringHelpers = {
  trackEvent: MetaMetricsController['trackEvent'];
  persistKeyringHelper: () => Promise<void>;
  removeAccountHelper: (address: string) => Promise<void>;
};

/**
 * Get the addresses of the accounts managed by a given Snap.
 *
 * @param controller - Instance of the MetaMask Controller.
 * @param snapId - Snap ID to get accounts for.
 * @returns The addresses of the accounts.
 */
export const getAccountsBySnapId = async (
  controller: MetamaskController,
  snapId: SnapId,
) => {
  const snapKeyring: SnapKeyring = await controller.getSnapKeyring();
  return await snapKeyring.getAccountsBySnapId(snapId);
};

/**
 * Show the account creation dialog for a given Snap.
 * This function will start the approval flow, show the account creation dialog, and end the flow.
 *
 * @param snapId - Snap ID to show the account creation dialog for.
 * @param messenger - The controller messenger instance.
 * @returns The user's confirmation result.
 */
export async function showAccountCreationDialog(
  snapId: string,
  messenger: SnapKeyringBuilderMessenger,
) {
  try {
    const confirmationResult = Boolean(
      await messenger.call(
        'ApprovalController:addRequest',
        {
          origin: snapId,
          type: SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES.confirmAccountCreation,
        },
        true,
      ),
    );
    return confirmationResult;
  } catch (e) {
    throw new Error(
      `Error occurred while showing account creation dialog.\n${e}`,
    );
  }
}

/**
 * Show the account name suggestion confirmation dialog for a given Snap.
 *
 * @param snapId - Snap ID to show the account name suggestion dialog for.
 * @param messenger - The controller messenger instance.
 * @param accountNameSuggestion - Suggested name for the new account.
 * @returns The user's confirmation result.
 */
export async function showAccountNameSuggestionDialog(
  snapId: string,
  messenger: SnapKeyringBuilderMessenger,
  accountNameSuggestion: string,
): Promise<{ success: boolean; name?: string }> {
  try {
    const confirmationResult = (await messenger.call(
      'ApprovalController:addRequest',
      {
        origin: snapId,
        type: SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES.showNameSnapAccount,
        requestData: {
          snapSuggestedAccountName: accountNameSuggestion,
        },
      },
      true,
    )) as { success: boolean; name?: string };
    return confirmationResult;
  } catch (e) {
    throw new Error(`Error occurred while showing name account dialog.\n${e}`);
  }
}

class SnapKeyringImpl implements SnapKeyringCallbacks {
  readonly #messenger: SnapKeyringBuilderMessenger;

  readonly #trackEvent: SnapKeyringHelpers['trackEvent'];

  readonly #persistKeyringHelper: SnapKeyringHelpers['persistKeyringHelper'];

  readonly #removeAccountHelper: SnapKeyringHelpers['removeAccountHelper'];

  constructor(
    messenger: SnapKeyringBuilderMessenger,
    {
      trackEvent,
      persistKeyringHelper,
      removeAccountHelper,
    }: SnapKeyringHelpers,
  ) {
    this.#messenger = messenger;
    this.#trackEvent = trackEvent;
    this.#persistKeyringHelper = persistKeyringHelper;
    this.#removeAccountHelper = removeAccountHelper;
  }

  async addressExists(address: string) {
    const addresses = await this.#messenger.call(
      'KeyringController:getAccounts',
    );
    return addresses.includes(address.toLowerCase());
  }

  async redirectUser(snapId: string, url: string, message: string) {
    // Either url or message must be defined
    if (url.length > 0 || message.length > 0) {
      const isBlocked = await isBlockedUrl(
        url,
        async () => {
          return await this.#messenger.call(
            'PhishingController:maybeUpdateState',
          );
        },
        (urlToTest: string) => {
          return this.#messenger.call(
            'PhishingController:testOrigin',
            urlToTest,
          );
        },
      );

      const confirmationResult = await this.#messenger.call(
        'ApprovalController:addRequest',
        {
          origin: snapId,
          requestData: { url, message, isBlockedUrl: isBlocked },
          type: SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES.showSnapAccountRedirect,
        },
        true,
      );

      if (Boolean(confirmationResult) && url.length > 0) {
        browser.tabs.create({ url });
      } else {
        console.log('User refused snap account redirection to:', url);
      }
    } else {
      console.log(
        'Error occurred when redirecting snap account. url or message must be defined',
      );
    }
  }

  async saveState() {
    await this.#persistKeyringHelper();
  }

  async addAccount(
    address: string,
    snapId: string,
    handleUserInput: (accepted: boolean) => Promise<void>,
    accountNameSuggestion: string = '',
    displayConfirmation: boolean = false,
  ) {
    assertSnapIdIsValid(snapId);

    const snapName = getSnapName(snapId as SnapId, this.#messenger);
    const { id: addAccountFlowId } = this.#messenger.call(
      'ApprovalController:startFlow',
    );

    const trackSnapAccountEvent = (event: MetaMetricsEventName) => {
      this.#trackEvent({
        event,
        category: MetaMetricsEventCategory.Accounts,
        properties: {
          account_type: MetaMetricsEventAccountType.Snap,
          snap_id: snapId,
          snap_name: snapName,
        },
      });
    };

    try {
      const learnMoreLink =
        'https://support.metamask.io/managing-my-wallet/accounts-and-addresses/how-to-add-accounts-in-your-wallet/';

      // If snap is preinstalled and does not request confirmation, skip the confirmation dialog
      const skipConfirmation =
        isSnapPreinstalled(snapId as SnapId) && !displayConfirmation;
      // If confirmation dialog are skipped, we consider the account creation to be confirmed until the account name dialog is closed
      const accountCreationConfirmationResult =
        skipConfirmation ||
        (await showAccountCreationDialog(snapId, this.#messenger));

      if (!accountCreationConfirmationResult) {
        // User has cancelled account creation
        await handleUserInput(accountCreationConfirmationResult);

        throw new Error('User denied account creation');
      }

      const accountNameConfirmationResult =
        await showAccountNameSuggestionDialog(
          snapId,
          this.#messenger,
          accountNameSuggestion,
        );

      if (accountNameConfirmationResult?.success) {
        try {
          // Persist the account so we can rename it afterward
          await this.#persistKeyringHelper();
          await handleUserInput(accountNameConfirmationResult.success);
          const account = this.#messenger.call(
            'AccountsController:getAccountByAddress',
            address,
          );
          if (!account) {
            throw new Error(
              `Internal account not found for address: ${address}`,
            );
          }
          // Set the selected account to the new account
          this.#messenger.call(
            'AccountsController:setSelectedAccount',
            account.id,
          );

          if (accountNameConfirmationResult.name) {
            this.#messenger.call(
              'AccountsController:setAccountName',
              account.id,
              accountNameConfirmationResult.name,
            );
          }

          if (!skipConfirmation) {
            // TODO: Add events tracking to the dialog itself, so that events are more
            // "linked" to UI actions
            // User should now see the "Successfuly added account" page
            trackSnapAccountEvent(
              MetaMetricsEventName.AddSnapAccountSuccessViewed,
            );
            await showSuccess(
              this.#messenger,
              snapId,
              {
                icon: IconName.UserCircleAdd,
                title: t('snapAccountCreated'),
              },
              {
                message: t('snapAccountCreatedDescription') as string,
                address,
                learnMoreLink,
              },
            );
            // User has clicked on "OK"
            trackSnapAccountEvent(
              MetaMetricsEventName.AddSnapAccountSuccessClicked,
            );
          }

          trackSnapAccountEvent(MetaMetricsEventName.AccountAdded);
        } catch (e) {
          // Error occurred while naming the account
          const error = (e as Error).message;

          await showError(
            this.#messenger,
            snapId,
            {
              icon: IconName.UserCircleAdd,
              title: t('snapAccountCreationFailed'),
            },
            {
              message: t(
                'snapAccountCreationFailedDescription',
                snapName,
              ) as string,
              learnMoreLink,
              error,
            },
          );

          throw new Error(
            `Error occurred while creating snap account: ${error}`,
          );
        }
      } else {
        // User has cancelled account creation so remove the account from the keyring
        await handleUserInput(accountNameConfirmationResult?.success);

        throw new Error('User denied account creation');
      }
    } finally {
      this.#messenger.call('ApprovalController:endFlow', {
        id: addAccountFlowId,
      });
    }
  }

  async removeAccount(
    address: string,
    snapId: string,
    handleUserInput: (accepted: boolean) => Promise<void>,
  ) {
    assertSnapIdIsValid(snapId);

    const snapName = getSnapName(snapId as SnapId, this.#messenger);
    const { id: removeAccountApprovalId } = this.#messenger.call(
      'ApprovalController:startFlow',
    );

    const learnMoreLink =
      'https://support.metamask.io/managing-my-wallet/accounts-and-addresses/how-to-remove-an-account-from-your-metamask-wallet/';

    const trackSnapAccountEvent = (event: MetaMetricsEventName) => {
      this.#trackEvent({
        event,
        category: MetaMetricsEventCategory.Accounts,
        properties: {
          account_type: MetaMetricsEventAccountType.Snap,
          snap_id: snapId,
          snap_name: snapName,
        },
      });
    };

    // Since we use this in the finally, better to give it a default value if the controller call fails
    let confirmationResult = false;
    try {
      confirmationResult = Boolean(
        await this.#messenger.call(
          'ApprovalController:addRequest',
          {
            origin: snapId,
            type: SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES.confirmAccountRemoval,
            requestData: { publicAddress: address },
          },
          true,
        ),
      );

      if (confirmationResult) {
        try {
          await this.#removeAccountHelper(address);
          await handleUserInput(confirmationResult);
          await this.#persistKeyringHelper();

          // TODO: Add events tracking to the dialog itself, so that events are more
          // "linked" to UI actions
          // User should now see the "Successfuly removed account" page
          trackSnapAccountEvent(
            MetaMetricsEventName.RemoveSnapAccountSuccessViewed,
          );
          // This isn't actually an error, but we show it as one for styling reasons
          await showError(
            this.#messenger,
            snapId,
            {
              icon: IconName.UserCircleRemove,
              title: t('snapAccountRemoved'),
            },
            {
              message: t('snapAccountRemovedDescription') as string,
              learnMoreLink,
            },
          );

          // User has clicked on "OK"
          trackSnapAccountEvent(
            MetaMetricsEventName.RemoveSnapAccountSuccessClicked,
          );
        } catch (e) {
          const error = (e as Error).message;

          await showError(
            this.#messenger,
            snapId,
            {
              icon: IconName.UserCircleRemove,
              title: t('snapAccountRemovalFailed'),
            },
            {
              message: t(
                'snapAccountRemovalFailedDescription',
                snapName,
              ) as string,
              learnMoreLink,
              error,
            },
          );

          trackSnapAccountEvent(MetaMetricsEventName.AccountRemoveFailed);

          throw new Error(
            `Error occurred while removing snap account: ${error}`,
          );
        }
      } else {
        await handleUserInput(confirmationResult);

        throw new Error('User denied account removal');
      }
    } finally {
      // We do not have a `else` clause here, as it's used if the request was
      // canceled by the user, thus it's not a "fail" (not an error).
      if (confirmationResult) {
        trackSnapAccountEvent(MetaMetricsEventName.AccountRemoved);
      }

      this.#messenger.call('ApprovalController:endFlow', {
        id: removeAccountApprovalId,
      });
    }
  }
}

/**
 * Constructs a SnapKeyring builder with specified handlers for managing Snap accounts.
 *
 * @param messenger - The messenger instace.
 * @param helpers - Helpers required by the Snap keyring implementation.
 * @returns A Snap keyring builder.
 */
export function snapKeyringBuilder(
  messenger: SnapKeyringBuilderMessenger,
  helpers: SnapKeyringHelpers,
) {
  const builder = (() => {
    return new SnapKeyring(messenger, new SnapKeyringImpl(messenger, helpers));
  }) as SnapKeyringBuilder;
  builder.type = SnapKeyring.type;

  return builder;
}
