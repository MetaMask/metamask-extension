import { SnapKeyring } from '@metamask/eth-snap-keyring';
import type { SnapController } from '@metamask/snaps-controllers';
import type {
  AcceptRequest,
  AddApprovalRequest,
  EndFlow,
  RejectRequest,
  ResultComponent,
  ShowError,
  ShowSuccess,
  StartFlow,
} from '@metamask/approval-controller';
import type { KeyringControllerGetAccountsAction } from '@metamask/keyring-controller';
import browser from 'webextension-polyfill';
import { RestrictedControllerMessenger } from '@metamask/base-controller';
import { MaybeUpdateState, TestOrigin } from '@metamask/phishing-controller';
import { SnapId } from '@metamask/snaps-sdk';
import { GetSubjectMetadata } from '@metamask/permission-controller';
import {
  AccountsControllerGetAccountByAddressAction,
  AccountsControllerSetSelectedAccountAction,
} from '@metamask/accounts-controller';
import { SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES } from '../../../../shared/constants/app';
import { t } from '../../translate';
import MetamaskController from '../../metamask-controller';
import { IconName } from '../../../../ui/components/component-library/icon';
import { getSnapName } from '../../../../ui/helpers/utils/util';
import { isBlockedUrl } from './utils/isBlockedUrl';

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

type SnapKeyringBuilderAllowActions =
  | StartFlow
  | EndFlow
  | ShowSuccess
  | ShowError
  | AddApprovalRequest
  | AcceptRequest
  | RejectRequest
  | MaybeUpdateState
  | TestOrigin
  | KeyringControllerGetAccountsAction
  | GetSubjectMetadata
  | AccountsControllerSetSelectedAccountAction
  | AccountsControllerGetAccountByAddressAction;

type snapKeyringBuilderMessenger = RestrictedControllerMessenger<
  'SnapKeyringBuilder',
  SnapKeyringBuilderAllowActions,
  never,
  SnapKeyringBuilderAllowActions['type'],
  never
>;

/**
 * Constructs a SnapKeyring builder with specified handlers for managing snap accounts.
 *
 * @param controllerMessenger - The controller messenger instance.
 * @param getSnapController - A function that retrieves the Snap Controller instance.
 * @param persistKeyringHelper - A function that persists all keyrings in the vault.
 * @param setSelectedAccountHelper - A function to update current selected account.
 * @param removeAccountHelper - A function to help remove an account based on its address.
 * @returns The constructed SnapKeyring builder instance with the following methods:
 * - `saveState`: Persists all keyrings in the keyring controller.
 * - `addAccount`: Initiates the process of adding an account with user confirmation and handling the user input.
 * - `removeAccount`: Initiates the process of removing an account with user confirmation and handling the user input.
 */
export const snapKeyringBuilder = (
  controllerMessenger: snapKeyringBuilderMessenger,
  getSnapController: () => SnapController,
  persistKeyringHelper: () => Promise<void>,
  setSelectedAccountHelper: (address: string) => void,
  removeAccountHelper: (address: string) => Promise<any>,
) => {
  const builder = (() => {
    const snapAuthorshipHeader = (snapId: string): ResultComponent => {
      return {
        name: 'SnapAuthorshipHeader',
        key: 'snapHeader',
        properties: { snapId },
      } as ResultComponent;
    };

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
      ) => {
        const { id: addAccountApprovalId } = controllerMessenger.call(
          'ApprovalController:startFlow',
        );

        const learnMoreLink =
          'https://support.metamask.io/hc/en-us/articles/360015289452-How-to-add-accounts-in-your-wallet';

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

          if (confirmationResult) {
            try {
              await handleUserInput(confirmationResult);
              await persistKeyringHelper();
              setSelectedAccountHelper(address);
              const internalAccount = controllerMessenger.call(
                'AccountsController:getAccountByAddress',
                address,
              );
              if (!internalAccount) {
                throw new Error(
                  `Internal account not found for address: ${address}`,
                );
              }
              controllerMessenger.call(
                'AccountsController:setSelectedAccount',
                internalAccount.id,
              );
              await controllerMessenger.call('ApprovalController:showSuccess', {
                header: [snapAuthorshipHeader(snapId)],
                title: t('snapAccountCreated') as string,
                icon: IconName.UserCircleAdd,
                message: {
                  name: 'SnapAccountSuccessMessage',
                  key: 'SnapAccountSuccessMessage',
                  properties: {
                    message: t('snapAccountCreatedDescription') as string,
                    address,
                    learnMoreLink,
                  },
                },
              });
            } catch (e) {
              const error = (e as Error).message;
              const subjectMetadata = controllerMessenger.call(
                'SubjectMetadataController:getSubjectMetadata',
                snapId,
              );

              const snapName = getSnapName(snapId, subjectMetadata);

              await controllerMessenger.call('ApprovalController:showError', {
                header: [snapAuthorshipHeader(snapId)],
                title: t('snapAccountCreationFailed') as string,
                icon: IconName.UserCircleAdd,
                error: {
                  name: 'SnapAccountErrorMessage',
                  key: 'SnapAccountErrorMessage',
                  properties: {
                    message: t(
                      'snapAccountCreationFailedDescription',
                      snapName,
                    ) as string,
                    learnMoreLink,
                    error,
                  },
                },
              });
              throw new Error(
                `Error occurred while creating snap account: ${error}`,
              );
            }
          } else {
            await handleUserInput(confirmationResult);
            throw new Error('User denied account creation');
          }
        } finally {
          controllerMessenger.call('ApprovalController:endFlow', {
            id: addAccountApprovalId,
          });
        }
      },
      removeAccount: async (
        address: string,
        snapId: string,
        handleUserInput: (accepted: boolean) => Promise<void>,
      ) => {
        const { id: removeAccountApprovalId } = controllerMessenger.call(
          'ApprovalController:startFlow',
        );

        const learnMoreLink =
          'https://support.metamask.io/hc/en-us/articles/360057435092-How-to-remove-an-account-from-your-MetaMask-wallet';

        try {
          const confirmationResult = Boolean(
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
              // This isn't actually an error, but we show it as one for styling reasons
              await controllerMessenger.call('ApprovalController:showError', {
                header: [snapAuthorshipHeader(snapId)],
                icon: IconName.UserCircleRemove,
                title: t('snapAccountRemoved') as string,
                error: {
                  name: 'SnapAccountErrorMessage',
                  key: 'snapAccountErrorMessage',
                  properties: {
                    message: t('snapAccountRemovedDescription') as string,
                    learnMoreLink,
                  },
                },
              });
            } catch (e) {
              const error = (e as Error).message;
              const subjectMetadata = controllerMessenger.call(
                'SubjectMetadataController:getSubjectMetadata',
                snapId,
              );

              const snapName = getSnapName(snapId, subjectMetadata);

              await controllerMessenger.call('ApprovalController:showError', {
                header: [snapAuthorshipHeader(snapId)],
                icon: IconName.UserCircleRemove,
                title: t('snapAccountRemovalFailed') as string,
                error: {
                  name: 'SnapAccountErrorMessage',
                  key: 'snapAccountErrorMessage',
                  properties: {
                    message: t(
                      'snapAccountRemovalFailedDescription',
                      snapName,
                    ) as string,
                    learnMoreLink,
                    error,
                  },
                },
              });
              throw new Error(
                `Error occurred while removing snap account: ${error}`,
              );
            }
          } else {
            await handleUserInput(confirmationResult);
            throw new Error('User denied account removal');
          }
        } finally {
          controllerMessenger.call('ApprovalController:endFlow', {
            id: removeAccountApprovalId,
          });
        }
      },
    });
  }) as any;
  builder.type = SnapKeyring.type;
  return builder;
};
