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
 * Execute side effects of a removed account.
 *
 * @param address - The address of the account to remove.
 */
export type LegacyBackgroundApiServiceOnAccountRemovedAction = {
  type: `LegacyBackgroundApiService:onAccountRemoved`;
  handler: LegacyBackgroundApiService['onAccountRemoved'];
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
 * Union of all LegacyBackgroundApiService action types.
 */
export type LegacyBackgroundApiServiceMethodActions =
  | LegacyBackgroundApiServiceIsAssetsUnifyStateEnabledAction
  | LegacyBackgroundApiServiceSetCurrentCurrencyAction
  | LegacyBackgroundApiServiceIsPublicEndpointUrlAction
  | LegacyBackgroundApiServiceGetRequestAccountTabIdsAction
  | LegacyBackgroundApiServiceGetOpenMetamaskTabsIdsAction
  | LegacyBackgroundApiServiceMarkPasswordForgottenAction
  | LegacyBackgroundApiServiceUnMarkPasswordForgottenAction
  | LegacyBackgroundApiServiceGetCodeAction
  | LegacyBackgroundApiServiceGetSeedPhraseAction
  | LegacyBackgroundApiServiceResetAccountAction
  | LegacyBackgroundApiServiceGetGlobalChainIdAction
  | LegacyBackgroundApiServiceRemoveAccountAction
  | LegacyBackgroundApiServiceOnAccountRemovedAction
  | LegacyBackgroundApiServiceImportAccountWithStrategyAction
  | LegacyBackgroundApiServiceGetAccountsBySnapIdAction
  | LegacyBackgroundApiServiceCheckIsSeedlessPasswordOutdatedAction;
