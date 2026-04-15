/**
 * This file is auto generated.
 * Do not edit manually.
 */

import type { PreferencesController } from './preferences-controller';

/**
 * Sets the {@code forgottenPassword} state property
 *
 * @param forgottenPassword - whether or not the user has forgotten their password
 */
export type PreferencesControllerSetPasswordForgottenAction = {
  type: `PreferencesController:setPasswordForgotten`;
  handler: PreferencesController['setPasswordForgotten'];
};

/**
 * Setter for the `usePhishDetect` property
 *
 * @param val - Whether or not the user prefers phishing domain protection
 */
export type PreferencesControllerSetUsePhishDetectAction = {
  type: `PreferencesController:setUsePhishDetect`;
  handler: PreferencesController['setUsePhishDetect'];
};

/**
 * Setter for the `useMultiAccountBalanceChecker` property
 *
 * @param val - Whether or not the user prefers to turn off/on all security settings
 */
export type PreferencesControllerSetUseMultiAccountBalanceCheckerAction = {
  type: `PreferencesController:setUseMultiAccountBalanceChecker`;
  handler: PreferencesController['setUseMultiAccountBalanceChecker'];
};

/**
 * Setter for the `useSafeChainsListValidation` property
 *
 * @param val - Whether or not the user prefers to turn off/on validation for manually adding networks
 */
export type PreferencesControllerSetUseSafeChainsListValidationAction = {
  type: `PreferencesController:setUseSafeChainsListValidation`;
  handler: PreferencesController['setUseSafeChainsListValidation'];
};

export type PreferencesControllerToggleExternalServicesAction = {
  type: `PreferencesController:toggleExternalServices`;
  handler: PreferencesController['toggleExternalServices'];
};

/**
 * Setter for the `useTokenDetection` property
 *
 * @param val - Whether or not the user prefers to use the static token list or dynamic token list from the API
 */
export type PreferencesControllerSetUseTokenDetectionAction = {
  type: `PreferencesController:setUseTokenDetection`;
  handler: PreferencesController['setUseTokenDetection'];
};

/**
 * Setter for the `useNftDetection` property
 *
 * @param useNftDetection - Whether or not the user prefers to autodetect NFTs.
 */
export type PreferencesControllerSetUseNftDetectionAction = {
  type: `PreferencesController:setUseNftDetection`;
  handler: PreferencesController['setUseNftDetection'];
};

/**
 * Setter for the `use4ByteResolution` property
 *
 * @param use4ByteResolution - (Privacy) Whether or not the user prefers to have smart contract name details resolved with 4byte.directory
 */
export type PreferencesControllerSetUse4ByteResolutionAction = {
  type: `PreferencesController:setUse4ByteResolution`;
  handler: PreferencesController['setUse4ByteResolution'];
};

/**
 * Setter for the `useCurrencyRateCheck` property
 *
 * @param val - Whether or not the user prefers to use currency rate check for ETH and tokens.
 */
export type PreferencesControllerSetUseCurrencyRateCheckAction = {
  type: `PreferencesController:setUseCurrencyRateCheck`;
  handler: PreferencesController['setUseCurrencyRateCheck'];
};

/**
 * Setter for the `openSeaEnabled` property
 *
 * @param openSeaEnabled - Whether or not the user prefers to use the OpenSea API for NFTs data.
 */
export type PreferencesControllerSetOpenSeaEnabledAction = {
  type: `PreferencesController:setOpenSeaEnabled`;
  handler: PreferencesController['setOpenSeaEnabled'];
};

/**
 * Setter for the `securityAlertsEnabled` property
 *
 * @param securityAlertsEnabled - Whether or not the user prefers to use the security alerts.
 */
export type PreferencesControllerSetSecurityAlertsEnabledAction = {
  type: `PreferencesController:setSecurityAlertsEnabled`;
  handler: PreferencesController['setSecurityAlertsEnabled'];
};

/**
 * Setter for the `addSnapAccountEnabled` property.
 *
 * @param addSnapAccountEnabled - Whether or not the user wants to
 * enable the "Add Snap accounts" button.
 */
export type PreferencesControllerSetAddSnapAccountEnabledAction = {
  type: `PreferencesController:setAddSnapAccountEnabled`;
  handler: PreferencesController['setAddSnapAccountEnabled'];
};

/**
 * Setter for the `watchEthereumAccountEnabled` property.
 *
 * @param watchEthereumAccountEnabled - Whether or not the user wants to
 * enable the "Watch Ethereum account (Beta)" button.
 */
export type PreferencesControllerSetWatchEthereumAccountEnabledAction = {
  type: `PreferencesController:setWatchEthereumAccountEnabled`;
  handler: PreferencesController['setWatchEthereumAccountEnabled'];
};

/**
 * Setter for the `useExternalNameSources` property
 *
 * @param useExternalNameSources - Whether or not to use external name providers in the name controller.
 */
export type PreferencesControllerSetUseExternalNameSourcesAction = {
  type: `PreferencesController:setUseExternalNameSources`;
  handler: PreferencesController['setUseExternalNameSources'];
};

/**
 * Setter for the `useTransactionSimulations` property
 *
 * @param useTransactionSimulations - Whether or not to use simulations in the transaction confirmations.
 */
export type PreferencesControllerSetUseTransactionSimulationsAction = {
  type: `PreferencesController:setUseTransactionSimulations`;
  handler: PreferencesController['setUseTransactionSimulations'];
};

/**
 * Setter for the `advancedGasFee` property
 *
 * @param options
 * @param options.chainId - The chainId the advancedGasFees should be set on
 * @param options.gasFeePreferences - The advancedGasFee options to set
 */
export type PreferencesControllerSetAdvancedGasFeeAction = {
  type: `PreferencesController:setAdvancedGasFee`;
  handler: PreferencesController['setAdvancedGasFee'];
};

/**
 * Setter for the `theme` property
 *
 * @param val - 'default' or 'dark' value based on the mode selected by user.
 */
export type PreferencesControllerSetThemeAction = {
  type: `PreferencesController:setTheme`;
  handler: PreferencesController['setTheme'];
};

/**
 * Add new methodData to state, to avoid requesting this information again through Infura
 *
 * @param fourBytePrefix - Four-byte method signature
 * @param methodData - Corresponding data method
 */
export type PreferencesControllerAddKnownMethodDataAction = {
  type: `PreferencesController:addKnownMethodData`;
  handler: PreferencesController['addKnownMethodData'];
};

/**
 * Setter for the `currentLocale` property
 *
 * @param key - he preferred language locale key
 */
export type PreferencesControllerSetCurrentLocaleAction = {
  type: `PreferencesController:setCurrentLocale`;
  handler: PreferencesController['setCurrentLocale'];
};

/**
 * Sets a custom label for an account
 *
 * @deprecated - Use setAccountName from the AccountsController
 * @param address - the account to set a label for
 * @param label - the custom label for the account
 * @returns the account label
 */
export type PreferencesControllerSetAccountLabelAction = {
  type: `PreferencesController:setAccountLabel`;
  handler: PreferencesController['setAccountLabel'];
};

/**
 * Updates the `featureFlags` property, which is an object. One property within that object will be set to a boolean.
 *
 * @param feature - A key that corresponds to a UI feature.
 * @param activated - Indicates whether or not the UI feature should be displayed
 * @returns the updated featureFlags object.
 */
export type PreferencesControllerSetFeatureFlagAction = {
  type: `PreferencesController:setFeatureFlag`;
  handler: PreferencesController['setFeatureFlag'];
};

/**
 * Updates the `preferences` property, which is an object. These are user-controlled features
 * found in the settings page.
 *
 * @param preference - The preference to enable or disable.
 * @param value - Indicates whether or not the preference should be enabled or disabled.
 * @returns Promises a updated Preferences object.
 */
export type PreferencesControllerSetPreferenceAction = {
  type: `PreferencesController:setPreference`;
  handler: PreferencesController['setPreference'];
};

/**
 * A getter for the `preferences` property
 *
 * @returns A map of user-selected preferences.
 */
export type PreferencesControllerGetPreferencesAction = {
  type: `PreferencesController:getPreferences`;
  handler: PreferencesController['getPreferences'];
};

/**
 * A getter for the `ipfsGateway` property
 *
 * @returns The current IPFS gateway domain
 */
export type PreferencesControllerGetIpfsGatewayAction = {
  type: `PreferencesController:getIpfsGateway`;
  handler: PreferencesController['getIpfsGateway'];
};

/**
 * A setter for the `ipfsGateway` property
 *
 * @param domain - The new IPFS gateway domain
 * @returns the update IPFS gateway domain
 */
export type PreferencesControllerSetIpfsGatewayAction = {
  type: `PreferencesController:setIpfsGateway`;
  handler: PreferencesController['setIpfsGateway'];
};

/**
 * A setter for the `isIpfsGatewayEnabled` property
 *
 * @param enabled - Whether or not IPFS is enabled
 */
export type PreferencesControllerSetIsIpfsGatewayEnabledAction = {
  type: `PreferencesController:setIsIpfsGatewayEnabled`;
  handler: PreferencesController['setIsIpfsGatewayEnabled'];
};

/**
 * A setter for the `useAddressBarEnsResolution` property
 *
 * @param useAddressBarEnsResolution - Whether or not user prefers IPFS resolution for domains
 */
export type PreferencesControllerSetUseAddressBarEnsResolutionAction = {
  type: `PreferencesController:setUseAddressBarEnsResolution`;
  handler: PreferencesController['setUseAddressBarEnsResolution'];
};

/**
 * A setter for the `ledgerTransportType` property.
 *
 * @deprecated We no longer support specifying a ledger transport type other
 * than webhid, therefore managing a preference is no longer necessary.
 * @param ledgerTransportType - 'webhid'
 * @returns The transport type that was set.
 */
export type PreferencesControllerSetLedgerTransportPreferenceAction = {
  type: `PreferencesController:setLedgerTransportPreference`;
  handler: PreferencesController['setLedgerTransportPreference'];
};

/**
 * A setter for the user preference to dismiss the seed phrase backup reminder
 *
 * @param dismissSeedBackUpReminder - User preference for dismissing the back up reminder.
 */
export type PreferencesControllerSetDismissSeedBackUpReminderAction = {
  type: `PreferencesController:setDismissSeedBackUpReminder`;
  handler: PreferencesController['setDismissSeedBackUpReminder'];
};

/**
 * A setter for the user preference to override the Content-Security-Policy header
 *
 * @param overrideContentSecurityPolicyHeader - User preference for overriding the Content-Security-Policy header.
 */
export type PreferencesControllerSetOverrideContentSecurityPolicyHeaderAction =
  {
    type: `PreferencesController:setOverrideContentSecurityPolicyHeader`;
    handler: PreferencesController['setOverrideContentSecurityPolicyHeader'];
  };

/**
 * A setter for the user preference to manage institutional wallets
 *
 * @param manageInstitutionalWallets - User preference for managing institutional wallets.
 */
export type PreferencesControllerSetManageInstitutionalWalletsAction = {
  type: `PreferencesController:setManageInstitutionalWallets`;
  handler: PreferencesController['setManageInstitutionalWallets'];
};

export type PreferencesControllerSetServiceWorkerKeepAlivePreferenceAction = {
  type: `PreferencesController:setServiceWorkerKeepAlivePreference`;
  handler: PreferencesController['setServiceWorkerKeepAlivePreference'];
};

export type PreferencesControllerSetUseSidePanelAsDefaultAction = {
  type: `PreferencesController:setUseSidePanelAsDefault`;
  handler: PreferencesController['setUseSidePanelAsDefault'];
};

export type PreferencesControllerSetShowDefaultAddressAction = {
  type: `PreferencesController:setShowDefaultAddress`;
  handler: PreferencesController['setShowDefaultAddress'];
};

export type PreferencesControllerSetDefaultAddressScopeAction = {
  type: `PreferencesController:setDefaultAddressScope`;
  handler: PreferencesController['setDefaultAddressScope'];
};

export type PreferencesControllerSetSnapsAddSnapAccountModalDismissedAction = {
  type: `PreferencesController:setSnapsAddSnapAccountModalDismissed`;
  handler: PreferencesController['setSnapsAddSnapAccountModalDismissed'];
};

/**
 * Resets the preferences state to the default values.
 * This is used when the wallet is reset during the "Forgot Password" flow.
 */
export type PreferencesControllerResetStateAction = {
  type: `PreferencesController:resetState`;
  handler: PreferencesController['resetState'];
};

export type PreferencesControllerAddReferralApprovedAccountAction = {
  type: `PreferencesController:addReferralApprovedAccount`;
  handler: PreferencesController['addReferralApprovedAccount'];
};

export type PreferencesControllerAddReferralPassedAccountAction = {
  type: `PreferencesController:addReferralPassedAccount`;
  handler: PreferencesController['addReferralPassedAccount'];
};

export type PreferencesControllerAddReferralDeclinedAccountAction = {
  type: `PreferencesController:addReferralDeclinedAccount`;
  handler: PreferencesController['addReferralDeclinedAccount'];
};

export type PreferencesControllerRemoveReferralDeclinedAccountAction = {
  type: `PreferencesController:removeReferralDeclinedAccount`;
  handler: PreferencesController['removeReferralDeclinedAccount'];
};

export type PreferencesControllerSetAccountsReferralApprovedAction = {
  type: `PreferencesController:setAccountsReferralApproved`;
  handler: PreferencesController['setAccountsReferralApproved'];
};

/**
 * Union of all PreferencesController action types.
 */
export type PreferencesControllerMethodActions =
  | PreferencesControllerSetPasswordForgottenAction
  | PreferencesControllerSetUsePhishDetectAction
  | PreferencesControllerSetUseMultiAccountBalanceCheckerAction
  | PreferencesControllerSetUseSafeChainsListValidationAction
  | PreferencesControllerToggleExternalServicesAction
  | PreferencesControllerSetUseTokenDetectionAction
  | PreferencesControllerSetUseNftDetectionAction
  | PreferencesControllerSetUse4ByteResolutionAction
  | PreferencesControllerSetUseCurrencyRateCheckAction
  | PreferencesControllerSetOpenSeaEnabledAction
  | PreferencesControllerSetSecurityAlertsEnabledAction
  | PreferencesControllerSetAddSnapAccountEnabledAction
  | PreferencesControllerSetWatchEthereumAccountEnabledAction
  | PreferencesControllerSetUseExternalNameSourcesAction
  | PreferencesControllerSetUseTransactionSimulationsAction
  | PreferencesControllerSetAdvancedGasFeeAction
  | PreferencesControllerSetThemeAction
  | PreferencesControllerAddKnownMethodDataAction
  | PreferencesControllerSetCurrentLocaleAction
  | PreferencesControllerSetAccountLabelAction
  | PreferencesControllerSetFeatureFlagAction
  | PreferencesControllerSetPreferenceAction
  | PreferencesControllerGetPreferencesAction
  | PreferencesControllerGetIpfsGatewayAction
  | PreferencesControllerSetIpfsGatewayAction
  | PreferencesControllerSetIsIpfsGatewayEnabledAction
  | PreferencesControllerSetUseAddressBarEnsResolutionAction
  | PreferencesControllerSetLedgerTransportPreferenceAction
  | PreferencesControllerSetDismissSeedBackUpReminderAction
  | PreferencesControllerSetOverrideContentSecurityPolicyHeaderAction
  | PreferencesControllerSetManageInstitutionalWalletsAction
  | PreferencesControllerSetServiceWorkerKeepAlivePreferenceAction
  | PreferencesControllerSetUseSidePanelAsDefaultAction
  | PreferencesControllerSetShowDefaultAddressAction
  | PreferencesControllerSetDefaultAddressScopeAction
  | PreferencesControllerSetSnapsAddSnapAccountModalDismissedAction
  | PreferencesControllerResetStateAction
  | PreferencesControllerAddReferralApprovedAccountAction
  | PreferencesControllerAddReferralPassedAccountAction
  | PreferencesControllerAddReferralDeclinedAccountAction
  | PreferencesControllerRemoveReferralDeclinedAccountAction
  | PreferencesControllerSetAccountsReferralApprovedAction;
