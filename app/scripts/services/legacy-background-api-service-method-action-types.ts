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
 * Triggers a safe reload of the extension without disrupting user state.
 */
export type LegacyBackgroundApiServiceRequestSafeReloadAction = {
  type: `LegacyBackgroundApiService:requestSafeReload`;
  handler: LegacyBackgroundApiService['requestSafeReload'];
};

/**
 * Opens the "Updating" page in a new tab and then triggers a safe extension
 * reload. Used when an update is available.
 */
export type LegacyBackgroundApiServiceOpenUpdateTabAndReloadAction = {
  type: `LegacyBackgroundApiService:openUpdateTabAndReload`;
  handler: LegacyBackgroundApiService['openUpdateTabAndReload'];
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
 * Marks the notification popup as having been automatically closed.
 *
 * This lets us differentiate between the cases where we close the
 * notification popup v.s. when the user closes the popup window directly.
 */
export type LegacyBackgroundApiServiceMarkNotificationPopupAsAutomaticallyClosedAction =
  {
    type: `LegacyBackgroundApiService:markNotificationPopupAsAutomaticallyClosed`;
    handler: LegacyBackgroundApiService['markNotificationPopupAsAutomaticallyClosed'];
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
 * Adds a transaction to the TransactionController (or a user operation for
 * smart accounts) after running security validation, without waiting for the
 * transaction to be published.
 *
 * @param transactionParams - The parameters of the transaction to add.
 * @param transactionOptions - Options for adding the transaction.
 * @returns The transaction metadata.
 */
export type LegacyBackgroundApiServiceAddTransactionAction = {
  type: `LegacyBackgroundApiService:addTransaction`;
  handler: LegacyBackgroundApiService['addTransaction'];
};

/**
 * Adds a transaction to the TransactionController (or a user operation for
 * smart accounts) after running security validation, waiting for the
 * transaction to be published and returning the final transaction metadata.
 *
 * @param transactionParams - The parameters of the transaction to add.
 * @param transactionOptions - Options for adding the transaction.
 * @returns The final transaction metadata.
 */
export type LegacyBackgroundApiServiceAddTransactionAndWaitForPublishAction = {
  type: `LegacyBackgroundApiService:addTransactionAndWaitForPublish`;
  handler: LegacyBackgroundApiService['addTransactionAndWaitForPublish'];
};

/**
 * Adds a network and (optionally) sets it as the active network.
 *
 * @param networkConfiguration - The network configuration to add.
 * @param options - Options for post-add behavior.
 * @param options.setActive - Whether to switch to the added network.
 * @returns The added network configuration.
 */
export type LegacyBackgroundApiServiceAddNetworkAction = {
  type: `LegacyBackgroundApiService:addNetwork`;
  handler: LegacyBackgroundApiService['addNetwork'];
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
 * Gathers metadata (primarily connectivity status) about the globally selected
 * network as well as each enabled network and persists it to state.
 */
export type LegacyBackgroundApiServiceLookupSelectedNetworksAction = {
  type: `LegacyBackgroundApiService:lookupSelectedNetworks`;
  handler: LegacyBackgroundApiService['lookupSelectedNetworks'];
};

/**
 * Enables the given network, then refreshes connectivity metadata for
 * the selected and enabled networks.
 *
 * @param chainId - The chain ID of the network to enable.
 */
export type LegacyBackgroundApiServiceSetEnabledNetworksAction = {
  type: `LegacyBackgroundApiService:setEnabledNetworks`;
  handler: LegacyBackgroundApiService['setEnabledNetworks'];
};

/**
 * Enables all popular networks, then refreshes connectivity metadata for
 * the selected and enabled networks.
 */
export type LegacyBackgroundApiServiceSetEnabledAllPopularNetworksAction = {
  type: `LegacyBackgroundApiService:setEnabledAllPopularNetworks`;
  handler: LegacyBackgroundApiService['setEnabledAllPopularNetworks'];
};

/**
 * Resets the wallet to a clean state, clearing sensitive controller state and
 * signing the user out.
 *
 * @param restoreOnly - When `true`, onboarding state is preserved (used by the
 * restore-vault flow); when `false`, onboarding is also reset and the wallet
 * reset progress flag is set.
 */
export type LegacyBackgroundApiServiceResetWalletAction = {
  type: `LegacyBackgroundApiService:resetWallet`;
  handler: LegacyBackgroundApiService['resetWallet'];
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
 * Gets the standard and details for a token on the globally selected network.
 *
 * Resolves the token metadata from the static token list, the dynamic token
 * list and the user's tokens, falling back to an on-chain lookup via the
 * `AssetsContractController` when the token cannot be treated as an ERC20.
 *
 * @param address - The token contract address.
 * @param userAddress - The user account address.
 * @param tokenId - The token ID (for ERC721/ERC1155).
 * @returns The token standard and details.
 */
export type LegacyBackgroundApiServiceGetTokenStandardAndDetailsAction = {
  type: `LegacyBackgroundApiService:getTokenStandardAndDetails`;
  handler: LegacyBackgroundApiService['getTokenStandardAndDetails'];
};

/**
 * Gets the standard and details for a token on a specific chain.
 *
 * Resolves the token metadata from the static token list, the dynamic token
 * list and the user's tokens, falling back to an on-chain lookup via the
 * `AssetsContractController` when the token cannot be treated as an ERC20.
 *
 * @param address - The token contract address.
 * @param userAddress - The user account address.
 * @param tokenId - The token ID (for ERC721/ERC1155).
 * @param chainId - The chain ID to resolve the token on.
 * @returns The token standard and details.
 */
export type LegacyBackgroundApiServiceGetTokenStandardAndDetailsByChainAction =
  {
    type: `LegacyBackgroundApiService:getTokenStandardAndDetailsByChain`;
    handler: LegacyBackgroundApiService['getTokenStandardAndDetailsByChain'];
  };

/**
 * Gets the symbol of a token via an on-chain lookup through the
 * `AssetsContractController`.
 *
 * @param address - The token contract address.
 * @returns The token symbol, or `null` if it could not be resolved.
 */
export type LegacyBackgroundApiServiceGetTokenSymbolAction = {
  type: `LegacyBackgroundApiService:getTokenSymbol`;
  handler: LegacyBackgroundApiService['getTokenSymbol'];
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
 * Changes the wallet password using a verified passkey assertion.
 *
 * Delegates the actual password change and vault-key renewal to
 * `PasskeyController:changePasswordWithPasskeyVerification`, but wraps the call
 * in the shared `seedlessOperationMutex` so it stays serialized against the
 * other keyring/seedless operations (password change, SRP backups, keyring
 * encryption key sync) that mutate the same keyring encryption key and vault.
 * The PasskeyController has its own internal mutex, which only serializes
 * passkey operations against each other, so the extension-level lock is still
 * required to avoid interleaving with those flows.
 *
 * @param params - Passkey password-change parameters.
 * @param params.newPassword - The new wallet password.
 * @param params.authenticationResponse - Result of `navigator.credentials.get()`.
 * @param params.options - Optional flow controls.
 * @param params.options.renewVaultKeyProtection - Re-wrap the vault key after the password change.
 */
export type LegacyBackgroundApiServiceChangePasswordWithPasskeyVerificationAction =
  {
    type: `LegacyBackgroundApiService:changePasswordWithPasskeyVerification`;
    handler: LegacyBackgroundApiService['changePasswordWithPasskeyVerification'];
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
 * @param incrementToggleCount - Whether to increment the toggle interaction metric.
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
 * Resolve a pending approval. For hardware wallet transactions and signatures,
 * this handles error parsing.
 *
 * @param id - The approval ID.
 * @param value - The value to resolve with (for transactions, contains txMeta).
 * @param options - Options for the approval.
 * @param options.walletType - The hardware wallet type (if hardware wallet).
 * @param options.waitForResult - Whether to wait for the result.
 */
export type LegacyBackgroundApiServiceResolvePendingApprovalAction = {
  type: `LegacyBackgroundApiService:resolvePendingApproval`;
  handler: LegacyBackgroundApiService['resolvePendingApproval'];
};

/**
 * Approve a hardware wallet transaction with retry support.
 * This is a convenience wrapper around resolvePendingApproval for the
 * transaction confirmation flow, which passes txMeta in a specific format.
 *
 * @param opts - Options for the transaction.
 * @param opts.txId - The transaction ID to approve.
 * @param opts.txMeta - The transaction metadata.
 * @param opts.actionId - The action ID for tracking.
 * @param opts.walletType - The hardware wallet type (e.g., 'Ledger', 'Trezor').
 * @throws When hardware wallet error occurs (with recreatedTxId if recreation succeeded).
 */
export type LegacyBackgroundApiServiceApproveHardwareWalletTransactionAction = {
  type: `LegacyBackgroundApiService:approveHardwareWalletTransaction`;
  handler: LegacyBackgroundApiService['approveHardwareWalletTransaction'];
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
 * Attempts to create the Ledger transport app.
 *
 * @returns Whether the app was created successfully.
 */
export type LegacyBackgroundApiServiceAttemptLedgerTransportCreationAction = {
  type: `LegacyBackgroundApiService:attemptLedgerTransportCreation`;
  handler: LegacyBackgroundApiService['attemptLedgerTransportCreation'];
};

/**
 * Gets the app name and version from the Ledger device.
 *
 * @returns The app name and version.
 */
export type LegacyBackgroundApiServiceGetAppNameAndVersionAction = {
  type: `LegacyBackgroundApiService:getAppNameAndVersion`;
  handler: LegacyBackgroundApiService['getAppNameAndVersion'];
};

/**
 * Gets the app configuration from the Ledger device.
 *
 * @returns The app configuration.
 */
export type LegacyBackgroundApiServiceGetLedgerAppConfigurationAction = {
  type: `LegacyBackgroundApiService:getLedgerAppConfiguration`;
  handler: LegacyBackgroundApiService['getLedgerAppConfiguration'];
};

/**
 * Get the active Ledger handler mode based on the remote feature flag.
 *
 * Reads from `RemoteFeatureFlagController` state and merges with manifest
 * overrides so `.manifest-overrides.json` can flip the flag for dev/E2E
 * builds without touching LaunchDarkly.
 *
 * @returns The Ledger handler mode.
 */
export type LegacyBackgroundApiServiceGetLedgerModeAction = {
  type: `LegacyBackgroundApiService:getLedgerMode`;
  handler: LegacyBackgroundApiService['getLedgerMode'];
};

/**
 * Fetch account list from a hardware device.
 *
 * @param deviceName - The device name to connect.
 * @param page - The page of accounts to fetch (-1 for previous, 1 for next,
 * otherwise the first page).
 * @param hdPath - An optional hd path to set on the device keyring.
 * @returns The accounts.
 */
export type LegacyBackgroundApiServiceConnectHardwareAction = {
  type: `LegacyBackgroundApiService:connectHardware`;
  handler: LegacyBackgroundApiService['connectHardware'];
};

/**
 * Check if the device is unlocked.
 *
 * @param deviceName - The device name to check.
 * @param hdPath - An optional hd path to set on the device keyring.
 * @returns Whether the device is unlocked.
 */
export type LegacyBackgroundApiServiceCheckHardwareStatusAction = {
  type: `LegacyBackgroundApiService:checkHardwareStatus`;
  handler: LegacyBackgroundApiService['checkHardwareStatus'];
};

/**
 * Get the hd path currently configured on a Ledger hardware keyring.
 *
 * @returns The hd path.
 */
export type LegacyBackgroundApiServiceGetHdPathForLedgerKeyringAction = {
  type: `LegacyBackgroundApiService:getHdPathForLedgerKeyring`;
  handler: LegacyBackgroundApiService['getHdPathForLedgerKeyring'];
};

/**
 * Gets the public key from the Ledger device.
 *
 * @param hdPath - The hd path to get the public key for.
 * @returns The public key.
 */
export type LegacyBackgroundApiServiceGetLedgerPublicKeyAction = {
  type: `LegacyBackgroundApiService:getLedgerPublicKey`;
  handler: LegacyBackgroundApiService['getLedgerPublicKey'];
};

/**
 * Gets the features from the Trezor device.
 *
 * @returns The features.
 */
export type LegacyBackgroundApiServiceGetTrezorFeaturesAction = {
  type: `LegacyBackgroundApiService:getTrezorFeatures`;
  handler: LegacyBackgroundApiService['getTrezorFeatures'];
};

/**
 * Forget a hardware device.
 *
 * @param deviceName - The device name to forget.
 * @returns `true` when the device has been forgotten.
 */
export type LegacyBackgroundApiServiceForgetDeviceAction = {
  type: `LegacyBackgroundApiService:forgetDevice`;
  handler: LegacyBackgroundApiService['forgetDevice'];
};

/**
 * Imports an account from a Trezor or Ledger device.
 *
 * @param index - The account index to unlock.
 * @param deviceName - The device name.
 * @param hdPath - An optional hd path.
 * @param hdPathDescription - An optional hd path description.
 * @returns The unlocked account address and the current account list.
 */
export type LegacyBackgroundApiServiceUnlockHardwareWalletAccountAction = {
  type: `LegacyBackgroundApiService:unlockHardwareWalletAccount`;
  handler: LegacyBackgroundApiService['unlockHardwareWalletAccount'];
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
 * Creates a PRIMARY seed phrase backup for the user.
 *
 * Generate Encryption Key from the password using the Threshold OPRF and encrypt the seed phrase with the key.
 * Save the encrypted seed phrase in the metadata store.
 *
 * `createToprfKeyAndBackupSeedPhrase` already marks migration as V1 for new
 * backups, so a separate `setMigrationVersion` call is unnecessary.
 *
 * @param password - The user's password.
 * @param encodedSeedPhrase - The seed phrase to backup.
 * @param keyringId - The keyring id of the backup seed phrase.
 */
export type LegacyBackgroundApiServiceCreateSeedPhraseBackupAction = {
  type: `LegacyBackgroundApiService:createSeedPhraseBackup`;
  handler: LegacyBackgroundApiService['createSeedPhraseBackup'];
};

/**
 * Syncs the seed phrases with the social login flow.
 */
export type LegacyBackgroundApiServiceSyncSeedPhrasesAction = {
  type: `LegacyBackgroundApiService:syncSeedPhrases`;
  handler: LegacyBackgroundApiService['syncSeedPhrases'];
};

/**
 * Creates a new Vault and create a new keychain.
 *
 * @param password - The password used to encrypt the vault.
 * @returns created keyring object
 */
export type LegacyBackgroundApiServiceCreateNewVaultAndKeychainAction = {
  type: `LegacyBackgroundApiService:createNewVaultAndKeychain`;
  handler: LegacyBackgroundApiService['createNewVaultAndKeychain'];
};

/**
 * Creates a new vault and returns the seed phrase in a single atomic operation.
 * Holding the vault mutex through seed export avoids races where concurrent
 * keyring mutations leave no HD keyring available for export.
 *
 * @param password - The password used to encrypt the vault.
 * @returns The seed phrase encoded as UTF-8 bytes.
 */
export type LegacyBackgroundApiServiceCreateNewVaultAndGetSeedPhraseAction = {
  type: `LegacyBackgroundApiService:createNewVaultAndGetSeedPhrase`;
  handler: LegacyBackgroundApiService['createNewVaultAndGetSeedPhrase'];
};

/**
 * Unlocks the vault and returns the seed phrase in a single atomic operation.
 * Holding the vault mutex through seed export avoids races where concurrent
 * keyring mutations leave no HD keyring available for export.
 *
 * @param password - The password used to unlock the vault.
 * @returns The seed phrase encoded as UTF-8 bytes.
 */
export type LegacyBackgroundApiServiceUnlockAndGetSeedPhraseAction = {
  type: `LegacyBackgroundApiService:unlockAndGetSeedPhrase`;
  handler: LegacyBackgroundApiService['unlockAndGetSeedPhrase'];
};

/**
 * Discovers and creates accounts for the given keyring id.
 *
 * @param id - The keyring id to discover and create accounts for.
 * @returns Discovered account counts by chain.
 */
export type LegacyBackgroundApiServiceDiscoverAndCreateAccountsAction = {
  type: `LegacyBackgroundApiService:discoverAndCreateAccounts`;
  handler: LegacyBackgroundApiService['discoverAndCreateAccounts'];
};

/**
 * Imports a new mnemonic to the vault.
 *
 * @param mnemonic - The mnemonic to import.
 * @param options - The options for the import.
 * @param options.shouldCreateSocialBackup - whether to create a backup for the seedless onboarding flow
 * @param options.shouldSelectAccount - whether to select the new account in the wallet
 */
export type LegacyBackgroundApiServiceImportMnemonicToVaultAction = {
  type: `LegacyBackgroundApiService:importMnemonicToVault`;
  handler: LegacyBackgroundApiService['importMnemonicToVault'];
};

/**
 * Fetches and restores the seed phrase from the metadata store using the social login and restore the vault using the seed phrase.
 *
 * @param password - The password.
 * @returns The seed phrase.
 */
export type LegacyBackgroundApiServiceRestoreSocialBackupAndGetSeedPhraseAction =
  {
    type: `LegacyBackgroundApiService:restoreSocialBackupAndGetSeedPhrase`;
    handler: LegacyBackgroundApiService['restoreSocialBackupAndGetSeedPhrase'];
  };

/**
 * Create a new Vault and restore an existent keyring.
 *
 * @param password - The password used to encrypt the vault.
 * @param encodedSeedPhrase - The seed phrase, encoded as an array of UTF-8 bytes.
 */
export type LegacyBackgroundApiServiceCreateNewVaultAndRestoreAction = {
  type: `LegacyBackgroundApiService:createNewVaultAndRestore`;
  handler: LegacyBackgroundApiService['createNewVaultAndRestore'];
};

export type LegacyBackgroundApiServiceIsRelaySupportedAction = {
  type: `LegacyBackgroundApiService:isRelaySupported`;
  handler: LegacyBackgroundApiService['isRelaySupported'];
};

/**
 * Get Sentinel Network flags for the given chain.
 *
 * @param chainId - The chain ID to check for relay support.
 * @returns The Sentinel network flags for the given chain, or undefined if not found.
 */
export type LegacyBackgroundApiServiceGetSentinelNetworkFlagsAction = {
  type: `LegacyBackgroundApiService:getSentinelNetworkFlags`;
  handler: LegacyBackgroundApiService['getSentinelNetworkFlags'];
};

/**
 * Runs when CAIP-25 permitted accounts are extended via the permission
 * background API. If the origin is a referral partner and the globally
 * selected account is EVM and included among the newly permitted accounts,
 * it triggers the DeFi referral flow.
 *
 * @param details - Added accounts payload.
 * @param details.origin - The origin whose permitted accounts were extended.
 * @param details.newCaipAccountIds - The newly added CAIP-10 account ids.
 */
export type LegacyBackgroundApiServiceHandleDefiReferralOnPermittedAccountsAddedAction =
  {
    type: `LegacyBackgroundApiService:handleDefiReferralOnPermittedAccountsAdded`;
    handler: LegacyBackgroundApiService['handleDefiReferralOnPermittedAccountsAdded'];
  };

/**
 * Handles DeFi referral approval flow for a partner.
 * Shows approval confirmation screen if needed and manages referral URL redirection.
 * This can be triggered by connection permission grants or existing connections.
 *
 * @param partner - The partner configuration.
 * @param tabId - The browser tab ID to update.
 * @param triggerType - The trigger type.
 * @param options - Optional behavior.
 * @param options.activePermittedAddressOverride - When set, use this permitted address for referral state instead of the first sorted permitted account.
 */
export type LegacyBackgroundApiServiceHandleDefiReferralAction = {
  type: `LegacyBackgroundApiService:handleDefiReferral`;
  handler: LegacyBackgroundApiService['handleDefiReferral'];
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
  | LegacyBackgroundApiServiceRequestSafeReloadAction
  | LegacyBackgroundApiServiceOpenUpdateTabAndReloadAction
  | LegacyBackgroundApiServiceGetPhishingResultAction
  | LegacyBackgroundApiServiceMarkNotificationPopupAsAutomaticallyClosedAction
  | LegacyBackgroundApiServiceMarkPasswordForgottenAction
  | LegacyBackgroundApiServiceUnMarkPasswordForgottenAction
  | LegacyBackgroundApiServiceGetCodeAction
  | LegacyBackgroundApiServiceCheckDelegationDisabledAction
  | LegacyBackgroundApiServiceEstimateGasAction
  | LegacyBackgroundApiServiceDecodeTransactionDataAction
  | LegacyBackgroundApiServiceAddTransactionAction
  | LegacyBackgroundApiServiceAddTransactionAndWaitForPublishAction
  | LegacyBackgroundApiServiceAddNetworkAction
  | LegacyBackgroundApiServiceGetSeedPhraseAction
  | LegacyBackgroundApiServiceResetAccountAction
  | LegacyBackgroundApiServiceLookupSelectedNetworksAction
  | LegacyBackgroundApiServiceSetEnabledNetworksAction
  | LegacyBackgroundApiServiceSetEnabledAllPopularNetworksAction
  | LegacyBackgroundApiServiceResetWalletAction
  | LegacyBackgroundApiServiceGetGlobalChainIdAction
  | LegacyBackgroundApiServiceGetTokenStandardAndDetailsAction
  | LegacyBackgroundApiServiceGetTokenStandardAndDetailsByChainAction
  | LegacyBackgroundApiServiceGetTokenSymbolAction
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
  | LegacyBackgroundApiServiceChangePasswordWithPasskeyVerificationAction
  | LegacyBackgroundApiServiceUnlockWithPasskeyAction
  | LegacyBackgroundApiServiceSetLockedAction
  | LegacyBackgroundApiServiceSyncKeyringEncryptionKeyAction
  | LegacyBackgroundApiServiceExportAccountAction
  | LegacyBackgroundApiServiceApplyTransactionContainersExistingAction
  | LegacyBackgroundApiServiceUpsertTransactionUIMetricsFragmentAction
  | LegacyBackgroundApiServiceRejectPendingApprovalAction
  | LegacyBackgroundApiServiceResolvePendingApprovalAction
  | LegacyBackgroundApiServiceApproveHardwareWalletTransactionAction
  | LegacyBackgroundApiServiceRejectAllPendingApprovalsAction
  | LegacyBackgroundApiServiceToggleExternalServicesAction
  | LegacyBackgroundApiServiceAcceptPermissionsRequestAction
  | LegacyBackgroundApiServiceAttemptLedgerTransportCreationAction
  | LegacyBackgroundApiServiceGetAppNameAndVersionAction
  | LegacyBackgroundApiServiceGetLedgerAppConfigurationAction
  | LegacyBackgroundApiServiceGetLedgerModeAction
  | LegacyBackgroundApiServiceConnectHardwareAction
  | LegacyBackgroundApiServiceCheckHardwareStatusAction
  | LegacyBackgroundApiServiceGetHdPathForLedgerKeyringAction
  | LegacyBackgroundApiServiceGetLedgerPublicKeyAction
  | LegacyBackgroundApiServiceGetTrezorFeaturesAction
  | LegacyBackgroundApiServiceForgetDeviceAction
  | LegacyBackgroundApiServiceUnlockHardwareWalletAccountAction
  | LegacyBackgroundApiServiceCaptureTestErrorAction
  | LegacyBackgroundApiServiceThrowTestErrorAction
  | LegacyBackgroundApiServiceCreateSeedPhraseBackupAction
  | LegacyBackgroundApiServiceSyncSeedPhrasesAction
  | LegacyBackgroundApiServiceCreateNewVaultAndKeychainAction
  | LegacyBackgroundApiServiceCreateNewVaultAndGetSeedPhraseAction
  | LegacyBackgroundApiServiceUnlockAndGetSeedPhraseAction
  | LegacyBackgroundApiServiceDiscoverAndCreateAccountsAction
  | LegacyBackgroundApiServiceImportMnemonicToVaultAction
  | LegacyBackgroundApiServiceRestoreSocialBackupAndGetSeedPhraseAction
  | LegacyBackgroundApiServiceCreateNewVaultAndRestoreAction
  | LegacyBackgroundApiServiceIsRelaySupportedAction
  | LegacyBackgroundApiServiceGetSentinelNetworkFlagsAction
  | LegacyBackgroundApiServiceHandleDefiReferralOnPermittedAccountsAddedAction
  | LegacyBackgroundApiServiceHandleDefiReferralAction;
