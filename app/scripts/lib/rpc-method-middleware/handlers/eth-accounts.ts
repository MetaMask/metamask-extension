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
    setAllAccountsReferralApproved,
    getFreshPreferencesState,
  }: EthAccountsHandlerOptions,
): Promise<void> {
  const { origin } = req as JsonRpcRequest<Params> & { origin: string };
  console.log('eth_accounts called with origin:', origin);

  console.log('🌍 ORIGIN CHECK:', origin);
  console.log('🎯 Is Hyperliquid?', origin === 'https://app.hyperliquid.xyz');
  console.log('🔧 Has requestUserApproval?', !!requestUserApproval);
  console.log('🔧 Has metamaskState?', !!metamaskState);
  console.log('🔧 Has hasApprovalRequestsForOrigin?', !!hasApprovalRequestsForOrigin);

  // Handle Hyperliquid referral consent (for existing connected users)
  if (
    origin === 'https://app.hyperliquid.xyz' &&
    requestUserApproval &&
    metamaskState &&
    hasApprovalRequestsForOrigin
  ) {
    console.log('✅ ENTERED HYPERLIQUID CONSENT BLOCK');

    // Only show consent if Hyperliquid is actually connected (has permitted accounts)
    const permittedAccounts = getAccounts();
    console.log('👥 Permitted accounts:', permittedAccounts);
    console.log('👥 Permitted accounts length:', permittedAccounts.length);

    if (permittedAccounts.length === 0) {
      console.log('❌ EARLY EXIT: Hyperliquid not connected, skipping consent dialog');
      res.result = getAccounts();
      return end();
    }

    console.log('✅ HYPERLIQUID IS CONNECTED, CONTINUING...');

    // Check if there's already a pending approval request to prevent duplicates
    if (hasApprovalRequestsForOrigin()) {
      console.log('Approval request already pending, skipping duplicate');
      res.result = getAccounts();
      return end();
    }

        const { selectedAddress } = metamaskState as any;

    // Get FRESH preferences state instead of stale metamaskState
    const freshPreferencesState = getFreshPreferencesState ? getFreshPreferencesState() : {};
    console.log('🔄 Using fresh preferences state instead of stale metamaskState');

    const {
      referralApprovedAccounts = [],
      referralPassedAccounts = [],
      referralDeclinedAccounts = [],
    } = freshPreferencesState as any;

    console.log('🔍 Fresh referral arrays:', {
      referralApprovedAccounts,
      referralPassedAccounts,
      referralDeclinedAccounts
    });

    // Detailed debugging for why modal isn't showing
    console.log('🔍 DETAILED DEBUG:');
    console.log('  selectedAddress:', selectedAddress);
    console.log('  referralApprovedAccounts:', JSON.stringify(referralApprovedAccounts));
    console.log('  referralPassedAccounts:', JSON.stringify(referralPassedAccounts));
    console.log('  referralDeclinedAccounts:', JSON.stringify(referralDeclinedAccounts));

        // Check if we should show consent based on scenarios
    // Don't show if user has already approved, declined, or been passed the referral code
        const isInApprovedAccounts = referralApprovedAccounts.includes(selectedAddress);
    const isInPassedAccounts = referralPassedAccounts.includes(selectedAddress);
    const isInDeclinedAccounts = referralDeclinedAccounts.includes(selectedAddress);

    console.log('🔍 BOOLEAN CHECKS:');
    console.log('  isInApprovedAccounts:', isInApprovedAccounts);
    console.log('  isInPassedAccounts:', isInPassedAccounts);
    console.log('  isInDeclinedAccounts:', isInDeclinedAccounts);

    const shouldShowConsent = !isInApprovedAccounts &&
                             !isInPassedAccounts &&
                             !isInDeclinedAccounts;

    console.log('🔍 FINAL RESULT: shouldShowConsent =', shouldShowConsent);

    console.log(
      'Should show consent:',
      shouldShowConsent,
      'for address:',
      selectedAddress,
    );
    console.log('Consent state:', {
      approved: isInApprovedAccounts,
      passed: isInPassedAccounts,
      declined: isInDeclinedAccounts,
      referralApprovedAccounts,
      referralPassedAccounts,
      referralDeclinedAccounts,
    });

    // Debug: Show the actual fresh preference state object
    console.log('🔍 Fresh PreferencesController state:', freshPreferencesState);

    if (shouldShowConsent) {
      // Double-check no approval is pending to prevent race conditions
      if (hasApprovalRequestsForOrigin && hasApprovalRequestsForOrigin()) {
        console.log('⚠️ Another approval pending, skipping consent request');
        res.result = getAccounts();
        return end();
      }

      try {
        console.log('Requesting Hyperliquid referral consent...');

        const consentResult = await requestUserApproval({
          origin,
          type: HYPERLIQUID_APPROVAL_TYPE,
          requestData: { selectedAddress },
        });

        console.log('Hyperliquid consent result:', consentResult);

        // Store the consent result in preferences
        const result = consentResult as any;
        console.log('🔍 Processing consent result:', result);
                console.log('🔍 Available hooks:', {
          addReferralApprovedAccount: !!addReferralApprovedAccount,
          addReferralDeclinedAccount: !!addReferralDeclinedAccount,
          setAllAccountsReferralApproved: !!setAllAccountsReferralApproved
        });

        if (result?.approved) {
          console.log('✅ User approved referral consent');

                                        // Always use individual account approval for better reliability
          // Whether user selected "all accounts" or not, approve the current account
          if (addReferralApprovedAccount && selectedAddress) {
            console.log('📞 Calling addReferralApprovedAccount with:', selectedAddress);
            await addReferralApprovedAccount(selectedAddress);
            console.log('✅ addReferralApprovedAccount completed for:', selectedAddress);
          }

          // If user selected "all accounts", also approve all other connected accounts
          if (result.allAccounts) {
            const availableAccounts = getAccounts();
            console.log('📞 User selected all accounts, approving:', availableAccounts);

            for (const account of availableAccounts) {
              if (account !== selectedAddress && addReferralApprovedAccount) {
                await addReferralApprovedAccount(account);
                console.log('✅ addReferralApprovedAccount completed for additional account:', account);
              }
            }
          }

          // Force a small delay to ensure state is persisted before continuing
          await new Promise(resolve => setTimeout(resolve, 100));
          console.log('⏰ Waited for state persistence');

          // Don't mark as "passed" yet - let URL interceptor do that when it adds the code
        } else {
          console.log('❌ User declined referral consent');

          // Store declined state for current account
          if (addReferralDeclinedAccount) {
            console.log('📞 Calling addReferralDeclinedAccount with:', selectedAddress);
            await addReferralDeclinedAccount(selectedAddress);
            console.log('💾 Declined referral for account:', selectedAddress);
          }
        }
      } catch (error) {
        console.log('User cancelled consent dialog:', error);
        // Continue with normal flow - user cancelled
      }
    }
  }

  res.result = getAccounts();
  return end();
}
