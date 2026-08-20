import log from 'loglevel';
import { Messenger } from '@metamask/messenger';
import {
  AddNetworkFields,
  NetworkConfiguration,
  NetworkControllerAddNetworkAction,
  NetworkControllerFindNetworkClientIdByChainIdAction,
  NetworkControllerGetNetworkClientByIdAction,
  NetworkControllerGetNetworkConfigurationByNetworkClientIdAction,
  NetworkControllerGetSelectedNetworkClientAction,
  NetworkControllerGetStateAction,
  NetworkControllerLookupNetworkAction,
  NetworkControllerResetConnectionAction,
  NetworkControllerSetActiveNetworkAction,
  Provider,
} from '@metamask/network-controller';
import {
  NetworkEnablementControllerActions,
  NetworkEnablementControllerEnableAllPopularNetworksAction,
  NetworkEnablementControllerEnableNetworkAction,
  NetworkEnablementControllerGetStateAction,
  NetworkEnablementControllerIsNetworkEnabledAction,
  NetworkEnablementControllerState,
  NetworkEnablementControllerStateChangeEvent,
} from '@metamask/network-enablement-controller';
import { SelectedNetworkControllerGetNetworkClientIdForDomainAction } from '@metamask/selected-network-controller';
import {
  add0x,
  bytesToHex,
  CaipAccountId,
  CaipChainId,
  Hex,
  hexToBytes,
  Json,
  NonEmptyArray,
  parseCaipAccountId,
} from '@metamask/utils';
import { Mutex } from 'async-mutex';
import { wordlist } from '@metamask/scure-bip39/dist/wordlists/english';
import {
  BtcAccountType,
  isEvmAccountType,
  SolAccountType,
  TrxAccountType,
} from '@metamask/keyring-api';
import {
  AccountImportStrategy,
  KeyringControllerAddNewKeyringAction,
  KeyringControllerChangePasswordAction,
  KeyringControllerExportAccountAction,
  KeyringControllerExportEncryptionKeyAction,
  KeyringControllerExportSeedPhraseAction,
  KeyringControllerGetKeyringForAccountAction,
  KeyringControllerGetKeyringsByTypeAction,
  KeyringControllerGetStateAction,
  KeyringControllerImportAccountWithStrategyAction,
  KeyringControllerRemoveAccountAction,
  KeyringControllerWithControllerAction,
  KeyringControllerWithKeyringV2Action,
  KeyringControllerWithKeyringV2UnsafeAction,
  KeyringControllerSetLockedAction,
  KeyringControllerSignEip7702AuthorizationAction,
  KeyringControllerSubmitEncryptionKeyAction,
  KeyringControllerSubmitPasswordAction,
  KeyringControllerVerifyPasswordAction,
  KeyringControllerWithKeyringAction,
} from '@metamask/keyring-controller';
import {
  AccountsControllerGetAccountAction,
  AccountsControllerGetAccountByAddressAction,
  AccountsControllerGetSelectedAccountAction,
  AccountsControllerGetStateAction,
  AccountsControllerListAccountsAction,
  AccountsControllerSetAccountNameAction,
  AccountsControllerSetSelectedAccountAction,
  AccountsControllerUpdateAccountsAction,
} from '@metamask/accounts-controller';
import { OneKeyKeyring, TrezorKeyring } from '@metamask/eth-trezor-keyring';
import {
  AccountPage,
  LedgerKeyring,
} from '@metamask/eth-ledger-bridge-keyring';
import LatticeKeyring from 'eth-lattice-keyring';
import { QrKeyring } from '@metamask/eth-qr-keyring';
import { LedgerKeyring as LedgerKeyringV2 } from '@metamask/eth-ledger-bridge-keyring/v2';
import {
  TrezorKeyring as TrezorKeyringV2,
  OneKeyKeyring as OneKeyKeyringV2,
} from '@metamask/eth-trezor-keyring/v2';
import { QrKeyring as QrKeyringV2 } from '@metamask/eth-qr-keyring/v2';
import { KeyringType } from '@metamask/keyring-api/v2';
import { normalize } from '@metamask/eth-sig-util';
import {
  TransactionContainerType,
  TransactionControllerAddTransactionAction,
  TransactionControllerAddTransactionBatchAction,
  TransactionControllerClearUnapprovedTransactionsAction,
  TransactionControllerEstimateGasAction,
  TransactionControllerGetNonceLockAction,
  TransactionControllerGetStateAction,
  TransactionControllerIsAtomicBatchSupportedAction,
  TransactionControllerUnapprovedTransactionAddedEvent,
  TransactionControllerUpdateEditableParamsAction,
  TransactionControllerUpdateSecurityAlertResponseAction,
  TransactionControllerWipeTransactionsAction,
  type TransactionMeta,
  type TransactionParams,
} from '@metamask/transaction-controller';
import {
  UserOperationControllerAddUserOperationFromTransactionAction,
  UserOperationControllerStartPollingByNetworkClientIdAction,
} from '@metamask/user-operation-controller';
import {
  GetSignatureState,
  SignatureStateChange,
} from '@metamask/signature-controller';
import {
  AssetsContractControllerGetTokenStandardAndDetailsAction,
  CurrencyRateControllerSetCurrentCurrencyAction,
  GetTokenListState,
  TokenDetectionControllerDisableAction,
  TokenDetectionControllerEnableAction,
  TokensControllerGetStateAction,
} from '@metamask/assets-controllers';
import {
  AccountId,
  Asset,
  AssetsControllerGetAssetsAction,
  AssetsControllerGetStateAction,
  AssetsControllerSetSelectedCurrencyAction,
  Caip19AssetId,
} from '@metamask/assets-controller';
import type { InternalAccount } from '@metamask/keyring-internal-api';
import { SupportedCurrency } from '@metamask/core-backend';
import { RemoteFeatureFlagControllerGetStateAction } from '@metamask/remote-feature-flag-controller';
import {
  PhishingControllerMaybeUpdateStateAction,
  PhishingControllerScanAddressAction,
  PhishingControllerTestOriginAction,
} from '@metamask/phishing-controller';
import {
  ApprovalControllerAcceptRequestAction,
  ApprovalControllerAddAction,
  ApprovalControllerGetStateAction,
  ApprovalControllerHasRequestAction,
  ApprovalControllerRejectRequestAction,
  ApprovalRequestNotFoundError,
} from '@metamask/approval-controller';
import { SmartTransactionsControllerWipeSmartTransactionsAction } from '@metamask/smart-transactions-controller';
import { BridgeStatusControllerWipeBridgeStatusAction } from '@metamask/bridge-status-controller';
import {
  EncAccountDataType,
  InvalidPrimarySecretDataTypeError,
  RecoveryError,
  SecretMetadata,
  SecretType,
  SeedlessOnboardingControllerAddNewSecretDataAction,
  SeedlessOnboardingControllerChangePasswordAction,
  SeedlessOnboardingControllerCheckIsPasswordOutdatedAction,
  SeedlessOnboardingControllerClearStateAction,
  SeedlessOnboardingControllerCreateToprfKeyAndBackupSeedPhraseAction,
  SeedlessOnboardingControllerErrorMessage,
  SeedlessOnboardingControllerFetchAllSecretDataAction,
  SeedlessOnboardingControllerGetSecretDataBackupStateAction,
  SeedlessOnboardingControllerGetStateAction,
  SeedlessOnboardingControllerLoadKeyringEncryptionKeyAction,
  SeedlessOnboardingControllerRevokePendingRefreshTokensAction,
  SeedlessOnboardingControllerRunMigrationsAction,
  SeedlessOnboardingControllerSetLockedAction,
  SeedlessOnboardingControllerStoreKeyringEncryptionKeyAction,
  SeedlessOnboardingControllerSubmitGlobalPasswordAction,
  SeedlessOnboardingControllerSubmitPasswordAction,
  SeedlessOnboardingControllerSyncLatestGlobalPasswordAction,
  SeedlessOnboardingControllerUpdateBackupMetadataStateAction,
} from '@metamask/seedless-onboarding-controller';
import {
  CaveatSpecificationConstraint,
  ExtractPermission,
  OriginString,
  PermissionControllerAcceptPermissionsRequestAction,
  PermissionControllerClearStateAction,
  PermissionControllerRejectPermissionsRequestAction,
  PermissionControllerRevokePermissionsAction,
  PermissionControllerUpdatePermissionsByCaveatAction,
  PermissionSpecificationConstraint,
  PermissionsRequest,
  PermissionsRequestNotFoundError,
} from '@metamask/permission-controller';
import {
  Caip25CaveatMutators,
  Caip25CaveatType,
  Caip25CaveatValue,
} from '@metamask/chain-agnostic-permission';
import { SnapId } from '@metamask/snaps-sdk';
import {
  SnapControllerClearStateAction,
  SnapInterfaceControllerDeleteInterfaceAction,
} from '@metamask/snaps-controllers';
import { DIALOG_APPROVAL_TYPES } from '@metamask/snaps-rpc-methods';
import {
  ApprovalType,
  ERC20,
  ERC721,
  ERC1155,
} from '@metamask/controller-utils';
import {
  MultichainAccountServiceAlignWalletsAction,
  MultichainAccountServiceCreateMultichainAccountWalletAction,
  MultichainAccountServiceGetMultichainAccountWalletAction,
  MultichainAccountServiceInitAction,
  MultichainAccountServiceRemoveMultichainAccountWalletAction,
  MultichainAccountServiceResyncAccountsAction,
} from '@metamask/multichain-account-service';
import {
  AccountTreeControllerClearStateAction,
  AccountTreeControllerGetSelectedAccountGroupAction,
  AccountTreeControllerInitAction,
  AccountTreeControllerReinitAction,
  AccountTreeControllerSyncWithUserStorageAction,
  AccountTreeControllerSyncWithUserStorageAtLeastOnceAction,
} from '@metamask/account-tree-controller';
import {
  errorCodes,
  JsonRpcError,
  providerErrors,
  rpcErrors,
} from '@metamask/rpc-errors';
import {
  AuthenticationControllerGetBearerTokenAction,
  AuthenticationControllerGetStateAction,
  AuthenticationControllerPerformSignOutAction,
} from '@metamask/profile-sync-controller/auth';
import {
  SubscriptionControllerClearStateAction,
  SubscriptionControllerGetStateAction,
  SubscriptionControllerGetSubscriptionByProductAction,
  SubscriptionControllerStopAllPollingAction,
} from '@metamask/subscription-controller';
import {
  ShieldControllerClearStateAction,
  ShieldControllerStartAction,
  ShieldControllerStopAction,
} from '@metamask/shield-controller';
import { ClaimsControllerClearStateAction } from '@metamask/claims-controller';
import { AddressBookControllerClearAction } from '@metamask/address-book-controller';
import {
  GasFeeControllerDisableNonRPCGasFeeApisAction,
  GasFeeControllerEnableNonRPCGasFeeApisAction,
} from '@metamask/gas-fee-controller';
import { DelegationControllerSignDelegationAction } from '@metamask/delegation-controller';
import type {
  PasskeyAuthenticationResponse,
  PasskeyControllerChangePasswordWithPasskeyVerificationAction,
  PasskeyControllerClearStateAction,
  PasskeyControllerExportSeedPhraseWithPasskeyAction,
  PasskeyControllerUnlockWithPasskeyAction,
} from '@metamask/passkey-controller';
import { cloneDeep, merge } from 'lodash';
import {
  convertEnglishWordlistIndicesToCodepoints,
  isPublicEndpointUrl,
} from '../lib/util';
import {
  getIsAssetsUnifiedStateIncludedInBuild,
  getIsSeedlessOnboardingFeatureEnabled,
} from '../../../shared/lib/environment';
import { getIsShieldSubscriptionActive } from '../../../shared/lib/shield/subscription-utils';
import { getAllEnabledNetworkClientIds } from '../../../shared/lib/network.utils';
import { getTokensControllerAllTokens } from '../../../shared/lib/selectors/assets-migration';
import { STATIC_MAINNET_TOKEN_LIST } from '../../../shared/constants/tokens';
import {
  fetchTokenBalance,
  fetchERC1155Balance,
} from '../../../shared/lib/token-util';
import { isEqualCaseInsensitive } from '../../../shared/lib/string-utils';
import { CHAIN_IDS } from '../../../shared/constants/network';
import { DecodedTransactionDataResponse } from '../../../shared/types/transaction-decode';
import { captureException } from '../../../shared/lib/sentry';
import {
  ASSETS_UNIFY_STATE_VERSION_1,
  AssetsUnifyStateFeatureFlag,
  isAssetsUnifyStateFeatureEnabled as getIsAssetsUnifyStateFeatureEnabled,
} from '../../../shared/lib/assets-unify-state/remote-feature-flag';
import { SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES } from '../../../shared/constants/app';
import { LedgerHandlerMode } from '../../../shared/constants/offscreen-communication';
import { MINUTE } from '../../../shared/constants/time';
import { KeyringType as KeyringTypes } from '../../../shared/constants/keyring';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventFragment,
  MetaMetricsEventName,
} from '../../../shared/constants/metametrics';
import { restrictKeyringForDeviceRead } from '../lib/hardware-device-read-keyring';
import type { UsePPOMAction } from '../lib/ppom/ppom-util';
import {
  OnboardingControllerGetIsSocialLoginFlowAction,
  OnboardingControllerResetOnboardingAction,
} from '../controllers/onboarding-method-action-types';
import { getAccountsBySnapId } from '../lib/snap-keyring';
import {
  getSentinelNetworkFlags,
  isSendBundleSupported,
  type SentinelNetwork,
} from '../lib/transaction/sentinel-api';
import { openUpdateTabAndReload } from '../lib/open-update-tab-and-reload';
import { applyTransactionContainers } from '../lib/transaction/containers/util';
import { isRelaySupported } from '../lib/transaction/transaction-relay';
import { decodeTransactionData } from '../lib/transaction/decode/util';
import {
  addTransaction as addTransactionToPipeline,
  type AddTransactionOptions,
  type AddTransactionRequest,
} from '../lib/transaction/util';
import { TransactionControllerInitMessenger } from '../wallet-init/messengers/transaction-controller-messenger';
import {
  PreferencesControllerAddReferralApprovedAccountAction,
  PreferencesControllerAddReferralDeclinedAccountAction,
  PreferencesControllerAddReferralPassedAccountAction,
  PreferencesControllerRemoveReferralDeclinedAccountAction,
  PreferencesControllerResetStateAction,
  PreferencesControllerSetAccountsReferralApprovedAction,
  PreferencesControllerSetPasswordForgottenAction,
  PreferencesControllerToggleExternalServicesAction,
} from '../controllers/preferences-controller-method-action-types';
import {
  PreferencesControllerGetStateAction,
  ReferralStatus,
} from '../controllers/preferences-controller';
import { OnboardingControllerGetStateAction } from '../controllers/onboarding';
import {
  MetaMetricsControllerCreateEventFragmentAction,
  MetaMetricsControllerGetEventFragmentByIdAction,
  MetaMetricsControllerUpdateEventFragmentAction,
  MetaMetricsControllerBufferedEndTraceAction,
  MetaMetricsControllerBufferedTraceAction,
} from '../controllers/metametrics-controller-method-action-types';
import { createEventBuilder, trackEvent } from '../controllers/analytics';
import {
  DefiReferralPartner,
  DefiReferralPartnerConfig,
  getPartnerByOrigin,
} from '../../../shared/constants/defi-referrals';
import { checkGmxHasReferralCode } from '../lib/defi-referrals/referral-onchain-check';
import { checkHyperliquidHasReferralCode } from '../lib/defi-referrals/referral-api-check';
import { ReferralTriggerType } from '../lib/defi-referrals/createDefiReferralMiddleware';
import { runSeedlessOnboardingMigrations } from '../lib/seedless-onboarding/run-migrations';
import { createSentryError } from '../../../shared/lib/error';
import {
  encodeDisabledDelegationsCheck,
  decodeDisabledDelegationsResult,
} from '../../../shared/lib/delegation/delegation';
import {
  endTrace,
  getPerformanceTimestamp,
  TraceName,
  TraceOperation,
  trace,
} from '../../../shared/lib/trace';
import {
  AppStateControllerAddAddressSecurityAlertResponseAction,
  AppStateControllerAddSignatureSecurityAlertResponseAction,
  AppStateControllerGetAddressSecurityAlertResponseAction,
  AppStateControllerGetIsWalletResetInProgressAction,
  AppStateControllerSetIsWalletResetInProgressAction,
  AppStateControllerSetPasskeyAutoUnlockSuppressedAction,
  AppStateControllerSetTrezorModelAction,
} from '../controllers/app-state-controller-method-action-types';
import { AppStateControllerGetStateAction } from '../controllers/app-state-controller';
import { AccountOrderControllerUpdateHiddenAccountsListAction } from '../controllers/account-order-method-action-types';
import { PASSKEY_AUTO_UNLOCK_SUPPRESSION_DURATION_MS } from '../../../shared/constants/passkey';
import {
  HardwareDeviceNames,
  LedgerTransportTypes,
  LEDGER_LIVE_PATH,
} from '../../../shared/constants/hardware-wallets';
import {
  HardwareWalletType,
  isUserRejectedHardwareWalletError,
  toHardwareWalletError,
} from '../../../shared/lib/hardware-wallets';
import { isDmkFeatureEnabled } from '../../../shared/lib/hardware-wallets/feature-flags';
import { getManifestFlags } from '../../../shared/lib/manifestFlags';
import { getProviderConfig } from '../../../shared/lib/selectors/networks';
import {
  LatticeKeyringV2,
  LatticeCreateAccountOptions,
} from '../lib/offscreen-bridge/lattice-keyring-v2';
import { LegacyBackgroundApiServiceMethodActions } from './legacy-background-api-service-method-action-types';

const serviceName = 'LegacyBackgroundApiService';

/**
 * The union of the V2 hardware keyring wrapper types that
 * {@link LegacyBackgroundApiService.#withKeyringForDevice} can operate on.
 */
type HardwareKeyringV2 =
  | LedgerKeyringV2
  | TrezorKeyringV2
  | OneKeyKeyringV2
  | QrKeyringV2
  | LatticeKeyringV2;

/**
 * Upper bound (ms) on lock-free hardware device reads (address paging,
 * status/feature probes). Device reads may legitimately wait on user
 * interaction (PIN or passphrase entry), so the bound is generous; it exists
 * to fail abandoned requests with an actionable error instead of leaving the
 * UI waiting forever. See {@link LegacyBackgroundApiService.#withKeyringForDevice}.
 */
export const HARDWARE_DEVICE_READ_TIMEOUT_MS = 5 * MINUTE;

/**
 * Token metadata merged from the static token list, the dynamic token list and
 * the user's tokens, used to decide how a token should be treated.
 */
type MergedTokenDetails = {
  standard?: string;
  erc20?: boolean;
  erc721?: boolean;
  decimals?: number;
  symbol?: string;
};

/**
 * The intermediate token details assembled while resolving a token's standard,
 * before the final `decimals`/`balance` are normalized to strings.
 */
type WorkingTokenDetails = {
  address?: string;
  balance?: unknown;
  standard?: string;
  decimals?: unknown;
  symbol?: string;
  name?: string;
  tokenURI?: string;
};

/**
 * The token standard and details returned to the client.
 */
type TokenStandardAndDetails = {
  address?: string;
  standard?: string;
  symbol?: string;
  name?: string;
  tokenURI?: string;
  decimals?: string;
  balance?: string;
};

/**
 * The methods that the {@link LegacyBackgroundApiService} exposes to the messenger.
 * This is currently empty, but it can be extended in the future to replace `MetaMaskController.getApi()`.
 */
const MESSENGER_EXPOSED_METHODS = [
  'acceptPermissionsRequest',
  'addNetwork',
  'addTransaction',
  'addTransactionAndWaitForPublish',
  'applyTransactionContainersExisting',
  'attemptLedgerTransportCreation',
  'captureTestError',
  'changePassword',
  'changePasswordWithPasskeyVerification',
  'checkDelegationDisabled',
  'checkHardwareStatus',
  'checkIsSeedlessPasswordOutdated',
  'connectHardware',
  'createNewVaultAndGetSeedPhrase',
  'createNewVaultAndKeychain',
  'createNewVaultAndRestore',
  'createSeedPhraseBackup',
  'decodeTransactionData',
  'discoverAndCreateAccounts',
  'estimateGas',
  'exportAccount',
  'exportSeedPhraseWithPasskey',
  'forgetDevice',
  'getAccountsBySnapId',
  'getAppNameAndVersion',
  'getAssets',
  'getCode',
  'getGlobalChainId',
  'getHdPathForLedgerKeyring',
  'getLedgerAppConfiguration',
  'getLedgerMode',
  'getLedgerPublicKey',
  'getNextNonce',
  'getOpenMetamaskTabsIds',
  'getPhishingResult',
  'getRequestAccountTabIds',
  'getSeedPhrase',
  'getSentinelNetworkFlags',
  'getTokenStandardAndDetails',
  'getTokenStandardAndDetailsByChain',
  'getTokenSymbol',
  'getTrezorFeatures',
  'handleDefiReferral',
  'handleDefiReferralOnPermittedAccountsAdded',
  'importAccountWithStrategy',
  'importMnemonicToVault',
  'isAssetsUnifyStateEnabled',
  'isPublicEndpointUrl',
  'isRelaySupported',
  'isSendBundleSupported',
  'lookupSelectedNetworks',
  'markNotificationPopupAsAutomaticallyClosed',
  'markPasswordForgotten',
  'onAccountRemoved',
  'approveHardwareWalletTransaction',
  'openUpdateTabAndReload',
  'rejectAllPendingApprovals',
  'rejectPendingApproval',
  'rejectPermissionsRequest',
  'resolvePendingApproval',
  'removeAccount',
  'removePermissionsFor',
  'requestSafeReload',
  'resetAccount',
  'resetWallet',
  'restoreSocialBackupAndGetSeedPhrase',
  'setAccountLabel',
  'setCurrentCurrency',
  'setEnabledAllPopularNetworks',
  'setEnabledNetworks',
  'setLocked',
  'setSelectedInternalAccount',
  'submitPasswordOrEncryptionKey',
  'syncKeyringEncryptionKey',
  'syncPasswordAndUnlockWallet',
  'syncSeedPhrases',
  'throwTestError',
  'toggleExternalServices',
  'unlockWithPasskey',
  'unMarkPasswordForgotten',
  'unlockAndGetSeedPhrase',
  'unlockHardwareWalletAccount',
  'upsertTransactionUIMetricsFragment',
] as const;

/**
 * The actions that the {@link LegacyBackgroundApiService} can handle.
 */
export type LegacyBackgroundApiServiceActions =
  LegacyBackgroundApiServiceMethodActions;

// `@metamask/network-enablement-controller`@6.0.0 defines this action type but
// omits it from the package's public exports, so derive it from the exported
// actions union. Import it directly once the package re-exports
// `NetworkEnablementControllerRestoreEnabledNetworkMapAction`.
type NetworkEnablementControllerRestoreEnabledNetworkMapAction = Extract<
  NetworkEnablementControllerActions,
  { type: 'NetworkEnablementController:restoreEnabledNetworkMap' }
>;

type AllowedActions =
  | AccountOrderControllerUpdateHiddenAccountsListAction
  | AccountTreeControllerClearStateAction
  | AccountTreeControllerGetSelectedAccountGroupAction
  | AccountTreeControllerInitAction
  | AccountTreeControllerReinitAction
  | AccountTreeControllerSyncWithUserStorageAction
  | AccountTreeControllerSyncWithUserStorageAtLeastOnceAction
  | AccountsControllerGetAccountAction
  | AccountsControllerGetAccountByAddressAction
  | AccountsControllerGetSelectedAccountAction
  | AccountsControllerGetStateAction
  | AccountsControllerListAccountsAction
  | AccountsControllerSetAccountNameAction
  | AccountsControllerSetSelectedAccountAction
  | AccountsControllerUpdateAccountsAction
  | AddressBookControllerClearAction
  | ApprovalControllerAcceptRequestAction
  | ApprovalControllerAddAction
  | ApprovalControllerGetStateAction
  | ApprovalControllerHasRequestAction
  | ApprovalControllerRejectRequestAction
  | AppStateControllerAddAddressSecurityAlertResponseAction
  | AppStateControllerAddSignatureSecurityAlertResponseAction
  | AppStateControllerGetAddressSecurityAlertResponseAction
  | AppStateControllerGetIsWalletResetInProgressAction
  | AppStateControllerGetStateAction
  | AppStateControllerSetIsWalletResetInProgressAction
  | AppStateControllerSetPasskeyAutoUnlockSuppressedAction
  | AppStateControllerSetTrezorModelAction
  | AssetsContractControllerGetTokenStandardAndDetailsAction
  | AssetsControllerGetAssetsAction
  | AssetsControllerGetStateAction
  | AssetsControllerSetSelectedCurrencyAction
  | AuthenticationControllerGetBearerTokenAction
  | AuthenticationControllerGetStateAction
  | AuthenticationControllerPerformSignOutAction
  | BridgeStatusControllerWipeBridgeStatusAction
  | ClaimsControllerClearStateAction
  | CurrencyRateControllerSetCurrentCurrencyAction
  | DelegationControllerSignDelegationAction
  | GasFeeControllerDisableNonRPCGasFeeApisAction
  | GasFeeControllerEnableNonRPCGasFeeApisAction
  | KeyringControllerAddNewKeyringAction
  | KeyringControllerChangePasswordAction
  | KeyringControllerExportAccountAction
  | KeyringControllerExportEncryptionKeyAction
  | KeyringControllerExportSeedPhraseAction
  | KeyringControllerGetKeyringForAccountAction
  | KeyringControllerGetKeyringsByTypeAction
  | KeyringControllerGetStateAction
  | KeyringControllerImportAccountWithStrategyAction
  | KeyringControllerRemoveAccountAction
  | KeyringControllerWithControllerAction
  | KeyringControllerWithKeyringV2Action
  | KeyringControllerWithKeyringV2UnsafeAction
  | MetaMetricsControllerCreateEventFragmentAction
  | MetaMetricsControllerGetEventFragmentByIdAction
  | MetaMetricsControllerUpdateEventFragmentAction
  | KeyringControllerSetLockedAction
  | KeyringControllerSignEip7702AuthorizationAction
  | KeyringControllerSubmitEncryptionKeyAction
  | KeyringControllerSubmitPasswordAction
  | KeyringControllerVerifyPasswordAction
  | KeyringControllerWithKeyringAction
  | MetaMetricsControllerBufferedTraceAction
  | MetaMetricsControllerBufferedEndTraceAction
  | MultichainAccountServiceAlignWalletsAction
  | MultichainAccountServiceCreateMultichainAccountWalletAction
  | MultichainAccountServiceGetMultichainAccountWalletAction
  | MultichainAccountServiceInitAction
  | MultichainAccountServiceRemoveMultichainAccountWalletAction
  | MultichainAccountServiceResyncAccountsAction
  | NetworkControllerAddNetworkAction
  | NetworkControllerFindNetworkClientIdByChainIdAction
  | NetworkControllerGetNetworkClientByIdAction
  | NetworkControllerGetNetworkConfigurationByNetworkClientIdAction
  | NetworkControllerGetSelectedNetworkClientAction
  | NetworkControllerGetStateAction
  | NetworkControllerLookupNetworkAction
  | NetworkControllerResetConnectionAction
  | NetworkControllerSetActiveNetworkAction
  | NetworkEnablementControllerEnableAllPopularNetworksAction
  | NetworkEnablementControllerEnableNetworkAction
  | NetworkEnablementControllerIsNetworkEnabledAction
  | NetworkEnablementControllerGetStateAction
  | NetworkEnablementControllerRestoreEnabledNetworkMapAction
  | OnboardingControllerGetIsSocialLoginFlowAction
  | OnboardingControllerGetStateAction
  | OnboardingControllerResetOnboardingAction
  | PasskeyControllerChangePasswordWithPasskeyVerificationAction
  | PasskeyControllerClearStateAction
  | PasskeyControllerExportSeedPhraseWithPasskeyAction
  | PasskeyControllerUnlockWithPasskeyAction
  | PermissionControllerAcceptPermissionsRequestAction
  | PermissionControllerClearStateAction
  | PermissionControllerRejectPermissionsRequestAction
  | PermissionControllerRevokePermissionsAction
  | PermissionControllerUpdatePermissionsByCaveatAction
  | PhishingControllerMaybeUpdateStateAction
  | PhishingControllerScanAddressAction
  | PhishingControllerTestOriginAction
  | PreferencesControllerAddReferralApprovedAccountAction
  | PreferencesControllerAddReferralDeclinedAccountAction
  | PreferencesControllerAddReferralPassedAccountAction
  | PreferencesControllerGetStateAction
  | PreferencesControllerRemoveReferralDeclinedAccountAction
  | PreferencesControllerResetStateAction
  | PreferencesControllerSetAccountsReferralApprovedAction
  | PreferencesControllerSetPasswordForgottenAction
  | PreferencesControllerToggleExternalServicesAction
  | RemoteFeatureFlagControllerGetStateAction
  | SeedlessOnboardingControllerAddNewSecretDataAction
  | SeedlessOnboardingControllerChangePasswordAction
  | SeedlessOnboardingControllerCheckIsPasswordOutdatedAction
  | SeedlessOnboardingControllerClearStateAction
  | SeedlessOnboardingControllerCreateToprfKeyAndBackupSeedPhraseAction
  | SeedlessOnboardingControllerFetchAllSecretDataAction
  | SeedlessOnboardingControllerGetSecretDataBackupStateAction
  | SeedlessOnboardingControllerGetStateAction
  | SeedlessOnboardingControllerRunMigrationsAction
  | SeedlessOnboardingControllerLoadKeyringEncryptionKeyAction
  | SeedlessOnboardingControllerRevokePendingRefreshTokensAction
  | SeedlessOnboardingControllerSetLockedAction
  | SeedlessOnboardingControllerStoreKeyringEncryptionKeyAction
  | SeedlessOnboardingControllerSubmitGlobalPasswordAction
  | SeedlessOnboardingControllerSubmitPasswordAction
  | SeedlessOnboardingControllerSyncLatestGlobalPasswordAction
  | SeedlessOnboardingControllerUpdateBackupMetadataStateAction
  | SelectedNetworkControllerGetNetworkClientIdForDomainAction
  | GetSignatureState
  | ShieldControllerClearStateAction
  | ShieldControllerStartAction
  | ShieldControllerStopAction
  | SmartTransactionsControllerWipeSmartTransactionsAction
  | SnapControllerClearStateAction
  | SnapInterfaceControllerDeleteInterfaceAction
  | SubscriptionControllerClearStateAction
  | SubscriptionControllerGetStateAction
  | SubscriptionControllerGetSubscriptionByProductAction
  | SubscriptionControllerStopAllPollingAction
  | GetTokenListState
  | TokenDetectionControllerDisableAction
  | TokenDetectionControllerEnableAction
  | TokensControllerGetStateAction
  | TransactionControllerAddTransactionAction
  | TransactionControllerAddTransactionBatchAction
  | TransactionControllerClearUnapprovedTransactionsAction
  | TransactionControllerEstimateGasAction
  | TransactionControllerGetNonceLockAction
  | TransactionControllerGetStateAction
  | TransactionControllerIsAtomicBatchSupportedAction
  | TransactionControllerUpdateEditableParamsAction
  | TransactionControllerUpdateSecurityAlertResponseAction
  | TransactionControllerWipeTransactionsAction
  | UsePPOMAction
  | UserOperationControllerAddUserOperationFromTransactionAction
  | UserOperationControllerStartPollingByNetworkClientIdAction;

/**
 * The events that the {@link LegacyBackgroundApiService} can subscribe to.
 *
 * Consumed by the shared transaction-add pipeline to await the pending
 * transaction or signature request while running PPOM security validation.
 */
type AllowedEvents =
  | NetworkEnablementControllerStateChangeEvent
  | TransactionControllerUnapprovedTransactionAddedEvent
  | SignatureStateChange;

/**
 * The {@link LegacyBackgroundApiService} messenger.
 */
export type LegacyBackgroundApiServiceMessenger = Messenger<
  typeof serviceName,
  LegacyBackgroundApiServiceActions | AllowedActions,
  AllowedEvents
>;

/**
 * The options required to initialize the {@link LegacyBackgroundApiService}.
 */
type LegacyBackgroundApiServiceOptions = {
  messenger: LegacyBackgroundApiServiceMessenger;
  infuraProjectId: string;
  getRequestAccountTabIds: () => Record<string, number>;
  getOpenMetamaskTabsIds: () => Record<string, number>;
  getPermittedAccounts: (origin: string) => Promise<string[]>;
  getTabUrl: (tabId: number) => Promise<string | undefined>;
  updateTabUrl: (tabId: number, url: string) => Promise<void>;
  markNotificationPopupAsAutomaticallyClosed: () => void;
  requestSafeReload: () => Promise<void>;
  sendUpdate: () => void;
  offscreenPromise: Promise<void>;
};

/**
 * The `LegacyBackgroundApiService` provides an interface for the background API that is compatible with the existing MetaMaskController.getApi() method.
 * It is intended to be a temporary solution until all of the functionality of the background API can be migrated to the new modular architecture.
 * This service should not contain any new functionality, but should instead delegate to other services or controllers as needed.
 * Once the migration is complete, this service can be removed.
 *
 * @deprecated This service is a temporary solution and should not be used for new functionality.
 * It will be removed once the migration to the new modular architecture is complete.
 */
export class LegacyBackgroundApiService {
  name: typeof serviceName = serviceName;

  readonly #messenger: LegacyBackgroundApiServiceMessenger;

  readonly #infuraProjectId: string;

  readonly #getRequestAccountTabIds: () => Record<string, number>;

  readonly #getOpenMetamaskTabsIds: () => Record<string, number>;

  readonly #getPermittedAccounts: (origin: string) => Promise<string[]>;

  readonly #getTabUrl: (tabId: number) => Promise<string | undefined>;

  readonly #updateTabUrl: (tabId: number, url: string) => Promise<void>;

  readonly #markNotificationPopupAsAutomaticallyClosed: () => void;

  readonly #requestSafeReload: () => Promise<void>;

  readonly #sendUpdate: () => void;

  readonly #seedlessOperationMutex: Mutex;

  readonly #createVaultMutex: Mutex;

  readonly #offscreenPromise: Promise<void>;

  #passkeyAutoUnlockSuppressedResetTimeoutId: NodeJS.Timeout | null = null;

  /**
   * Creates a new instance of the LegacyBackgroundApiService.
   * @param options - The options required to initialize the LegacyBackgroundApiService.
   * @param options.messenger - The messenger instance used for communication.
   * @param options.infuraProjectId - The Infura project ID.
   * @param options.getRequestAccountTabIds - A function that returns a record of account tab IDs.
   * @param options.getOpenMetamaskTabsIds - A function that returns a record of open MetaMask tab IDs.
   * @param options.getPermittedAccounts - A function that returns the permitted accounts for an origin.
   * @param options.getTabUrl - A function that returns the current URL of a browser tab.
   * @param options.updateTabUrl - A function that navigates a browser tab to a URL.
   * @param options.markNotificationPopupAsAutomaticallyClosed - A function that marks the notification popup as automatically closed.
   * @param options.requestSafeReload - A function that triggers a safe reload of the extension.
   * @param options.sendUpdate - A function that triggers an update to the UI.
   * @param options.offscreenPromise - A promise that resolves when the offscreen document is ready.
   */
  constructor({
    messenger,
    infuraProjectId,
    getRequestAccountTabIds,
    getOpenMetamaskTabsIds,
    getPermittedAccounts,
    getTabUrl,
    updateTabUrl,
    markNotificationPopupAsAutomaticallyClosed,
    requestSafeReload,
    sendUpdate,
    offscreenPromise,
  }: LegacyBackgroundApiServiceOptions) {
    this.#messenger = messenger;

    this.#infuraProjectId = infuraProjectId;
    this.#getRequestAccountTabIds = getRequestAccountTabIds;
    this.#getOpenMetamaskTabsIds = getOpenMetamaskTabsIds;
    this.#getPermittedAccounts = getPermittedAccounts;
    this.#getTabUrl = getTabUrl;
    this.#updateTabUrl = updateTabUrl;
    this.#markNotificationPopupAsAutomaticallyClosed =
      markNotificationPopupAsAutomaticallyClosed;
    this.#requestSafeReload = requestSafeReload;
    this.#sendUpdate = sendUpdate;
    this.#seedlessOperationMutex = new Mutex();
    this.#createVaultMutex = new Mutex();
    this.#offscreenPromise = offscreenPromise;

    this.#messenger.registerMethodActionHandlers(
      this,
      MESSENGER_EXPOSED_METHODS,
    );
  }

  /**
   * Checks if the assets unify state feature is enabled based on the remote feature flag and build configuration.
   *
   * @returns `true` if the assets unify state feature is enabled, `false` otherwise.
   */
  isAssetsUnifyStateEnabled(): boolean {
    const featureFlagsState = this.#messenger.call(
      'RemoteFeatureFlagController:getState',
    );

    const assetsUnifyState =
      featureFlagsState.remoteFeatureFlags?.assetsUnifyState;

    return (
      getIsAssetsUnifyStateFeatureEnabled(
        assetsUnifyState as AssetsUnifyStateFeatureFlag,
        ASSETS_UNIFY_STATE_VERSION_1,
      ) && getIsAssetsUnifiedStateIncludedInBuild()
    );
  }

  /**
   * Sets the current currency for the CurrencyRateController and AssetsController (if the assets unify state feature is enabled).
   *
   * @param currencyCode - The currency code to set as the current currency.
   */
  async setCurrentCurrency(currencyCode: SupportedCurrency): Promise<void> {
    await this.#messenger.call(
      'CurrencyRateController:setCurrentCurrency',
      currencyCode,
    );

    if (this.isAssetsUnifyStateEnabled()) {
      this.#messenger.call(
        'AssetsController:setSelectedCurrency',
        currencyCode,
      );
    }
  }

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
  async getAssets(
    accounts: InternalAccount[],
    options?: Parameters<AssetsControllerGetAssetsAction['handler']>[1],
  ): Promise<Record<AccountId, Record<Caip19AssetId, Asset>> | undefined> {
    if (!this.isAssetsUnifyStateEnabled()) {
      return undefined;
    }

    return await this.#messenger.call('AssetsController:getAssets', accounts, {
      ...options,
      forceUpdate: true,
    });
  }

  /**
   * Determines if the given endpoint URL is a public endpoint URL.
   *
   * @param endpointUrl - The endpoint URL to check.
   * @returns `true` if the endpoint URL is a public endpoint URL, `false` otherwise.
   */
  isPublicEndpointUrl(endpointUrl: string): boolean {
    return isPublicEndpointUrl(endpointUrl, this.#infuraProjectId);
  }

  /**
   * Determines whether the sendBundle feature is supported for the given chain.
   *
   * @param chainId - The chain ID to check.
   * @returns `true` if sendBundle is supported for the chain, `false` otherwise.
   */
  async isSendBundleSupported(chainId: Hex): Promise<boolean> {
    return await isSendBundleSupported(chainId);
  }

  /**
   * Gets the record of request account tab IDs.
   *
   * @returns A record of request account tab IDs.
   */
  getRequestAccountTabIds(): Record<string, number> {
    return this.#getRequestAccountTabIds();
  }

  /**
   * Gets the record of open MetaMask tab IDs.
   *
   * @returns A record of open MetaMask tab IDs.
   */
  getOpenMetamaskTabsIds(): Record<string, number> {
    return this.#getOpenMetamaskTabsIds();
  }

  /**
   * Triggers a safe reload of the extension without disrupting user state.
   */
  async requestSafeReload(): Promise<void> {
    return this.#requestSafeReload();
  }

  /**
   * Opens the "Updating" page in a new tab and then triggers a safe extension
   * reload. Used when an update is available.
   */
  async openUpdateTabAndReload(): Promise<void> {
    return openUpdateTabAndReload(this.#requestSafeReload);
  }

  /**
   * Updates the phishing lists if necessary and then checks whether the given
   * website is a known phishing site.
   *
   * @param website - The website origin to check.
   * @returns The phishing detection result.
   */
  async getPhishingResult(
    website: string,
  ): Promise<ReturnType<PhishingControllerTestOriginAction['handler']>> {
    await this.#messenger.call('PhishingController:maybeUpdateState');

    return this.#messenger.call('PhishingController:testOrigin', website);
  }

  /**
   * Marks the notification popup as having been automatically closed.
   *
   * This lets us differentiate between the cases where we close the
   * notification popup v.s. when the user closes the popup window directly.
   */
  markNotificationPopupAsAutomaticallyClosed(): void {
    this.#markNotificationPopupAsAutomaticallyClosed();
  }

  /**
   * Marks the password as forgotten.
   */
  markPasswordForgotten(): void {
    this.#messenger.call('PreferencesController:setPasswordForgotten', true);
    this.#sendUpdate();
  }

  /**
   * Un-marks the password as forgotten.
   */
  unMarkPasswordForgotten(): void {
    this.#messenger.call('PreferencesController:setPasswordForgotten', false);
    this.#sendUpdate();
  }

  /**
   * Gets the code of a contract at a given address for a specific network client.
   *
   * @param address - The address of the contract.
   * @param networkClientId - The ID of the network client to use for the request.
   * @returns The code of the contract at the given address.
   */
  async getCode(address: Hex, networkClientId: string): Promise<Json> {
    const { provider } = this.#messenger.call(
      'NetworkController:getNetworkClientById',
      networkClientId,
    );

    return await provider.request({
      method: 'eth_getCode',
      params: [address],
    });
  }

  /**
   * Checks whether a delegation has been disabled on-chain by performing an
   * `eth_call` against the delegation manager contract.
   *
   * @param delegationManagerAddress - The delegation manager contract address.
   * @param delegationHash - The hash of the delegation to check.
   * @param networkClientId - The ID of the network client to use for the request.
   * @returns `true` if the delegation is disabled, `false` otherwise.
   */
  async checkDelegationDisabled(
    delegationManagerAddress: Hex,
    delegationHash: Hex,
    networkClientId: string,
  ): Promise<boolean> {
    // Encode the call to disabledDelegations(bytes32)
    const callData = encodeDisabledDelegationsCheck({ delegationHash });

    // Make eth_call request through the network controller
    const { provider } = this.#messenger.call(
      'NetworkController:getNetworkClientById',
      networkClientId,
    );

    const result = (await provider.request({
      method: 'eth_call',
      params: [
        {
          to: delegationManagerAddress,
          data: callData,
        },
        'latest',
      ],
    })) as Hex;

    // Decode the result
    return decodeDisabledDelegationsResult(result);
  }

  /**
   * Estimates the gas for a given transaction using the currently selected
   * network client.
   *
   * @param estimateGasParams - The parameters of the transaction to estimate
   * the gas for.
   * @returns The estimated gas as a hexadecimal string.
   */
  async estimateGas(estimateGasParams: Json): Promise<string> {
    const networkClient = this.#messenger.call(
      'NetworkController:getSelectedNetworkClient',
    );

    if (!networkClient) {
      throw new Error('No network client available for gas estimation');
    }

    const result = await networkClient.provider.request<Json[], number>({
      method: 'eth_estimateGas',
      params: [estimateGasParams],
    });

    return result.toString(16);
  }

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
  async decodeTransactionData(request: {
    transactionData: Hex;
    contractAddress: Hex;
    chainId: Hex;
  }): Promise<DecodedTransactionDataResponse | undefined> {
    const { selectedNetworkClientId } = this.#messenger.call(
      'NetworkController:getState',
    );

    const { provider } = this.#messenger.call(
      'NetworkController:getNetworkClientById',
      selectedNetworkClientId,
    );

    return decodeTransactionData({
      ...request,
      provider,
    });
  }

  /**
   * Adds a transaction to the TransactionController (or a user operation for
   * smart accounts) after running security validation, without waiting for the
   * transaction to be published.
   *
   * @param transactionParams - The parameters of the transaction to add.
   * @param transactionOptions - Options for adding the transaction.
   * @returns The transaction metadata.
   */
  async addTransaction(
    transactionParams: TransactionParams,
    transactionOptions?: Partial<AddTransactionOptions>,
  ): Promise<TransactionMeta> {
    return addTransactionToPipeline(
      this.#buildAddTransactionRequest(
        transactionParams,
        transactionOptions,
        false,
      ),
    );
  }

  /**
   * Adds a transaction to the TransactionController (or a user operation for
   * smart accounts) after running security validation, waiting for the
   * transaction to be published and returning the final transaction metadata.
   *
   * @param transactionParams - The parameters of the transaction to add.
   * @param transactionOptions - Options for adding the transaction.
   * @returns The final transaction metadata.
   */
  async addTransactionAndWaitForPublish(
    transactionParams: TransactionParams,
    transactionOptions?: Partial<AddTransactionOptions>,
  ): Promise<TransactionMeta> {
    return addTransactionToPipeline(
      this.#buildAddTransactionRequest(
        transactionParams,
        transactionOptions,
        true,
      ),
    );
  }

  /**
   * Builds the request consumed by the shared transaction-add pipeline from the
   * messenger, mirroring the former `MetamaskController.getAddTransactionRequest`.
   *
   * @param transactionParams - The parameters of the transaction to add.
   * @param transactionOptions - Options for adding the transaction.
   * @param waitForSubmit - Whether to wait for the transaction to be published.
   * @returns The transaction-add request.
   */
  #buildAddTransactionRequest(
    transactionParams: TransactionParams,
    transactionOptions: Partial<AddTransactionOptions> | undefined,
    waitForSubmit: boolean,
  ): AddTransactionRequest {
    const networkClientId = transactionOptions?.networkClientId;
    const { chainId } = this.#messenger.call(
      'NetworkController:getNetworkConfigurationByNetworkClientId',
      networkClientId as string,
    ) as NetworkConfiguration;

    return {
      messenger: this.#messenger,
      internalAccounts: this.#messenger.call('AccountsController:listAccounts'),
      selectedAccount: this.#messenger.call(
        'AccountsController:getAccountByAddress',
        transactionParams.from,
      ) as InternalAccount,
      networkClientId: networkClientId as string,
      chainId,
      transactionParams,
      transactionOptions: { ...transactionOptions, isInternal: true },
      securityAlertsEnabled: this.#messenger.call(
        'PreferencesController:getState',
      ).securityAlertsEnabled,
      waitForSubmit,
    };
  }

  /**
   * Adds a network and (optionally) sets it as the active network.
   *
   * @param networkConfiguration - The network configuration to add.
   * @param options - Options for post-add behavior.
   * @param options.setActive - Whether to switch to the added network.
   * @returns The added network configuration.
   */
  async addNetwork(
    networkConfiguration: AddNetworkFields,
    { setActive = true } = {},
  ): Promise<NetworkConfiguration> {
    if (setActive) {
      const addedNetwork = this.#messenger.call(
        'NetworkController:addNetwork',
        networkConfiguration,
      );
      const { networkClientId } =
        addedNetwork?.rpcEndpoints?.[addedNetwork.defaultRpcEndpointIndex] ??
        {};
      await this.#messenger.call(
        'NetworkController:setActiveNetwork',
        networkClientId,
      );
      return addedNetwork;
    }

    const { enabledNetworkMap } = this.#messenger.call(
      'NetworkEnablementController:getState',
    );
    const previousEnabledNetworkMap = Object.fromEntries(
      Object.entries(enabledNetworkMap).map(([namespace, networks]) => [
        namespace,
        { ...networks },
      ]),
    ) as NetworkEnablementControllerState['enabledNetworkMap'];

    const addedNetwork = this.#messenger.call(
      'NetworkController:addNetwork',
      networkConfiguration,
    );
    await this.lookupSelectedNetworks();

    // The NetworkEnablementController enables the newly added network
    // asynchronously (its `onAddNetwork` handler awaits a SLIP-44 lookup before
    // updating state), which switches the active network filter. Wait for that
    // enablement to land, then restore the previous map.
    //
    // The restore runs here in the linear flow rather than from a
    // `NetworkEnablementController:stateChange` subscriber on purpose: calling
    // the `restoreEnabledNetworkMap` action synchronously from inside the
    // subscriber re-enters the messenger's publish and the restore update is
    // dropped. Awaiting first defers the restore to a microtask outside that
    // publish.
    await this.#waitForNetworkToBeEnabled(networkConfiguration.chainId);
    this.#messenger.call(
      'NetworkEnablementController:restoreEnabledNetworkMap',
      previousEnabledNetworkMap,
    );

    return addedNetwork;
  }

  /**
   * Resolves once the given network is enabled in the
   * NetworkEnablementController. `NetworkEnablementController.onAddNetwork`
   * always enables a newly added network, so this is guaranteed to resolve.
   *
   * @param chainId - The chain ID of the newly added network.
   */
  async #waitForNetworkToBeEnabled(chainId: Hex): Promise<void> {
    if (
      this.#messenger.call(
        'NetworkEnablementController:isNetworkEnabled',
        chainId,
      )
    ) {
      return;
    }

    await this.#messenger.waitUntil('NetworkEnablementController:stateChange', {
      condition: () =>
        this.#messenger.call(
          'NetworkEnablementController:isNetworkEnabled',
          chainId,
        ),
    });
  }

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
  async getSeedPhrase(password: string, keyringId?: string): Promise<Buffer> {
    const seedPhrase = await this.#messenger.call(
      'KeyringController:exportSeedPhrase',
      { password },
      keyringId,
    );

    return convertEnglishWordlistIndicesToCodepoints(seedPhrase);
  }

  /**
   * Clears the transaction history, to allow users to force-reset their nonces.
   * Mostly used in development environments, when networks are restarted with
   * the same network ID.
   *
   * @returns The current selected address.
   */
  async resetAccount(): Promise<string> {
    const selectedAddress = this.#messenger.call(
      'AccountsController:getSelectedAccount',
    ).address;

    const globalChainId = this.getGlobalChainId();

    this.#messenger.call('TransactionController:wipeTransactions', {
      address: selectedAddress,
      chainId: globalChainId,
    });

    this.#messenger.call('SmartTransactionsController:wipeSmartTransactions', {
      address: selectedAddress,
      ignoreNetwork: false,
    });

    this.#messenger.call('BridgeStatusController:wipeBridgeStatus', {
      address: selectedAddress,
      ignoreNetwork: false,
    });

    this.#messenger.call('NetworkController:resetConnection');

    return selectedAddress;
  }

  /**
   * Gathers metadata (primarily connectivity status) about the globally selected
   * network as well as each enabled network and persists it to state.
   */
  async lookupSelectedNetworks(): Promise<void> {
    const { enabledNetworkMap } = this.#messenger.call(
      'NetworkEnablementController:getState',
    );
    const { networkConfigurationsByChainId } = this.#messenger.call(
      'NetworkController:getState',
    );

    const enabledNetworkClientIds = getAllEnabledNetworkClientIds(
      enabledNetworkMap,
      networkConfigurationsByChainId,
    );

    await Promise.allSettled([
      this.#messenger.call('NetworkController:lookupNetwork'),
      ...enabledNetworkClientIds.map(async (networkClientId) => {
        return await this.#messenger.call(
          'NetworkController:lookupNetwork',
          networkClientId,
        );
      }),
    ]);
  }

  /**
   * Enables the given network, then refreshes connectivity metadata for
   * the selected and enabled networks.
   *
   * @param chainId - The chain ID of the network to enable.
   */
  async setEnabledNetworks(chainId: Hex | CaipChainId): Promise<void> {
    try {
      this.#messenger.call(
        'NetworkEnablementController:enableNetwork',
        chainId,
      );
    } catch (err) {
      log.error((err as Error).message);
      throw err;
    }

    await this.lookupSelectedNetworks();
  }

  /**
   * Enables all popular networks, then refreshes connectivity metadata for
   * the selected and enabled networks.
   */
  async setEnabledAllPopularNetworks(): Promise<void> {
    try {
      this.#messenger.call(
        'NetworkEnablementController:enableAllPopularNetworks',
      );
    } catch (err) {
      log.error((err as Error).message);
      throw err;
    }

    await this.lookupSelectedNetworks();
  }

  /**
   * Resets the wallet to a clean state, clearing sensitive controller state and
   * signing the user out.
   *
   * @param restoreOnly - When `true`, onboarding state is preserved (used by the
   * restore-vault flow); when `false`, onboarding is also reset and the wallet
   * reset progress flag is set.
   */
  async resetWallet(restoreOnly = false): Promise<void> {
    // sign out from Authentication service and clear the Session Data
    this.#messenger.call('AuthenticationController:performSignOut');

    // clear SeedlessOnboardingController state
    this.#messenger.call('SeedlessOnboardingController:clearState');

    // clear passkey early (vault-bound unlock material; runs for restoreOnly too)
    this.#messenger.call('PasskeyController:clearState');

    // stop subscription polling
    this.#messenger.call('SubscriptionController:stopAllPolling');

    // clear States
    this.#messenger.call('SubscriptionController:clearState');
    this.#messenger.call('ShieldController:clearState');
    this.#messenger.call('ClaimsController:clearState');

    // clear contacts (address book)
    this.#messenger.call('AddressBookController:clear');

    // reset preferences to defaults
    this.#messenger.call('PreferencesController:resetState');

    if (!restoreOnly) {
      // reset onboarding state
      this.#messenger.call('OnboardingController:resetOnboarding');
      this.#messenger.call(
        'AppStateController:setIsWalletResetInProgress',
        true,
      );
    }
  }

  /**
   * @deprecated Avoid new references to the global network.
   * Will be removed once multi-chain support is fully implemented.
   *
   * @returns The chain ID of the currently selected network.
   */
  getGlobalChainId(): Hex {
    const { selectedNetworkClientId } = this.#messenger.call(
      'NetworkController:getState',
    );

    const globalNetworkClient = this.#messenger.call(
      'NetworkController:getNetworkClientById',
      selectedNetworkClientId,
    );

    return globalNetworkClient.configuration.chainId;
  }

  /**
   * @deprecated Avoid new references to the global network.
   *
   * @returns The provider of the currently selected (global) network client.
   */
  #getGlobalProvider(): Provider {
    const { selectedNetworkClientId } = this.#messenger.call(
      'NetworkController:getState',
    );

    return this.#messenger.call(
      'NetworkController:getNetworkClientById',
      selectedNetworkClientId,
    ).provider;
  }

  /**
   * Returns the `TokensController.allTokens` map, reconstructed from the
   * `AssetsController` state when the assets unify state feature is enabled.
   *
   * @returns The `ChainId -> AccountAddress -> Token[]` map.
   */
  #getAllTokens(): ReturnType<typeof getTokensControllerAllTokens> {
    const { allTokens } = this.#messenger.call('TokensController:getState');

    // When the assets unify state feature is disabled, the selector simply
    // returns `TokensController.allTokens`; the additional slices are only
    // needed to reconstruct the token list from the (conditionally registered)
    // AssetsController state when the feature is enabled.
    if (!this.isAssetsUnifyStateEnabled()) {
      return allTokens;
    }

    const { internalAccounts } = this.#messenger.call(
      'AccountsController:getState',
    );
    const { remoteFeatureFlags } = this.#messenger.call(
      'RemoteFeatureFlagController:getState',
    );
    const { assetsInfo, assetsBalance, customAssets } = this.#messenger.call(
      'AssetsController:getState',
    );

    const metamask = {
      allTokens,
      internalAccounts,
      remoteFeatureFlags,
      assetsInfo,
      assetsBalance,
      customAssets,
    };

    return getTokensControllerAllTokens({ metamask });
  }

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
  async getTokenStandardAndDetails(
    address: string,
    userAddress?: string,
    tokenId?: string,
  ): Promise<TokenStandardAndDetails> {
    const currentChainId = this.getGlobalChainId();

    const { tokensChainsCache } = this.#messenger.call(
      'TokenListController:getState',
    );
    const tokenList = tokensChainsCache?.[currentChainId]?.data || {};
    const allTokens = this.#getAllTokens();

    const tokens = allTokens?.[currentChainId]?.[userAddress as string] || [];

    const staticTokenListDetails =
      STATIC_MAINNET_TOKEN_LIST[address?.toLowerCase()] || {};
    const tokenListDetails = tokenList[address?.toLowerCase()] || {};
    const userDefinedTokenDetails =
      tokens.find(({ address: _address }) =>
        isEqualCaseInsensitive(_address, address),
      ) || {};

    const tokenDetails = {
      ...staticTokenListDetails,
      ...tokenListDetails,
      ...userDefinedTokenDetails,
    } as MergedTokenDetails;

    // boolean to check if the token is an ERC20
    const tokenDetailsStandardIsERC20 =
      isEqualCaseInsensitive(tokenDetails.standard ?? '', ERC20) ||
      tokenDetails.erc20 === true;

    // boolean to check if the token is an NFT
    const noEvidenceThatTokenIsAnNFT =
      !tokenId &&
      !isEqualCaseInsensitive(tokenDetails.standard ?? '', ERC1155) &&
      !isEqualCaseInsensitive(tokenDetails.standard ?? '', ERC721) &&
      !tokenDetails.erc721;

    // boolean to check if the token is an ERC20 like
    const otherDetailsAreERC20Like =
      tokenDetails.decimals !== undefined && tokenDetails.symbol;

    // boolean to check if the token can be treated as an ERC20
    const tokenCanBeTreatedAsAnERC20 =
      tokenDetailsStandardIsERC20 ||
      (noEvidenceThatTokenIsAnNFT && otherDetailsAreERC20Like);

    let details: WorkingTokenDetails | undefined;
    if (tokenCanBeTreatedAsAnERC20) {
      try {
        const balance = userAddress
          ? await fetchTokenBalance(
              address,
              userAddress,
              this.#getGlobalProvider(),
            )
          : undefined;

        details = {
          address,
          balance,
          standard: ERC20,
          decimals: tokenDetails.decimals,
          symbol: tokenDetails.symbol,
        };
      } catch (e) {
        // If the `fetchTokenBalance` call failed, `details` remains undefined, and we
        // fall back to the below `AssetsContractController:getTokenStandardAndDetails` call
        log.warn(`Failed to get token balance. Error: ${String(e)}`);
      }
    }

    // `details`` will be undefined if `tokenCanBeTreatedAsAnERC20`` is false,
    // or if it is true but the `fetchTokenBalance`` call failed. In either case, we should
    // attempt to retrieve details from `AssetsContractController:getTokenStandardAndDetails`
    if (details === undefined) {
      try {
        details = await this.#messenger.call(
          'AssetsContractController:getTokenStandardAndDetails',
          address,
          userAddress,
          tokenId,
        );
      } catch (e) {
        log.warn(
          `Failed to get token standard and details. Error: ${String(e)}`,
        );
      }
    }

    if (details) {
      const tokenDetailsStandardIsERC1155 = isEqualCaseInsensitive(
        details.standard ?? '',
        ERC1155,
      );

      if (tokenDetailsStandardIsERC1155) {
        try {
          const balance = await fetchERC1155Balance(
            address,
            userAddress as string,
            tokenId as string,
            this.#getGlobalProvider(),
          );

          const balanceToUse = balance?._hex
            ? parseInt(balance._hex, 16).toString()
            : null;

          details = {
            ...details,
            balance: balanceToUse,
          };
        } catch (e) {
          // If the `fetchTokenBalance` call failed, `details` remains undefined, and we
          // fall back to the below `AssetsContractController:getTokenStandardAndDetails` call
          log.warn('Failed to get token balance. Error:', e);
        }
      }
    }

    return {
      ...details,
      decimals: (details?.decimals as number | undefined)?.toString(10),
      balance: (details?.balance as number | undefined)?.toString(10),
    };
  }

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
  async getTokenStandardAndDetailsByChain(
    address: string,
    userAddress?: string,
    tokenId?: string,
    chainId?: Hex,
  ): Promise<TokenStandardAndDetails> {
    const { tokensChainsCache } = this.#messenger.call(
      'TokenListController:getState',
    );
    const tokenList = (chainId && tokensChainsCache?.[chainId]?.data) || {};

    const allTokens = this.#getAllTokens();
    const selectedAccount = this.#messenger.call(
      'AccountsController:getSelectedAccount',
    );
    const tokens =
      (chainId && allTokens?.[chainId]?.[selectedAccount.address]) || [];

    let staticTokenListDetails = {};
    if (chainId === CHAIN_IDS.MAINNET) {
      staticTokenListDetails =
        STATIC_MAINNET_TOKEN_LIST[address?.toLowerCase()] || {};
    }

    const tokenListDetails = tokenList[address?.toLowerCase()] || {};
    const userDefinedTokenDetails =
      tokens.find(({ address: _address }) =>
        isEqualCaseInsensitive(_address, address),
      ) || {};
    const tokenDetails = {
      ...staticTokenListDetails,
      ...tokenListDetails,
      ...userDefinedTokenDetails,
    } as MergedTokenDetails;

    const tokenDetailsStandardIsERC20 =
      isEqualCaseInsensitive(tokenDetails.standard ?? '', ERC20) ||
      tokenDetails.erc20 === true;

    const noEvidenceThatTokenIsAnNFT =
      !tokenId &&
      !isEqualCaseInsensitive(tokenDetails.standard ?? '', ERC1155) &&
      !isEqualCaseInsensitive(tokenDetails.standard ?? '', ERC721) &&
      !tokenDetails.erc721;

    const otherDetailsAreERC20Like =
      tokenDetails.decimals !== undefined && tokenDetails.symbol;

    // boolean to check if the token can be treated as an ERC20
    const tokenCanBeTreatedAsAnERC20 =
      tokenDetailsStandardIsERC20 ||
      (noEvidenceThatTokenIsAnNFT && otherDetailsAreERC20Like);

    let details: WorkingTokenDetails | undefined;
    if (tokenCanBeTreatedAsAnERC20) {
      try {
        let balance = 0;
        if (this.getGlobalChainId() === chainId) {
          balance = await fetchTokenBalance(
            address,
            userAddress as string,
            this.#getGlobalProvider(),
          );
        }

        details = {
          address,
          balance,
          standard: ERC20,
          decimals: tokenDetails.decimals,
          symbol: tokenDetails.symbol,
        };
      } catch (e) {
        // If the `fetchTokenBalance` call failed, `details` remains undefined, and we
        // fall back to the below `AssetsContractController:getTokenStandardAndDetails` call
        log.warn(`Failed to get token balance. Error: ${String(e)}`);
      }
    }

    // `details`` will be undefined if `tokenCanBeTreatedAsAnERC20`` is false,
    // or if it is true but the `fetchTokenBalance`` call failed. In either case, we should
    // attempt to retrieve details from `AssetsContractController:getTokenStandardAndDetails`
    if (details === undefined) {
      try {
        const { networkConfigurationsByChainId } = this.#messenger.call(
          'NetworkController:getState',
        );
        const networkClientId =
          chainId &&
          networkConfigurationsByChainId?.[chainId]?.rpcEndpoints[
            networkConfigurationsByChainId?.[chainId]?.defaultRpcEndpointIndex
          ]?.networkClientId;

        details = await this.#messenger.call(
          'AssetsContractController:getTokenStandardAndDetails',
          address,
          userAddress,
          tokenId,
          networkClientId || undefined,
        );
      } catch (e) {
        log.warn(
          `Failed to get token standard and details. Error: ${String(e)}`,
        );
      }
    }

    if (details) {
      const tokenDetailsStandardIsERC1155 = isEqualCaseInsensitive(
        details.standard ?? '',
        ERC1155,
      );

      if (tokenDetailsStandardIsERC1155) {
        try {
          const balance = await fetchERC1155Balance(
            address,
            userAddress as string,
            tokenId as string,
            this.#getGlobalProvider(),
          );

          const balanceToUse = balance?._hex
            ? parseInt(balance._hex, 16).toString()
            : null;

          details = {
            ...details,
            balance: balanceToUse,
          };
        } catch (e) {
          // If the `fetchTokenBalance` call failed, `details` remains undefined, and we
          // fall back to the below `AssetsContractController:getTokenStandardAndDetails` call
          log.warn('Failed to get token balance. Error:', e);
        }
      }
    }

    return {
      ...details,
      decimals: (details?.decimals as number | undefined)?.toString(10),
      balance: (details?.balance as number | undefined)?.toString(10),
    };
  }

  /**
   * Gets the symbol of a token via an on-chain lookup through the
   * `AssetsContractController`.
   *
   * @param address - The token contract address.
   * @returns The token symbol, or `null` if it could not be resolved.
   */
  async getTokenSymbol(address: string): Promise<string | null | undefined> {
    try {
      const details = await this.#messenger.call(
        'AssetsContractController:getTokenStandardAndDetails',
        address,
      );
      return details?.symbol;
    } catch (e) {
      return null;
    }
  }

  /**
   * Removes an account from state / storage.
   *
   * @param address - The account address, not CAIP-10 formatted.
   */
  async removeAccount(address: string): Promise<string> {
    this.onAccountRemoved(address);
    await this.#messenger.call('KeyringController:removeAccount', address);

    return address;
  }

  /**
   * Sets the label for the account at the given address.
   *
   * @param address - The address of the account to set the label for.
   * @param label - The label to set for the account.
   */
  setAccountLabel(address: string, label: string): void {
    const account = this.#messenger.call(
      'AccountsController:getAccountByAddress',
      address,
    );
    if (account === undefined) {
      throw new Error(`No account found for address: ${address}`);
    }
    this.#messenger.call(
      'AccountsController:setAccountName',
      account.id,
      label,
    );
  }

  /**
   * Execute side effects of a removed account.
   *
   * @param address - The address of the account to remove.
   */
  onAccountRemoved(address: string): void {
    this.#messenger.call(
      'PermissionController:updatePermissionsByCaveat',
      Caip25CaveatType,
      (scopes) =>
        // @ts-expect-error - Type mismatch
        Caip25CaveatMutators[Caip25CaveatType].removeAccount(
          scopes as Caip25CaveatValue,
          // This function is typed as expecting hex, but works with any address format.
          address as Hex,
        ),
    );
  }

  /**
   * Rejects a pending permissions request.
   *
   * Swallows `PermissionsRequestNotFoundError` so that rejecting an already
   * resolved request does not throw.
   *
   * @param requestId - The ID of the permissions request to reject.
   */
  rejectPermissionsRequest(requestId: string): void {
    try {
      this.#messenger.call(
        'PermissionController:rejectPermissionsRequest',
        requestId,
      );
    } catch (error) {
      if (!(error instanceof PermissionsRequestNotFoundError)) {
        throw error;
      }
    }
  }

  /**
   * Removes the given permissions for the given subjects.
   *
   * @param subjects - The subjects and their permissions to remove.
   */
  removePermissionsFor(
    subjects: Record<
      OriginString,
      NonEmptyArray<
        ExtractPermission<
          PermissionSpecificationConstraint,
          CaveatSpecificationConstraint
        >['parentCapability']
      >
    >,
  ): void {
    try {
      this.#messenger.call('PermissionController:revokePermissions', subjects);
    } catch (error) {
      if (!(error instanceof PermissionsRequestNotFoundError)) {
        throw error;
      }
    }
  }

  async importAccountWithStrategy(
    strategy: AccountImportStrategy,
    args: unknown[],
    { shouldCreateSocialBackup = true, shouldSelectAccount = true } = {},
  ): Promise<void> {
    const importedAccountAddress = (await this.#messenger.call(
      'KeyringController:importAccountWithStrategy',
      strategy,
      args,
    )) as Hex;

    const isSocialLoginFlow = this.#messenger.call(
      'OnboardingController:getIsSocialLoginFlow',
    );

    if (isSocialLoginFlow) {
      const importedAccount = this.#messenger.call(
        'AccountsController:getAccountByAddress',
        importedAccountAddress,
      );
      if (!importedAccount) {
        throw new Error(
          `No account found for address: ${importedAccountAddress}`,
        );
      }

      const { id: keyringId, privateKey: privateKeyFromKeyring } =
        (await this.#messenger.call(
          'KeyringController:withKeyringV2',
          { address: importedAccountAddress },
          async ({ keyring, metadata }) => {
            if (!keyring.exportAccount) {
              throw new Error(
                'Imported account keyring does not export accounts',
              );
            }
            const privateKeyObj = await keyring.exportAccount(
              importedAccount.id,
            );
            return { id: metadata.id, privateKey: privateKeyObj.privateKey };
          },
        )) as { id: string; privateKey: string };

      try {
        // if social backup is requested, add the seed phrase backup
        await this.#addNewPrivateKeyBackup(
          privateKeyFromKeyring,
          keyringId,
          shouldCreateSocialBackup,
        );
      } catch (err) {
        // handle seedless controller import error by reverting keyring controller mnemonic import
        // KeyringController.removeAccount will remove keyring when it's emptied, currently there are no other method in keyring controller to remove keyring
        await this.#messenger.call(
          'KeyringController:removeAccount',
          importedAccountAddress,
        );
        throw err;
      }
    }

    if (shouldSelectAccount) {
      const account = this.#messenger.call(
        'AccountsController:getAccountByAddress',
        importedAccountAddress,
      );
      if (account) {
        this.#messenger.call(
          'AccountsController:setSelectedAccount',
          account.id,
        );
      } else {
        throw new Error(
          `No account found for address: ${importedAccountAddress}`,
        );
      }
    }
  }

  /**
   * Adds a new private key backup for the user
   *
   * If `syncWithSocial` is false, it will only update the local state,
   * and not sync the private key to the server.
   *
   * @param privateKey - The privateKey from keyring.
   * @param keyringId - The keyring id to add the private key backup to.
   * @param syncWithSocial - whether to skip syncing with social login
   */
  async #addNewPrivateKeyBackup(
    privateKey: string,
    keyringId: string,
    syncWithSocial = true,
  ): Promise<void> {
    const privateKeyBytes = hexToBytes(add0x(privateKey));

    if (syncWithSocial) {
      await this.#seedlessOperationMutex.runExclusive(async () => {
        try {
          // Run data type migration before adding new secret data to ensure
          // data consistency.
          await runSeedlessOnboardingMigrations(this.#messenger);

          await this.#messenger.call(
            'SeedlessOnboardingController:addNewSecretData',
            privateKeyBytes,
            EncAccountDataType.ImportedPrivateKey,
            { keyringId },
          );
        } catch (error) {
          log.error('Error adding new private key backup', error);
          throw error;
        }
      });
    } else {
      // Do not sync the seed phrase to the server, only update the local state
      this.#messenger.call(
        'SeedlessOnboardingController:updateBackupMetadataState',
        {
          keyringId,
          data: privateKeyBytes,
          type: SecretType.PrivateKey,
        },
      );
    }
  }

  /**
   * Gets the accounts of a given snap ID from the snap keyring.
   *
   * @param snapId - The snap ID to get accounts for.
   * @returns The addresses of the accounts managed by the snap.
   */
  async getAccountsBySnapId(snapId: SnapId): Promise<string[]> {
    return getAccountsBySnapId(this.#messenger, snapId);
  }

  /**
   * Sets the currently selected internal account.
   *
   * @param id - The ID of the account to set as selected.
   */
  setSelectedInternalAccount(id: string): void {
    const account = this.#messenger.call('AccountsController:getAccount', id);
    if (account) {
      this.#messenger.call('AccountsController:setSelectedAccount', id);
    }
  }

  /**
   * Returns the next nonce according to the nonce-tracker
   *
   * @param address - The hex string address for the transaction
   * @param networkClientId - The networkClientId to get the nonce lock with
   * @returns The next nonce.
   */
  async getNextNonce(
    address: string,
    networkClientId: string,
  ): Promise<number> {
    const nonceLock = await this.#messenger.call(
      'TransactionController:getNonceLock',
      address,
      networkClientId,
    );
    nonceLock.releaseLock();
    return nonceLock.nextNonce;
  }

  /**
   * Changes the password for the wallet.
   *
   * If the flow is social login flow, it will also change the password for the seedless onboarding controller.
   *
   * @param newPassword - The new password.
   * @param oldPassword - The old password.
   */
  async changePassword(
    newPassword: string,
    oldPassword: string,
  ): Promise<void> {
    const releaseLock = await this.#seedlessOperationMutex.acquire();
    const isSocialLoginFlow = this.#messenger.call(
      'OnboardingController:getIsSocialLoginFlow',
    );
    try {
      await this.#messenger.call(
        'KeyringController:changePassword',
        newPassword,
      );

      if (isSocialLoginFlow) {
        try {
          await this.#messenger.call(
            'SeedlessOnboardingController:changePassword',
            newPassword,
            oldPassword,
          );
          // store the new keyring encryption key in the seedless onboarding controller
          const keyringEncKey = await this.#messenger.call(
            'KeyringController:exportEncryptionKey',
          );
          await this.#messenger.call(
            'SeedlessOnboardingController:storeKeyringEncryptionKey',
            keyringEncKey,
          );
        } catch (err) {
          log.error('error while changing seedless-onboarding password', err);
          log.error('reverting keyring password change');
          // revert the keyring password change by changing the password back to the old password
          await this.#messenger.call(
            'KeyringController:changePassword',
            oldPassword,
          );
          // store the old keyring encryption key in the seedless onboarding controller
          const revertedKeyringEncKey = await this.#messenger.call(
            'KeyringController:exportEncryptionKey',
          );
          await this.#messenger.call(
            'SeedlessOnboardingController:storeKeyringEncryptionKey',
            revertedKeyringEncKey,
          );

          this.#messenger.captureException?.(
            createSentryError(
              'error while changing password for social login flow',
              err,
            ),
          );
          throw err;
        }
      }
    } catch (error) {
      log.error('error while changing password', error);
      throw error;
    } finally {
      releaseLock();
    }
  }

  /**
   * Checks if the seedless password is outdated.
   *
   * @param args - The arguments for the checkIsSeedlessPasswordOutdated method.
   * @param args.skipCache - whether to skip the cache @default false
   * @param args.captureSentryError - whether to capture the sentry error. @default false
   * @returns true if the password is outdated, false otherwise, undefined if the flow is not seedless
   */
  async checkIsSeedlessPasswordOutdated({
    skipCache = false,
    captureSentryError = false,
  } = {}): Promise<boolean | undefined> {
    try {
      const isSocialLoginFlow = this.#messenger.call(
        'OnboardingController:getIsSocialLoginFlow',
      );
      const { completedOnboarding } = this.#messenger.call(
        'OnboardingController:getState',
      );

      if (!isSocialLoginFlow || !completedOnboarding) {
        // this is only available for seedless onboarding flow and completed onboarding
        return false;
      }

      const isPasswordOutdated = await this.#messenger.call(
        'SeedlessOnboardingController:checkIsPasswordOutdated',
        { skipCache },
      );

      return isPasswordOutdated;
    } catch (error) {
      if (captureSentryError) {
        this.#messenger.captureException?.(
          createSentryError(
            'Failed to check if seedless password is outdated',
            error,
          ),
        );
      }

      throw error;
    }
  }

  /**
   * Sync latest global seedless password and override the current device password with latest global password.
   * Unlock the vault with the latest global password.
   *
   * @param password - latest global seedless password
   * @returns
   */
  async syncPasswordAndUnlockWallet(password: string): Promise<void> {
    const isSocialLoginFlow = this.#messenger.call(
      'OnboardingController:getIsSocialLoginFlow',
    );
    // check if the password is outdated
    let isPasswordOutdated: boolean | undefined = false;

    if (isSocialLoginFlow) {
      try {
        isPasswordOutdated = await this.checkIsSeedlessPasswordOutdated({
          skipCache: false,
          captureSentryError: true,
        });
      } catch (error) {
        // we don't want to block the unlock flow if the password outdated check fails
        log.error('error while checking if password is outdated', error);
      }
    }

    // if the flow is not social login or the password is not outdated,
    // we will proceed with the normal flow and use the password to unlock the vault
    if (!isSocialLoginFlow || !isPasswordOutdated) {
      await this.submitPasswordOrEncryptionKey({ password });
      if (isSocialLoginFlow) {
        // try to revoke pending refresh tokens asynchronously
        this.#messenger
          .call('SeedlessOnboardingController:revokePendingRefreshTokens')
          .catch((error: Error) => {
            log.error('error while revoking pending refresh tokens', error);
          });
      }
      return;
    }

    await this.#seedlessOperationMutex.runExclusive(async () => {
      const isKeyringPasswordValid = await this.#messenger
        .call('KeyringController:verifyPassword', password)
        .then(() => true)
        .catch((error: Error) => {
          if (error.message.includes('Incorrect password')) {
            return false;
          }
          log.error('error while verifying keyring password', error.message);
          throw error;
        });

      // Here the password could be invalid or outdated, which can result in following cases:
      // 1. Seedless controller password verification succeeded.
      // 2. Seedless controller failed but Keyring controller password verification succeeded.
      // 3. Both keyring and seedless controller password verification failed.
      await this.#messenger
        .call('SeedlessOnboardingController:submitGlobalPassword', {
          globalPassword: password,
          maxKeyChainLength: 20,
        })
        .catch((error: Error) => {
          if (error instanceof RecoveryError) {
            // Keyring controller password verification succeeds and seedless controller failed.
            if (
              error?.message ===
                SeedlessOnboardingControllerErrorMessage.IncorrectPassword &&
              isKeyringPasswordValid
            ) {
              throw new Error(
                SeedlessOnboardingControllerErrorMessage.OutdatedPassword,
              );
            }
            throw new JsonRpcError(-32603, error.message, error.data);
          }
          log.error(`error while submitting global password: ${error.message}`);
          throw error;
        });

      // re-encrypt the old vault data with the latest global password
      const keyringEncryptionKey = await this.#messenger.call(
        'SeedlessOnboardingController:loadKeyringEncryptionKey',
      );
      // use encryption key to unlock the keyring vault
      await this.submitPasswordOrEncryptionKey({
        encryptionKey: keyringEncryptionKey,
      });

      let changePasswordSuccess = false;
      try {
        // update seedlessOnboardingController to use latest global password
        await this.#messenger.call(
          'SeedlessOnboardingController:syncLatestGlobalPassword',
          {
            globalPassword: password,
          },
        );

        this.#messenger.call('MetaMetricsController:bufferedTrace', {
          name: TraceName.OnboardingResetPassword,
          op: TraceOperation.OnboardingSecurityOp,
        });
        // update vault password to global password
        await this.#messenger.call(
          'KeyringController:changePassword',
          password,
        );
        changePasswordSuccess = true;
        // sync the new keyring encryption key after keyring changePassword to the seedless onboarding controller
        await this.syncKeyringEncryptionKey();

        // check password outdated again skip cache to reset the cache after successful syncing
        await this.checkIsSeedlessPasswordOutdated({
          skipCache: true,
          captureSentryError: true,
        });

        // revoke pending refresh tokens asynchronously
        this.#messenger
          .call('SeedlessOnboardingController:revokePendingRefreshTokens')
          .catch((err) => {
            log.error('error while revoking pending refresh tokens', err);
          });
      } catch (err) {
        this.#messenger?.captureException?.(
          createSentryError(TraceName.OnboardingResetPasswordError, err),
        );

        // lock app again on error after submitPassword succeeded
        // here we skip the seedless operation lock as we are already in the seedless operation lock
        await this.setLocked({ skipSeedlessOperationLock: true });
        throw err;
      } finally {
        this.#messenger.call('MetaMetricsController:bufferedEndTrace', {
          name: TraceName.OnboardingResetPassword,
          data: { success: changePasswordSuccess },
        });
      }
    });
  }

  /**
   * Attempts to unlock the vault using either the user's password or encryption
   * key. Also synchronizes the preferencesController, to ensure its schema is
   * up to date with known accounts once the vault is decrypted.
   *
   * @param params - The function parameters.
   * @param params.password - The user's password.
   * @param params.encryptionKey - The user's encryption key.
   */
  async submitPasswordOrEncryptionKey({
    password,
    encryptionKey,
  }: {
    password?: string;
    encryptionKey?: string;
  }): Promise<void> {
    const isSocialLoginFlow = this.#messenger.call(
      'OnboardingController:getIsSocialLoginFlow',
    );

    // Before attempting to unlock the keyrings, we need the offscreen to have loaded.
    await this.#offscreenPromise;

    if (encryptionKey) {
      await this.#messenger.call(
        'KeyringController:submitEncryptionKey',
        encryptionKey,
      );
    } else if (password) {
      await this.#messenger.call('KeyringController:submitPassword', password);
      if (isSocialLoginFlow) {
        // unlock the seedless onboarding vault
        await this.#messenger.call(
          'SeedlessOnboardingController:submitPassword',
          password,
        );
      }
    }

    await this.#initAccountsAfterUnlock();
  }

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
  async changePasswordWithPasskeyVerification(params: {
    newPassword: string;
    authenticationResponse: PasskeyAuthenticationResponse;
    options?: { renewVaultKeyProtection?: boolean };
  }): Promise<void> {
    await this.#seedlessOperationMutex.runExclusive(() =>
      this.#messenger.call(
        'PasskeyController:changePasswordWithPasskeyVerification',
        params,
      ),
    );
  }

  /**
   * Exports and JSON-encodes a seed phrase after passkey verification.
   *
   * @param params - Passkey seed export parameters.
   * @param params.authenticationResponse - WebAuthn authentication response.
   * @param params.keyringId - Optional HD keyring id.
   * @returns UTF-8 seed phrase bytes as a JSON-safe number array.
   */
  async exportSeedPhraseWithPasskey(params: {
    authenticationResponse: PasskeyAuthenticationResponse;
    keyringId?: string;
  }): Promise<number[]> {
    const mnemonic = await this.#messenger.call(
      'PasskeyController:exportSeedPhraseWithPasskey',
      params.authenticationResponse,
      params.keyringId,
    );

    return Array.from(convertEnglishWordlistIndicesToCodepoints(mnemonic));
  }

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
  async unlockWithPasskey(
    authenticationResponse: PasskeyAuthenticationResponse,
  ): Promise<void> {
    // Before attempting to unlock the keyrings, we need the offscreen to have loaded.
    await this.#offscreenPromise;

    await this.#messenger.call(
      'PasskeyController:unlockWithPasskey',
      authenticationResponse,
    );

    await this.#initAccountsAfterUnlock();
  }

  /**
   * Runs the awaited post-unlock account initialization sequence: refreshes
   * internal accounts, initializes multichain accounts, refreshes the account
   * tree, and (asynchronously) resyncs and aligns accounts.
   */
  async #initAccountsAfterUnlock(): Promise<void> {
    await this.#messenger.call('AccountsController:updateAccounts');

    // Init multichain accounts after creating internal accounts.
    await this.#messenger.call('MultichainAccountService:init');

    // Force account-tree refresh after all accounts have been updated.
    this.#messenger.call('AccountTreeController:init');

    // FIXME: We might wanna run discovery + alignment asynchronously here, like we do
    // for mobile.
    // NOTE: We run this asynchronously on purpose, see FIXME^.
    // eslint-disable-next-line no-void
    void this.#resyncAndAlignAccounts();
  }

  async #resyncAndAlignAccounts(): Promise<void> {
    // READ THIS CAREFULLY:
    // There is/was a bug with Snap accounts that can be desynchronized (Solana). To
    // automatically "fix" this corrupted state, we run this method which will re-sync
    // MetaMask accounts and Snap accounts upon login.
    // BUG: https://github.com/MetaMask/metamask-extension/issues/37228
    await this.#messenger.call('MultichainAccountService:resyncAccounts');

    // This allows to create missing accounts if new account providers have been added.
    await this.#messenger.call('MultichainAccountService:alignWallets');
  }

  /**
   * Locks MetaMask
   *
   * @param options - The options for setting the locked state.
   * @param options.skipSeedlessOperationLock - If true, the seedless operation mutex will not be locked.
   */
  async setLocked({ skipSeedlessOperationLock = false } = {}): Promise<void> {
    const releaseVaultMutex = await this.#createVaultMutex.acquire();
    try {
      const isSocialLoginFlow = this.#messenger.call(
        'OnboardingController:getIsSocialLoginFlow',
      );

      let releaseLock;
      if (isSocialLoginFlow && !skipSeedlessOperationLock) {
        releaseLock = await this.#seedlessOperationMutex.acquire();
      }

      try {
        if (isSocialLoginFlow) {
          await this.#messenger.call('SeedlessOnboardingController:setLocked');
        }
        await this.#messenger.call('KeyringController:setLocked');

        // stop polling for the subscriptions when the wallet is locked manually and window/side-panel is still open
        this.#messenger.call('SubscriptionController:stopAllPolling');

        // sign out from Authentication service and clear the Session Data if user is signed in
        // this check is to make sure that the user sensitive data is cleared when the wallet is locked.
        // We have `useAutoSignOut` hook that should handle the automatic sign out, however, it's not always triggered.
        const { isSignedIn } = this.#messenger.call(
          'AuthenticationController:getState',
        );
        if (isSignedIn) {
          this.#messenger.call('AuthenticationController:performSignOut');
        }

        // After lock, suppress auto passkey unlock briefly (cross-surface), then clear.
        if (this.#passkeyAutoUnlockSuppressedResetTimeoutId !== null) {
          clearTimeout(this.#passkeyAutoUnlockSuppressedResetTimeoutId);
          this.#passkeyAutoUnlockSuppressedResetTimeoutId = null;
        }
        this.#messenger.call(
          'AppStateController:setPasskeyAutoUnlockSuppressed',
          true,
        );
        this.#passkeyAutoUnlockSuppressedResetTimeoutId = setTimeout(() => {
          this.#passkeyAutoUnlockSuppressedResetTimeoutId = null;
          this.#messenger.call(
            'AppStateController:setPasskeyAutoUnlockSuppressed',
            false,
          );
        }, PASSKEY_AUTO_UNLOCK_SUPPRESSION_DURATION_MS);
      } catch (error) {
        log.error('Error setting locked state', error);
        throw error;
      } finally {
        if (releaseLock) {
          releaseLock();
        }
      }
    } finally {
      releaseVaultMutex();
    }
  }

  /**
   * Syncs the keyring encryption key with the seedless onboarding controller.
   *
   * @returns
   */
  async syncKeyringEncryptionKey(): Promise<void> {
    // store the keyring encryption key in the seedless onboarding controller
    const keyringEncryptionKey = await this.#messenger.call(
      'KeyringController:exportEncryptionKey',
    );
    await this.#messenger.call(
      'SeedlessOnboardingController:storeKeyringEncryptionKey',
      keyringEncryptionKey,
    );
  }

  /**
   * Verifies the password and exports the private key for the given account.
   *
   * @param address - The address of the account to export.
   * @param password - The password of the vault.
   * @returns The private key of the account.
   */
  async exportAccount(address: string, password: string): Promise<string> {
    await this.#messenger.call('KeyringController:verifyPassword', password);
    return this.#messenger.call(
      'KeyringController:exportAccount',
      { password },
      address,
    );
  }

  /**
   * Applies the given transaction container types to an existing transaction.
   *
   * @param transactionId - The ID of the transaction to update.
   * @param containerTypes - The container types to apply to the transaction.
   * @param incrementToggleCount - Whether to increment the toggle interaction metric.
   */
  async applyTransactionContainersExisting(
    transactionId: string,
    containerTypes: TransactionContainerType[],
    incrementToggleCount = false,
  ): Promise<{ enforcedSimulationsSlippage?: number }> {
    const { transactions } = await this.#messenger.call(
      'TransactionController:getState',
    );

    const transactionMeta = transactions.find((tx) => tx.id === transactionId);

    if (!transactionMeta) {
      throw new Error(`Transaction with ID ${transactionId} not found.`);
    }

    if (incrementToggleCount) {
      this.#incrementTransactionUIMetricsFragmentProperty(
        transactionId,
        'enforced_simulation_toggle_count',
      );
    }

    const { enforcedSimulationsSlippage, updateTransaction } =
      await applyTransactionContainers({
        isApproved: false,
        messenger:
          this.#messenger as unknown as TransactionControllerInitMessenger,
        transactionMeta,
        types: containerTypes,
      });

    const newTransactionMeta = cloneDeep(transactionMeta);

    updateTransaction(newTransactionMeta);

    await this.#messenger.call(
      'TransactionController:updateEditableParams',
      transactionId,
      {
        containerTypes,
        data: newTransactionMeta.txParams.data ?? '0x',
        gas: newTransactionMeta.txParams.gas,
        gasPrice: transactionMeta.txParams.gasPrice,
        maxFeePerGas: transactionMeta.txParams.maxFeePerGas,
        maxPriorityFeePerGas: transactionMeta.txParams.maxPriorityFeePerGas,
        to: newTransactionMeta.txParams.to,
        updateType: false,
        value: newTransactionMeta.txParams.value,
      },
    );

    return { enforcedSimulationsSlippage };
  }

  /**
   * Builds the event fragment id used to store the UI metrics fragment for a
   * given transaction.
   *
   * @param transactionId - The id of the transaction.
   * @returns The event fragment id.
   */
  #getTransactionUIMetricsFragmentId(transactionId: string): string {
    return `transaction-ui-${transactionId}`;
  }

  /**
   * Retrieves the UI metrics fragment for a given transaction.
   *
   * @param transactionId - The id of the transaction.
   * @returns The event fragment, or `undefined` if it does not exist.
   */
  #getTransactionUIMetricsFragment(
    transactionId: string,
  ): MetaMetricsEventFragment | undefined {
    return this.#messenger.call(
      'MetaMetricsController:getEventFragmentById',
      this.#getTransactionUIMetricsFragmentId(transactionId),
    );
  }

  /**
   * Creates or updates the UI metrics fragment for a given transaction.
   *
   * @param transactionId - The id of the transaction.
   * @param payload - The fragment settings and properties to store.
   */
  upsertTransactionUIMetricsFragment(
    transactionId: string,
    payload: Partial<MetaMetricsEventFragment>,
  ): void {
    if (!transactionId || !payload) {
      return;
    }

    const fragmentId = this.#getTransactionUIMetricsFragmentId(transactionId);
    const existingFragment =
      this.#getTransactionUIMetricsFragment(transactionId);

    if (existingFragment) {
      this.#messenger.call(
        'MetaMetricsController:updateEventFragment',
        fragmentId,
        payload,
      );
      return;
    }

    this.#messenger.call('MetaMetricsController:createEventFragment', {
      // `createEventFragment` derives the fragment `id` from `uniqueIdentifier`.
      uniqueIdentifier: fragmentId,
      // Required by createEventFragment, but this fragment is storage-only.
      // We never finalize this fragment and we do not set initialEvent.
      successEvent: 'Transaction Fragment Created',
      category: MetaMetricsEventCategory.Transactions,
      canDeleteIfAbandoned: true,
      properties: payload.properties ?? {},
      sensitiveProperties: payload.sensitiveProperties ?? {},
    });
  }

  /**
   * Increments a numeric property in a transaction UI metrics fragment.
   *
   * @param transactionId - The id of the transaction.
   * @param property - The metrics property to increment.
   */
  #incrementTransactionUIMetricsFragmentProperty(
    transactionId: string,
    property: string,
  ): void {
    const fragment = this.#getTransactionUIMetricsFragment(transactionId);
    const currentValue = fragment?.properties?.[property];
    const nextValue = (typeof currentValue === 'number' ? currentValue : 0) + 1;

    this.upsertTransactionUIMetricsFragment(transactionId, {
      properties: {
        [property]: nextValue,
      },
    });
  }

  /**
   * Rejects a pending approval request.
   *
   * @param id - The ID of the approval request to reject.
   * @param error - The error to reject the approval request with.
   * @param error.code - The error code.
   * @param error.message - The error message.
   * @param error.data - The error data.
   */
  rejectPendingApproval(
    id: string,
    error: { code: number; message: string; data?: Json },
  ): void {
    try {
      this.#messenger.call(
        'ApprovalController:rejectRequest',
        id,
        new JsonRpcError(error.code, error.message, error.data),
      );
    } catch (err) {
      if (!(err instanceof ApprovalRequestNotFoundError)) {
        throw err;
      }
    }
  }

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
  async resolvePendingApproval(
    id: string,
    value: unknown,
    options: {
      walletType?: HardwareWalletType;
      waitForResult?: boolean;
    } | null = {},
  ): Promise<void> {
    // RPC params may serialize an omitted argument as `null`, so normalize first
    // before destructuring to avoid a runtime TypeError.
    const normalizedOptions = options ?? {};
    const { walletType, waitForResult } = normalizedOptions;
    const approvalOptions =
      typeof waitForResult === 'boolean' ? { waitForResult } : undefined;

    try {
      await this.#messenger.call(
        'ApprovalController:acceptRequest',
        id,
        value,
        approvalOptions,
      );
    } catch (error) {
      // Ignore if approval was already handled
      if (error instanceof ApprovalRequestNotFoundError) {
        return;
      }

      if (walletType) {
        await this.#handleHardwareWalletError(error as Error, walletType);
        return;
      }

      throw error;
    }
  }

  /**
   * Handle hardware wallet errors with retry support.
   * Parses the error, checks if it's retryable, and if so, attempts to recreate
   * the request (transaction or signature). Always throws an RPC error with
   * properly formatted data.
   *
   * @param error - The original error from the hardware wallet.
   * @param walletType - The hardware wallet type (e.g., 'Ledger', 'Trezor').
   * @throws Always throws with hardware wallet error data.
   */
  async #handleHardwareWalletError(
    error: Error,
    walletType: HardwareWalletType,
  ): Promise<never> {
    const hwError = toHardwareWalletError(error, walletType);
    const createRpcError = isUserRejectedHardwareWalletError(hwError)
      ? providerErrors.userRejectedRequest
      : rpcErrors.internal;
    // Throw a JsonRpcError with hardware wallet error data preserved
    // This ensures the error properties survive serialization across the RPC boundary
    throw createRpcError({
      message: hwError.message,
      data: {
        code: hwError.code,
        severity: hwError.severity,
        category: hwError.category,
        userMessage: hwError.userMessage,
        metadata: hwError.metadata,
      },
    });
  }

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
  async approveHardwareWalletTransaction({
    txId,
    txMeta,
    actionId,
    walletType,
  }: {
    txId: string | number;
    txMeta: unknown;
    actionId: string;
    walletType: HardwareWalletType;
  }): Promise<void> {
    await this.resolvePendingApproval(
      String(txId),
      { txMeta, actionId },
      { waitForResult: true, walletType },
    );
  }

  /**
   * Rejects all pending approval requests.
   *
   * Snap dialogs and account confirmations are accepted with a falsy value and
   * their interface deleted where applicable, while all other approvals are
   * rejected with a user-rejected-request error.
   */
  rejectAllPendingApprovals(): void {
    const { pendingApprovals } = this.#messenger.call(
      'ApprovalController:getState',
    );

    const approvalRequests = Object.values(pendingApprovals);

    for (const approvalRequest of approvalRequests) {
      const { id, type, origin } = approvalRequest;
      const interfaceId = approvalRequest.requestData?.id as string;

      switch (type) {
        case ApprovalType.SnapDialogAlert:
        case ApprovalType.SnapDialogPrompt:
        case DIALOG_APPROVAL_TYPES.default:
          log.debug('Rejecting snap dialog', { id, interfaceId, origin, type });
          this.#messenger.call('ApprovalController:acceptRequest', id, null);
          this.#messenger.call(
            'SnapInterfaceController:deleteInterface',
            interfaceId,
          );
          break;

        case ApprovalType.SnapDialogConfirmation:
          log.debug('Rejecting snap confirmation', {
            id,
            interfaceId,
            origin,
            type,
          });
          this.#messenger.call('ApprovalController:acceptRequest', id, false);
          this.#messenger.call(
            'SnapInterfaceController:deleteInterface',
            interfaceId,
          );
          break;

        case SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES.confirmAccountCreation:
        case SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES.confirmAccountRemoval:
        case SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES.showSnapAccountRedirect:
          log.debug('Rejecting snap account confirmation', {
            id,
            origin,
            type,
          });
          this.#messenger.call('ApprovalController:acceptRequest', id, false);
          break;

        default:
          log.debug('Rejecting pending approval', { id, origin, type });
          this.#messenger.call(
            'ApprovalController:rejectRequest',
            id,
            providerErrors.userRejectedRequest({
              data: {
                cause: 'rejectAllApprovals',
              },
            }),
          );
          break;
      }
    }
  }

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
  toggleExternalServices(useExternal: boolean): void {
    this.#messenger.call(
      'PreferencesController:toggleExternalServices',
      useExternal,
    );

    const subscriptionState = this.#messenger.call(
      'SubscriptionController:getState',
    );
    const hasActiveShieldSubscription = getIsShieldSubscriptionActive(
      subscriptionState.subscriptions,
    );

    if (useExternal) {
      this.#messenger.call('TokenDetectionController:enable');
      this.#messenger.call('GasFeeController:enableNonRPCGasFeeApis');
      if (hasActiveShieldSubscription) {
        this.#messenger.call('ShieldController:start');
      }
    } else {
      this.#messenger.call('TokenDetectionController:disable');
      this.#messenger.call('GasFeeController:disableNonRPCGasFeeApis');
      // stop polling for the subscriptions if external services are disabled
      this.#messenger.call('SubscriptionController:stopAllPolling');
      if (hasActiveShieldSubscription) {
        this.#messenger.call('ShieldController:stop');
      }
    }
  }

  /**
   * Accepts a permissions request. Silently ignores the request if it can no
   * longer be found.
   *
   * @param request - The permissions request to accept.
   */
  acceptPermissionsRequest(request: PermissionsRequest): void {
    try {
      this.#messenger.call(
        'PermissionController:acceptPermissionsRequest',
        request,
      );
    } catch (error) {
      if (!(error instanceof PermissionsRequestNotFoundError)) {
        throw error;
      }
    }
  }

  //
  // Hardware
  //

  /**
   * Attempts to create the Ledger transport app.
   *
   * @returns Whether the app was created successfully.
   */
  async attemptLedgerTransportCreation(): Promise<boolean> {
    return await this.#withKeyringForDevice(
      { name: HardwareDeviceNames.ledger, deviceRead: true },
      async (keyring) => await (keyring as LedgerKeyringV2).attemptMakeApp(),
    );
  }

  /**
   * Gets the app name and version from the Ledger device.
   *
   * @returns The app name and version.
   */
  async getAppNameAndVersion(): Promise<
    ReturnType<LedgerKeyringV2['getAppNameAndVersion']>
  > {
    return await this.#withKeyringForDevice(
      { name: HardwareDeviceNames.ledger, deviceRead: true },
      async (keyring) =>
        await (keyring as LedgerKeyringV2).getAppNameAndVersion(),
    );
  }

  /**
   * Gets the app configuration from the Ledger device.
   *
   * @returns The app configuration.
   */
  async getLedgerAppConfiguration(): Promise<
    ReturnType<LedgerKeyringV2['bridge']['getAppConfiguration']>
  > {
    return await this.#withKeyringForDevice(
      { name: HardwareDeviceNames.ledger, deviceRead: true },
      async (keyring) =>
        await (keyring as LedgerKeyringV2).bridge.getAppConfiguration(),
    );
  }

  /**
   * Get the active Ledger handler mode based on the remote feature flag.
   *
   * Reads from `RemoteFeatureFlagController` state and merges with manifest
   * overrides so `.manifest-overrides.json` can flip the flag for dev/E2E
   * builds without touching LaunchDarkly.
   *
   * @returns The Ledger handler mode.
   */
  getLedgerMode(): LedgerHandlerMode {
    const state = this.#messenger.call('RemoteFeatureFlagController:getState');
    const merged = merge(
      {},
      state.remoteFeatureFlags ?? {},
      getManifestFlags().remoteFeatureFlags ?? {},
    );
    return isDmkFeatureEnabled(merged)
      ? LedgerHandlerMode.DMK
      : LedgerHandlerMode.Legacy;
  }

  /**
   * Fetch account list from a hardware device.
   *
   * @param deviceName - The device name to connect.
   * @param page - The page of accounts to fetch (-1 for previous, 1 for next,
   * otherwise the first page).
   * @param hdPath - An optional hd path to set on the device keyring.
   * @returns The accounts.
   */
  async connectHardware(
    deviceName: string,
    page: number,
    hdPath?: string,
  ): Promise<AccountPage> {
    // This is the first-time setup path for a hardware wallet; the keyring
    // may not exist yet, so allow creation here. Every other caller of
    // `#withKeyringForDevice` operates on an already-paired device.
    //
    // Address paging waits on the device (and on user interaction, e.g.
    // entering a PIN), potentially forever if the device stays locked, so it
    // runs as a `deviceRead` outside the controller lock.
    return this.#withKeyringForDevice(
      { name: deviceName, hdPath, create: true, deviceRead: true },
      async (keyring) => {
        const ledgerKeyring = keyring as LedgerKeyringV2;
        let accounts: AccountPage = [];
        switch (page) {
          case -1:
            accounts = await ledgerKeyring.getPreviousPage();
            break;
          case 1:
            accounts = await ledgerKeyring.getNextPage();
            break;
          default:
            accounts = await ledgerKeyring.getFirstPage();
        }

        return accounts;
      },
    );
  }

  /**
   * Check if the device is unlocked.
   *
   * @param deviceName - The device name to check.
   * @param hdPath - An optional hd path to set on the device keyring.
   * @returns Whether the device is unlocked.
   */
  async checkHardwareStatus(
    deviceName: string,
    hdPath?: string,
  ): Promise<boolean> {
    return this.#withKeyringForDevice(
      {
        name: deviceName,
        hdPath,
        create: deviceName === HardwareDeviceNames.qr,
        deviceRead: true,
      },
      async (keyring) => {
        if (deviceName === HardwareDeviceNames.qr) {
          // QR keyrings have no `isUnlocked()`; pairing is reported via
          // `getMode()`. The QR V2 wrapper type does not declare it here, so
          // reach for it via a narrow structural cast.
          return Boolean(
            (keyring as unknown as { getMode(): unknown }).getMode(),
          );
        }
        // `isUnlocked` is exposed by the Ledger/Trezor V2 wrappers at runtime;
        // the wrapper types do not declare it, so reach for it via a narrow
        // structural cast.
        return (keyring as unknown as { isUnlocked(): boolean }).isUnlocked();
      },
    );
  }

  /**
   * Get the hd path currently configured on a Ledger hardware keyring.
   *
   * @returns The hd path.
   */
  async getHdPathForLedgerKeyring(): Promise<string> {
    return this.#withKeyringForDevice(
      { name: HardwareDeviceNames.ledger, deviceRead: true },
      async (keyring) => {
        return (keyring as LedgerKeyringV2).hdPath;
      },
    );
  }

  /**
   * Gets the public key from the Ledger device.
   *
   * @param hdPath - The hd path to get the public key for.
   * @returns The public key.
   */
  async getLedgerPublicKey(
    hdPath: string,
  ): Promise<ReturnType<LedgerKeyringV2['bridge']['getPublicKey']>> {
    return await this.#withKeyringForDevice(
      { name: HardwareDeviceNames.ledger, deviceRead: true },
      async (keyring) =>
        await (keyring as LedgerKeyringV2).bridge.getPublicKey({ hdPath }),
    );
  }

  /**
   * Gets the features from the Trezor device.
   *
   * @returns The features.
   */
  async getTrezorFeatures(): Promise<unknown> {
    return await this.#withKeyringForDevice(
      { name: HardwareDeviceNames.trezor, deviceRead: true },
      async (keyring) => {
        const { bridge } = keyring as TrezorKeyringV2;
        const bridgeWithFeatures = bridge as unknown as {
          getFeatures?: () => Promise<unknown>;
        };
        if (typeof bridgeWithFeatures.getFeatures !== 'function') {
          throw new Error('Trezor bridge does not support getFeatures');
        }

        return await bridgeWithFeatures.getFeatures();
      },
    );
  }

  /**
   * Forget a hardware device.
   *
   * @param deviceName - The device name to forget.
   * @returns `true` when the device has been forgotten.
   */
  async forgetDevice(deviceName: string): Promise<boolean> {
    return this.#withKeyringForDevice({ name: deviceName }, async (keyring) => {
      // V2 wrappers return `KeyringAccount[]` from `getAccounts()`; the
      // remove-handler downstream expects raw addresses.
      for (const account of await keyring.getAccounts()) {
        this.onAccountRemoved(account.address);
      }

      await keyring.forgetDevice();

      return true;
    });
  }

  /**
   * Get hardware account label.
   *
   * @param name - The device name.
   * @param index - The account index.
   * @param hdPathDescription - An optional hd path description.
   * @returns The account label.
   */
  #getAccountLabel(
    name: string,
    index: number,
    hdPathDescription?: string,
  ): string {
    return `${name[0].toUpperCase()}${name.slice(1)} ${
      index + 1
    } ${hdPathDescription || ''}`.trim();
  }

  /**
   * Imports an account from a Trezor or Ledger device.
   *
   * @param index - The account index to unlock.
   * @param deviceName - The device name.
   * @param hdPath - An optional hd path.
   * @param hdPathDescription - An optional hd path description.
   * @returns The unlocked account address and the current account list.
   */
  async unlockHardwareWalletAccount(
    index: number,
    deviceName: string,
    hdPath?: string,
    hdPathDescription?: string,
  ): Promise<{
    unlockedAccount: string;
    accounts: ReturnType<AccountsControllerListAccountsAction['handler']>;
  }> {
    const { address: unlockedAccount } = await this.#withKeyringForDevice(
      { name: deviceName, hdPath },
      async (keyring) => {
        const { entropySource } = keyring as
          | LedgerKeyringV2
          | TrezorKeyringV2
          | OneKeyKeyringV2
          | QrKeyringV2
          | LatticeKeyringV2;
        // Callers may omit `hdPath` and rely on the keyring's currently
        // configured base path (the legacy V1 surface implicitly did this
        // via `keyring.setAccountToUnlock` + `addAccounts`). Fall back to
        // the keyring's `hdPath` so V2 `createAccounts` builds a valid
        // derivation path.
        const effectiveHdPath = hdPath ?? (keyring as LedgerKeyringV2).hdPath;
        let createdAccount;

        switch (deviceName) {
          case HardwareDeviceNames.ledger: {
            // Ledger Live mode uses a per-account hardened third segment;
            // Legacy and BIP-44 modes are `${hdPath}/${index}`.
            const derivationPath = (
              effectiveHdPath === LEDGER_LIVE_PATH
                ? `m/44'/60'/${index}'/0/0`
                : `${effectiveHdPath}/${index}`
            ) as `m/${string}`;
            [createdAccount] = await (
              keyring as LedgerKeyringV2
            ).createAccounts({
              type: 'bip44:derive-path',
              entropySource,
              derivationPath,
            });
            break;
          }
          case HardwareDeviceNames.trezor:
          case HardwareDeviceNames.oneKey: {
            [createdAccount] = await (
              keyring as TrezorKeyringV2 | OneKeyKeyringV2
            ).createAccounts({
              type: 'bip44:derive-path',
              entropySource,
              derivationPath: `${effectiveHdPath}/${index}` as `m/${string}`,
            });
            break;
          }
          case HardwareDeviceNames.qr: {
            // QR devices are HD or Account-mode; legacy `setAccountToUnlock +
            // addAccounts` worked for both because the inner keyring routed
            // by mode internally. The V2 wrapper splits the two paths.
            const qrKeyring = keyring as QrKeyringV2;
            const isAccountMode = qrKeyring.getMode() === 'account';
            [createdAccount] = isAccountMode
              ? await qrKeyring.createAccounts({
                  type: 'custom',
                  entropySource,
                  addressIndex: index,
                })
              : await qrKeyring.createAccounts({
                  type: 'bip44:derive-index',
                  entropySource,
                  groupIndex: index,
                });
            break;
          }
          case HardwareDeviceNames.lattice: {
            [createdAccount] = await (
              keyring as LatticeKeyringV2
            ).createAccounts({
              type: 'custom',
              entropySource,
              addressIndex: index,
            } as LatticeCreateAccountOptions);
            break;
          }
          default:
            throw new Error(
              `LegacyBackgroundApiService:unlockHardwareWalletAccount - Unknown device: ${deviceName}`,
            );
        }

        if (!createdAccount) {
          throw new Error(`No account created for device: ${deviceName}`);
        }

        return {
          address: normalize(createdAccount.address) as string,
          label: this.#getAccountLabel(
            deviceName === HardwareDeviceNames.qr
              ? (keyring as QrKeyringV2).getName()
              : deviceName,
            index,
            hdPathDescription,
          ),
        };
      },
    );

    const accounts = this.#messenger.call('AccountsController:listAccounts');

    const internalAccount = this.#messenger.call(
      'AccountsController:getAccountByAddress',
      unlockedAccount,
    );

    if (internalAccount) {
      this.#messenger.call(
        'AccountsController:setSelectedAccount',
        internalAccount.id,
      );
    } else {
      throw new Error(`No account found for address: ${unlockedAccount}`);
    }

    return { unlockedAccount, accounts };
  }

  /**
   * Sets the Ledger Live preference to use for Ledger hardware wallet support.
   *
   * @param keyring - The Ledger keyring.
   * @returns The bridge result if available, otherwise `undefined`.
   * @deprecated This method is deprecated and will be removed in the future.
   * Only webhid connections are supported in chrome and u2f in firefox.
   */
  async #setLedgerTransportPreference(
    keyring: LedgerKeyringV2,
  ): Promise<boolean | undefined> {
    const transportType = window.navigator.hid
      ? LedgerTransportTypes.webhid
      : LedgerTransportTypes.u2f;

    // TODO: Expose `updateTransportMethod` directly on the V2 `LedgerKeyring`
    // wrapper in `@metamask/eth-ledger-bridge-keyring/v2` so callers don't
    // need to reach through `bridge`. The V2 wrapper currently exposes the
    // bridge instance but not this top-level method.
    //
    // Use `await` (not `.then`/`.catch`) so callers tolerate any bridge whose
    // `updateTransportMethod` is synchronous (e.g. older test stubs that
    // returned a raw value before being aligned with the real bridge's
    // Promise contract).
    const { bridge } = keyring;
    if (bridge?.updateTransportMethod) {
      return await bridge.updateTransportMethod(transportType);
    }

    return undefined;
  }

  /**
   * Runs the given callback with the keyring for the given device.
   *
   * @param options - The options for the device.
   * @param options.name - The device name to select.
   * @param options.hdPath - An optional hd path to be set on the device
   * keyring.
   * @param options.create - Whether to create the keyring if it is missing.
   * @param options.deviceRead - Set when the callback only reads from the
   * device (address paging, feature/status probes). Device reads can stall
   * indefinitely on a locked or unresponsive device, so they are executed on
   * the lock-free `withKeyringV2Unsafe` path instead of holding the
   * controller-wide operation mutex for the whole device interaction. To
   * enforce this, the callback does not receive the full keyring: it receives
   * a frozen read-only facade (see `restrictKeyringForDeviceRead`) on which
   * mutating methods do not exist.
   * @param callback - The callback to execute with the keyring.
   * @returns The result of the callback.
   */
  async #withKeyringForDevice<CallbackResult>(
    options: {
      name: string;
      hdPath?: string;
      create?: boolean;
      deviceRead?: boolean;
    },
    callback: (keyring: HardwareKeyringV2) => Promise<CallbackResult>,
  ): Promise<CallbackResult> {
    let keyringType = null;
    let v2KeyringType = null;
    switch (options.name) {
      case HardwareDeviceNames.trezor:
        keyringType = TrezorKeyring.type;
        v2KeyringType = KeyringType.Trezor;
        break;
      case HardwareDeviceNames.oneKey:
        keyringType = OneKeyKeyring.type;
        v2KeyringType = KeyringType.OneKey;
        break;
      case HardwareDeviceNames.ledger:
        keyringType = LedgerKeyring.type;
        v2KeyringType = KeyringType.Ledger;
        break;
      case HardwareDeviceNames.qr:
        keyringType = QrKeyring.type;
        v2KeyringType = KeyringType.Qr;
        break;
      case HardwareDeviceNames.lattice:
        keyringType = LatticeKeyring.type;
        v2KeyringType = KeyringType.Lattice;
        break;
      default:
        throw new Error(
          'LegacyBackgroundApiService:#withKeyringForDevice - Unknown device',
        );
    }

    // `withKeyringV2` has no `createIfMissing` option. The connect-device
    // flow and QR reconnect status probe may legitimately create a hardware
    // keyring; every other caller operates on a keyring that should already
    // exist, and should let the controller throw `KeyringNotFound` if it
    // doesn't.
    // `withController` runs the check-and-create as a mutually exclusive
    // transaction so a concurrent caller can't slip in between.
    if (options.create) {
      await this.#messenger.call(
        'KeyringController:withController',
        async (controller) => {
          const hasKeyring = controller.keyrings.some(
            (entry) =>
              (entry as unknown as { type: string }).type === keyringType,
          );
          if (!hasKeyring) {
            await controller.addNewKeyring(keyringType);
          }
        },
      );
    }

    // The prelude mutates keyring/app state (`setHdPath` resets the paging
    // state and can clear accounts, the Lattice `network` field feeds the
    // GridPlus session) and is fast and bounded, so it always runs under the
    // controller lock where `persistOrRollback` can pick up the changes.
    const prepareKeyring = async (hardwareKeyring: HardwareKeyringV2) => {
      // `setHdPath` is only declared on the Ledger V2 wrapper; the legacy QR
      // keyring also implements it at runtime. Reach for it via a narrow
      // structural cast and only call it when present.
      const keyringWithHdPath = hardwareKeyring as unknown as {
        setHdPath?: (hdPath: string) => void;
      };
      if (options.hdPath && keyringWithHdPath.setHdPath) {
        keyringWithHdPath.setHdPath(options.hdPath);
      }

      if (options.name === HardwareDeviceNames.ledger) {
        await this.#setLedgerTransportPreference(
          hardwareKeyring as LedgerKeyringV2,
        );
      }

      if (
        options.name === HardwareDeviceNames.trezor ||
        options.name === HardwareDeviceNames.oneKey
      ) {
        const model = (
          hardwareKeyring as TrezorKeyringV2 | OneKeyKeyringV2
        ).getModel();
        this.#messenger.call(
          'AppStateController:setTrezorModel',
          model ?? null,
        );
      }

      if (options.name === HardwareDeviceNames.lattice) {
        // `network` is cleared by `_resetDefaults` (called from `forgetDevice`) and depends on
        // runtime state, so we keep tracking it on every entry. The
        // GridPlus SDK Client reads it on `_initSession` to target
        // the right chain.
        (hardwareKeyring as LatticeKeyringV2).network =
          getProviderConfig({
            metamask: this.#messenger.call('NetworkController:getState'),
          }).type ?? null;
      }
    };

    if (!options.deviceRead) {
      return this.#messenger.call(
        'KeyringController:withKeyringV2',
        { type: v2KeyringType },
        async ({ keyring }) => {
          const hardwareKeyring = keyring as unknown as HardwareKeyringV2;
          await prepareKeyring(hardwareKeyring);
          return await callback(hardwareKeyring);
        },
      ) as Promise<CallbackResult>;
    }

    // Device-read path. The prelude still runs under the lock (short,
    // mutating), but the device interaction itself runs on the lock-free
    // path: a locked or unresponsive device makes calls like `getFirstPage`
    // or `getPublicKey` hang indefinitely, and holding the operation mutex
    // across that hang deadlocks every other locked keyring operation
    // (account syncing, account creation, unlocking, ...) until the browser
    // restarts.
    //
    // Trade-off: while the device read is in flight, a concurrent locked
    // operation that fails (or a lock/unlock cycle) can rebuild the keyring
    // instances, in which case this read fails or returns data from the
    // replaced instance. That is intentional: the stale instance is no longer
    // part of the controller, so its state can never be persisted, and the
    // caller can simply retry — unlike the previous behavior, where the whole
    // wallet wedged on the held mutex.
    await this.#messenger.call(
      'KeyringController:withKeyringV2',
      { type: v2KeyringType },
      async ({ keyring }) =>
        prepareKeyring(keyring as unknown as HardwareKeyringV2),
    );

    // The timeout is a UX backstop: without the lock, an abandoned device
    // read no longer blocks anything else, but the requesting UI would still
    // wait forever. Note that timing out abandons the in-flight device call
    // rather than cancelling it; a retry while the device call is still
    // pending may be rejected by the transport SDK.
    const deviceReadOperation = this.#messenger.call(
      'KeyringController:withKeyringV2Unsafe',
      { type: v2KeyringType },
      // The facade structurally prevents `deviceRead` callbacks from reaching
      // mutating keyring methods on the lock-free path.
      async ({ keyring }) =>
        await callback(
          restrictKeyringForDeviceRead(
            keyring as unknown as HardwareKeyringV2,
          ) as unknown as HardwareKeyringV2,
        ),
    ) as Promise<CallbackResult>;

    let timeoutHandle: ReturnType<typeof setTimeout> | undefined;
    let timedOut = false;
    try {
      return (await Promise.race([
        deviceReadOperation,
        new Promise((_resolve, reject) => {
          timeoutHandle = setTimeout(() => {
            timedOut = true;
            reject(
              new Error(
                `Hardware wallet device read timed out for device: ${options.name}. Make sure the device is connected and unlocked, then try again.`,
              ),
            );
          }, HARDWARE_DEVICE_READ_TIMEOUT_MS);
        }),
      ])) as CallbackResult;
    } finally {
      clearTimeout(timeoutHandle);
      if (timedOut) {
        // Only for observability: `Promise.race` already subscribes to the
        // abandoned device read, so a late rejection can never surface as an
        // unhandled rejection — but without this it would be dropped silently.
        deviceReadOperation.catch((error) =>
          log.warn(
            `Abandoned hardware device read failed after timeout for device: ${options.name}`,
            error,
          ),
        );
      }
    }
  }

  /**
   * Capture an artificial error in a timeout handler for testing purposes.
   *
   * @param message - The error message.
   * @deprecated This is only meant to facilitate manual and E2E tests testing. We should not
   * use this for handling errors.
   */
  captureTestError(message: string): void {
    setTimeout(() => {
      const error = new Error(message);
      error.name = 'TestError';
      captureException(error);
    });
  }

  /**
   * Throw an artificial error in a timeout handler for testing purposes.
   *
   * @param message - The error message.
   * @deprecated This is only meant to facilitate manual and E2E testing. We should not
   * use this for handling errors.
   */
  throwTestError(message: string): void {
    setTimeout(() => {
      const error = new Error(message);
      error.name = 'TestError';
      throw error;
    });
  }

  /**
   * Determines if the transaction relay supports the given chain.
   *
   * @param chainId - The chain ID to check for relay support.
   * @returns `true` if the transaction relay supports the chain, `false` otherwise.
   */
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
  async createSeedPhraseBackup(
    password: string,
    encodedSeedPhrase: number[],
    keyringId: string,
  ): Promise<void> {
    let createSeedPhraseBackupSuccess = false;
    try {
      this.#messenger.call('MetaMetricsController:bufferedTrace', {
        name: TraceName.OnboardingCreateKeyAndBackupSrp,
        op: TraceOperation.OnboardingSecurityOp,
      });
      const seedPhraseAsBuffer = Buffer.from(encodedSeedPhrase);
      const seedPhrase =
        this.#convertMnemonicToWordlistIndices(seedPhraseAsBuffer);

      await this.#messenger.call(
        'SeedlessOnboardingController:createToprfKeyAndBackupSeedPhrase',
        password,
        seedPhrase,
        keyringId,
      );
      createSeedPhraseBackupSuccess = true;

      await this.syncKeyringEncryptionKey();
    } catch (error) {
      this.#messenger.captureException?.(
        createSentryError(
          TraceName.OnboardingCreateKeyAndBackupSrpError,
          error,
        ),
      );

      log.error('[createSeedPhraseBackup] error', error);
      throw error;
    } finally {
      this.#messenger.call('MetaMetricsController:bufferedEndTrace', {
        name: TraceName.OnboardingCreateKeyAndBackupSrp,
        data: { success: createSeedPhraseBackupSuccess },
      });
    }
  }

  /**
   * Fetches all backed-up Secret Data (SRPs and Private keys) from the server.
   *
   * @param password - The user's password.
   * @returns Array of secret metadata items.
   */
  async #fetchAllSecretData(password?: string): Promise<SecretMetadata[]> {
    let fetchAllSeedPhrasesSuccess = false;
    try {
      this.#messenger.call('MetaMetricsController:bufferedTrace', {
        name: TraceName.OnboardingFetchSrps,
        op: TraceOperation.OnboardingSecurityOp,
      });
      const allSeedPhrases = await this.#messenger.call(
        'SeedlessOnboardingController:fetchAllSecretData',
        password,
      );
      fetchAllSeedPhrasesSuccess = true;

      return allSeedPhrases;
    } finally {
      this.#messenger.call('MetaMetricsController:bufferedEndTrace', {
        name: TraceName.OnboardingFetchSrps,
        data: { success: fetchAllSeedPhrasesSuccess },
      });
    }
  }

  /**
   * Syncs the seed phrases with the social login flow.
   */
  async syncSeedPhrases(): Promise<void> {
    try {
      const isSocialLoginFlow = this.#messenger.call(
        'OnboardingController:getIsSocialLoginFlow',
      );

      if (!isSocialLoginFlow) {
        throw new Error(
          'Syncing seed phrases is only available for social login flow',
        );
      }

      // 1. fetch all seed phrases
      const [rootSecret, ...otherSecrets] = await this.#fetchAllSecretData();
      if (!rootSecret) {
        throw new Error('No root SRP found');
      }

      for (const secret of otherSecrets) {
        // import SRP secret
        // Get the SRP hash, and find the hash in the local state
        const srpHash = this.#messenger.call(
          'SeedlessOnboardingController:getSecretDataBackupState',
          secret.data,
          secret.type,
        );

        if (!srpHash) {
          // import private key secret
          if (secret.type === SecretType.PrivateKey) {
            await this.importAccountWithStrategy(
              AccountImportStrategy.privateKey,
              [bytesToHex(secret.data)],
              {
                shouldCreateSocialBackup: false,
                shouldSelectAccount: false,
              },
            );
            continue;
          }

          const encodedSrp = convertEnglishWordlistIndicesToCodepoints(
            secret.data,
          );
          const mnemonicToRestore = Buffer.from(encodedSrp).toString('utf8');

          // import the new mnemonic to the current vault
          await this.importMnemonicToVault(mnemonicToRestore, {
            shouldCreateSocialBackup: false,
            shouldSelectAccount: false,
          });
        }
      }
    } catch (error) {
      log.error('error while syncing seed phrases', error);

      this.#messenger.captureException?.(
        createSentryError('Error while syncing seed phrases', error),
      );

      throw error;
    }
  }

  /**
   * Adds a new seed phrase backup for the user.
   *
   * If `syncWithSocial` is false, it will only update the local state,
   * and not sync the seed phrase to the server.
   *
   * @param mnemonic - The mnemonic to derive the seed phrase from.
   * @param keyringId - The keyring id of the backup seed phrase.
   * @param syncWithSocial - whether to skip syncing with social login
   */
  async addNewSeedPhraseBackup(
    mnemonic: string,
    keyringId: string,
    syncWithSocial = true,
  ): Promise<void> {
    const seedPhraseAsBuffer = Buffer.from(mnemonic, 'utf8');
    const seedPhraseAsUint8Array =
      this.#convertMnemonicToWordlistIndices(seedPhraseAsBuffer);

    if (syncWithSocial) {
      await this.#seedlessOperationMutex.runExclusive(async () => {
        let addNewSeedPhraseBackupSuccess = false;
        try {
          this.#messenger.call('MetaMetricsController:bufferedTrace', {
            name: TraceName.OnboardingAddSrp,
            op: TraceOperation.OnboardingSecurityOp,
          });

          // Run data type migration before adding new SRP to ensure data consistency.
          await runSeedlessOnboardingMigrations(this.#messenger);

          await this.#messenger.call(
            'SeedlessOnboardingController:addNewSecretData',
            seedPhraseAsUint8Array,
            EncAccountDataType.ImportedSrp,
            {
              keyringId,
            },
          );
          addNewSeedPhraseBackupSuccess = true;
        } catch (err) {
          this.#messenger.captureException?.(
            createSentryError(TraceName.OnboardingAddSrpError, err),
          );

          throw err;
        } finally {
          this.#messenger.call('MetaMetricsController:bufferedEndTrace', {
            name: TraceName.OnboardingAddSrp,
            data: { success: addNewSeedPhraseBackupSuccess },
          });
        }
      });
    } else {
      // Do not sync the seed phrase to the server, only update the local state
      this.#messenger.call(
        'SeedlessOnboardingController:updateBackupMetadataState',
        {
          keyringId,
          data: seedPhraseAsUint8Array,
          type: SecretType.Mnemonic,
        },
      );
    }
  }

  /**
   * Creates a new Vault and create a new keychain.
   *
   * @param password - The password used to encrypt the vault.
   * @returns created keyring object
   */
  async createNewVaultAndKeychain(
    password: string,
  ): Promise<{ type: string; accounts: string[]; metadata: { id: string } }> {
    const releaseLock = await this.#createVaultMutex.acquire();
    try {
      return await this.#createNewVaultAndKeychainUnderLock(password);
    } finally {
      releaseLock();
    }
  }

  /**
   * Creates a new vault and returns the seed phrase in a single atomic operation.
   * Holding the vault mutex through seed export avoids races where concurrent
   * keyring mutations leave no HD keyring available for export.
   *
   * @param password - The password used to encrypt the vault.
   * @returns The seed phrase encoded as UTF-8 bytes.
   */
  async createNewVaultAndGetSeedPhrase(password: string): Promise<Buffer> {
    const releaseLock = await this.#createVaultMutex.acquire();
    try {
      await this.#createNewVaultAndKeychainUnderLock(password);
      return await this.getSeedPhrase(password);
    } finally {
      releaseLock();
    }
  }

  /**
   * Unlocks the vault and returns the seed phrase in a single atomic operation.
   * Holding the vault mutex through seed export avoids races where concurrent
   * keyring mutations leave no HD keyring available for export.
   *
   * @param password - The password used to unlock the vault.
   * @returns The seed phrase encoded as UTF-8 bytes.
   */
  async unlockAndGetSeedPhrase(password: string): Promise<Buffer> {
    const releaseLock = await this.#createVaultMutex.acquire();
    try {
      await this.submitPasswordOrEncryptionKey({
        password,
      });
      return await this.getSeedPhrase(password);
    } finally {
      releaseLock();
    }
  }

  async #createNewVaultAndKeychainUnderLock(
    password: string,
  ): Promise<{ type: string; accounts: string[]; metadata: { id: string } }> {
    const isWalletResetInProgress = this.#messenger.call(
      'AppStateController:getIsWalletResetInProgress',
    );
    if (isWalletResetInProgress) {
      // clear permissions
      this.#messenger.call('PermissionController:clearState');

      // Clear snap state
      await this.#messenger.call('SnapController:clearState');

      // Clear account tree state
      this.#messenger.call('AccountTreeController:clearState');

      // Currently, the account-order-controller is not in sync with
      // the accounts-controller. To properly persist the hidden state
      // of accounts, we should add a new flag to the account struct
      // to indicate if it is hidden or not.
      // TODO: Update @metamask/accounts-controller to support this.
      this.#messenger.call(
        'AccountOrderController:updateHiddenAccountsList',
        [],
      );

      this.#messenger.call('TransactionController:clearUnapprovedTransactions');
    }

    await this.#messenger.call(
      'MultichainAccountService:createMultichainAccountWallet',
      {
        type: 'create',
        password,
      },
    );

    // set is resetting wallet in progress to false, after new vault and keychain are created
    this.#messenger.call(
      'AppStateController:setIsWalletResetInProgress',
      false,
    );

    const { keyrings } = this.#messenger.call('KeyringController:getState');
    const primaryKeyring = keyrings[0] as {
      type: string;
      accounts: string[];
      metadata: { id: string };
    };

    // Once we have our first HD keyring available, we re-create the internal list of
    // accounts (they should be up-to-date already, but we still run `updateAccounts` as
    // there are some account migration happening in that function).
    await this.#messenger.call('AccountsController:updateAccounts');

    // Then we can build the initial tree.
    this.#messenger.call('AccountTreeController:reinit');

    return primaryKeyring;
  }

  /**
   * Counts the number of accounts discovered by provider.
   *
   * @param accounts - The discovered accounts to count by provider.
   * @returns Account counts by provider.
   */
  #getDiscoveryCountByProvider(
    accounts: { type: string }[],
  ): Record<'Bitcoin' | 'Solana' | 'Tron', number> {
    const counts = {
      Bitcoin: 0,
      Solana: 0,
      Tron: 0,
    };

    const solanaAccountTypes: string[] = Object.values(SolAccountType);
    const bitcoinAccountTypes: string[] = Object.values(BtcAccountType);
    const tronAccountTypes: string[] = Object.values(TrxAccountType);

    for (const account of accounts) {
      if (solanaAccountTypes.includes(account.type)) {
        counts.Solana += 1;
      }
      if (bitcoinAccountTypes.includes(account.type)) {
        counts.Bitcoin += 1;
      }
      if (tronAccountTypes.includes(account.type)) {
        counts.Tron += 1;
      }
    }

    return counts;
  }

  /**
   * Discovers and creates accounts for the given keyring id.
   *
   * @param id - The keyring id to discover and create accounts for.
   * @returns Discovered account counts by chain.
   */
  async discoverAndCreateAccounts(
    id?: string,
  ): Promise<Record<'Bitcoin' | 'Solana' | 'Tron', number>> {
    // Hold the start time so the span can be backdated if discovery does real
    // work. The common no-op discovery (every login, per keyring) is not traced.
    const startTime = getPerformanceTimestamp();
    try {
      const { keyrings } = this.#messenger.call('KeyringController:getState');
      // If no keyring id is provided, we assume one keyring was added to the vault
      const keyringIdToDiscover = id || keyrings[0]?.metadata.id;

      if (!keyringIdToDiscover) {
        throw new Error('No keyring id to discover accounts for');
      }

      const wallet = this.#messenger.call(
        'MultichainAccountService:getMultichainAccountWallet',
        {
          entropySource: keyringIdToDiscover,
        },
      );

      const result = await wallet.discoverAccounts();

      const counts = this.#getDiscoveryCountByProvider(result);

      // Only emit a span when discovery actually created accounts.
      if (result.length > 0) {
        trace({
          name: TraceName.DiscoverAccounts,
          op: TraceOperation.AccountDiscover,
          startTime,
        });
        endTrace({
          name: TraceName.DiscoverAccounts,
        });
      }

      return counts;
    } catch (error) {
      log.warn(`Failed to add accounts with balance. ${String(error)}`);
      return {
        Bitcoin: 0,
        Solana: 0,
        Tron: 0,
      };
    }
  }

  /**
   * Returns the index of the HD keyring containing the selected account.
   *
   * @returns The index of the HD keyring containing the selected account.
   */
  #getHDEntropyIndex(): number | undefined {
    const selectedAccount = this.#messenger.call(
      'AccountsController:getSelectedAccount',
    );
    const { keyrings } = this.#messenger.call('KeyringController:getState');
    const hdKeyrings = keyrings.filter(
      (keyring: { type: string; accounts: string[] }) =>
        keyring.type === KeyringTypes.hdKeyTree,
    );
    const index = hdKeyrings.findIndex(
      (keyring: { type: string; accounts: string[] }) =>
        keyring.accounts.includes(selectedAccount.address),
    );

    return index === -1 ? undefined : index;
  }

  /**
   * Imports a new mnemonic to the vault.
   *
   * @param mnemonic - The mnemonic to import.
   * @param options - The options for the import.
   * @param options.shouldCreateSocialBackup - whether to create a backup for the seedless onboarding flow
   * @param options.shouldSelectAccount - whether to select the new account in the wallet
   */
  async importMnemonicToVault(
    mnemonic: string,
    options: {
      shouldCreateSocialBackup?: boolean;
      shouldSelectAccount?: boolean;
    } = {
      shouldCreateSocialBackup: true,
      shouldSelectAccount: true,
    },
  ): Promise<void> {
    const { shouldCreateSocialBackup = true, shouldSelectAccount = true } =
      options;
    const releaseLock = await this.#createVaultMutex.acquire();
    try {
      const { entropySource: id } = await this.#messenger.call(
        'MultichainAccountService:createMultichainAccountWallet',
        {
          type: 'import',
          mnemonic: this.#convertMnemonicToWordlistIndices(
            Buffer.from(mnemonic, 'utf8'),
          ),
        },
      );

      const [newAccount] = (await this.#messenger.call(
        'KeyringController:withKeyringV2',
        { id },
        async ({ keyring }) => keyring.getAccounts(),
      )) as { address: string }[];

      const isSocialLoginFlow = this.#messenger.call(
        'OnboardingController:getIsSocialLoginFlow',
      );
      if (isSocialLoginFlow) {
        try {
          // if social backup is requested, add the seed phrase backup
          await this.addNewSeedPhraseBackup(
            mnemonic,
            id,
            shouldCreateSocialBackup,
          );
        } catch (err) {
          await this.#messenger.call(
            'MultichainAccountService:removeMultichainAccountWallet',
            id,
          );
          throw err;
        }
      }

      if (shouldSelectAccount) {
        const account = this.#messenger.call(
          'AccountsController:getAccountByAddress',
          newAccount.address,
        );
        if (!account) {
          throw new Error(
            `No account found for address: ${newAccount.address}`,
          );
        }
        this.#messenger.call(
          'AccountsController:setSelectedAccount',
          account.id,
        );
      }

      const syncAndDiscoverAccounts = async () => {
        // We want to trigger a full sync of the account tree after importing a new SRP
        // because `hasAccountTreeSyncingSyncedAtLeastOnce` is already true
        await this.#messenger.call('AccountTreeController:syncWithUserStorage');

        const discoveredAccounts = await this.discoverAndCreateAccounts(id);

        const newHdEntropyIndex = this.#getHDEntropyIndex();

        trackEvent(
          createEventBuilder(MetaMetricsEventName.ImportSecretRecoveryPhrase)
            .addProperties({
              status: 'completed',
              // Metrics property names use snake_case by convention.
              // eslint-disable-next-line @typescript-eslint/naming-convention
              hd_entropy_index: newHdEntropyIndex,
              // eslint-disable-next-line @typescript-eslint/naming-convention
              number_of_solana_accounts_discovered: discoveredAccounts?.Solana,
              // eslint-disable-next-line @typescript-eslint/naming-convention
              number_of_bitcoin_accounts_discovered:
                discoveredAccounts?.Bitcoin,
            })
            .build(),
        );
      };

      const { completedOnboarding } = this.#messenger.call(
        'OnboardingController:getState',
      );
      // In order to avoid premature sync and avoid potential race condition, for the actual B&S full sync after the onboarding is completed.
      // We only sync and discover accounts if the onboarding is completed.
      // i.e we don't sync and discover accounts for `socialImport` flow before the onboarding is completed.
      if (completedOnboarding) {
        // In order to avoid blocking the UI thread, we don't await for the sync and discover accounts to complete.
        // eslint-disable-next-line no-void
        void syncAndDiscoverAccounts();
      }
    } finally {
      releaseLock();
    }
  }

  /**
   * Restores an array of seed phrases to the vault.
   *
   * @param secretDatas - The secret metadata items to restore.
   */
  async restoreSeedPhrasesToVault(
    secretDatas: SecretMetadata[],
  ): Promise<void> {
    const isSocialLoginFlow = this.#messenger.call(
      'OnboardingController:getIsSocialLoginFlow',
    );

    if (!isSocialLoginFlow) {
      // import the restored seed phrase (mnemonics) to the vault
      // this is only available for social login flow
      return; // or throw error here?
    }

    // These mnemonics are restored from the Social Backup, so we don't need to do it again
    const shouldCreateSocialBackup = false;
    // This is used to select the new account in the wallet.
    // During the restore seed phrases, we just do the import, but don't change the selected account.
    // Just let the user select the account manually after the restore.
    const shouldSetSelectedAccount = false;

    for (const secret of secretDatas) {
      // import SRP secret
      // Get the SRP hash, and find the hash in the local state
      const srpHash = this.#messenger.call(
        'SeedlessOnboardingController:getSecretDataBackupState',
        secret.data,
        secret.type,
      );
      if (srpHash) {
        // If SRP is in the local state, skip it
        continue;
      }

      if (secret.type === SecretType.PrivateKey) {
        await this.importAccountWithStrategy(
          AccountImportStrategy.privateKey,
          [bytesToHex(secret.data)],
          {
            shouldCreateSocialBackup,
            shouldSelectAccount: shouldSetSelectedAccount,
          },
        );
        continue;
      }

      // If SRP is not in the local state, import it to the vault
      // convert the seed phrase to a mnemonic (string)
      const encodedSrp = convertEnglishWordlistIndicesToCodepoints(secret.data);
      const mnemonicToRestore = Buffer.from(encodedSrp).toString('utf8');

      // import the new mnemonic to the vault
      await this.importMnemonicToVault(mnemonicToRestore, {
        shouldCreateSocialBackup,
        shouldSelectAccount: shouldSetSelectedAccount,
      });
    }
  }

  /**
   * Fetches and restores the seed phrase from the metadata store using the social login and restore the vault using the seed phrase.
   *
   * @param password - The password.
   * @returns The seed phrase.
   */
  async restoreSocialBackupAndGetSeedPhrase(password: string): Promise<string> {
    try {
      // get the first seed phrase from the array, this is the oldest seed phrase
      // and we will use it to create the initial vault
      const [firstSecretData, ...remainingSecretData] =
        await this.#fetchAllSecretData(password);

      const firstSeedPhrase = convertEnglishWordlistIndicesToCodepoints(
        firstSecretData.data,
      );
      const mnemonic = Buffer.from(firstSeedPhrase).toString('utf8');
      const encodedSeedPhrase = Array.from(
        Buffer.from(mnemonic, 'utf8').values(),
      );
      // restore the vault using the root seed phrase
      await this.createNewVaultAndRestore(password, encodedSeedPhrase);

      // restore the remaining Mnemonics/SeedPhrases/PrivateKeys to the vault
      if (remainingSecretData.length > 0) {
        await this.restoreSeedPhrasesToVault(remainingSecretData);
      }

      return mnemonic;
    } catch (error) {
      if (error instanceof RecoveryError) {
        throw new JsonRpcError(-32603, error.message, error.data);
      }

      if (error instanceof InvalidPrimarySecretDataTypeError) {
        const errorMessage = `${error.message} - ${JSON.stringify(error.data)}`;
        log.error('restoreSocialBackupAndGetSeedPhrase::error', errorMessage);
        this.#messenger.captureException?.(
          createSentryError(errorMessage, error),
        );
        throw error;
      }

      this.#messenger.captureException?.(
        createSentryError(
          'Failed to restore social backup and get seed phrase',
          error,
        ),
      );

      throw error;
    }
  }

  /**
   * Create a new Vault and restore an existent keyring.
   *
   * @param password - The password used to encrypt the vault.
   * @param encodedSeedPhrase - The seed phrase, encoded as an array of UTF-8 bytes.
   */
  async createNewVaultAndRestore(
    password: string,
    encodedSeedPhrase: number[],
  ): Promise<void> {
    const releaseLock = await this.#createVaultMutex.acquire();
    try {
      const { completedOnboarding } = this.#messenger.call(
        'OnboardingController:getState',
      );

      const seedPhraseAsBuffer = Buffer.from(encodedSeedPhrase);

      // clear permissions
      this.#messenger.call('PermissionController:clearState');

      // Clear snap state
      await this.#messenger.call('SnapController:clearState');

      // Clear account tree state
      this.#messenger.call('AccountTreeController:clearState');

      // Currently, the account-order-controller is not in sync with
      // the accounts-controller. To properly persist the hidden state
      // of accounts, we should add a new flag to the account struct
      // to indicate if it is hidden or not.
      // TODO: Update @metamask/accounts-controller to support this.
      this.#messenger.call(
        'AccountOrderController:updateHiddenAccountsList',
        [],
      );

      this.#messenger.call('TransactionController:clearUnapprovedTransactions');

      if (completedOnboarding) {
        this.#messenger.call('TokenDetectionController:enable');
      }

      // create new vault
      const seedPhraseAsUint8Array =
        this.#convertMnemonicToWordlistIndices(seedPhraseAsBuffer);

      const { entropySource: id } = await this.#messenger.call(
        'MultichainAccountService:createMultichainAccountWallet',
        {
          type: 'restore',
          password,
          mnemonic: seedPhraseAsUint8Array,
        },
      );

      // set is resetting wallet in progress to false, after new vault and keychain are created
      this.#messenger.call(
        'AppStateController:setIsWalletResetInProgress',
        false,
      );

      // We re-created the vault, meaning we only have 1 new HD keyring
      // now. We re-create the internal list of accounts (which is
      // not an expensive operation, since we should only have 1 HD
      // keyring that has one default account.
      // TODO: Remove this once the `accounts-controller` once only
      // depends only on keyrings `:stateChange`.
      await this.#messenger.call('AccountsController:updateAccounts');

      // Init multichain accounts after creating internal accounts.
      await this.#messenger.call('MultichainAccountService:init');

      // And we re-init the account tree controller too, to use the
      // newly created accounts.
      // TODO: Remove this once the `accounts-controller` once only
      // depends only on keyrings `:stateChange`.
      this.#messenger.call('AccountTreeController:reinit');

      if (completedOnboarding) {
        // check if external services are enabled
        const { useExternalServices } = this.#messenger.call(
          'PreferencesController:getState',
        );
        if (useExternalServices) {
          await this.#messenger.call(
            'AccountTreeController:syncWithUserStorageAtLeastOnce',
          );
        }
        await this.discoverAndCreateAccounts(id);
      }

      if (getIsSeedlessOnboardingFeatureEnabled()) {
        const isSocialLoginFlow = this.#messenger.call(
          'OnboardingController:getIsSocialLoginFlow',
        );
        if (isSocialLoginFlow) {
          const { keyrings } = this.#messenger.call(
            'KeyringController:getState',
          );
          // if it's social login flow, update the local backup metadata state of SeedlessOnboarding Controller
          const primaryKeyringId = keyrings[0].metadata.id;
          this.#messenger.call(
            'SeedlessOnboardingController:updateBackupMetadataState',
            {
              keyringId: primaryKeyringId,
              data: seedPhraseAsUint8Array,
              type: SecretType.Mnemonic,
            },
          );

          await this.syncKeyringEncryptionKey();
        }
      }
    } finally {
      releaseLock();
    }
  }

  /**
   * Encodes a BIP-39 mnemonic as the indices of words in the English BIP-39 wordlist.
   *
   * @param mnemonic - The BIP-39 mnemonic.
   * @returns The Unicode code points for the seed phrase formed from the words in the wordlist.
   */
  #convertMnemonicToWordlistIndices(mnemonic: Buffer): Uint8Array {
    const indices = mnemonic
      .toString()
      .split(' ')
      .map((word) => wordlist.indexOf(word));
    return new Uint8Array(new Uint16Array(indices).buffer);
  }

  async isRelaySupported(chainId: Hex): Promise<boolean> {
    return isRelaySupported(chainId);
  }

  /**
   * Get Sentinel Network flags for the given chain.
   *
   * @param chainId - The chain ID to check for relay support.
   * @returns The Sentinel network flags for the given chain, or undefined if not found.
   */
  async getSentinelNetworkFlags(
    chainId: Hex,
  ): Promise<SentinelNetwork | undefined> {
    return getSentinelNetworkFlags(chainId);
  }

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
  handleDefiReferralOnPermittedAccountsAdded(details: {
    origin: string;
    newCaipAccountIds: CaipAccountId[];
  }): void {
    const { origin, newCaipAccountIds } = details;

    const partner = getPartnerByOrigin(origin);
    if (!partner) {
      return;
    }

    const { accounts, selectedAccount: selectedAccountId } =
      this.#messenger.call('AccountsController:getState').internalAccounts;
    const selectedAccount = accounts[selectedAccountId];
    if (!selectedAccount?.address || !isEvmAccountType(selectedAccount.type)) {
      return;
    }

    const selectedMatchesNewPermit = newCaipAccountIds.some((caipAccountId) => {
      try {
        const { address } = parseCaipAccountId(caipAccountId);
        return isEqualCaseInsensitive(address, selectedAccount.address);
      } catch {
        return false;
      }
    });

    if (!selectedMatchesNewPermit) {
      return;
    }

    const { appActiveTab } = this.#messenger.call(
      'AppStateController:getState',
    );
    if (
      !appActiveTab?.id ||
      typeof appActiveTab.id !== 'number' ||
      appActiveTab.origin !== origin
    ) {
      return;
    }

    this.handleDefiReferral(
      partner,
      appActiveTab.id,
      ReferralTriggerType.PermittedAccountAdded,
      {
        activePermittedAddressOverride: selectedAccount.address,
      },
    ).catch((error) => {
      log.error(
        `Failed to handle ${partner.name} referral after permitted account added: `,
        error,
      );
    });
  }

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
  async handleDefiReferral(
    partner: DefiReferralPartnerConfig,
    tabId: number,
    triggerType: ReferralTriggerType,
    options: { activePermittedAddressOverride?: string } = {},
  ): Promise<void> {
    const { remoteFeatureFlags } = this.#messenger.call(
      'RemoteFeatureFlagController:getState',
    );
    const referralPartnersFlag =
      remoteFeatureFlags?.extensionUxDefiReferralPartners as
        | Record<string, boolean>
        | undefined;
    const isReferralEnabled = referralPartnersFlag?.[partner.id];

    if (!isReferralEnabled) {
      return;
    }

    // Only continue if the partner has permitted accounts
    const permittedAccounts = await this.#getPermittedAccounts(partner.origin);
    if (permittedAccounts.length === 0) {
      return;
    }

    // Only continue if there is no pending approval
    const hasPendingApproval = this.#messenger.call(
      'ApprovalController:hasRequest',
      {
        origin: partner.origin,
        type: partner.approvalType,
      },
    );

    if (hasPendingApproval) {
      return;
    }

    // If the partner requires a specific chain and user's chain doesn't match,
    // return early to avoid the referral code potentially not being applied.
    // Don't write any account status so that the prompt can show on the next
    // trigger (NewConnection or OnNavigateConnectedTab) once the user has switched chain
    if (partner.requiredChainId) {
      const networkClientId = this.#messenger.call(
        'SelectedNetworkController:getNetworkClientIdForDomain',
        partner.origin,
      );
      const networkConfig = this.#messenger.call(
        'NetworkController:getNetworkConfigurationByNetworkClientId',
        networkClientId,
      );
      const currentChainId = networkConfig?.chainId;
      if (currentChainId !== partner.requiredChainId) {
        return;
      }
    }

    const { activePermittedAddressOverride } = options;
    const activePermittedAccount =
      (activePermittedAddressOverride &&
        permittedAccounts.find((addr) =>
          isEqualCaseInsensitive(addr, activePermittedAddressOverride),
        )) ??
      permittedAccounts[0];

    const preferencesState = this.#messenger.call(
      'PreferencesController:getState',
    );
    const referralStatusByAccount = preferencesState.referrals[partner.id];
    const permittedAccountStatus =
      referralStatusByAccount[activePermittedAccount as Hex];
    const declinedAccounts = Object.keys(referralStatusByAccount).filter(
      (account) =>
        referralStatusByAccount[account as Hex] === ReferralStatus.Declined,
    );

    // We should show approval screen if the account does not have a status
    const shouldShowApproval = permittedAccountStatus === undefined;

    // We should redirect to the referral url if the account is approved
    const shouldRedirect = permittedAccountStatus === ReferralStatus.Approved;

    const checkExistingCodeMap: Partial<
      Record<DefiReferralPartner, (account: string) => Promise<boolean>>
    > = {
      [DefiReferralPartner.GMX]: (account) =>
        this.#checkGmxHasReferralCode(account),
      [DefiReferralPartner.Hyperliquid]: preferencesState.useExternalServices
        ? checkHyperliquidHasReferralCode
        : undefined,
    };

    if (shouldShowApproval || shouldRedirect) {
      const checkExistingCode = checkExistingCodeMap[partner.id];
      if (checkExistingCode) {
        const hasExistingCode = await checkExistingCode(activePermittedAccount);
        if (hasExistingCode) {
          this.#messenger.call(
            'PreferencesController:addReferralPassedAccount',
            partner.id,
            activePermittedAccount as Hex,
          );
          return;
        }
      }
    }

    if (shouldShowApproval) {
      try {
        // Track referral viewed event
        trackEvent(
          createEventBuilder(MetaMetricsEventName.ReferralViewed)
            .addCategory(MetaMetricsEventCategory.Referrals)
            .addProperties({
              url: partner.origin,
              // eslint-disable-next-line @typescript-eslint/naming-convention
              trigger_type: triggerType,
            })
            .build(),
        );

        // `shouldShowRequest` is preserved for parity with the previous
        // MetamaskController implementation; `ApprovalController.add` ignores it
        // (only `addRequest` reads it), so it is a no-op passed via a widened
        // object to satisfy the action's option type.
        const approvalRequest = {
          origin: partner.origin,
          type: partner.approvalType,
          requestData: {
            selectedAddress: activePermittedAccount,
            partnerId: partner.id,
            partnerName: partner.name,
            learnMoreUrl: partner.learnMoreUrl,
          },
          shouldShowRequest: triggerType === ReferralTriggerType.NewConnection,
        };
        const approvalResponse = (await this.#messenger.call(
          'ApprovalController:add',
          approvalRequest,
        )) as { approved?: boolean } | undefined;

        if (approvalResponse?.approved) {
          this.#handleDefiReferralApprovedAccount(
            partner,
            activePermittedAccount,
            permittedAccounts,
            declinedAccounts,
          );
          await this.#handleDefiReferralRedirect(
            partner,
            tabId,
            activePermittedAccount,
          );
        } else {
          this.#messenger.call(
            'PreferencesController:addReferralDeclinedAccount',
            partner.id,
            activePermittedAccount as Hex,
          );
        }

        // Track referral confirm button clicked event
        trackEvent(
          createEventBuilder(MetaMetricsEventName.ReferralConfirmButtonClicked)
            .addCategory(MetaMetricsEventCategory.Referrals)
            .addProperties({
              // eslint-disable-next-line @typescript-eslint/naming-convention
              opt_in: Boolean(approvalResponse?.approved),
              url: partner.origin,
            })
            .build(),
        );
      } catch (error) {
        // Do nothing if the user rejects the request
        if (
          (error as { code?: number })?.code ===
          errorCodes.provider.userRejectedRequest
        ) {
          return;
        }
        throw error;
      }
    }

    if (shouldRedirect) {
      await this.#handleDefiReferralRedirect(
        partner,
        tabId,
        activePermittedAccount,
      );
    }
  }

  /**
   * Checks whether the given wallet already has a GMX referral code set on the
   * Arbitrum ReferralStorage contract. Reconstructs the Arbitrum provider via
   * the messenger and defaults to `false` when Arbitrum is not configured.
   *
   * @param walletAddress - The wallet address to check.
   * @returns Whether the wallet has a GMX referral code on-chain.
   */
  async #checkGmxHasReferralCode(walletAddress: string): Promise<boolean> {
    try {
      const networkClientId = this.#messenger.call(
        'NetworkController:findNetworkClientIdByChainId',
        CHAIN_IDS.ARBITRUM,
      );
      const { provider } = this.#messenger.call(
        'NetworkController:getNetworkClientById',
        networkClientId,
      );
      return await checkGmxHasReferralCode(provider, walletAddress);
    } catch {
      // If Arbitrum is not configured or the lookup fails, default to false
      return false;
    }
  }

  /**
   * Handles redirection to the DeFi partner's referral page.
   *
   * @param partner - The partner configuration.
   * @param tabId - The browser tab ID to update.
   * @param permittedAccount - The permitted account.
   */
  async #handleDefiReferralRedirect(
    partner: DefiReferralPartnerConfig,
    tabId: number,
    permittedAccount: string,
  ): Promise<void> {
    await this.#updateDefiReferralUrl(partner, tabId);
    // Mark this account as having been shown the referral page
    this.#messenger.call(
      'PreferencesController:addReferralPassedAccount',
      partner.id,
      permittedAccount as Hex,
    );
  }

  /**
   * Handles referral states for permitted accounts after user approval.
   *
   * @param partner - The partner configuration.
   * @param activePermittedAccount - The active permitted account.
   * @param permittedAccounts - The permitted accounts.
   * @param declinedAccounts - The previously declined permitted accounts.
   */
  #handleDefiReferralApprovedAccount(
    partner: DefiReferralPartnerConfig,
    activePermittedAccount: string,
    permittedAccounts: string[],
    declinedAccounts: string[],
  ): void {
    if (declinedAccounts.length === 0) {
      // If there are no previously declined permitted accounts then
      // we approve all permitted accounts so that the user is not
      // shown the approval screen unnecessarily when switching
      this.#messenger.call(
        'PreferencesController:setAccountsReferralApproved',
        partner.id,
        permittedAccounts as Hex[],
      );
    } else {
      this.#messenger.call(
        'PreferencesController:addReferralApprovedAccount',
        partner.id,
        activePermittedAccount as Hex,
      );
      // If there are any previously declined accounts then
      // we do not approve them, but instead remove them from the declined list
      // so they have the option to participate again in future
      permittedAccounts.forEach((account) => {
        if (declinedAccounts.includes(account)) {
          this.#messenger.call(
            'PreferencesController:removeReferralDeclinedAccount',
            partner.id,
            account as Hex,
          );
        }
      });
    }
  }

  /**
   * Updates the browser tab URL to the DeFi partner's referral page.
   *
   * @param partner - The partner configuration.
   * @param tabId - The browser tab ID to update.
   */
  async #updateDefiReferralUrl(
    partner: DefiReferralPartnerConfig,
    tabId: number,
  ): Promise<void> {
    try {
      const url = await this.#getTabUrl(tabId);
      const currentUrl = new URL(url || '');
      const referralUrl = new URL(partner.referralUrl);

      // Preserve (or update) existing params and add referral params
      const mergedParams = new URLSearchParams(currentUrl.search);
      for (const [key, value] of referralUrl.searchParams) {
        mergedParams.set(key, value);
      }

      // Apply merged params to the referral URL
      referralUrl.search = mergedParams.toString();
      await this.#updateTabUrl(tabId, referralUrl.toString());
    } catch (error) {
      log.error(
        `Failed to update URL to ${partner.name} referral page: `,
        error,
      );
    }
  }
}
