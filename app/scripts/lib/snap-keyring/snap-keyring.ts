import {
  getDefaultInternalOptions,
  SnapKeyring,
  SnapKeyringCallbacks,
  SnapKeyringInternalOptions,
} from '@metamask/eth-snap-keyring';
import browser from 'webextension-polyfill';
import { SnapId } from '@metamask/snaps-sdk';
import { assertIsValidSnapId } from '@metamask/snaps-utils';
import {
  MetaMetricsEventAccountType,
  MetaMetricsEventCategory,
  MetaMetricsEventName,
} from '../../../../shared/constants/metametrics';
import { SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES } from '../../../../shared/constants/app';
import { t } from '../../../../shared/lib/translate';
// TODO: Remove restricted import
// eslint-disable-next-line import/no-restricted-paths
import { IconName } from '../../../../ui/components/component-library/icon';
import MetaMetricsController from '../../controllers/metametrics-controller';
import { isSnapPreinstalled } from '../../../../shared/lib/snaps/snaps';
import {
  getSnapName,
  isMultichainWalletSnap,
} from '../../../../shared/lib/accounts/snaps';
import { SnapKeyringBuilderMessenger } from './types';
import { isBlockedUrl } from './utils/isBlockedUrl';
import { showError, showSuccess } from './utils/showResult';

/**
 * Builder type for the Snap keyring.
 */
export type SnapKeyringBuilder = {
  name: 'SnapKeyringBuilder';
  state: null;

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
      // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31893
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      `Error occurred while showing account creation dialog.\n${e}`,
    );
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

  async #withApprovalFlow<Return>(
    run: (flowId: string) => Promise<Return>,
  ): Promise<Return> {
    const { id: flowId } = this.#messenger.call('ApprovalController:startFlow');

    try {
      return await run(flowId);
    } finally {
      this.#messenger.call('ApprovalController:endFlow', {
        id: flowId,
      });
    }
  }

  async #addAccountConfirmations({
    snapId,
    skipConfirmationDialog,
    skipApprovalFlow,
    handleUserInput,
  }: {
    snapId: SnapId;
    skipConfirmationDialog: boolean;
    skipApprovalFlow: boolean;
    handleUserInput: (accepted: boolean) => Promise<void>;
  }): Promise<void> {
    // If the confirmation dialog is skipped (preinstalled snap without confirmations),
    // don't enter the approval flow at all to avoid unnecessary loader/flow UI.
    // Just compute the name and signal acceptance.
    if (skipApprovalFlow) {
      return await handleUserInput(true);
    }

    return await this.#withApprovalFlow(async (_) => {
      // Show the account CREATION confirmation dialog.
      // If confirmation dialog are skipped, we consider the account creation to be confirmed automatically.
      const success =
        skipConfirmationDialog ||
        (await showAccountCreationDialog(snapId, this.#messenger));

      await handleUserInput(success);

      if (!success) {
        // User has cancelled account creation
        throw new Error('User denied account creation');
      }
    });
  }

  async #addAccountFinalize({
    address,
    snapId,
    skipConfirmationDialog,
    skipSetSelectedAccountStep,
    skipApprovalFlow,
    onceSaved,
  }: {
    address: string;
    snapId: SnapId;
    skipConfirmationDialog: boolean;
    skipSetSelectedAccountStep: boolean;
    skipApprovalFlow: boolean;
    onceSaved: Promise<string>;
  }) {
    const learnMoreLink =
      'https://support.metamask.io/managing-my-wallet/accounts-and-addresses/how-to-add-accounts-in-your-wallet/';

    const snapName = getSnapName(snapId, this.#messenger);

    const trackSnapAccountEvent = (event: MetaMetricsEventName) => {
      this.#trackEvent({
        event,
        category: MetaMetricsEventCategory.Accounts,
        properties: {
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          account_type: MetaMetricsEventAccountType.Snap,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          snap_id: snapId,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          snap_name: snapName,
          ...(event === MetaMetricsEventName.AccountAdded && {
            // NOTE: We keep this property for backward compatibility with existing
            // metrics, but we're no longer naming those accounts, only account groups.
            // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
            // eslint-disable-next-line @typescript-eslint/naming-convention
            is_suggested_name: false,
          }),
        },
      });
    };

    const finalizeFn = async () => {
      try {
        // First, wait for the account to be fully saved.
        // NOTE: This might throw, so keep this in the `try` clause.
        const accountId = await onceSaved;

        // From here, we know the account has been saved into the Snap keyring
        // state, so we can safely uses this state to run post-processing.
        // (e.g. renaming the account, select the account, etc...)

        if (!skipSetSelectedAccountStep) {
          // Set the selected account to the new account
          this.#messenger.call(
            'AccountsController:setSelectedAccount',
            accountId,
          );
        }

        if (!skipConfirmationDialog) {
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

        // This part of the flow is not awaited, so we just log the error for now:
        console.error('Error occurred while creating snap account:', error);
      }
    };

    // If confirmation was skipped, do not start an approval flow to avoid loader UI.
    if (skipApprovalFlow) {
      await finalizeFn();
      return;
    }

    await this.#withApprovalFlow(finalizeFn);
  }

  async addAccount(
    address: string,
    snapId: string,
    handleUserInput: (accepted: boolean) => Promise<void>,
    onceSaved: Promise<string>,
    // Not used anymore.
    // TODO: Update `SnapKeyring` interface to remove this parameter.
    _accountNameSuggestion?: string,
    {
      displayConfirmation,
      setSelectedAccount,
    }: SnapKeyringInternalOptions = getDefaultInternalOptions(),
  ) {
    assertIsValidSnapId(snapId);

    // Preinstalled Snaps can skip some confirmation dialogs.
    const isPreinstalled = isSnapPreinstalled(snapId);

    // Since the introduction of BIP-44, multichain wallet Snaps will skip them automatically too!
    let skipAll = isPreinstalled && isMultichainWalletSnap(snapId);
    // FIXME: We still rely on the old behavior in some e2e, so we do not skip them in this case.
    if (process.env.IN_TEST) {
      skipAll = false;
    }

    // If Snap is preinstalled and does not request confirmation, skip the confirmation dialog.
    const skipConfirmationDialog =
      skipAll || (isPreinstalled && !displayConfirmation);

    // Only pre-installed Snaps can skip the account from being selected.
    const skipSetSelectedAccountStep =
      skipAll || (isPreinstalled && !setSelectedAccount);

    // Skip the approval flow if the confirmation dialog is skipped.
    const skipApprovalFlow = skipConfirmationDialog;

    // First part of the flow, which includes confirmation dialog (if not skipped).
    // Once confirmed, we resume the Snap execution.
    await this.#addAccountConfirmations({
      snapId,
      skipConfirmationDialog,
      skipApprovalFlow,
      handleUserInput,
    });

    // The second part is about selecting the newly created account and showing some other
    // confirmation dialogs (or error dialogs if anything goes wrong while persisting the account
    // into the state.
    // eslint-disable-next-line no-void
    void this.#addAccountFinalize({
      address,
      snapId,
      skipConfirmationDialog,
      skipSetSelectedAccountStep,
      skipApprovalFlow,
      onceSaved,
    });
  }

  async removeAccount(
    address: string,
    snapId: string,
    handleUserInput: (accepted: boolean) => Promise<void>,
  ) {
    assertIsValidSnapId(snapId);

    const snapName = getSnapName(snapId, this.#messenger);
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
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          account_type: MetaMetricsEventAccountType.Snap,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
          snap_id: snapId,
          // TODO: Fix in https://github.com/MetaMask/metamask-extension/issues/31860
          // eslint-disable-next-line @typescript-eslint/naming-convention
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
          await this.saveState();

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
  const SnapKeyringBuilder = (() => {
    return new SnapKeyring({
      messenger,
      callbacks: new SnapKeyringImpl(messenger, helpers),
      ///: BEGIN:ONLY_INCLUDE_IF(build-flask)
      // Enables generic account creation for new chain integration. It's
      // Flask-only since production should use defined account types.
      isAnyAccountTypeAllowed: true,
      ///: END:ONLY_INCLUDE_IF
    });
  }) as SnapKeyringBuilder;

  SnapKeyringBuilder.state = null;
  SnapKeyringBuilder.type = SnapKeyring.type;

  return SnapKeyringBuilder;
}
