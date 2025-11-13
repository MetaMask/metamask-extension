import {
  GatorPermissionsController,
  GatorPermissionsControllerState,
} from '@metamask/gator-permissions-controller';
import { assertIsValidSnapId } from '@metamask/snaps-utils';
import { TransactionMeta } from '@metamask/transaction-controller';
import { Hex } from '@metamask/utils';
import { ControllerInitFunction } from '../types';
import { isGatorPermissionsFeatureEnabled } from '../../../../shared/modules/environment';
import { GatorPermissionsControllerMessenger } from '../messengers/gator-permissions';

const generateDefaultGatorPermissionsControllerState =
  (): Partial<GatorPermissionsControllerState> => {
    const gatorPermissionsProviderSnapId =
      process.env.GATOR_PERMISSIONS_PROVIDER_SNAP_ID;

    // if GATOR_PERMISSIONS_PROVIDER_SNAP_ID is not specified, GatorPermissionsController will initialize it's default
    if (gatorPermissionsProviderSnapId !== undefined) {
      try {
        assertIsValidSnapId(gatorPermissionsProviderSnapId);
      } catch (error) {
        throw new Error(
          'GATOR_PERMISSIONS_PROVIDER_SNAP_ID must be set to a valid snap id',
          {
            cause: error,
          },
        );
      }
    }

    const isGatorPermissionsEnabled = isGatorPermissionsFeatureEnabled();

    const state: Partial<GatorPermissionsControllerState> = {
      isGatorPermissionsEnabled,
    };

    if (gatorPermissionsProviderSnapId) {
      state.gatorPermissionsProviderSnapId = gatorPermissionsProviderSnapId;
    }

    return state;
  };

export const GatorPermissionsControllerInit: ControllerInitFunction<
  GatorPermissionsController,
  GatorPermissionsControllerMessenger
> = ({ controllerMessenger, persistedState }) => {
  // Closure-scoped map to track pending revocation transactions that haven't been approved yet
  const pendingRevocationTransactions = new Map<string, Hex>();

  const controller = new GatorPermissionsController({
    // Type mismatch due to different BaseController versions, GatorPermissionsController uses 8.3.0 while extension uses 8.2.0.
    // We can remove once extension BaseController version is updated to 8.3.0.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    messenger: controllerMessenger as any,
    state: {
      ...generateDefaultGatorPermissionsControllerState(),
      ...persistedState.GatorPermissionsController,
    },
  });

  /**
   * Handles transaction approval by adding the pending revocation to state.
   * This ensures we only track revocations that the user has actually confirmed.
   * This event fires when the user clicks "confirm" in the transaction window.
   */
  const handleTransactionApproved = ({ transactionMeta }: { transactionMeta: TransactionMeta }) => {
    const permissionContext = pendingRevocationTransactions.get(transactionMeta.id);

    if (permissionContext) {
      // User confirmed the transaction, now add it to pending revocations
      controller.addPendingRevocation({
        txId: transactionMeta.id,
        permissionContext,
      }).catch((error: Error) => {
        console.error('Error adding pending revocation after approval:', error);
      });

      // Remove from tracking map once added to state
      pendingRevocationTransactions.delete(transactionMeta.id);
    }
  };

  /**
   * Handles transaction rejection by cleaning up the pending revocation map.
   * This event fires when the user clicks "cancel" in the transaction window.
   */
  const handleTransactionRejected = ({ transactionMeta }: { transactionMeta: TransactionMeta }) => {
    // User cancelled the transaction, remove from tracking map
    pendingRevocationTransactions.delete(transactionMeta.id);
  };

  // Subscribe to transaction approved event to add pending revocations
  // only when users click "confirm" in the transaction window.
  controllerMessenger.subscribe(
    'TransactionController:transactionApproved',
    handleTransactionApproved,
  );

  // Subscribe to transaction rejected event to cleanup the map
  // when users click "cancel" in the transaction window.
  controllerMessenger.subscribe(
    'TransactionController:transactionRejected',
    handleTransactionRejected,
  );

  return {
    controller,
    api: {
      fetchAndUpdateGatorPermissions:
        controller.fetchAndUpdateGatorPermissions.bind(controller),
      addPendingRevocation: ({
        txId,
        permissionContext,
      }: {
        txId: string;
        permissionContext: Hex;
      }) => {
        // Stage the revocation. Do not add to state until the transaction is approved by user.
        pendingRevocationTransactions.set(txId, permissionContext);
      },
      submitRevocation: controller.submitRevocation.bind(controller),
    },
  };
};
