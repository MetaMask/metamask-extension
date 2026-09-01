import { PerpsAgentWalletController } from '../controllers/perps/agent-wallet/perps-agent-wallet-controller';
import type { PerpsAgentWalletControllerMessenger } from '../controllers/perps/agent-wallet/types';
import type { MessengerClientInitFunction } from './types';

/**
 * Initialize the Perps Agent Wallet controller.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the
 * controller.
 * @param request.persistedState - The persisted state of the extension.
 * @returns The initialized controller.
 */
export const PerpsAgentWalletControllerInit: MessengerClientInitFunction<
  PerpsAgentWalletController,
  PerpsAgentWalletControllerMessenger
> = ({ controllerMessenger, persistedState }) => {
  const messengerClient = new PerpsAgentWalletController({
    messenger: controllerMessenger,
    state: persistedState.PerpsAgentWalletController,
  });

  return {
    messengerClient,
  };
};
