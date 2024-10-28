import { SnapKeyring } from '@metamask/eth-snap-keyring';
import type { SnapController } from '@metamask/snaps-controllers';
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
import { isBlockedUrl } from './utils/isBlockedUrl';
import { showError, showSuccess } from './utils/showResult';
import { SnapKeyringBuilderMessenger } from './types';

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
 * @param controllerMessenger - The controller messenger instance.
 * @returns The user's confirmation result.
 */
export async function showAccountCreationDialog(
  snapId: string,
  controllerMessenger: SnapKeyringBuilderMessenger,
) {
  try {
    const confirmationResult = Boolean(
      await controllerMessenger.call(
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
 * @param controllerMessenger - The controller messenger instance.
 * @param accountNameSuggestion - Suggested name for the new account.
 * @returns The user's confirmation result.
 */
export async function showAccountNameSuggestionDialog(
  snapId: string,
  controllerMessenger: SnapKeyringBuilderMessenger,
  accountNameSuggestion: string,
): Promise<{ success: boolean; name?: string }> {
  try {
    const confirmationResult = (await controllerMessenger.call(
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

/**
 * Constructs a SnapKeyring builder with specified handlers for managing snap accounts.
 *
 * @param controllerMessenger - The controller messenger instance.
 * @param getSnapController - A function that retrieves the Snap Controller instance.
 * @param persistKeyringHelper - A function that persists all keyrings in the vault.
 * @param removeAccountHelper - A function to help remove an account based on its address.
 * @param trackEvent - A function to track MetaMetrics events.
 * @param getSnapName - A function to get a snap's localized
 * (or non-localized if there are no localization files) name from its manifest.
 * @param isSnapPreinstalled - A function to check if a Snap is pre-installed.
 * @returns The constructed SnapKeyring builder instance with the following methods:
 * - `saveState`: Persists all keyrings in the keyring controller.
 * - `addAccount`: Initiates the process of adding an account with user confirmation and handling the user input.
 * - `removeAccount`: Initiates the process of removing an account with user confirmation and handling the user input.
 */
export const snapKeyringBuilder = (
  controllerMessenger: SnapKeyringBuilderMessenger,
  getSnapController: () => SnapController,
  persistKeyringHelper: () => Promise<void>,
  // TODO: Replace `any` with type
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  removeAccountHelper: (address: string) => Promise<any>,
  trackEvent: (
    // TODO: Replace `any` with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    payload: Record<string, any>,
    // TODO: Replace `any` with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    options?: Record<string, any>,
  ) => void,
  getSnapName: (snapId: string) => string,
  isSnapPreinstalled: (snapId: string) => boolean,
) => {
  const builder = (() => {
    // TODO: Replace `any` with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new SnapKeyring(getSnapController() as any, {
      addressExists: async (address) => {
        const addresses = await controllerMessenger.call(
          'KeyringController:getAccounts',
        );
        return addresses.includes(address.toLowerCase());
      },
      redirectUser: async (snapId: string, url: string, message: string) => {
        // Either url or message must be defined
        if (url.length > 0 || message.length > 0) {
          const isBlocked = await isBlockedUrl(
            url,
            async () => {
              return await controllerMessenger.call(
                'PhishingController:maybeUpdateState',
              );
            },
            (urlToTest: string) => {
              return controllerMessenger.call(
                'PhishingController:testOrigin',
                urlToTest,
              );
            },
          );

          const confirmationResult = await controllerMessenger.call(
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
      },
      saveState: async () => {
        await persistKeyringHelper();
      },
      addAccount: async (
        address: string,
        snapId: string,
        handleUserInput: (accepted: boolean) => Promise<void>,
        accountNameSuggestion: string = '',
        displayConfirmation: boolean = false,
      ) => {
        const snapName = getSnapName(snapId);
        const { id: addAccountFlowId } = controllerMessenger.call(
          'ApprovalController:startFlow',
        );

        const trackSnapAccountEvent = (event: MetaMetricsEventName) => {
          trackEvent({
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
            isSnapPreinstalled(snapId) && !displayConfirmation;
          // If confirmation dialog are skipped, we consider the account creation to be confirmed until the account name dialog is closed
          const accountCreationConfirmationResult =
            skipConfirmation ||
            (await showAccountCreationDialog(snapId, controllerMessenger));

          if (!accountCreationConfirmationResult) {
            // User has cancelled account creation
            await handleUserInput(accountCreationConfirmationResult);

            throw new Error('User denied account creation');
          }

          const accountNameConfirmationResult =
            await showAccountNameSuggestionDialog(
              snapId,
              controllerMessenger,
              accountNameSuggestion,
            );

          if (accountNameConfirmationResult?.success) {
            try {
              // Persist the account so we can rename it afterward
              await persistKeyringHelper();
              await handleUserInput(accountNameConfirmationResult.success);
              const account = controllerMessenger.call(
                'AccountsController:getAccountByAddress',
                address,
              );
              if (!account) {
                throw new Error(
                  `Internal account not found for address: ${address}`,
                );
              }
              // Set the selected account to the new account
              controllerMessenger.call(
                'AccountsController:setSelectedAccount',
                account.id,
              );

              if (accountNameConfirmationResult.name) {
                controllerMessenger.call(
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
                  controllerMessenger,
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
                controllerMessenger,
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
          controllerMessenger.call('ApprovalController:endFlow', {
            id: addAccountFlowId,
          });
        }
      },
      removeAccount: async (
        address: string,
        snapId: string,
        handleUserInput: (accepted: boolean) => Promise<void>,
      ) => {
        const snapName = getSnapName(snapId);
        const { id: removeAccountApprovalId } = controllerMessenger.call(
          'ApprovalController:startFlow',
        );

        const learnMoreLink =
          'https://support.metamask.io/managing-my-wallet/accounts-and-addresses/how-to-remove-an-account-from-your-metamask-wallet/';

        const trackSnapAccountEvent = (event: MetaMetricsEventName) => {
          trackEvent({
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
            await controllerMessenger.call(
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
              await removeAccountHelper(address);
              await handleUserInput(confirmationResult);
              await persistKeyringHelper();

              // TODO: Add events tracking to the dialog itself, so that events are more
              // "linked" to UI actions
              // User should now see the "Successfuly removed account" page
              trackSnapAccountEvent(
                MetaMetricsEventName.RemoveSnapAccountSuccessViewed,
              );
              // This isn't actually an error, but we show it as one for styling reasons
              await showError(
                controllerMessenger,
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
                controllerMessenger,
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

          controllerMessenger.call('ApprovalController:endFlow', {
            id: removeAccountApprovalId,
          });
        }
      },
    });
    // TODO: Replace `any` with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }) as any;
  builder.type = SnapKeyring.type;
  return builder;
};
