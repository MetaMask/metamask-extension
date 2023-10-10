import { SnapKeyring } from '@metamask/eth-snap-keyring';
import type { SnapController } from '@metamask/snaps-controllers';
import type {
  ApprovalController,
  ResultComponent,
} from '@metamask/approval-controller';
import type { KeyringController } from '@metamask/keyring-controller';
import { SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES } from '../../../../shared/constants/app';
import { t } from '../../translate';
import MetamaskController from '../../metamask-controller';
import PreferencesController from '../../controllers/preferences';

/**
 * Get the addresses of the accounts managed by a given Snap.
 *
 * @param controller - Instance of the MetaMask Controller.
 * @param snapId - Snap ID to get accounts for.
 * @returns The addresses of the accounts.
 */
export const getAccountsBySnapId = async (
  controller: MetamaskController,
  snapId: string,
) => {
  const snapKeyring: SnapKeyring = await controller.getSnapKeyring();
  return await snapKeyring.getAccountsBySnapId(snapId);
};

/**
 * Constructs a SnapKeyring builder with specified handlers for managing snap accounts.
 *
 * @param getSnapController - A function that retrieves the Snap Controller instance.
 * @param getApprovalController - A function that retrieves the Approval Controller instance.
 * @param getKeyringController - A function that retrieves the Keyring Controller instance.
 * @param getPreferencesController - A function that retrieves the Preferences Controller instance.
 * @param removeAccountHelper - A function to help remove an account based on its address.
 * @returns The constructed SnapKeyring builder instance with the following methods:
 * - `saveState`: Persists all keyrings in the keyring controller.
 * - `addAccount`: Initiates the process of adding an account with user confirmation and handling the user input.
 * - `removeAccount`: Initiates the process of removing an account with user confirmation and handling the user input.
 */
export const snapKeyringBuilder = (
  getSnapController: () => SnapController,
  getApprovalController: () => ApprovalController,
  getKeyringController: () => KeyringController,
  getPreferencesController: () => PreferencesController,
  removeAccountHelper: (address: string) => Promise<any>,
) => {
  const builder = (() => {
    return new SnapKeyring(getSnapController() as any, {
      addressExists: async (address) => {
        const addresses = await getKeyringController().getAccounts();
        return addresses.includes(address.toLowerCase());
      },
      saveState: async () => {
        await getKeyringController().persistAllKeyrings();
      },
      addAccount: async (
        address: string,
        origin: string,
        handleUserInput: (accepted: boolean) => Promise<void>,
      ) => {
        const { id: addAccountApprovalId } =
          getApprovalController().startFlow();

        const snapAuthorshipHeader: ResultComponent = {
          name: 'SnapAuthorshipHeader',
          key: 'snapHeader',
          properties: { snapId: origin },
        };

        try {
          const confirmationResult: boolean =
            (await getApprovalController().addAndShowApprovalRequest({
              origin,
              type: SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES.confirmAccountCreation,
            })) as boolean;

          if (confirmationResult) {
            try {
              await handleUserInput(confirmationResult);
              await getKeyringController().persistAllKeyrings();
              getPreferencesController().setSelectedAddress(address);
              await getApprovalController().success({
                message: t('snapAccountCreated') ?? 'Your account is ready!',
                header: [snapAuthorshipHeader],
              });
            } catch (error) {
              await getApprovalController().error({
                error: (error as Error).message,
                header: [snapAuthorshipHeader],
              });
              throw new Error(
                `Error occurred while creating snap account: ${
                  (error as Error).message
                }`,
              );
            }
          } else {
            await handleUserInput(confirmationResult);
            throw new Error('User denied account creation');
          }
        } finally {
          getApprovalController().endFlow({
            id: addAccountApprovalId,
          });
        }
      },
      removeAccount: async (
        address: string,
        snapId: string,
        handleUserInput: (accepted: boolean) => Promise<void>,
      ) => {
        const { id: removeAccountApprovalId } =
          getApprovalController().startFlow();

        const snapAuthorshipHeader: ResultComponent = {
          name: 'SnapAuthorshipHeader',
          key: 'snapHeader',
          properties: { snapId },
        };

        try {
          const confirmationResult: boolean =
            (await getApprovalController().addAndShowApprovalRequest({
              origin: snapId,
              type: SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES.confirmAccountRemoval,
              requestData: { publicAddress: address },
            })) as boolean;

          if (confirmationResult) {
            try {
              await removeAccountHelper(address);
              await handleUserInput(confirmationResult);
              await getKeyringController().persistAllKeyrings();
              await getApprovalController().success({
                message: t('snapAccountRemoved') ?? 'Account removed',
                header: [snapAuthorshipHeader],
              });
            } catch (error) {
              await getApprovalController().error({
                error: (error as Error).message,
                header: [snapAuthorshipHeader],
              });
              throw new Error(
                `Error occurred while removing snap account: ${
                  (error as Error).message
                }`,
              );
            }
          } else {
            await handleUserInput(confirmationResult);
            throw new Error('User denied account removal');
          }
        } finally {
          getApprovalController().endFlow({
            id: removeAccountApprovalId,
          });
        }
      },
    });
  }) as any;
  builder.type = SnapKeyring.type;
  return builder;
};
