import { JsonRpcRequest, PendingJsonRpcResponse } from "@metamask/utils";
import browser from 'webextension-polyfill';
import { HYPERLIQUID_APPROVAL_TYPE } from "../../../../../shared/constants/app";

const HYPERLIQUID_ORIGIN = 'https://app.hyperliquid.xyz';
const METAMASK_REFERRAL_CODE = 'MMREFCSI';

// Handle Hyperliquid referral consent (for new and existing connected users)
export const hyperliquidReferral = async (
  requestUserApproval: (request: unknown) => Promise<unknown>,
  metamaskState: Record<string, unknown>,
  hasApprovalRequestsForOrigin: () => boolean,
  getAccounts: () => string[],
  addReferralApprovedAccount,
  addReferralDeclinedAccount,
  addReferralPassedAccount,
  getFreshPreferencesState,
  req: JsonRpcRequest<Params> & { origin: string; tabId: number },
  res: PendingJsonRpcResponse<string[]>,
) => {
  const { origin, tabId } = req;
  if (
    origin === HYPERLIQUID_ORIGIN &&
    requestUserApproval &&
    metamaskState &&
    hasApprovalRequestsForOrigin
  ) {
    // This is called when the user lands on Hyperliquid
    // And then again when I press Connect
    // And then again when I confirm the Hyperliquid consent
    // It's also called a lot when I go to Hyperliquid with an already connected account
    console.log("Test 6: inside ethAccountsHandler, requesting approval")
    // Only show consent if Hyperliquid is actually connected (has permitted accounts)
    // TODO amelie: why does it show the accounts of the last connected accounts, even when wallet is unconnected?
    const connectedAccounts = getAccounts();
    console.log("Test 7: getAccounts", connectedAccounts)

    if (connectedAccounts.length === 0) {
      res.result = connectedAccounts;
      return;
    }

    // Check if there's already a pending approval request to prevent duplicates
    if (hasApprovalRequestsForOrigin()) {
      // We get here after pressing Connect
      console.log("Test 8: hasApprovalRequestsForOrigin true")
      res.result = connectedAccounts;
      return;
    }

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
    // Don't show consent if user has already approved, declined, or been passed the referral code
    const isInApprovedAccounts =
      referralApprovedAccounts.includes(connectedAccounts[0]);
    const isInPassedAccounts = referralPassedAccounts.includes(connectedAccounts[0]);
    const isInDeclinedAccounts =
      referralDeclinedAccounts.includes(connectedAccounts[0]);

    const shouldShowConsent =
      !isInApprovedAccounts && !isInPassedAccounts && !isInDeclinedAccounts;
      console.log("Test 9: shouldShowConsent", shouldShowConsent)
      console.log("Test 10: isInApprovedAccounts", isInApprovedAccounts )
      console.log("Test 11: isInPassedAccounts", isInPassedAccounts)
      console.log("Test 12: isInDeclinedAccounts", isInDeclinedAccounts)

    if (shouldShowConsent) {
      // Double-check no approval is pending to prevent race conditions
      if (hasApprovalRequestsForOrigin && hasApprovalRequestsForOrigin()) {
        console.log("Test 15: hasApprovalRequestsForOrigin", hasApprovalRequestsForOrigin())
        res.result = connectedAccounts;
        return;
      }

      try {
        const consentResult = await requestUserApproval({
          origin,
          type: HYPERLIQUID_APPROVAL_TYPE, // TODO: add this APPROVAL_TYPE to controller-utils package
          requestData: { selectedAddress: connectedAccounts[0] }, // TODO amelie: where is this used?
        });

        // Store the consent result in preferences
        const result = consentResult as { approved: boolean, allAccounts: boolean };
        console.log("Test 14: result", result)

        if (result?.approved) {
          // Always use individual account approval for better reliability
          // Whether user selected "all accounts" or not, approve the current account
          if (addReferralApprovedAccount && connectedAccounts[0]) {
            console.log("Test 13: adding approved account", connectedAccounts[0])
            await addReferralApprovedAccount(connectedAccounts[0]);

            const { url } = await browser.tabs.get(tabId);
            const { search } = new URL(url || '');
            const newUrl = `${HYPERLIQUID_ORIGIN}/join/${METAMASK_REFERRAL_CODE}${search}`;
            await browser.tabs.update(tabId, { url: newUrl });

            // Mark this account as having received the referral code
            if (addReferralPassedAccount) {
              console.log("Test 17: adding passed account", connectedAccounts[0])
              await addReferralPassedAccount(connectedAccounts[0]);
            }
          }

          // If user selected "all accounts", also approve all other connected accounts
          if (result.allAccounts) {
            console.log("Test 14: availableAccounts", connectedAccounts)

            for (const account of connectedAccounts) {
              if (account !== connectedAccounts[0] && addReferralApprovedAccount) {
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
            await addReferralDeclinedAccount(connectedAccounts[0]);
          }
        }
      } catch (error) {
        // Continue with normal flow - user cancelled
      }
    }
    if (!isInPassedAccounts && !isInDeclinedAccounts && isInApprovedAccounts) {
      // This works when I switch to a different approved account, but it doesn't connect the user first
      console.log("Test 18: adding passed account for existing approved account", connectedAccounts[0])
      const { url } = await browser.tabs.get(tabId);
            const { search } = new URL(url || '');

            console.log("Test 16: search", search, url)
            const newUrl = `https://app.hyperliquid.xyz/join/METAMASK${search}`;
            await browser.tabs.update(tabId, { url: newUrl });

            // Mark this account as having received the referral code
            if (addReferralPassedAccount) {
              console.log("Test 17: adding passed account", connectedAccounts[0])
              await addReferralPassedAccount(connectedAccounts[0]);
            }
    }
  }
}
