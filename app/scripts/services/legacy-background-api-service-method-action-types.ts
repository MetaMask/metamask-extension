/**
 * This file is auto generated.
 * Do not edit manually.
 */

import type { LegacyBackgroundApiService } from './legacy-background-api-service';

/**
 * Checks if the assets unify state feature is enabled based on the remote feature flag and build configuration.
 *
 * @returns `true` if the assets unify state feature is enabled, `false` otherwise.
 */
export type LegacyBackgroundApiServiceIsAssetsUnifyStateEnabledAction = {
  type: `LegacyBackgroundApiService:isAssetsUnifyStateEnabled`;
  handler: LegacyBackgroundApiService['isAssetsUnifyStateEnabled'];
};

/**
 * Sets the current currency for the CurrencyRateController and AssetsController (if the assets unify state feature is enabled).
 *
 * @param currencyCode - The currency code to set as the current currency.
 */
export type LegacyBackgroundApiServiceSetCurrentCurrencyAction = {
  type: `LegacyBackgroundApiService:setCurrentCurrency`;
  handler: LegacyBackgroundApiService['setCurrentCurrency'];
};

/**
 * Refreshes and returns the assets for the given accounts via the
 * AssetsController (force-updating from remote sources).
 *
 * No-ops when the assets unify state feature is not enabled, since the
 * AssetsController is not registered in that case.
 *
 * @param accounts - The accounts to fetch assets for.
 * @param options - Options for fetching assets (e.g. `chainIds`, `assetTypes`).
 * @returns The assets for the given accounts, or `undefined` when the feature
 * is not enabled.
 */
export type LegacyBackgroundApiServiceGetAssetsAction = {
  type: `LegacyBackgroundApiService:getAssets`;
  handler: LegacyBackgroundApiService['getAssets'];
};

/**
 * Determines if the given endpoint URL is a public endpoint URL.
 *
 * @param endpointUrl - The endpoint URL to check.
 * @returns `true` if the endpoint URL is a public endpoint URL, `false` otherwise.
 */
export type LegacyBackgroundApiServiceIsPublicEndpointUrlAction = {
  type: `LegacyBackgroundApiService:isPublicEndpointUrl`;
  handler: LegacyBackgroundApiService['isPublicEndpointUrl'];
};

/**
 * Determines whether the sendBundle feature is supported for the given chain.
 *
 * @param chainId - The chain ID to check.
 * @returns `true` if sendBundle is supported for the chain, `false` otherwise.
 */
export type LegacyBackgroundApiServiceIsSendBundleSupportedAction = {
  type: `LegacyBackgroundApiService:isSendBundleSupported`;
  handler: LegacyBackgroundApiService['isSendBundleSupported'];
};

/**
 * Gets the record of request account tab IDs.
 *
 * @returns A record of request account tab IDs.
 */
export type LegacyBackgroundApiServiceGetRequestAccountTabIdsAction = {
  type: `LegacyBackgroundApiService:getRequestAccountTabIds`;
  handler: LegacyBackgroundApiService['getRequestAccountTabIds'];
};

/**
 * Gets the record of open MetaMask tab IDs.
 *
 * @returns A record of open MetaMask tab IDs.
 */
export type LegacyBackgroundApiServiceGetOpenMetamaskTabsIdsAction = {
  type: `LegacyBackgroundApiService:getOpenMetamaskTabsIds`;
  handler: LegacyBackgroundApiService['getOpenMetamaskTabsIds'];
};

/**
 * Updates the phishing lists if necessary and then checks whether the given
 * website is a known phishing site.
 *
 * @param website - The website origin to check.
 * @returns The phishing detection result.
 */
export type LegacyBackgroundApiServiceGetPhishingResultAction = {
  type: `LegacyBackgroundApiService:getPhishingResult`;
  handler: LegacyBackgroundApiService['getPhishingResult'];
};

/**
 * Marks the password as forgotten.
 */
export type LegacyBackgroundApiServiceMarkPasswordForgottenAction = {
  type: `LegacyBackgroundApiService:markPasswordForgotten`;
  handler: LegacyBackgroundApiService['markPasswordForgotten'];
};

/**
 * Un-marks the password as forgotten.
 */
export type LegacyBackgroundApiServiceUnMarkPasswordForgottenAction = {
  type: `LegacyBackgroundApiService:unMarkPasswordForgotten`;
  handler: LegacyBackgroundApiService['unMarkPasswordForgotten'];
};

/**
 * Gets the code of a contract at a given address for a specific network client.
 *
 * @param address - The address of the contract.
 * @param networkClientId - The ID of the network client to use for the request.
 * @returns The code of the contract at the given address.
 */
export type LegacyBackgroundApiServiceGetCodeAction = {
  type: `LegacyBackgroundApiService:getCode`;
  handler: LegacyBackgroundApiService['getCode'];
};

/**
 * Checks whether a delegation has been disabled on-chain by performing an
 * `eth_call` against the delegation manager contract.
 *
 * @param delegationManagerAddress - The delegation manager contract address.
 * @param delegationHash - The hash of the delegation to check.
 * @param networkClientId - The ID of the network client to use for the request.
 * @returns `true` if the delegation is disabled, `false` otherwise.
 */
export type LegacyBackgroundApiServiceCheckDelegationDisabledAction = {
  type: `LegacyBackgroundApiService:checkDelegationDisabled`;
  handler: LegacyBackgroundApiService['checkDelegationDisabled'];
};

/**
 * Estimates the gas for a given transaction using the currently selected
 * network client.
 *
 * @param estimateGasParams - The parameters of the transaction to estimate
 * the gas for.
 * @returns The estimated gas as a hexadecimal string.
 */
export type LegacyBackgroundApiServiceEstimateGasAction = {
  type: `LegacyBackgroundApiService:estimateGas`;
  handler: LegacyBackgroundApiService['estimateGas'];
};

/**
 * Decodes the data of a transaction using the currently selected network
 * client's provider.
 *
 * @param request - The transaction decode request.
 * @param request.transactionData - The transaction data to decode.
 * @param request.contractAddress - The address of the contract the
 * transaction interacts with.
 * @param request.chainId - The chain ID of the network the transaction is on.
 * @returns The decoded transaction data, or `undefined` if it could not be
 * decoded.
 */
export type LegacyBackgroundApiServiceDecodeTransactionDataAction = {
  type: `LegacyBackgroundApiService:decodeTransactionData`;
  handler: LegacyBackgroundApiService['decodeTransactionData'];
};

/**
 * Verifies the validity of the current vault's seed phrase.
 *
 * Validity: seed phrase restores the accounts belonging to the current vault.
 *
 * Called when the first account is created and on unlocking the vault.
 *
 * @param password - The password of the vault.
 * @param keyringId - This is the identifier for the hd keyring.
 * @returns The seed phrase to be confirmed by the user,
 * encoded as an array of UTF-8 bytes.
 */
export type LegacyBackgroundApiServiceGetSeedPhraseAction = {
  type: `LegacyBackgroundApiService:getSeedPhrase`;
  handler: LegacyBackgroundApiService['getSeedPhrase'];
};

/**
 * Clears the transaction history, to allow users to force-reset their nonces.
 * Mostly used in development environments, when networks are restarted with
 * the same network ID.
 *
 * @returns The current selected address.
 */
export type LegacyBackgroundApiServiceResetAccountAction = {
  type: `LegacyBackgroundApiService:resetAccount`;
  handler: LegacyBackgroundApiService['resetAccount'];
};

/**
 * @deprecated Avoid new references to the global network.
 * Will be removed once multi-chain support is fully implemented.
 *
 * @returns The chain ID of the currently selected network.
 */
export type LegacyBackgroundApiServiceGetGlobalChainIdAction = {
  type: `LegacyBackgroundApiService:getGlobalChainId`;
  handler: LegacyBackgroundApiService['getGlobalChainId'];
};

/**
 * Removes an account from state / storage.
 *
 * @param address - The account address, not CAIP-10 formatted.
 */
export type LegacyBackgroundApiServiceRemoveAccountAction = {
  type: `LegacyBackgroundApiService:removeAccount`;
  handler: LegacyBackgroundApiService['removeAccount'];
};

/**
 * Sets the label for the account at the given address.
 *
 * @param address - The address of the account to set the label for.
 * @param label - The label to set for the account.
 */
export type LegacyBackgroundApiServiceSetAccountLabelAction = {
  type: `LegacyBackgroundApiService:setAccountLabel`;
  handler: LegacyBackgroundApiService['setAccountLabel'];
};

/**
 * Execute side effects of a removed account.
 *
 * @param address - The address of the account to remove.
 */
export type LegacyBackgroundApiServiceOnAccountRemovedAction = {
  type: `LegacyBackgroundApiService:onAccountRemoved`;
  handler: LegacyBackgroundApiService['onAccountRemoved'];
};

/**
 * Rejects a pending permissions request.
 *
 * Swallows `PermissionsRequestNotFoundError` so that rejecting an already
 * resolved request does not throw.
 *
 * @param requestId - The ID of the permissions request to reject.
 */
export type LegacyBackgroundApiServiceRejectPermissionsRequestAction = {
  type: `LegacyBackgroundApiService:rejectPermissionsRequest`;
  handler: LegacyBackgroundApiService['rejectPermissionsRequest'];
};

/**
 * Removes the given permissions for the given subjects.
 *
 * @param subjects - The subjects and their permissions to remove.
 */
export type LegacyBackgroundApiServiceRemovePermissionsForAction = {
  type: `LegacyBackgroundApiService:removePermissionsFor`;
  handler: LegacyBackgroundApiService['removePermissionsFor'];
};

export type LegacyBackgroundApiServiceImportAccountWithStrategyAction = {
  type: `LegacyBackgroundApiService:importAccountWithStrategy`;
  handler: LegacyBackgroundApiService['importAccountWithStrategy'];
};

/**
 * Gets the accounts of a given snap ID from the snap keyring.
 *
 * @param snapId - The snap ID to get accounts for.
 * @returns The addresses of the accounts managed by the snap.
 */
export type LegacyBackgroundApiServiceGetAccountsBySnapIdAction = {
  type: `LegacyBackgroundApiService:getAccountsBySnapId`;
  handler: LegacyBackgroundApiService['getAccountsBySnapId'];
};

/**
 * Sets the currently selected internal account.
 *
 * @param id - The ID of the account to set as selected.
 */
export type LegacyBackgroundApiServiceSetSelectedInternalAccountAction = {
  type: `LegacyBackgroundApiService:setSelectedInternalAccount`;
  handler: LegacyBackgroundApiService['setSelectedInternalAccount'];
};

/**
 * Returns the next nonce according to the nonce-tracker
 *
 * @param address - The hex string address for the transaction
 * @param networkClientId - The networkClientId to get the nonce lock with
 * @returns The next nonce.
 */
export type LegacyBackgroundApiServiceGetNextNonceAction = {
  type: `LegacyBackgroundApiService:getNextNonce`;
  handler: LegacyBackgroundApiService['getNextNonce'];
};

/**
 * Changes the password for the wallet.
 *
 * If the flow is social login flow, it will also change the password for the seedless onboarding controller.
 *
 * @param newPassword - The new password.
 * @param oldPassword - The old password.
 */
export type LegacyBackgroundApiServiceChangePasswordAction = {
  type: `LegacyBackgroundApiService:changePassword`;
  handler: LegacyBackgroundApiService['changePassword'];
};

/**
 * Checks if the seedless password is outdated.
 *
 * @param args - The arguments for the checkIsSeedlessPasswordOutdated method.
 * @param args.skipCache - whether to skip the cache @default false
 * @param args.captureSentryError - whether to capture the sentry error. @default false
 * @returns true if the password is outdated, false otherwise, undefined if the flow is not seedless
 */
export type LegacyBackgroundApiServiceCheckIsSeedlessPasswordOutdatedAction = {
  type: `LegacyBackgroundApiService:checkIsSeedlessPasswordOutdated`;
  handler: LegacyBackgroundApiService['checkIsSeedlessPasswordOutdated'];
};

/**
 * Sync latest global seedless password and override the current device password with latest global password.
 * Unlock the vault with the latest global password.
 *
 * @param password - latest global seedless password
 * @returns
 */
export type LegacyBackgroundApiServiceSyncPasswordAndUnlockWalletAction = {
  type: `LegacyBackgroundApiService:syncPasswordAndUnlockWallet`;
  handler: LegacyBackgroundApiService['syncPasswordAndUnlockWallet'];
};

/**
 * Attempts to unlock the vault using either the user's password or encryption
 * key. Also synchronizes the preferencesController, to ensure its schema is
 * up to date with known accounts once the vault is decrypted.
 *
 * @param params - The function parameters.
 * @param params.password - The user's password.
 * @param params.encryptionKey - The user's encryption key.
 */
export type LegacyBackgroundApiServiceSubmitPasswordOrEncryptionKeyAction = {
  type: `LegacyBackgroundApiService:submitPasswordOrEncryptionKey`;
  handler: LegacyBackgroundApiService['submitPasswordOrEncryptionKey'];
};

/**
 * Unlocks the vault with a passkey, then runs the post-unlock account
 * initialization sequence.
 *
 * Delegates the keyring unlock to `PasskeyController:unlockWithPasskey` (which
 * verifies the authentication assertion and submits the decrypted vault key to
 * the KeyringController), then performs the awaited post-unlock account init
 * (accounts / multichain / account-tree) that the controller's keyring-only
 * unlock does not run.
 *
 * @param authenticationResponse - Result of `navigator.credentials.get()`.
 */
export type LegacyBackgroundApiServiceUnlockWithPasskeyAction = {
  type: `LegacyBackgroundApiService:unlockWithPasskey`;
  handler: LegacyBackgroundApiService['unlockWithPasskey'];
};

/**
 * Locks MetaMask
 *
 * @param options - The options for setting the locked state.
 * @param options.skipSeedlessOperationLock - If true, the seedless operation mutex will not be locked.
 */
export type LegacyBackgroundApiServiceSetLockedAction = {
  type: `LegacyBackgroundApiService:setLocked`;
  handler: LegacyBackgroundApiService['setLocked'];
};

/**
 * Syncs the keyring encryption key with the seedless onboarding controller.
 *
 * @returns
 */
export type LegacyBackgroundApiServiceSyncKeyringEncryptionKeyAction = {
  type: `LegacyBackgroundApiService:syncKeyringEncryptionKey`;
  handler: LegacyBackgroundApiService['syncKeyringEncryptionKey'];
};

/**
 * Verifies the password and exports the private key for the given account.
 *
 * @param address - The address of the account to export.
 * @param password - The password of the vault.
 * @returns The private key of the account.
 */
export type LegacyBackgroundApiServiceExportAccountAction = {
  type: `LegacyBackgroundApiService:exportAccount`;
  handler: LegacyBackgroundApiService['exportAccount'];
};

/**
 * Applies the given transaction container types to an existing transaction.
 *
 * @param transactionId - The ID of the transaction to update.
 * @param containerTypes - The container types to apply to the transaction.
 */
export type LegacyBackgroundApiServiceApplyTransactionContainersExistingAction =
  {
    type: `LegacyBackgroundApiService:applyTransactionContainersExisting`;
    handler: LegacyBackgroundApiService['applyTransactionContainersExisting'];
  };

/**
 * Creates or updates the UI metrics fragment for a given transaction.
 *
 * @param transactionId - The id of the transaction.
 * @param payload - The fragment settings and properties to store.
 */
export type LegacyBackgroundApiServiceUpsertTransactionUIMetricsFragmentAction =
  {
    type: `LegacyBackgroundApiService:upsertTransactionUIMetricsFragment`;
    handler: LegacyBackgroundApiService['upsertTransactionUIMetricsFragment'];
  };

/**
 * Rejects a pending approval request.
 *
 * @param id - The ID of the approval request to reject.
 * @param error - The error to reject the approval request with.
 * @param error.code - The error code.
 * @param error.message - The error message.
 * @param error.data - The error data.
 */
export type LegacyBackgroundApiServiceRejectPendingApprovalAction = {
  type: `LegacyBackgroundApiService:rejectPendingApproval`;
  handler: LegacyBackgroundApiService['rejectPendingApproval'];
};

/**
 * Rejects all pending approval requests.
 *
 * Snap dialogs and account confirmations are accepted with a falsy value and
 * their interface deleted where applicable, while all other approvals are
 * rejected with a user-rejected-request error.
 */
export type LegacyBackgroundApiServiceRejectAllPendingApprovalsAction = {
  type: `LegacyBackgroundApiService:rejectAllPendingApprovals`;
  handler: LegacyBackgroundApiService['rejectAllPendingApprovals'];
};

/**
 * Toggles external services on or off.
 *
 * When enabled, token detection and non-RPC gas fee APIs are started, and the
 * shield service is started if the user has an active shield subscription.
 * When disabled, those services are stopped, subscription polling is halted,
 * and the shield service is stopped if applicable.
 *
 * @param useExternal - Whether external services should be enabled.
 */
export type LegacyBackgroundApiServiceToggleExternalServicesAction = {
  type: `LegacyBackgroundApiService:toggleExternalServices`;
  handler: LegacyBackgroundApiService['toggleExternalServices'];
};

/**
 * Accepts a permissions request. Silently ignores the request if it can no
 * longer be found.
 *
 * @param request - The permissions request to accept.
 */
export type LegacyBackgroundApiServiceAcceptPermissionsRequestAction = {
  type: `LegacyBackgroundApiService:acceptPermissionsRequest`;
  handler: LegacyBackgroundApiService['acceptPermissionsRequest'];
};

/**
 * Capture an artificial error in a timeout handler for testing purposes.
 *
 * @param message - The error message.
 * @deprecated This is only meant to facilitate manual and E2E tests testing. We should not
 * use this for handling errors.
 */
export type LegacyBackgroundApiServiceCaptureTestErrorAction = {
  type: `LegacyBackgroundApiService:captureTestError`;
  handler: LegacyBackgroundApiService['captureTestError'];
};

/**
 * Throw an artificial error in a timeout handler for testing purposes.
 *
 * @param message - The error message.
 * @deprecated This is only meant to facilitate manual and E2E testing. We should not
 * use this for handling errors.
 */
export type LegacyBackgroundApiServiceThrowTestErrorAction = {
  type: `LegacyBackgroundApiService:throwTestError`;
  handler: LegacyBackgroundApiService['throwTestError'];
};

/**
 * Determines if the transaction relay supports the given chain.
 *
 * @param chainId - The chain ID to check for relay support.
 * @returns `true` if the transaction relay supports the chain, `false` otherwise.
 */
export type LegacyBackgroundApiServiceIsRelaySupportedAction = {
  type: `LegacyBackgroundApiService:isRelaySupported`;
  handler: LegacyBackgroundApiService['isRelaySupported'];
};

/**
 * Union of all LegacyBackgroundApiService action types.
 */
export type LegacyBackgroundApiServiceMethodActions =
  | LegacyBackgroundApiServiceIsAssetsUnifyStateEnabledAction
  | LegacyBackgroundApiServiceSetCurrentCurrencyAction
  | LegacyBackgroundApiServiceGetAssetsAction
  | LegacyBackgroundApiServiceIsPublicEndpointUrlAction
  | LegacyBackgroundApiServiceIsSendBundleSupportedAction
  | LegacyBackgroundApiServiceGetRequestAccountTabIdsAction
  | LegacyBackgroundApiServiceGetOpenMetamaskTabsIdsAction
  | LegacyBackgroundApiServiceGetPhishingResultAction
  | LegacyBackgroundApiServiceMarkPasswordForgottenAction
  | LegacyBackgroundApiServiceUnMarkPasswordForgottenAction
  | LegacyBackgroundApiServiceGetCodeAction
  | LegacyBackgroundApiServiceCheckDelegationDisabledAction
  | LegacyBackgroundApiServiceEstimateGasAction
  | LegacyBackgroundApiServiceDecodeTransactionDataAction
  | LegacyBackgroundApiServiceGetSeedPhraseAction
  | LegacyBackgroundApiServiceResetAccountAction
  | LegacyBackgroundApiServiceGetGlobalChainIdAction
  | LegacyBackgroundApiServiceRemoveAccountAction
  | LegacyBackgroundApiServiceSetAccountLabelAction
  | LegacyBackgroundApiServiceOnAccountRemovedAction
  | LegacyBackgroundApiServiceRejectPermissionsRequestAction
  | LegacyBackgroundApiServiceRemovePermissionsForAction
  | LegacyBackgroundApiServiceImportAccountWithStrategyAction
  | LegacyBackgroundApiServiceGetAccountsBySnapIdAction
  | LegacyBackgroundApiServiceSetSelectedInternalAccountAction
  | LegacyBackgroundApiServiceGetNextNonceAction
  | LegacyBackgroundApiServiceChangePasswordAction
  | LegacyBackgroundApiServiceCheckIsSeedlessPasswordOutdatedAction
  | LegacyBackgroundApiServiceSyncPasswordAndUnlockWalletAction
  | LegacyBackgroundApiServiceSubmitPasswordOrEncryptionKeyAction
  | LegacyBackgroundApiServiceUnlockWithPasskeyAction
  | LegacyBackgroundApiServiceSetLockedAction
  | LegacyBackgroundApiServiceSyncKeyringEncryptionKeyAction
  | LegacyBackgroundApiServiceExportAccountAction
  | LegacyBackgroundApiServiceApplyTransactionContainersExistingAction
  | LegacyBackgroundApiServiceUpsertTransactionUIMetricsFragmentAction
  | LegacyBackgroundApiServiceRejectPendingApprovalAction
  | LegacyBackgroundApiServiceRejectAllPendingApprovalsAction
  | LegacyBackgroundApiServiceToggleExternalServicesAction
  | LegacyBackgroundApiServiceAcceptPermissionsRequestAction
  | LegacyBackgroundApiServiceCaptureTestErrorAction
  | LegacyBackgroundApiServiceThrowTestErrorAction
  | LegacyBackgroundApiServiceIsRelaySupportedAction;
