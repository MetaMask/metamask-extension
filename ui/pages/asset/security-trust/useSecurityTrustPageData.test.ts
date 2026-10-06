import type { TokenSecurityData } from '@metamask/assets-controllers';
import { SolScope } from '@metamask/keyring-api';
import type { CaipAssetType } from '@metamask/utils';
import { renderHook } from '@testing-library/react';
import { getNetworkConfigurationsByChainId } from '../../../../shared/lib/selectors/networks';
import type { Token } from '../../../components/app/assets/types';
import { getFungibleAssetForRoute } from '../../../selectors/assets';
import { getAllMultichainNetworkConfigurations } from '../../../selectors/multichain/networks';
import { useTokenSecurityData } from '../../../hooks/useTokenSecurityData';
import * as securityTrustUtils from '../utils/security-trust-utils';
import { useSecurityTrustPageData } from './useSecurityTrustPageData';

jest.mock('../../../selectors/selectors', () => ({
  getUseExternalServices: jest.fn(),
}));

jest.mock('../../../selectors/multichain/feature-flags', () => ({
  getIsSecurityTrustTdpEnabled: jest.fn(),
}));

const { getUseExternalServices } = {
  get accountsWithSendEtherInfoSelector() {
    return jest.requireMock('../../../selectors/selectors')
      .accountsWithSendEtherInfoSelector;
  },
  get activeTabHasPermissions() {
    return jest.requireMock('../../../selectors/selectors')
      .activeTabHasPermissions;
  },
  get checkIfMethodIsEnabled() {
    return jest.requireMock('../../../selectors/selectors')
      .checkIfMethodIsEnabled;
  },
  get checkNetworkAndAccountSupports1559() {
    return jest.requireMock('../../../selectors/selectors')
      .checkNetworkAndAccountSupports1559;
  },
  get checkNetworkOrAccountNotSupports1559() {
    return jest.requireMock('../../../selectors/selectors')
      .checkNetworkOrAccountNotSupports1559;
  },
  get conversionRateSelector() {
    return jest.requireMock('../../../selectors/confirm-transaction')
      .conversionRateSelector;
  },
  get currentCurrencySelector() {
    return jest.requireMock('../../../selectors/confirm-transaction')
      .currentCurrencySelector;
  },
  get doesAddressRequireLedgerHidConnection() {
    return jest.requireMock('../../../selectors/selectors')
      .doesAddressRequireLedgerHidConnection;
  },
  get firstPendingConfirmationSelector() {
    return jest.requireMock('../../confirmations/selectors/confirm')
      .firstPendingConfirmationSelector;
  },
  get getAccountIdByAddress() {
    return jest.requireMock('../../../selectors/accounts')
      .getAccountIdByAddress;
  },
  get getAccountName() {
    return jest.requireMock('../../../selectors/selectors').getAccountName;
  },
  get getAccountToConnectToActiveTab() {
    return jest.requireMock('../../../selectors/selectors')
      .getAccountToConnectToActiveTab;
  },
  get getAccountTypeForOnboardingMetrics() {
    return jest.requireMock('../../../selectors/onboarding/onboarding')
      .getAccountTypeForOnboardingMetrics;
  },
  get getAccountsWithLabels() {
    return jest.requireMock('../../../selectors/selectors')
      .getAccountsWithLabels;
  },
  get getActiveQrCodeScanRequest() {
    return jest.requireMock('../../../selectors/selectors')
      .getActiveQrCodeScanRequest;
  },
  get getAddressBook() {
    return jest.requireMock('../../../selectors/selectors').getAddressBook;
  },
  get getAddressBookEntry() {
    return jest.requireMock('../../../selectors/selectors').getAddressBookEntry;
  },
  get getAddressBookEntryOrAccountName() {
    return jest.requireMock('../../../selectors/selectors')
      .getAddressBookEntryOrAccountName;
  },
  get getAddressSecurityAlertResponse() {
    return jest.requireMock('../../../selectors/selectors')
      .getAddressSecurityAlertResponse;
  },
  get getAdvancedGasFeeValues() {
    return jest.requireMock('../../../selectors/selectors')
      .getAdvancedGasFeeValues;
  },
  get getAdvancedInlineGasShown() {
    return jest.requireMock('../../../selectors/selectors')
      .getAdvancedInlineGasShown;
  },
  get getAllChainsToPoll() {
    return jest.requireMock('../../../selectors/selectors').getAllChainsToPoll;
  },
  get getAllDomains() {
    return jest.requireMock('../../../selectors/selectors').getAllDomains;
  },
  get getAllEnabledNetworks() {
    return jest.requireMock('../../../selectors/selectors')
      .getAllEnabledNetworks;
  },
  get getAllEnabledNetworksForAllNamespaces() {
    return jest.requireMock('../../../selectors/multichain/networks')
      .getAllEnabledNetworksForAllNamespaces;
  },
  get getAllMultichainNetworkConfigurations() {
    return jest.requireMock('../../../selectors/multichain/networks')
      .getAllMultichainNetworkConfigurations;
  },
  get getAllPermittedAccounts() {
    return jest.requireMock('../../../selectors/selectors')
      .getAllPermittedAccounts;
  },
  get getAllPermittedAccountsForCurrentTab() {
    return jest.requireMock('../../../selectors/selectors')
      .getAllPermittedAccountsForCurrentTab;
  },
  get getAllPermittedAccountsForSelectedTab() {
    return jest.requireMock('../../../selectors/selectors')
      .getAllPermittedAccountsForSelectedTab;
  },
  get getAllPermittedChainsForSelectedTab() {
    return jest.requireMock('../../../selectors/selectors')
      .getAllPermittedChainsForSelectedTab;
  },
  get getAllSnapAvailableUpdates() {
    return jest.requireMock('../../../selectors/selectors')
      .getAllSnapAvailableUpdates;
  },
  get getAllTokens() {
    return jest.requireMock('../../../../shared/lib/selectors/assets-migration')
      .getTokensControllerAllTokens;
  },
  get getAnalyticsId() {
    return jest.requireMock('../../../selectors/selectors').getAnalyticsId;
  },
  get getAnySnapUpdateAvailable() {
    return jest.requireMock('../../../selectors/selectors')
      .getAnySnapUpdateAvailable;
  },
  get getAppIsLoading() {
    return jest.requireMock('../../../selectors/selectors').getAppIsLoading;
  },
  get getApprovalFlows() {
    return jest.requireMock('../../../selectors/approvals').getApprovalFlows;
  },
  get getApprovalRequestsByType() {
    return jest.requireMock('../../../selectors/approvals')
      .getApprovalRequestsByType;
  },
  get getApprovalsByOrigin() {
    return jest.requireMock('../../../selectors/approvals')
      .getApprovalsByOrigin;
  },
  get getApprovedAndSignedTransactions() {
    return jest.requireMock('../../../selectors/transactions')
      .getApprovedAndSignedTransactions;
  },
  get getAveragePriceEstimateInHexWEI() {
    return jest.requireMock('../../../selectors/custom-gas')
      .getAveragePriceEstimateInHexWEI;
  },
  get getBackupAndSyncOnboardingToggleState() {
    return jest.requireMock('../../../selectors/selectors')
      .getBackupAndSyncOnboardingToggleState;
  },
  get getBlockExplorerLinkText() {
    return jest.requireMock('../../../selectors/selectors')
      .getBlockExplorerLinkText;
  },
  get getChainIdsToPoll() {
    return jest.requireMock('../../../selectors/selectors').getChainIdsToPoll;
  },
  get getCompleteAddressBook() {
    return jest.requireMock('../../../selectors/selectors')
      .getCompleteAddressBook;
  },
  get getConfirmationExchangeRates() {
    return jest.requireMock('../../../selectors/selectors')
      .getConfirmationExchangeRates;
  },
  get getConnectedSitesList() {
    return jest.requireMock('../../../selectors/selectors')
      .getConnectedSitesList;
  },
  get getConnectedSitesListWithNetworkInfo() {
    return jest.requireMock('../../../selectors/selectors')
      .getConnectedSitesListWithNetworkInfo;
  },
  get getConnectedSubjectsForAllAddresses() {
    return jest.requireMock('../../../selectors/selectors')
      .getConnectedSubjectsForAllAddresses;
  },
  get getConnectedSubjectsForSelectedAddress() {
    return jest.requireMock('../../../selectors/selectors')
      .getConnectedSubjectsForSelectedAddress;
  },
  get getConsentDecisionMade() {
    return jest.requireMock('../../../selectors/metametrics')
      .getConsentDecisionMade;
  },
  get getCrossChainMetaMaskCachedBalances() {
    return jest.requireMock('../../../selectors/selectors')
      .getCrossChainMetaMaskCachedBalances;
  },
  get getCrossChainTokenExchangeRates() {
    return jest.requireMock('../../../selectors/selectors')
      .getCrossChainTokenExchangeRates;
  },
  get getCurrencyRates() {
    return jest.requireMock('../../../../shared/lib/selectors/assets-migration')
      .getCurrencyRateControllerCurrencyRates;
  },
  get getCurrentAccountWithSendEtherInfo() {
    return jest.requireMock('../../../selectors/selectors')
      .getCurrentAccountWithSendEtherInfo;
  },
  get getCurrentEthBalance() {
    return jest.requireMock('../../../selectors/selectors')
      .getCurrentEthBalance;
  },
  get getCurrentNetwork() {
    return jest.requireMock('../../../selectors/selectors').getCurrentNetwork;
  },
  get getCurrentNetworkTransactions() {
    return jest.requireMock('../../../selectors/transactions')
      .getCurrentNetworkTransactions;
  },
  get getCustomNonceValue() {
    return jest.requireMock('../../../selectors/selectors').getCustomNonceValue;
  },
  get getDataCollectionForMarketing() {
    return jest.requireMock('../../../selectors/metametrics')
      .getDataCollectionForMarketing;
  },
  get getDefaultAddressScope() {
    return jest.requireMock('../../../selectors/selectors')
      .getDefaultAddressScope;
  },
  get getDefaultHomeActiveTabName() {
    return jest.requireMock('../../../selectors/selectors')
      .getDefaultHomeActiveTabName;
  },
  get getDeferredDeepLink() {
    return jest.requireMock('../../../selectors/selectors').getDeferredDeepLink;
  },
  get getDeferredDeepLinkParameters() {
    return jest.requireMock('../../../selectors/selectors')
      .getDeferredDeepLinkParameters;
  },
  get getEditedNetwork() {
    return jest.requireMock('../../../selectors/selectors').getEditedNetwork;
  },
  get getEnabledChainIds() {
    return jest.requireMock('../../../selectors/multichain/networks')
      .getEnabledChainIds;
  },
  get getEnabledNetworkClientIds() {
    return jest.requireMock('../../../selectors/multichain/networks')
      .getEnabledNetworkClientIds;
  },
  get getEnabledNetworks() {
    return jest.requireMock('../../../../shared/lib/selectors/multichain')
      .getEnabledNetworks;
  },
  get getEnabledNetworksByNamespace() {
    return jest.requireMock('../../../selectors/multichain/networks')
      .getEnabledNetworksByNamespace;
  },
  get getEvmInternalAccounts() {
    return jest.requireMock('../../../selectors/selectors')
      .getEvmInternalAccounts;
  },
  get getEvmMultichainNetworkConfigurations() {
    return jest.requireMock('../../../selectors/multichain/networks')
      .getEvmMultichainNetworkConfigurations;
  },
  get getExternalServicesOnboardingToggleState() {
    return jest.requireMock('../../../selectors/selectors')
      .getExternalServicesOnboardingToggleState;
  },
  get getFeatureFlags() {
    return jest.requireMock('../../../selectors/selectors').getFeatureFlags;
  },
  get getFeatureNotificationsEnabled() {
    return jest.requireMock('../../../selectors/selectors')
      .getFeatureNotificationsEnabled;
  },
  get getFirstSnapInstallOrUpdateRequest() {
    return jest.requireMock('../../../selectors/selectors')
      .getFirstSnapInstallOrUpdateRequest;
  },
  get getFirstTimeFlowType() {
    return jest.requireMock('../../../selectors/first-time-flow')
      .getFirstTimeFlowType;
  },
  get getFirstTimeFlowTypeRouteAfterMetaMetricsOptIn() {
    return jest.requireMock('../../../selectors/first-time-flow')
      .getFirstTimeFlowTypeRouteAfterMetaMetricsOptIn;
  },
  get getFirstTimeFlowTypeRouteAfterUnlock() {
    return jest.requireMock('../../../selectors/first-time-flow')
      .getFirstTimeFlowTypeRouteAfterUnlock;
  },
  get getFullTxData() {
    return jest.requireMock('../../../selectors/selectors').getFullTxData;
  },
  get getGasFeesSponsoredNetworkEnabled() {
    return jest.requireMock('../../../selectors/selectors')
      .getGasFeesSponsoredNetworkEnabled;
  },
  get getHDEntropyIndex() {
    return jest.requireMock('../../../selectors/selectors').getHDEntropyIndex;
  },
  get getHasAnyEvmNetworkEnabled() {
    return jest.requireMock('../../../selectors/selectors')
      .getHasAnyEvmNetworkEnabled;
  },
  get getHdKeyringIndexByIdOrDefault() {
    return jest.requireMock('../../../selectors/selectors')
      .getHdKeyringIndexByIdOrDefault;
  },
  get getHdKeyringOfSelectedAccountOrPrimaryKeyring() {
    return jest.requireMock('../../../selectors/selectors')
      .getHdKeyringOfSelectedAccountOrPrimaryKeyring;
  },
  get getHiddenAccountsList() {
    return jest.requireMock('../../../selectors/selectors')
      .getHiddenAccountsList;
  },
  get getHideSnapBranding() {
    return jest.requireMock('../../../selectors/selectors').getHideSnapBranding;
  },
  get getInterface() {
    return jest.requireMock('../../../selectors/selectors').getInterface;
  },
  get getInternalAccount() {
    return jest.requireMock('../../../selectors/selectors').getInternalAccount;
  },
  get getInternalAccountByAddress() {
    return jest.requireMock('../../../selectors/accounts')
      .getInternalAccountByAddress;
  },
  get getInternalAccounts() {
    return jest.requireMock('../../../selectors/accounts').getInternalAccounts;
  },
  get getInternalAccountsByScope() {
    return jest.requireMock('../../../selectors/accounts')
      .getInternalAccountsByScope;
  },
  get getInternalAccountsObject() {
    return jest.requireMock('../../../selectors/accounts')
      .getInternalAccountsObject;
  },
  get getInternalAccountsSortedByKeyring() {
    return jest.requireMock('../../../selectors/selectors')
      .getInternalAccountsSortedByKeyring;
  },
  get getIpfsGateway() {
    return jest.requireMock('../../../selectors/selectors').getIpfsGateway;
  },
  get getIsAccessedFromDappConnectedSitePopover() {
    return jest.requireMock('../../../selectors/selectors')
      .getIsAccessedFromDappConnectedSitePopover;
  },
  get getIsAddSnapAccountEnabled() {
    return jest.requireMock('../../../selectors/selectors')
      .getIsAddSnapAccountEnabled;
  },
  get getIsAddingNewNetwork() {
    return jest.requireMock('../../../selectors/selectors')
      .getIsAddingNewNetwork;
  },
  get getIsBasicFunctionalitySocialLoginUser() {
    return jest.requireMock('../../../selectors/onboarding/onboarding')
      .getIsBasicFunctionalitySocialLoginUser;
  },
  get getIsBitcoinSupportEnabled() {
    return jest.requireMock('../../../selectors/multichain/feature-flags')
      .getIsBitcoinSupportEnabled;
  },
  get getIsBitcoinTestnetSupportEnabled() {
    return jest.requireMock('../../../selectors/multichain/feature-flags')
      .getIsBitcoinTestnetSupportEnabled;
  },
  get getIsBridgeChain() {
    return jest.requireMock('../../../selectors/selectors').getIsBridgeChain;
  },
  get getIsBridgeEnabled() {
    return jest.requireMock('../../../selectors/selectors').getIsBridgeEnabled;
  },
  get getIsCustomNetwork() {
    return jest.requireMock('../../../selectors/selectors').getIsCustomNetwork;
  },
  get getIsDefaultAddressEnabled() {
    return jest.requireMock('../../../selectors/selectors')
      .getIsDefaultAddressEnabled;
  },
  get getIsDefiPositionsEnabled() {
    return jest.requireMock('../../../selectors/selectors')
      .getIsDefiPositionsEnabled;
  },
  get getIsDeviceOffline() {
    return jest.requireMock('../../../selectors/selectors').getIsDeviceOffline;
  },
  get getIsEnrolledPasskeyIncompatibleWithSidepanel() {
    return jest.requireMock('../../../selectors/selectors')
      .getIsEnrolledPasskeyIncompatibleWithSidepanel;
  },
  get getIsEvmMultichainNetworkSelected() {
    return jest.requireMock('../../../selectors/multichain/networks')
      .getIsEvmMultichainNetworkSelected;
  },
  get getIsHardwareWalletErrorModalVisible() {
    return jest.requireMock('../../../selectors/selectors')
      .getIsHardwareWalletErrorModalVisible;
  },
  get getIsLineaMainnet() {
    return jest.requireMock('../../../selectors/selectors').getIsLineaMainnet;
  },
  get getIsMainnet() {
    return jest.requireMock('../../../selectors/selectors').getIsMainnet;
  },
  get getIsMultiRpcOnboarding() {
    return jest.requireMock('../../../selectors/selectors')
      .getIsMultiRpcOnboarding;
  },
  get getIsPasskeyFeatureAvailable() {
    return jest.requireMock('../../../selectors/selectors')
      .getIsPasskeyFeatureAvailable;
  },
  get getIsPasskeyPRFBased() {
    return jest.requireMock('../../../selectors/selectors')
      .getIsPasskeyPRFBased;
  },
  get getIsPasskeyRegistered() {
    return jest.requireMock('../../../selectors/selectors')
      .getIsPasskeyRegistered;
  },
  get getIsPasskeyUserHandleBased() {
    return jest.requireMock('../../../selectors/selectors')
      .getIsPasskeyUserHandleBased;
  },
  get getIsRpcFailoverEnabled() {
    return jest.requireMock('../../../selectors/selectors')
      .getIsRpcFailoverEnabled;
  },
  get getIsSecurityAlertsEnabled() {
    return jest.requireMock('../../../selectors/selectors')
      .getIsSecurityAlertsEnabled;
  },
  get getIsSigningQRHardwareTransaction() {
    return jest.requireMock('../../../selectors/selectors')
      .getIsSigningQRHardwareTransaction;
  },
  get getIsSocialLoginFlow() {
    return jest.requireMock('../../../selectors/first-time-flow')
      .getIsSocialLoginFlow;
  },
  get getIsSocialLoginUserAuthenticated() {
    return jest.requireMock('../../../selectors/onboarding/onboarding')
      .getIsSocialLoginUserAuthenticated;
  },
  get getIsSolanaSupportEnabled() {
    return jest.requireMock('../../../selectors/multichain/feature-flags')
      .getIsSolanaSupportEnabled;
  },
  get getIsSolanaTestnetSupportEnabled() {
    return jest.requireMock('../../../selectors/multichain/feature-flags')
      .getIsSolanaTestnetSupportEnabled;
  },
  get getIsStellarSupportEnabled() {
    return jest.requireMock('../../../selectors/multichain/feature-flags')
      .getIsStellarSupportEnabled;
  },
  get getIsSwapsChain() {
    return jest.requireMock('../../../selectors/selectors').getIsSwapsChain;
  },
  get getIsTestnet() {
    return jest.requireMock('../../../selectors/selectors').getIsTestnet;
  },
  get getIsTestnetInUse() {
    return jest.requireMock('../../../selectors/test-networks')
      .getIsTestnetInUse;
  },
  get getIsTokenNetworkFilterEqualCurrentNetwork() {
    return jest.requireMock('../../../selectors/selectors')
      .getIsTokenNetworkFilterEqualCurrentNetwork;
  },
  get getIsTronSupportEnabled() {
    return jest.requireMock('../../../selectors/multichain/feature-flags')
      .getIsTronSupportEnabled;
  },
  get getIsTronTestnetSupportEnabled() {
    return jest.requireMock('../../../selectors/multichain/feature-flags')
      .getIsTronTestnetSupportEnabled;
  },
  get getIsWatchEthereumAccountEnabled() {
    return jest.requireMock('../../../selectors/selectors')
      .getIsWatchEthereumAccountEnabled;
  },
  get getKeyringSnapAccounts() {
    return jest.requireMock('../../../selectors/selectors')
      .getKeyringSnapAccounts;
  },
  get getKeyringSnapRemovalResult() {
    return jest.requireMock('../../../selectors/selectors')
      .getKeyringSnapRemovalResult;
  },
  get getKnownMethodData() {
    return jest.requireMock('../../../selectors/selectors').getKnownMethodData;
  },
  get getLastConnectedInfo() {
    return jest.requireMock('../../../selectors/selectors')
      .getLastConnectedInfo;
  },
  get getLastQrScanCompletedSuccessfully() {
    return jest.requireMock('../../../selectors/selectors')
      .getLastQrScanCompletedSuccessfully;
  },
  get getLastViewedUserSurvey() {
    return jest.requireMock('../../../selectors/selectors')
      .getLastViewedUserSurvey;
  },
  get getLastVisitedPerpsRoute() {
    return jest.requireMock('../../../selectors/selectors')
      .getLastVisitedPerpsRoute;
  },
  get getLocale() {
    return jest.requireMock('../../../selectors/selectors').getLocale;
  },
  get getManageInstitutionalWallets() {
    return jest.requireMock('../../../selectors/selectors')
      .getManageInstitutionalWallets;
  },
  get getMarketData() {
    return jest.requireMock('../../../../shared/lib/selectors/assets-migration')
      .getTokenRatesControllerMarketData;
  },
  get getMaybeSelectedInternalAccount() {
    return jest.requireMock('../../../selectors/selectors')
      .getMaybeSelectedInternalAccount;
  },
  get getMetaMaskAccountBalances() {
    return jest.requireMock('../../../selectors/selectors')
      .getMetaMaskAccountBalances;
  },
  get getMetaMaskAccounts() {
    return jest.requireMock('../../../selectors/selectors').getMetaMaskAccounts;
  },
  get getMetaMaskAccountsConnected() {
    return jest.requireMock('../../../selectors/selectors')
      .getMetaMaskAccountsConnected;
  },
  get getMetaMaskAccountsOrdered() {
    return jest.requireMock('../../../selectors/selectors')
      .getMetaMaskAccountsOrdered;
  },
  get getMetaMaskCachedBalances() {
    return jest.requireMock('../../../selectors/selectors')
      .getMetaMaskCachedBalances;
  },
  get getMetaMaskHdKeyrings() {
    return jest.requireMock('../../../selectors/selectors')
      .getMetaMaskHdKeyrings;
  },
  get getMetaMaskKeyrings() {
    return jest.requireMock('../../../selectors/selectors').getMetaMaskKeyrings;
  },
  get getMetaMetricsDataDeletionId() {
    return jest.requireMock('../../../selectors/selectors')
      .getMetaMetricsDataDeletionId;
  },
  get getMetaMetricsDataDeletionStatus() {
    return jest.requireMock('../../../selectors/selectors')
      .getMetaMetricsDataDeletionStatus;
  },
  get getMetaMetricsDataDeletionTimestamp() {
    return jest.requireMock('../../../selectors/selectors')
      .getMetaMetricsDataDeletionTimestamp;
  },
  get getMetadataContractName() {
    return jest.requireMock('../../../selectors/selectors')
      .getMetadataContractName;
  },
  get getModalTypeForShieldEntryModal() {
    return jest.requireMock('../../../selectors/selectors')
      .getModalTypeForShieldEntryModal;
  },
  get getMultichainIsEvm() {
    return jest.requireMock('../../../selectors/multichain/networks')
      .getMultichainIsEvm;
  },
  get getMultichainNetwork() {
    return jest.requireMock('../../../selectors/multichain/networks')
      .getMultichainNetwork;
  },
  get getMultichainNetworkConfigurationsByChainId() {
    return jest.requireMock('../../../selectors/multichain/networks')
      .getMultichainNetworkConfigurationsByChainId;
  },
  get getMultipleTargetsSubjectMetadata() {
    return jest.requireMock('../../../selectors/selectors')
      .getMultipleTargetsSubjectMetadata;
  },
  get getNameLookupSnaps() {
    return jest.requireMock('../../../selectors/selectors').getNameLookupSnaps;
  },
  get getNameLookupSnapsIds() {
    return jest.requireMock('../../../selectors/selectors')
      .getNameLookupSnapsIds;
  },
  get getNameSources() {
    return jest.requireMock('../../../selectors/selectors').getNameSources;
  },
  get getNames() {
    return jest.requireMock('../../../selectors/selectors').getNames;
  },
  get getNativeCurrencyForChain() {
    return jest.requireMock('../../../selectors/selectors')
      .getNativeCurrencyForChain;
  },
  get getNativeCurrencyImage() {
    return jest.requireMock('../../../selectors/selectors')
      .getNativeCurrencyImage;
  },
  get getNativeTokenCachedBalanceByChainIdSelector() {
    return jest.requireMock('../../../selectors/selectors')
      .getNativeTokenCachedBalanceByChainIdSelector;
  },
  get getNativeTokenInfo() {
    return jest.requireMock('../../../selectors/selectors').getNativeTokenInfo;
  },
  get getNetworkClientIdsToPoll() {
    return jest.requireMock('../../../selectors/selectors')
      .getNetworkClientIdsToPoll;
  },
  get getNetworkConfigurationIdByChainId() {
    return jest.requireMock('../../../selectors/selectors')
      .getNetworkConfigurationIdByChainId;
  },
  get getNetworkDiscoverButtonEnabled() {
    return jest.requireMock('../../../selectors/selectors')
      .getNetworkDiscoverButtonEnabled;
  },
  get getNetworkIdentifier() {
    return jest.requireMock('../../../selectors/selectors')
      .getNetworkIdentifier;
  },
  get getNetworkToAutomaticallySwitchTo() {
    return jest.requireMock('../../../selectors/selectors')
      .getNetworkToAutomaticallySwitchTo;
  },
  get getNetworksTabSelectedNetworkConfigurationId() {
    return jest.requireMock('../../../selectors/selectors')
      .getNetworksTabSelectedNetworkConfigurationId;
  },
  get getNewNetworkAdded() {
    return jest.requireMock('../../../selectors/selectors').getNewNetworkAdded;
  },
  get getNewTokensImported() {
    return jest.requireMock('../../../selectors/selectors')
      .getNewTokensImported;
  },
  get getNewTokensImportedError() {
    return jest.requireMock('../../../selectors/selectors')
      .getNewTokensImportedError;
  },
  get getNextSuggestedNonce() {
    return jest.requireMock('../../../selectors/selectors')
      .getNextSuggestedNonce;
  },
  get getNftIsStillFetchingIndication() {
    return jest.requireMock('../../../selectors/selectors')
      .getNftIsStillFetchingIndication;
  },
  get getNoGasPriceFetched() {
    return jest.requireMock('../../../selectors/custom-gas')
      .getNoGasPriceFetched;
  },
  get getNonEvmMultichainNetworkConfigurationsByChainId() {
    return jest.requireMock('../../../selectors/multichain/networks')
      .getNonEvmMultichainNetworkConfigurationsByChainId;
  },
  get getNotifySnaps() {
    return jest.requireMock('../../../selectors/selectors').getNotifySnaps;
  },
  get getNumberOfAllUnapprovedTransactionsAndMessages() {
    return jest.requireMock('../../../selectors/selectors')
      .getNumberOfAllUnapprovedTransactionsAndMessages;
  },
  get getNumberOfTokens() {
    return jest.requireMock('../../../selectors/selectors').getNumberOfTokens;
  },
  get getOpenSeaEnabled() {
    return jest.requireMock('../../../selectors/selectors').getOpenSeaEnabled;
  },
  get getOptedIn() {
    return jest.requireMock('../../../selectors/metametrics').getOptedIn;
  },
  get getOrderedConnectedAccountsForActiveTab() {
    return jest.requireMock('../../../selectors/selectors')
      .getOrderedConnectedAccountsForActiveTab;
  },
  get getOrderedNetworksList() {
    return jest.requireMock('../../../selectors/selectors')
      .getOrderedNetworksList;
  },
  get getOriginOfCurrentTab() {
    return jest.requireMock('../../../selectors/selectors')
      .getOriginOfCurrentTab;
  },
  get getPasskeyAuthenticatorId() {
    return jest.requireMock('../../../selectors/selectors')
      .getPasskeyAuthenticatorId;
  },
  get getPasskeyDerivationMethod() {
    return jest.requireMock('../../../selectors/selectors')
      .getPasskeyDerivationMethod;
  },
  get getPendingApprovals() {
    return jest.requireMock('../../../selectors/approvals').getPendingApprovals;
  },
  get getPendingRedirectRoute() {
    return jest.requireMock('../../../selectors/selectors')
      .getPendingRedirectRoute;
  },
  get getPendingShieldCohort() {
    return jest.requireMock('../../../selectors/selectors')
      .getPendingShieldCohort;
  },
  get getPendingShieldCohortTxType() {
    return jest.requireMock('../../../selectors/selectors')
      .getPendingShieldCohortTxType;
  },
  get getPendingTokens() {
    return jest.requireMock('../../../selectors/selectors').getPendingTokens;
  },
  get getPermissionSubjects() {
    return jest.requireMock('../../../selectors/selectors')
      .getPermissionSubjects;
  },
  get getPermissions() {
    return jest.requireMock('../../../selectors/selectors').getPermissions;
  },
  get getPermissionsForActiveTab() {
    return jest.requireMock('../../../selectors/selectors')
      .getPermissionsForActiveTab;
  },
  get getPermissionsRequests() {
    return jest.requireMock('../../../selectors/selectors')
      .getPermissionsRequests;
  },
  get getPermittedAccountsByOrigin() {
    return jest.requireMock('../../../selectors/selectors')
      .getPermittedAccountsByOrigin;
  },
  get getPermittedEVMChainsForSelectedTab() {
    return jest.requireMock('../../../selectors/selectors')
      .getPermittedEVMChainsForSelectedTab;
  },
  get getPinnedAccountsList() {
    return jest.requireMock('../../../selectors/selectors')
      .getPinnedAccountsList;
  },
  get getPna25Acknowledged() {
    return jest.requireMock('../../../selectors/metametrics')
      .getPna25Acknowledged;
  },
  get getPreinstalledSnaps() {
    return jest.requireMock('../../../selectors/selectors')
      .getPreinstalledSnaps;
  },
  get getPrivacyMode() {
    return jest.requireMock('../../../selectors/selectors').getPrivacyMode;
  },
  get getRequestState() {
    return jest.requireMock('../../../selectors/selectors').getRequestState;
  },
  get getRequestType() {
    return jest.requireMock('../../../selectors/selectors').getRequestType;
  },
  get getRequestingNetworkInfo() {
    return jest.requireMock('../../../selectors/selectors')
      .getRequestingNetworkInfo;
  },
  get getRpcPrefsForCurrentProvider() {
    return jest.requireMock('../../../selectors/selectors')
      .getRpcPrefsForCurrentProvider;
  },
  get getSelectedAccount() {
    return jest.requireMock('../../../selectors/selectors').getSelectedAccount;
  },
  get getSelectedAccountCachedBalance() {
    return jest.requireMock('../../../selectors/selectors')
      .getSelectedAccountCachedBalance;
  },
  get getSelectedAccountTokensAcrossChains() {
    return jest.requireMock('../../../selectors/selectors')
      .getSelectedAccountTokensAcrossChains;
  },
  get getSelectedAddress() {
    return jest.requireMock('../../../selectors/selectors').getSelectedAddress;
  },
  get getSelectedEvmInternalAccount() {
    return jest.requireMock('../../../selectors/selectors')
      .getSelectedEvmInternalAccount;
  },
  get getSelectedInternalAccountWithBalance() {
    return jest.requireMock('../../../selectors/selectors')
      .getSelectedInternalAccountWithBalance;
  },
  get getSelectedKeyringByIdOrDefault() {
    return jest.requireMock('../../../selectors/selectors')
      .getSelectedKeyringByIdOrDefault;
  },
  get getSelectedMultichainNetworkChainId() {
    return jest.requireMock('../../../selectors/multichain/networks')
      .getSelectedMultichainNetworkChainId;
  },
  get getSelectedMultichainNetworkConfiguration() {
    return jest.requireMock('../../../selectors/multichain/networks')
      .getSelectedMultichainNetworkConfiguration;
  },
  get getSelectedNetwork() {
    return jest.requireMock('../../../selectors/selectors').getSelectedNetwork;
  },
  get getSendInputCurrencySwitched() {
    return jest.requireMock('../../../selectors/selectors')
      .getSendInputCurrencySwitched;
  },
  get getSettingsPageSnapsIds() {
    return jest.requireMock('../../../selectors/selectors')
      .getSettingsPageSnapsIds;
  },
  get getShieldEntryModalTriggeringCohort() {
    return jest.requireMock('../../../selectors/selectors')
      .getShieldEntryModalTriggeringCohort;
  },
  get getShouldHideZeroBalanceTokens() {
    return jest.requireMock('../../../selectors/selectors')
      .getShouldHideZeroBalanceTokens;
  },
  get getShouldShowFiat() {
    return jest.requireMock('../../../selectors/selectors').getShouldShowFiat;
  },
  get getShouldShowTestNetworks() {
    return jest.requireMock('../../../selectors/test-networks')
      .getShouldShowTestNetworks;
  },
  get getShouldSubmitEventsForShieldEntryModal() {
    return jest.requireMock('../../../selectors/selectors')
      .getShouldSubmitEventsForShieldEntryModal;
  },
  get getShowDataDeletionErrorModal() {
    return jest.requireMock('../../../selectors/selectors')
      .getShowDataDeletionErrorModal;
  },
  get getShowDefaultAddressPreference() {
    return jest.requireMock('../../../selectors/selectors')
      .getShowDefaultAddressPreference;
  },
  get getShowDeleteMetaMetricsDataModal() {
    return jest.requireMock('../../../selectors/selectors')
      .getShowDeleteMetaMetricsDataModal;
  },
  get getShowDownloadMobileAppSlide() {
    return jest.requireMock('../../../selectors/selectors')
      .getShowDownloadMobileAppSlide;
  },
  get getShowExtensionInFullSizeView() {
    return jest.requireMock('../../../selectors/selectors')
      .getShowExtensionInFullSizeView;
  },
  get getShowFiatInTestnets() {
    return jest.requireMock('../../../selectors/selectors')
      .getShowFiatInTestnets;
  },
  get getShowNativeTokenAsMainBalance() {
    return jest.requireMock('../../../selectors/selectors')
      .getShowNativeTokenAsMainBalance;
  },
  get getShowOutdatedBrowserWarning() {
    return jest.requireMock('../../../selectors/selectors')
      .getShowOutdatedBrowserWarning;
  },
  get getShowRecoveryPhraseReminder() {
    return jest.requireMock('../../../selectors/selectors')
      .getShowRecoveryPhraseReminder;
  },
  get getShowShieldEntryModal() {
    return jest.requireMock('../../../selectors/selectors')
      .getShowShieldEntryModal;
  },
  get getShowTermsOfUse() {
    return jest.requireMock('../../../selectors/selectors').getShowTermsOfUse;
  },
  get getShowTestNetworksPreference() {
    return jest.requireMock('../../../selectors/selectors')
      .getShowTestNetworksPreference;
  },
  get getShowUpdateModal() {
    return jest.requireMock('../../../selectors/selectors').getShowUpdateModal;
  },
  get getSlides() {
    return jest.requireMock('../../../selectors/selectors').getSlides;
  },
  get getSnap() {
    return jest.requireMock('../../../selectors/selectors').getSnap;
  },
  get getSnapInsights() {
    return jest.requireMock('../../../selectors/selectors').getSnapInsights;
  },
  get getSnapInstallOrUpdateRequests() {
    return jest.requireMock('../../../selectors/selectors')
      .getSnapInstallOrUpdateRequests;
  },
  get getSnapLatestVersion() {
    return jest.requireMock('../../../selectors/selectors')
      .getSnapLatestVersion;
  },
  get getSnapMetadata() {
    return jest.requireMock('../../../selectors/selectors').getSnapMetadata;
  },
  get getSnapRegistryData() {
    return jest.requireMock('../../../selectors/selectors').getSnapRegistryData;
  },
  get getSnaps() {
    return jest.requireMock('../../../selectors/selectors').getSnaps;
  },
  get getSnapsInstallPrivacyWarningShown() {
    return jest.requireMock('../../../selectors/selectors')
      .getSnapsInstallPrivacyWarningShown;
  },
  get getSnapsList() {
    return jest.requireMock('../../../selectors/selectors').getSnapsList;
  },
  get getSnapsMetadata() {
    return jest.requireMock('../../../selectors/selectors').getSnapsMetadata;
  },
  get getSocialLoginEmail() {
    return jest.requireMock('../../../selectors/onboarding/onboarding')
      .getSocialLoginEmail;
  },
  get getSocialLoginType() {
    return jest.requireMock('../../../selectors/onboarding/onboarding')
      .getSocialLoginType;
  },
  get getSubjectMetadata() {
    return jest.requireMock('../../../selectors/selectors').getSubjectMetadata;
  },
  get getSubjectsWithSnapPermission() {
    return jest.requireMock('../../../selectors/selectors')
      .getSubjectsWithSnapPermission;
  },
  get getSuggestedNfts() {
    return jest.requireMock('../../../selectors/selectors').getSuggestedNfts;
  },
  get getSuggestedTokens() {
    return jest.requireMock('../../../selectors/selectors').getSuggestedTokens;
  },
  get getSwapsDefaultToken() {
    return jest.requireMock('../../../selectors/selectors')
      .getSwapsDefaultToken;
  },
  get getTargetAccount() {
    return jest.requireMock('../../../selectors/selectors').getTargetAccount;
  },
  get getTargetAccountWithSendEtherInfo() {
    return jest.requireMock('../../../selectors/selectors')
      .getTargetAccountWithSendEtherInfo;
  },
  get getTargetSubjectMetadata() {
    return jest.requireMock('../../../selectors/selectors')
      .getTargetSubjectMetadata;
  },
  get getTestNetworkBackgroundColor() {
    return jest.requireMock('../../../selectors/selectors')
      .getTestNetworkBackgroundColor;
  },
  get getTheme() {
    return jest.requireMock('../../../selectors/selectors').getTheme;
  },
  get getThirdPartyNotifySnaps() {
    return jest.requireMock('../../../selectors/selectors')
      .getThirdPartyNotifySnaps;
  },
  get getTokenDetectionSupportNetworkByChainId() {
    return jest.requireMock('../../../selectors/selectors')
      .getTokenDetectionSupportNetworkByChainId;
  },
  get getTokenExchangeRates() {
    return jest.requireMock('../../../selectors/selectors')
      .getTokenExchangeRates;
  },
  get getTokenList() {
    return jest.requireMock('../../../selectors/selectors').getTokenList;
  },
  get getTokenNetworkFilter() {
    return jest.requireMock('../../../selectors/selectors')
      .getTokenNetworkFilter;
  },
  get getTokenScanCache() {
    return jest.requireMock('../../../selectors/selectors').getTokenScanCache;
  },
  get getTokenScanResultsForAddresses() {
    return jest.requireMock('../../../selectors/selectors')
      .getTokenScanResultsForAddresses;
  },
  get getTokenSortConfig() {
    return jest.requireMock('../../../selectors/selectors').getTokenSortConfig;
  },
  get getTokensAcrossChainsByAccountAddressSelector() {
    return jest.requireMock('../../../selectors/selectors')
      .getTokensAcrossChainsByAccountAddressSelector;
  },
  get getTokensMarketData() {
    return jest.requireMock('../../../selectors/selectors').getTokensMarketData;
  },
  get getTotalUnapprovedCount() {
    return jest.requireMock('../../../selectors/selectors')
      .getTotalUnapprovedCount;
  },
  get getTransaction() {
    return jest.requireMock('../../../selectors/selectors').getTransaction;
  },
  get getTransactions() {
    return jest.requireMock('../../../selectors/transactions').getTransactions;
  },
  get getTransactionsByChainId() {
    return jest.requireMock('../../../selectors/transactions')
      .getTransactionsByChainId;
  },
  get getTxData() {
    return jest.requireMock('../../../selectors/selectors').getTxData;
  },
  get getUSDConversionRate() {
    return jest.requireMock('../../../selectors/selectors')
      .getUSDConversionRate;
  },
  get getUSDConversionRateByChainId() {
    return jest.requireMock('../../../selectors/selectors')
      .getUSDConversionRateByChainId;
  },
  get getUnapprovedConfirmations() {
    return jest.requireMock('../../../selectors/selectors')
      .getUnapprovedConfirmations;
  },
  get getUnapprovedTemplatedConfirmations() {
    return jest.requireMock('../../../selectors/selectors')
      .getUnapprovedTemplatedConfirmations;
  },
  get getUnapprovedTransaction() {
    return jest.requireMock('../../../selectors/selectors')
      .getUnapprovedTransaction;
  },
  get getUnapprovedTransactions() {
    return jest.requireMock('../../../selectors/transactions')
      .getUnapprovedTransactions;
  },
  get getUnapprovedTxCount() {
    return jest.requireMock('../../../selectors/selectors')
      .getUnapprovedTxCount;
  },
  get getUnconnectedAccounts() {
    return jest.requireMock('../../../selectors/selectors')
      .getUnconnectedAccounts;
  },
  get getUpdatedAndSortedAccounts() {
    return jest.requireMock('../../../selectors/selectors')
      .getUpdatedAndSortedAccounts;
  },
  get getUpdatedAndSortedAccountsWithCaipAccountId() {
    return jest.requireMock('../../../selectors/selectors')
      .getUpdatedAndSortedAccountsWithCaipAccountId;
  },
  get getUrlScanCacheResult() {
    return jest.requireMock('../../../selectors/selectors')
      .getUrlScanCacheResult;
  },
  get getUse4ByteResolution() {
    return jest.requireMock('../../../selectors/confirm-transaction')
      .getUse4ByteResolution;
  },
  get getUseCurrencyRateCheck() {
    return jest.requireMock('../../../selectors/selectors')
      .getUseCurrencyRateCheck;
  },
  get getUseExternalNameSources() {
    return jest.requireMock('../../../selectors/selectors')
      .getUseExternalNameSources;
  },
  get getUseExternalServices() {
    return jest.requireMock('../../../selectors/selectors')
      .getUseExternalServices;
  },
  get getUseNftDetection() {
    return jest.requireMock('../../../selectors/selectors').getUseNftDetection;
  },
  get getUsePhishDetect() {
    return jest.requireMock('../../../selectors/selectors').getUsePhishDetect;
  },
  get getUseSafeChainsListValidation() {
    return jest.requireMock('../../../selectors/selectors')
      .getUseSafeChainsListValidation;
  },
  get getUseTokenDetection() {
    return jest.requireMock('../../../selectors/selectors')
      .getUseTokenDetection;
  },
  get getUseTransactionSimulations() {
    return jest.requireMock('../../../selectors/selectors')
      .getUseTransactionSimulations;
  },
  get getWeb3ShimUsageStateForOrigin() {
    return jest.requireMock('../../../selectors/selectors')
      .getWeb3ShimUsageStateForOrigin;
  },
  get groupAndSortTransactionsByNonce() {
    return jest.requireMock('../../../selectors/transactions')
      .groupAndSortTransactionsByNonce;
  },
  get hasPendingApprovals() {
    return jest.requireMock('../../../selectors/approvals').hasPendingApprovals;
  },
  get hasTransactionPendingApprovals() {
    return jest.requireMock('../../../selectors/transactions')
      .hasTransactionPendingApprovals;
  },
  get incomingTxListSelector() {
    return jest.requireMock('../../../selectors/transactions')
      .incomingTxListSelector;
  },
  get incomingTxListSelectorAllChains() {
    return jest.requireMock('../../../selectors/transactions')
      .incomingTxListSelectorAllChains;
  },
  get internalSelectPendingApproval() {
    return jest.requireMock('../../../selectors/approvals')
      .internalSelectPendingApproval;
  },
  get isAccountConnectedToCurrentTab() {
    return jest.requireMock('../../../selectors/selectors')
      .isAccountConnectedToCurrentTab;
  },
  get isBalanceCached() {
    return jest.requireMock('../../../selectors/selectors').isBalanceCached;
  },
  get isBitcoinAccount() {
    return jest.requireMock('../../../selectors/accounts').isBitcoinAccount;
  },
  get isCurrentProviderCustom() {
    return jest.requireMock('../../../selectors/selectors')
      .isCurrentProviderCustom;
  },
  get isNonEvmAccount() {
    return jest.requireMock('../../../selectors/accounts').isNonEvmAccount;
  },
  get isSelectedInternalAccountEth() {
    return jest.requireMock('../../../selectors/accounts')
      .isSelectedInternalAccountEth;
  },
  get isSelectedInternalAccountSolana() {
    return jest.requireMock('../../../selectors/accounts')
      .isSelectedInternalAccountSolana;
  },
  get isSolanaAccount() {
    return jest.requireMock('../../../selectors/accounts').isSolanaAccount;
  },
  get isStellarAccount() {
    return jest.requireMock('../../../selectors/accounts').isStellarAccount;
  },
  get isTronAccount() {
    return jest.requireMock('../../../selectors/accounts').isTronAccount;
  },
  get nonceSortedCompletedTransactionsSelector() {
    return jest.requireMock('../../../selectors/transactions')
      .nonceSortedCompletedTransactionsSelector;
  },
  get nonceSortedCompletedTransactionsSelectorAllChains() {
    return jest.requireMock('../../../selectors/transactions')
      .nonceSortedCompletedTransactionsSelectorAllChains;
  },
  get nonceSortedPendingTransactionsSelector() {
    return jest.requireMock('../../../selectors/transactions')
      .nonceSortedPendingTransactionsSelector;
  },
  get nonceSortedPendingTransactionsSelectorAllChains() {
    return jest.requireMock('../../../selectors/transactions')
      .nonceSortedPendingTransactionsSelectorAllChains;
  },
  get nonceSortedTransactionsSelector() {
    return jest.requireMock('../../../selectors/transactions')
      .nonceSortedTransactionsSelector;
  },
  get nonceSortedTransactionsSelectorAllChains() {
    return jest.requireMock('../../../selectors/transactions')
      .nonceSortedTransactionsSelectorAllChains;
  },
  get pendingApprovalsSortedSelector() {
    return jest.requireMock('../../../selectors/approvals')
      .pendingApprovalsSortedSelector;
  },
  get pendingConfirmationsSortedSelector() {
    return jest.requireMock('../../confirmations/selectors/confirm')
      .pendingConfirmationsSortedSelector;
  },
  get selectAllTokensFlat() {
    return jest.requireMock('../../../selectors/selectors').selectAllTokensFlat;
  },
  get selectAnyEnabledNetworksAreAvailable() {
    return jest.requireMock('../../../selectors/multichain/networks')
      .selectAnyEnabledNetworksAreAvailable;
  },
  get selectConversionRateByChainId() {
    return jest.requireMock('../../../selectors/selectors')
      .selectConversionRateByChainId;
  },
  get selectDappSwapComparisonData() {
    return jest.requireMock('../../confirmations/selectors/confirm')
      .selectDappSwapComparisonData;
  },
  get selectERC20TokensByChain() {
    return jest.requireMock('../../../selectors/selectors')
      .selectERC20TokensByChain;
  },
  get selectEnabledNetworksAsCaipChainIds() {
    return jest.requireMock('../../../selectors/multichain/networks')
      .selectEnabledNetworksAsCaipChainIds;
  },
  get selectEvmAddress() {
    return jest.requireMock('../../../selectors/accounts').selectEvmAddress;
  },
  get selectHasApprovalFlows() {
    return jest.requireMock('../../../selectors/approvals')
      .selectHasApprovalFlows;
  },
  get selectHasBatchSellQuotes() {
    return jest.requireMock('../../../selectors/selectors')
      .selectHasBatchSellQuotes;
  },
  get selectHasBridgeQuotes() {
    return jest.requireMock('../../../selectors/selectors')
      .selectHasBridgeQuotes;
  },
  get selectIsNetworkMenuOpen() {
    return jest.requireMock('../../../selectors/selectors')
      .selectIsNetworkMenuOpen;
  },
  get selectIsRedesignedConfirmationType() {
    return jest.requireMock('../../../selectors/transactions')
      .selectIsRedesignedConfirmationType;
  },
  get selectIsTickerWidgetFeatureEnabled() {
    return jest.requireMock('../../../selectors/selectors')
      .selectIsTickerWidgetFeatureEnabled;
  },
  get selectNetworkIdentifierByChainId() {
    return jest.requireMock('../../../selectors/selectors')
      .selectNetworkIdentifierByChainId;
  },
  get selectNftsByChainId() {
    return jest.requireMock('../../../selectors/selectors').selectNftsByChainId;
  },
  get selectNonEvmChainIds() {
    return jest.requireMock('../../../selectors/multichain/networks')
      .selectNonEvmChainIds;
  },
  get selectNonZeroUnusedApprovalsAllowList() {
    return jest.requireMock('../../../selectors/selectors')
      .selectNonZeroUnusedApprovalsAllowList;
  },
  get selectPendingApprovalsForNavigation() {
    return jest.requireMock('../../../selectors/approvals')
      .selectPendingApprovalsForNavigation;
  },
  get selectShowTickerWidget() {
    return jest.requireMock('../../../selectors/selectors')
      .selectShowTickerWidget;
  },
  get selectThrottledOrigins() {
    return jest.requireMock('../../../selectors/origin-throttling')
      .selectThrottledOrigins;
  },
  get selectTransactionAvailableBalance() {
    return jest.requireMock('../../../selectors/confirm-transaction')
      .selectTransactionAvailableBalance;
  },
  get selectTransactionFeeById() {
    return jest.requireMock('../../../selectors/confirm-transaction')
      .selectTransactionFeeById;
  },
  get selectTransactionMetadata() {
    return jest.requireMock('../../../selectors/transactions')
      .selectTransactionMetadata;
  },
  get selectTransactionSender() {
    return jest.requireMock('../../../selectors/transactions')
      .selectTransactionSender;
  },
  get selectedAddressTxListSelector() {
    return jest.requireMock('../../../selectors/transactions')
      .selectedAddressTxListSelector;
  },
  get selectedAddressTxListSelectorAllChain() {
    return jest.requireMock('../../../selectors/transactions')
      .selectedAddressTxListSelectorAllChain;
  },
  get smartTransactionsListSelector() {
    return jest.requireMock('../../../selectors/transactions')
      .smartTransactionsListSelector;
  },
  get submittedPendingTransactionsSelector() {
    return jest.requireMock('../../../selectors/transactions')
      .submittedPendingTransactionsSelector;
  },
  get transactionFeeSelector() {
    return jest.requireMock('../../../selectors/confirm-transaction')
      .transactionFeeSelector;
  },
  get transactionSubSelector() {
    return jest.requireMock('../../../selectors/transactions')
      .transactionSubSelector;
  },
  get transactionSubSelectorAllChains() {
    return jest.requireMock('../../../selectors/transactions')
      .transactionSubSelectorAllChains;
  },
  get transactionsSelector() {
    return jest.requireMock('../../../selectors/transactions')
      .transactionsSelector;
  },
  get transactionsSelectorAllChains() {
    return jest.requireMock('../../../selectors/transactions')
      .transactionsSelectorAllChains;
  },
  get txDataSelector() {
    return jest.requireMock('../../../selectors/confirm-transaction')
      .txDataSelector;
  },
  get unapprovedDecryptMsgsSelector() {
    return jest.requireMock('../../../selectors/transactions')
      .unapprovedDecryptMsgsSelector;
  },
  get unapprovedEncryptionPublicKeyMsgsSelector() {
    return jest.requireMock('../../../selectors/transactions')
      .unapprovedEncryptionPublicKeyMsgsSelector;
  },
  get unapprovedMessagesSelector() {
    return jest.requireMock('../../../selectors/transactions')
      .unapprovedMessagesSelector;
  },
  get unapprovedPersonalMsgsSelector() {
    return jest.requireMock('../../../selectors/transactions')
      .unapprovedPersonalMsgsSelector;
  },
  get unapprovedTypedMessagesSelector() {
    return jest.requireMock('../../../selectors/transactions')
      .unapprovedTypedMessagesSelector;
  },
  get unconfirmedTransactionsHashSelector() {
    return jest.requireMock('../../../selectors/confirm-transaction')
      .unconfirmedTransactionsHashSelector;
  },
  get unconfirmedTransactionsListSelector() {
    return jest.requireMock('../../../selectors/confirm-transaction')
      .unconfirmedTransactionsListSelector;
  },
} as {
  getUseExternalServices: jest.Mock;
};

const { getIsSecurityTrustTdpEnabled } = {
  // eslint-disable-next-line @typescript-eslint/naming-convention -- Preserve the module export name.
  get BFT_CHILD_PREFERENCES() {
    return jest.requireMock(
      '../../../../shared/lib/basic-functionality-consolidation',
    ).BFT_CHILD_PREFERENCES;
  },
  get getIsAdvancedChartsEnabled() {
    return jest.requireMock('../../../selectors/multichain/feature-flags')
      .getIsAdvancedChartsEnabled;
  },
  get getIsBasicFunctionalityConsolidationEnabled() {
    return jest.requireMock('../../../selectors/multichain/basic-functionality')
      .getIsBasicFunctionalityConsolidationEnabled;
  },
  get getIsBasicFunctionalityToggleEnabled() {
    return jest.requireMock('../../../selectors/multichain/basic-functionality')
      .getIsBasicFunctionalityToggleEnabled;
  },
  get getIsBitcoinSupportEnabled() {
    return jest.requireMock('../../../selectors/multichain/feature-flags')
      .getIsBitcoinSupportEnabled;
  },
  get getIsBitcoinTestnetSupportEnabled() {
    return jest.requireMock('../../../selectors/multichain/feature-flags')
      .getIsBitcoinTestnetSupportEnabled;
  },
  get getIsChainlistEnabled() {
    return jest.requireMock('../../../selectors/multichain/feature-flags')
      .getIsChainlistEnabled;
  },
  get getIsDiscoverSearchEnabled() {
    return jest.requireMock('../../../selectors/multichain/feature-flags')
      .getIsDiscoverSearchEnabled;
  },
  get getIsNetworkManagementEnabled() {
    return jest.requireMock('../../../selectors/multichain/feature-flags')
      .getIsNetworkManagementEnabled;
  },
  get getIsSecurityTrustTdpEnabled() {
    return jest.requireMock('../../../selectors/multichain/feature-flags')
      .getIsSecurityTrustTdpEnabled;
  },
  get getIsSolanaSupportEnabled() {
    return jest.requireMock('../../../selectors/multichain/feature-flags')
      .getIsSolanaSupportEnabled;
  },
  get getIsSolanaTestnetSupportEnabled() {
    return jest.requireMock('../../../selectors/multichain/feature-flags')
      .getIsSolanaTestnetSupportEnabled;
  },
  get getIsStellarSupportEnabled() {
    return jest.requireMock('../../../selectors/multichain/feature-flags')
      .getIsStellarSupportEnabled;
  },
  get getIsTokenManagementFilterEnabled() {
    return jest.requireMock('../../../selectors/multichain/feature-flags')
      .getIsTokenManagementFilterEnabled;
  },
  get getIsTransactionLabelsEnabled() {
    return jest.requireMock('../../../selectors/multichain/feature-flags')
      .getIsTransactionLabelsEnabled;
  },
  get getIsTronSupportEnabled() {
    return jest.requireMock('../../../selectors/multichain/feature-flags')
      .getIsTronSupportEnabled;
  },
  get getIsTronTestnetSupportEnabled() {
    return jest.requireMock('../../../selectors/multichain/feature-flags')
      .getIsTronTestnetSupportEnabled;
  },
  get getShouldShowBasicFunctionalityMigrationModal() {
    return jest.requireMock('../../../selectors/multichain/basic-functionality')
      .getShouldShowBasicFunctionalityMigrationModal;
  },
  get getShouldShowBasicFunctionalityMigrationToast() {
    return jest.requireMock('../../../selectors/multichain/basic-functionality')
      .getShouldShowBasicFunctionalityMigrationToast;
  },
} as {
  getIsSecurityTrustTdpEnabled: jest.Mock;
};

const mockUseSelector = jest.fn();

let mockLocationState: Record<string, unknown> | null = null;

let mockRouteParams = {
  chainId: 'eip155:1',
  asset: 'eip155:1/erc20:0xabc',
};

jest.mock('react-redux', () => ({
  useSelector: (selector: unknown) => mockUseSelector(selector),
}));

jest.mock('react-router-dom', () => ({
  useLocation: () => ({
    pathname: '/asset/eip155:1/eip155%3A1%2Ferc20%3A0xabc/security-trust',
    state: mockLocationState,
  }),
  useParams: () => mockRouteParams,
}));

jest.mock('../../../hooks/useTokenSecurityData', () => ({
  useTokenSecurityData: jest.fn(),
}));

jest.mock('../../../selectors/assets', () => ({
  getFungibleAssetForRoute: jest.fn(),
}));

jest.mock('../../../../shared/lib/selectors/networks', () => ({
  getNetworkConfigurationsByChainId: jest.fn(),
}));

jest.mock('../../../selectors/multichain/networks', () => ({
  getAllMultichainNetworkConfigurations: jest.fn(),
}));

const mockUseTokenSecurityData = jest.mocked(useTokenSecurityData);

const assetId = 'eip155:1/erc20:0xabc' as CaipAssetType;

const baseSecurityData: TokenSecurityData = {
  resultType: 'Verified',
  maliciousScore: '0',
  features: [],
  fees: {
    transfer: 0,
    transferFeeMaxAmount: null,
    buy: 0,
    sell: null,
  },
  financialStats: {
    supply: 1000000,
    topHolders: [],
    holdersCount: 100,
    tradeVolume24h: null,
    lockedLiquidityPct: null,
    markets: [],
  },
  metadata: {
    externalLinks: {
      homepage: null,
      twitterPage: null,
      telegramChannelId: null,
    },
  },
  created: '2020-01-01T00:00:00.000Z',
};

const multichainNetworks = {
  'eip155:1': {
    chainId: 'eip155:1',
    name: 'Ethereum Mainnet',
    defaultBlockExplorerUrlIndex: 0,
    blockExplorerUrls: ['https://etherscan.io'],
  },
};

const routeAsset: Token = {
  symbol: 'AAVE',
  decimals: 18,
  address: '0xabc',
  image: '',
  chainId: '0x1',
  isNative: false,
};

describe('useSecurityTrustPageData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.restoreAllMocks();

    mockLocationState = null;

    mockRouteParams = {
      chainId: 'eip155:1',
      asset: 'eip155:1/erc20:0xabc',
    };

    mockUseTokenSecurityData.mockReturnValue({
      securityData: baseSecurityData,
      isLoading: false,
      error: null,
      symbol: 'USDC',
      decimals: 6,
      address: '0xabc',
      isNative: false,
    });

    mockUseSelector.mockImplementation((selector) => {
      if (selector === getUseExternalServices) {
        return true;
      }

      if (selector === getIsSecurityTrustTdpEnabled) {
        return true;
      }

      if (selector === getAllMultichainNetworkConfigurations) {
        return multichainNetworks;
      }

      if (selector === getNetworkConfigurationsByChainId) {
        return {
          '0x1': {
            chainId: '0x1',
            name: 'Ethereum Mainnet Hex',
            defaultBlockExplorerUrlIndex: 0,
            blockExplorerUrls: ['https://etherscan.io'],
          },
        };
      }

      if (typeof selector === 'function') {
        return getFungibleAssetForRoute(
          { metamask: {} },
          {
            assetId,
            chainId: 'eip155:1',
            decodedAsset: '0xabc',
          },
        );
      }

      return undefined;
    });

    jest.mocked(getFungibleAssetForRoute).mockReturnValue(routeAsset);
  });

  it('falls back to route asset metadata when location state is missing', () => {
    mockUseTokenSecurityData.mockReturnValue({
      securityData: baseSecurityData,
      isLoading: false,
      error: null,
      symbol: undefined,
      decimals: undefined,
      address: undefined,
      isNative: undefined,
    });

    const { result } = renderHook(() => useSecurityTrustPageData());

    expect(result.current.symbol).toBe('AAVE');
    expect(result.current.decimals).toBe(18);
    expect(result.current.networkName).toBe('Ethereum Mainnet');
    expect(result.current.blockExplorerLink?.name).toBe('Ethereum Mainnet');
    expect(result.current.blockExplorerLink?.url).toContain('etherscan.io');
  });

  it('uses fetched token metadata when route asset is unavailable', () => {
    jest.mocked(getFungibleAssetForRoute).mockReturnValue(null);

    const { result } = renderHook(() => useSecurityTrustPageData());

    expect(result.current.symbol).toBe('USDC');
    expect(result.current.decimals).toBe(6);
    expect(result.current.networkName).toBe('Ethereum Mainnet');
    expect(result.current.blockExplorerLink?.url).toContain('etherscan.io');
  });

  it('requests security data for the route asset id', () => {
    renderHook(() => useSecurityTrustPageData());

    expect(mockUseTokenSecurityData).toHaveBeenCalledWith({
      assetId,
      prefetchedData: undefined,
    });
  });

  it('derives CAIP chainId from route when location state is missing', () => {
    const { result } = renderHook(() => useSecurityTrustPageData());

    expect(result.current.chainId).toBe('eip155:1');
  });

  it('derives CAIP chainId for non-EVM routes without location state', () => {
    mockRouteParams = {
      chainId: SolScope.Mainnet,
      asset: `${SolScope.Mainnet}/spl:So11111111111111111111111111111111111111112`,
    };

    mockUseTokenSecurityData.mockReturnValue({
      securityData: baseSecurityData,
      isLoading: false,
      error: null,
      symbol: 'SOL',
      decimals: 9,
      address: 'So11111111111111111111111111111111111111112',
      isNative: false,
    });

    const { result } = renderHook(() => useSecurityTrustPageData());

    expect(result.current.chainId).toBe(SolScope.Mainnet);
    expect(result.current.blockExplorerLink?.url).toContain('solscan.io');
  });

  it('falls back to EVM network config when CAIP chain id is unavailable', () => {
    jest
      .spyOn(securityTrustUtils, 'toSecurityTrustChainId')
      .mockReturnValue(undefined);
    mockRouteParams = {
      chainId: '0x1',
      asset: '0xabc',
    };

    const { result } = renderHook(() => useSecurityTrustPageData());

    expect(result.current.networkName).toBe('Ethereum Mainnet Hex');
  });

  it('returns undefined network name when CAIP and hex lookups are unavailable', () => {
    jest
      .spyOn(securityTrustUtils, 'toSecurityTrustChainId')
      .mockReturnValue(undefined);
    mockRouteParams = {
      chainId: SolScope.Mainnet,
      asset: `${SolScope.Mainnet}/spl:So11111111111111111111111111111111111111112`,
    };

    const { result } = renderHook(() => useSecurityTrustPageData());

    expect(result.current.networkName).toBeUndefined();
  });

  it('does not request security data when feature is disabled', () => {
    mockUseSelector.mockImplementation((selector) => {
      if (selector === getUseExternalServices) {
        return true;
      }

      if (selector === getIsSecurityTrustTdpEnabled) {
        return false;
      }

      if (selector === getAllMultichainNetworkConfigurations) {
        return multichainNetworks;
      }

      if (selector === getNetworkConfigurationsByChainId) {
        return {
          '0x1': {
            chainId: '0x1',
            name: 'Ethereum Mainnet Hex',
            defaultBlockExplorerUrlIndex: 0,
            blockExplorerUrls: ['https://etherscan.io'],
          },
        };
      }

      if (typeof selector === 'function') {
        return getFungibleAssetForRoute(
          { metamask: {} },
          {
            assetId,
            chainId: 'eip155:1',
            decodedAsset: '0xabc',
          },
        );
      }

      return undefined;
    });

    renderHook(() => useSecurityTrustPageData());

    expect(mockUseTokenSecurityData).toHaveBeenCalledWith({
      assetId: null,
      prefetchedData: undefined,
    });
  });

  it('does not request security data when external services are disabled', () => {
    mockUseSelector.mockImplementation((selector) => {
      if (selector === getUseExternalServices) {
        return false;
      }

      if (selector === getIsSecurityTrustTdpEnabled) {
        return true;
      }

      if (selector === getAllMultichainNetworkConfigurations) {
        return multichainNetworks;
      }

      if (selector === getNetworkConfigurationsByChainId) {
        return {
          '0x1': {
            chainId: '0x1',
            name: 'Ethereum Mainnet Hex',
            defaultBlockExplorerUrlIndex: 0,
            blockExplorerUrls: ['https://etherscan.io'],
          },
        };
      }

      if (typeof selector === 'function') {
        return getFungibleAssetForRoute(
          { metamask: {} },
          {
            assetId,
            chainId: 'eip155:1',
            decodedAsset: '0xabc',
          },
        );
      }

      return undefined;
    });

    renderHook(() => useSecurityTrustPageData());

    expect(mockUseTokenSecurityData).toHaveBeenCalledWith({
      assetId: null,
      prefetchedData: undefined,
    });
  });
});
