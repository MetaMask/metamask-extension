import type {
  JsonRpcEngineEndCallback,
  JsonRpcEngineNextCallback,
} from '@metamask/json-rpc-engine';
import type {
  JsonRpcRequest,
  JsonRpcParams,
  PendingJsonRpcResponse,
} from '@metamask/utils';
import {
  MESSAGE_TYPE,
  HYPERLIQUID_APPROVAL_TYPE,
} from '../../../../../shared/constants/app';
import { HandlerWrapper } from './types';

type EthAccountsHandlerOptions = {
  getAccounts: () => string[];
  requestUserApproval?: (request: unknown) => Promise<unknown>;
  metamaskState?: Record<string, unknown>;
  hasApprovalRequestsForOrigin?: () => boolean;
  addReferralApprovedAccount?: (address: string) => void;
  addReferralPassedAccount?: (address: string) => void;
  addReferralDeclinedAccount?: (address: string) => void;
  setAllAccountsReferralApproved?: (addresses: string[]) => void;
  getFreshPreferencesState?: () => Record<string, unknown>;
};

type EthAccountsConstraint<Params extends JsonRpcParams = JsonRpcParams> = {
  implementation: (
    _req: JsonRpcRequest<Params>,
    res: PendingJsonRpcResponse<string[]>,
    _next: JsonRpcEngineNextCallback,
    end: JsonRpcEngineEndCallback,
    { getAccounts }: EthAccountsHandlerOptions,
  ) => Promise<void>;
} & HandlerWrapper;

/**
 * A wrapper for `eth_accounts` that returns an empty array when permission is denied.
 */
const ethAccounts = {
  methodNames: [MESSAGE_TYPE.ETH_ACCOUNTS],
  implementation: ethAccountsHandler,
  hookNames: {
    getAccounts: true,
    requestUserApproval: true,
    metamaskState: true,
    hasApprovalRequestsForOrigin: true,
    addReferralApprovedAccount: true,
    addReferralPassedAccount: true,
    addReferralDeclinedAccount: true,
    setAllAccountsReferralApproved: true,
    getFreshPreferencesState: true,
  },
} satisfies EthAccountsConstraint;
export default ethAccounts;

/**
 *
 * @param _req - The JSON-RPC request object.
 * @param res - The JSON-RPC response object.
 * @param _next - The json-rpc-engine 'next' callback.
 * @param end - The json-rpc-engine 'end' callback.
 * @param req - The JSON-RPC request object.
 * @param res - The JSON-RPC response object.
 * @param _next - The json-rpc-engine 'next' callback.
 * @param end - The json-rpc-engine 'end' callback.
 * @param options - The RPC method hooks.
 * @param options.getAccounts - A hook that returns the permitted eth accounts for the origin sorted by lastSelected.
 * @param options.requestUserApproval - A hook that requests user approval for various operations.
 * @param options.metamaskState - The MetaMask app state.
 * @param req.getAccounts
 * @param req.requestUserApproval
 * @param req.metamaskState
 * @param req.hasApprovalRequestsForOrigin
 * @param req.addReferralApprovedAccount
 * @param req.addReferralPassedAccount
 * @param req.addReferralDeclinedAccount
 * @param req.setAllAccountsReferralApproved
 * @param req.getAccounts
 * @param req.requestUserApproval
 * @param req.metamaskState
 * @param req.hasApprovalRequestsForOrigin
 * @param req.addReferralApprovedAccount
 * @param req.addReferralPassedAccount
 * @param req.addReferralDeclinedAccount
 * @param req.setAllAccountsReferralApproved
 * @param req.getAccounts
 * @param req.requestUserApproval
 * @param req.metamaskState
 * @param req.hasApprovalRequestsForOrigin
 * @param req.addReferralApprovedAccount
 * @param req.addReferralPassedAccount
 * @param req.addReferralDeclinedAccount
 * @param req.setAllAccountsReferralApproved
 * @param req.getAccounts
 * @param req.requestUserApproval
 * @param req.metamaskState
 * @param req.hasApprovalRequestsForOrigin
 * @param req.addReferralApprovedAccount
 * @param req.addReferralPassedAccount
 * @param req.addReferralDeclinedAccount
 * @param req.setAllAccountsReferralApproved
 * @param req.getAccounts
 * @param req.requestUserApproval
 * @param req.metamaskState
 * @param req.hasApprovalRequestsForOrigin
 * @param req.addReferralApprovedAccount
 * @param req.addReferralPassedAccount
 * @param req.addReferralDeclinedAccount
 * @param req.setAllAccountsReferralApproved
 * @param req.getAccounts
 * @param req.requestUserApproval
 * @param req.metamaskState
 * @param req.hasApprovalRequestsForOrigin
 * @param req.addReferralApprovedAccount
 * @param req.addReferralPassedAccount
 * @param req.addReferralDeclinedAccount
 * @param req.setAllAccountsReferralApproved
 * @param req.getAccounts
 * @param req.requestUserApproval
 * @param req.metamaskState
 * @param req.hasApprovalRequestsForOrigin
 * @param req.addReferralApprovedAccount
 * @param req.addReferralPassedAccount
 * @param req.addReferralDeclinedAccount
 * @param req.setAllAccountsReferralApproved
 * @param req.getAccounts
 * @param req.requestUserApproval
 * @param req.metamaskState
 * @param req.hasApprovalRequestsForOrigin
 * @param req.addReferralApprovedAccount
 * @param req.addReferralPassedAccount
 * @param req.addReferralDeclinedAccount
 * @param req.setAllAccountsReferralApproved
 */
async function ethAccountsHandler<Params extends JsonRpcParams = JsonRpcParams>(
  req: JsonRpcRequest<Params>,
  res: PendingJsonRpcResponse<string[]>,
  _next: JsonRpcEngineNextCallback,
  end: JsonRpcEngineEndCallback,
  {
    getAccounts,
    requestUserApproval,
    metamaskState,
    hasApprovalRequestsForOrigin,
    addReferralApprovedAccount,
    addReferralDeclinedAccount,
    getFreshPreferencesState,
  }: EthAccountsHandlerOptions,
): Promise<void> {
  const { origin } = req as JsonRpcRequest<Params> & { origin: string };

  // Handle Hyperliquid referral consent (for existing connected users)
  if (
    origin === 'https://app.hyperliquid.xyz' &&
    requestUserApproval &&
    metamaskState &&
    hasApprovalRequestsForOrigin
  ) {
    // Only show consent if Hyperliquid is actually connected (has permitted accounts)
    const permittedAccounts = getAccounts();

    if (permittedAccounts.length === 0) {
      res.result = getAccounts();
      return end();
    }

    // Check if there's already a pending approval request to prevent duplicates
    if (hasApprovalRequestsForOrigin()) {
      res.result = getAccounts();
      return end();
    }

    const { selectedAddress } = metamaskState as any;

    // Get FRESH preferences state instead of stale metamaskState
    const freshPreferencesState = getFreshPreferencesState
      ? getFreshPreferencesState()
      : {};

    const {
      referralApprovedAccounts = [],
      referralPassedAccounts = [],
      referralDeclinedAccounts = [],
    } = freshPreferencesState as any;

    // Check if we should show consent based on scenarios
    // Don't show if user has already approved, declined, or been passed the referral code
    const isInApprovedAccounts =
      referralApprovedAccounts.includes(selectedAddress);
    const isInPassedAccounts = referralPassedAccounts.includes(selectedAddress);
    const isInDeclinedAccounts =
      referralDeclinedAccounts.includes(selectedAddress);

    const shouldShowConsent =
      !isInApprovedAccounts && !isInPassedAccounts && !isInDeclinedAccounts;

    if (shouldShowConsent) {
      // Double-check no approval is pending to prevent race conditions
      if (hasApprovalRequestsForOrigin && hasApprovalRequestsForOrigin()) {
        res.result = getAccounts();
        return end();
      }

      try {
        const consentResult = await requestUserApproval({
          origin,
          type: HYPERLIQUID_APPROVAL_TYPE,
          requestData: { selectedAddress },
        });

        // Store the consent result in preferences
        const result = consentResult as any;

        if (result?.approved) {
          // Always use individual account approval for better reliability
          // Whether user selected "all accounts" or not, approve the current account
          if (addReferralApprovedAccount && selectedAddress) {
            await addReferralApprovedAccount(selectedAddress);
          }

          // If user selected "all accounts", also approve all other connected accounts
          if (result.allAccounts) {
            const availableAccounts = getAccounts();

            for (const account of availableAccounts) {
              if (account !== selectedAddress && addReferralApprovedAccount) {
                await addReferralApprovedAccount(account);
              }
            }
          }

          // Force a small delay to ensure state is persisted before continuing
          await new Promise((resolve) => setTimeout(resolve, 100));

          // Don't mark as "passed" yet - let URL interceptor do that when it adds the code
        } else {
          // Store declined state for current account
          if (addReferralDeclinedAccount) {
            await addReferralDeclinedAccount(selectedAddress);
          }
        }
      } catch (error) {
        // Continue with normal flow - user cancelled
      }
    }
  }

  res.result = getAccounts();
  return end();
}
