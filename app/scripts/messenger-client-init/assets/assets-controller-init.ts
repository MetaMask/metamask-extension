import {
  AssetsController,
  type AssetsControllerMessenger,
} from '@metamask/assets-controller';
import type { InternalAccount } from '@metamask/keyring-internal-api';
import { toEvmCaipChainId } from '@metamask/multichain-network-controller';
import type { TransactionMeta } from '@metamask/transaction-controller';
import { assetsController } from '@metamask/wallet';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import { getAssetsControllerInstanceOptions } from '../../wallet-init/instance-options/assets-controller';
import { type AssetsControllerInitMessenger } from '../messengers/assets/assets-controller-messenger';
import { type MessengerClientInitFunction } from '../types';

const ARC_CAIP_CHAIN_ID = toEvmCaipChainId(CHAIN_IDS.ARC);

/**
 * Forces a full Arc assets refresh after a confirmed transaction.
 *
 * Arc USDC is represented as a native asset in the wallet, but the
 * AccountActivity incremental balance update can miss that native USDC balance
 * after swaps while updating ERC-20 balances such as EURC correctly. A full
 * account asset scan resolves the native USDC balance, matching the manual
 * recovery path of reloading the extension or switching accounts.
 *
 * @param controllerMessenger - The AssetsController messenger.
 * @param assetsControllerInstance - The initialized AssetsController instance.
 */
function subscribeToArcTransactionConfirmedRefresh(
  controllerMessenger: AssetsControllerMessenger,
  assetsControllerInstance: AssetsController,
): void {
  controllerMessenger.subscribe(
    'TransactionController:transactionConfirmed',
    (transactionMeta: TransactionMeta) => {
      if (transactionMeta.chainId?.toLowerCase() !== CHAIN_IDS.ARC) {
        return;
      }

      const fromAddress = transactionMeta.txParams.from?.toLowerCase();
      if (!fromAddress) {
        return;
      }

      // TODO: should be moved to the controller (comment on PR#46259)
      const matchedAccount = controllerMessenger
        .call('AccountTreeController:getAccountsFromSelectedAccountGroup')
        .find(
          (account: InternalAccount) =>
            account.address.toLowerCase() === fromAddress,
        );

      if (!matchedAccount) {
        return;
      }

      assetsControllerInstance
        .getAssets([matchedAccount], {
          chainIds: [ARC_CAIP_CHAIN_ID],
          forceUpdate: true,
          bypassServerCache: true,
        })
        .catch(() => undefined);
    },
  );
}

/**
 * Init function for the AssetsController.
 *
 * The controller is constructed through `@metamask/wallet`'s opt-in
 * `assetsController` configuration, but it stays on the messenger-client init
 * path so it runs after `NetworkEnablementController`.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the controller.
 * @param request.persistedState - The persisted state of the extension.
 * @param request.initMessenger - The init messenger to use for the controller.
 * @param request.getMessengerClient - The function to get a messenger client.
 * @returns The initialized controller.
 */
export const AssetsControllerInit: MessengerClientInitFunction<
  AssetsController,
  AssetsControllerMessenger,
  AssetsControllerInitMessenger
> = ({
  controllerMessenger,
  persistedState,
  initMessenger,
  getMessengerClient,
}) => {
  const messengerClient = assetsController.init({
    messenger: controllerMessenger,
    // Persisted slices are partial; AssetsController merges them with defaults.
    state: persistedState.AssetsController as
      | AssetsController['state']
      | undefined,
    options: getAssetsControllerInstanceOptions({
      controllerMessenger,
      getIsUiOpen: () => getMessengerClient('ClientController').state.isUiOpen,
      initMessenger,
      persistedState,
    }),
  });

  subscribeToArcTransactionConfirmedRefresh(
    controllerMessenger,
    messengerClient,
  );

  return { messengerClient };
};
