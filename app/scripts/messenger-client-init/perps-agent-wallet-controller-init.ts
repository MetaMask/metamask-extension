import { PERPS_AGENT_SETUP_ERROR_CODES } from '../../../shared/constants/perps';
import {
  AgentSetupRejectionError,
  AgentSetupSubmissionError,
} from '../controllers/perps/agent-wallet/agent-setup-flow';
import { PerpsAgentWalletController } from '../controllers/perps/agent-wallet/perps-agent-wallet-controller';
import type { PerpsAgentWalletControllerMessenger } from '../controllers/perps/agent-wallet/types';
import type { MessengerClientInitFunction } from './types';

/**
 * Background API parameters for `perpsSetupAgentWallet`.
 */
type PerpsSetupAgentWalletParams = {
  masterAccountAddress: string;
  isTestnet: boolean;
  password: string;
};

/**
 * Prefix typed setup-flow errors with stable codes before they cross the
 * extension RPC boundary. Only an error's `message` survives serialization,
 * so the UI classifies failures by these codes (shared/constants/perps.ts)
 * instead of brittle underlying strings.
 *
 * @param error - The error thrown by the controller's setup flow.
 * @returns An error carrying the stable code prefix.
 */
function normalizeAgentSetupError(error: unknown): Error {
  if (error instanceof AgentSetupRejectionError) {
    return new Error(
      `${PERPS_AGENT_SETUP_ERROR_CODES.REJECTED}: ${error.message}`,
    );
  }
  if (error instanceof AgentSetupSubmissionError) {
    return new Error(
      `${PERPS_AGENT_SETUP_ERROR_CODES.SUBMISSION_FAILED}: ${error.message}`,
    );
  }
  return error instanceof Error ? error : new Error(String(error));
}

/**
 * Initialize the Perps Agent Wallet controller.
 *
 * @param request - The request object.
 * @param request.controllerMessenger - The messenger to use for the
 * controller.
 * @param request.persistedState - The persisted state of the extension.
 * @returns The initialized controller and its background API.
 */
export const PerpsAgentWalletControllerInit: MessengerClientInitFunction<
  PerpsAgentWalletController,
  PerpsAgentWalletControllerMessenger
> = ({ controllerMessenger, persistedState }) => {
  const messengerClient = new PerpsAgentWalletController({
    messenger: controllerMessenger,
    state: persistedState.PerpsAgentWalletController,
  });

  const api = {
    /**
     * Runs the full agent setup flow (verify password → generate agent
     * keypair → master signs approveAgent → exchange submission → activate).
     * Typed flow errors are prefixed with PERPS_AGENT_SETUP_ERROR_CODES.
     * @param params
     */
    perpsSetupAgentWallet: async (params: PerpsSetupAgentWalletParams) => {
      try {
        return await messengerClient.setupAgentWallet(params);
      } catch (error) {
        throw normalizeAgentSetupError(error);
      }
    },

    /**
     * True only while the session was password-unlocked (ruling R1). When
     * false — e.g. unlocked via encryption key (passkey/social login) — the
     * UI hides the agent setup CTA and perps falls back to master signing.
     */
    perpsCanSetupAgentWallet: (): boolean =>
      messengerClient.canSetupAgentWallet(),

    /**
     * Runs the perps trading-readiness steps (unified account enablement,
     * builder fee approval) for the active provider and the selected
     * account. No params: the readiness is network/account scoped inside the
     * PerpsController. Any required master signature surfaces here — this is
     * also invoked best-effort by the setup flow right after agent
     * activation so hardware wallet users sign everything in one session.
     */
    perpsPrepareTradingWallet: async (): Promise<void> => {
      await controllerMessenger.call('PerpsController:prepareTradingWallet');
    },
  };

  return {
    messengerClient,
    api,
  };
};
