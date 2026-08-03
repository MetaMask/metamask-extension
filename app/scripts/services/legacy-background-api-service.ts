import log from 'loglevel';
import { Messenger } from '@metamask/messenger';
import {
  NetworkControllerGetNetworkClientByIdAction,
  NetworkControllerGetSelectedNetworkClientAction,
  NetworkControllerGetStateAction,
  NetworkControllerLookupNetworkAction,
  NetworkControllerResetConnectionAction,
} from '@metamask/network-controller';
import {
  NetworkEnablementControllerEnableAllPopularNetworksAction,
  NetworkEnablementControllerEnableNetworkAction,
  NetworkEnablementControllerGetStateAction,
} from '@metamask/network-enablement-controller';
import {
  add0x,
  bytesToHex,
  CaipChainId,
  Hex,
  hexToBytes,
  Json,
  NonEmptyArray,
} from '@metamask/utils';
import { Mutex } from 'async-mutex';
import { wordlist } from '@metamask/scure-bip39/dist/wordlists/english';
import {
  BtcAccountType,
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
  KeyringControllerGetKeyringsByTypeAction,
  KeyringControllerGetStateAction,
  KeyringControllerImportAccountWithStrategyAction,
  KeyringControllerRemoveAccountAction,
  KeyringControllerWithKeyringV2Action,
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
  AccountsControllerSetAccountNameAction,
  AccountsControllerSetSelectedAccountAction,
  AccountsControllerUpdateAccountsAction,
} from '@metamask/accounts-controller';
import {
  TransactionContainerType,
  TransactionControllerClearUnapprovedTransactionsAction,
  TransactionControllerEstimateGasAction,
  TransactionControllerGetNonceLockAction,
  TransactionControllerGetStateAction,
  TransactionControllerIsAtomicBatchSupportedAction,
  TransactionControllerUpdateEditableParamsAction,
  TransactionControllerWipeTransactionsAction,
} from '@metamask/transaction-controller';
import {
  CurrencyRateControllerSetCurrentCurrencyAction,
  TokenDetectionControllerDisableAction,
  TokenDetectionControllerEnableAction,
} from '@metamask/assets-controllers';
import {
  AccountId,
  Asset,
  AssetsControllerGetAssetsAction,
  AssetsControllerSetSelectedCurrencyAction,
  Caip19AssetId,
} from '@metamask/assets-controller';
import type { InternalAccount } from '@metamask/keyring-internal-api';
import { SupportedCurrency } from '@metamask/core-backend';
import { RemoteFeatureFlagControllerGetStateAction } from '@metamask/remote-feature-flag-controller';
import {
  PhishingControllerMaybeUpdateStateAction,
  PhishingControllerTestOriginAction,
} from '@metamask/phishing-controller';
import {
  ApprovalControllerAcceptRequestAction,
  ApprovalControllerGetStateAction,
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
import { ApprovalType } from '@metamask/controller-utils';
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
import { JsonRpcError, providerErrors, rpcErrors } from '@metamask/rpc-errors';
import {
  AuthenticationControllerGetStateAction,
  AuthenticationControllerPerformSignOutAction,
} from '@metamask/profile-sync-controller/auth';
import {
  SubscriptionControllerGetStateAction,
  SubscriptionControllerStopAllPollingAction,
} from '@metamask/subscription-controller';
import {
  ShieldControllerStartAction,
  ShieldControllerStopAction,
} from '@metamask/shield-controller';
import {
  GasFeeControllerDisableNonRPCGasFeeApisAction,
  GasFeeControllerEnableNonRPCGasFeeApisAction,
} from '@metamask/gas-fee-controller';
import { DelegationControllerSignDelegationAction } from '@metamask/delegation-controller';
import { cloneDeep } from 'lodash';
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
import { DecodedTransactionDataResponse } from '../../../shared/types/transaction-decode';
import { captureException } from '../../../shared/lib/sentry';
import {
  ASSETS_UNIFY_STATE_VERSION_1,
  AssetsUnifyStateFeatureFlag,
  isAssetsUnifyStateFeatureEnabled as getIsAssetsUnifyStateFeatureEnabled,
} from '../../../shared/lib/assets-unify-state/remote-feature-flag';
import { SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES } from '../../../shared/constants/app';
import { KeyringType as KeyringTypes } from '../../../shared/constants/keyring';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventFragment,
  MetaMetricsEventName,
} from '../../../shared/constants/metametrics';
import { OnboardingControllerGetIsSocialLoginFlowAction } from '../controllers/onboarding-method-action-types';
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
import { TransactionControllerInitMessenger } from '../wallet-init/messengers/transaction-controller-messenger';
import {
  PreferencesControllerSetPasswordForgottenAction,
  PreferencesControllerToggleExternalServicesAction,
} from '../controllers/preferences-controller-method-action-types';
import { PreferencesControllerGetStateAction } from '../controllers/preferences-controller';
import { OnboardingControllerGetStateAction } from '../controllers/onboarding';
import {
  MetaMetricsControllerCreateEventFragmentAction,
  MetaMetricsControllerGetEventFragmentByIdAction,
  MetaMetricsControllerUpdateEventFragmentAction,
  MetaMetricsControllerBufferedEndTraceAction,
  MetaMetricsControllerBufferedTraceAction,
} from '../controllers/metametrics-controller-method-action-types';
import { createEventBuilder, trackEvent } from '../controllers/analytics';
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
  AppStateControllerGetIsWalletResetInProgressAction,
  AppStateControllerSetIsWalletResetInProgressAction,
  AppStateControllerSetPasskeyAutoUnlockSuppressedAction,
} from '../controllers/app-state-controller-method-action-types';
import { AccountOrderControllerUpdateHiddenAccountsListAction } from '../controllers/account-order-method-action-types';
import { PASSKEY_AUTO_UNLOCK_SUPPRESSION_DURATION_MS } from '../../../shared/constants/passkey';
import {
  HardwareWalletType,
  isUserRejectedHardwareWalletError,
  toHardwareWalletError,
} from '../../../shared/lib/hardware-wallets';
import { LegacyBackgroundApiServiceMethodActions } from './legacy-background-api-service-method-action-types';

const serviceName = 'LegacyBackgroundApiService';

/**
 * The methods that the {@link LegacyBackgroundApiService} exposes to the messenger.
 * This is currently empty, but it can be extended in the future to replace `MetaMaskController.getApi()`.
 */
const MESSENGER_EXPOSED_METHODS = [
  'acceptPermissionsRequest',
  'applyTransactionContainersExisting',
  'captureTestError',
  'changePassword',
  'checkDelegationDisabled',
  'checkIsSeedlessPasswordOutdated',
  'createNewVaultAndGetSeedPhrase',
  'createNewVaultAndKeychain',
  'createNewVaultAndRestore',
  'createSeedPhraseBackup',
  'decodeTransactionData',
  'discoverAndCreateAccounts',
  'estimateGas',
  'exportAccount',
  'getAccountsBySnapId',
  'getAssets',
  'getCode',
  'getGlobalChainId',
  'getNextNonce',
  'getOpenMetamaskTabsIds',
  'getPhishingResult',
  'getRequestAccountTabIds',
  'getSeedPhrase',
  'getSentinelNetworkFlags',
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
  'unMarkPasswordForgotten',
  'unlockAndGetSeedPhrase',
  'upsertTransactionUIMetricsFragment',
] as const;

/**
 * The actions that the {@link LegacyBackgroundApiService} can handle.
 */
export type LegacyBackgroundApiServiceActions =
  LegacyBackgroundApiServiceMethodActions;

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
  | AccountsControllerSetAccountNameAction
  | AccountsControllerSetSelectedAccountAction
  | AccountsControllerUpdateAccountsAction
  | ApprovalControllerAcceptRequestAction
  | ApprovalControllerGetStateAction
  | ApprovalControllerRejectRequestAction
  | AppStateControllerGetIsWalletResetInProgressAction
  | AppStateControllerSetIsWalletResetInProgressAction
  | AppStateControllerSetPasskeyAutoUnlockSuppressedAction
  | AssetsControllerGetAssetsAction
  | AssetsControllerSetSelectedCurrencyAction
  | AuthenticationControllerGetStateAction
  | AuthenticationControllerPerformSignOutAction
  | BridgeStatusControllerWipeBridgeStatusAction
  | CurrencyRateControllerSetCurrentCurrencyAction
  | DelegationControllerSignDelegationAction
  | GasFeeControllerDisableNonRPCGasFeeApisAction
  | GasFeeControllerEnableNonRPCGasFeeApisAction
  | KeyringControllerAddNewKeyringAction
  | KeyringControllerChangePasswordAction
  | KeyringControllerExportAccountAction
  | KeyringControllerExportEncryptionKeyAction
  | KeyringControllerExportSeedPhraseAction
  | KeyringControllerGetKeyringsByTypeAction
  | KeyringControllerGetStateAction
  | KeyringControllerImportAccountWithStrategyAction
  | KeyringControllerRemoveAccountAction
  | KeyringControllerWithKeyringV2Action
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
  | NetworkControllerGetNetworkClientByIdAction
  | NetworkControllerGetSelectedNetworkClientAction
  | NetworkControllerGetStateAction
  | NetworkControllerLookupNetworkAction
  | NetworkControllerResetConnectionAction
  | NetworkEnablementControllerEnableAllPopularNetworksAction
  | NetworkEnablementControllerEnableNetworkAction
  | NetworkEnablementControllerGetStateAction
  | OnboardingControllerGetIsSocialLoginFlowAction
  | OnboardingControllerGetStateAction
  | PermissionControllerAcceptPermissionsRequestAction
  | PermissionControllerClearStateAction
  | PermissionControllerRejectPermissionsRequestAction
  | PermissionControllerRevokePermissionsAction
  | PermissionControllerUpdatePermissionsByCaveatAction
  | PhishingControllerMaybeUpdateStateAction
  | PhishingControllerTestOriginAction
  | PreferencesControllerGetStateAction
  | PreferencesControllerSetPasswordForgottenAction
  | PreferencesControllerToggleExternalServicesAction
  | RemoteFeatureFlagControllerGetStateAction
  | SeedlessOnboardingControllerAddNewSecretDataAction
  | SeedlessOnboardingControllerChangePasswordAction
  | SeedlessOnboardingControllerCheckIsPasswordOutdatedAction
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
  | ShieldControllerStartAction
  | ShieldControllerStopAction
  | SmartTransactionsControllerWipeSmartTransactionsAction
  | SnapControllerClearStateAction
  | SnapInterfaceControllerDeleteInterfaceAction
  | SubscriptionControllerGetStateAction
  | SubscriptionControllerStopAllPollingAction
  | TokenDetectionControllerDisableAction
  | TokenDetectionControllerEnableAction
  | TransactionControllerClearUnapprovedTransactionsAction
  | TransactionControllerEstimateGasAction
  | TransactionControllerGetNonceLockAction
  | TransactionControllerGetStateAction
  | TransactionControllerIsAtomicBatchSupportedAction
  | TransactionControllerUpdateEditableParamsAction
  | TransactionControllerWipeTransactionsAction;

/**
 * The {@link LegacyBackgroundApiService} messenger.
 */
export type LegacyBackgroundApiServiceMessenger = Messenger<
  typeof serviceName,
  LegacyBackgroundApiServiceActions | AllowedActions,
  never
>;

/**
 * The options required to initialize the {@link LegacyBackgroundApiService}.
 */
type LegacyBackgroundApiServiceOptions = {
  messenger: LegacyBackgroundApiServiceMessenger;
  infuraProjectId: string;
  seedlessOperationMutex: Mutex;
  getRequestAccountTabIds: () => Record<string, number>;
  getOpenMetamaskTabsIds: () => Record<string, number>;
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
   * @param options.markNotificationPopupAsAutomaticallyClosed - A function that marks the notification popup as automatically closed.
   * @param options.requestSafeReload - A function that triggers a safe reload of the extension.
   * @param options.sendUpdate - A function that triggers an update to the UI.
   * @param options.seedlessOperationMutex - A mutex to use for seedless operations.
   * @param options.offscreenPromise - A promise that resolves when the offscreen document is ready.
   */
  constructor({
    messenger,
    infuraProjectId,
    getRequestAccountTabIds,
    getOpenMetamaskTabsIds,
    markNotificationPopupAsAutomaticallyClosed,
    requestSafeReload,
    sendUpdate,
    seedlessOperationMutex,
    offscreenPromise,
  }: LegacyBackgroundApiServiceOptions) {
    this.#messenger = messenger;

    this.#infuraProjectId = infuraProjectId;
    this.#getRequestAccountTabIds = getRequestAccountTabIds;
    this.#getOpenMetamaskTabsIds = getOpenMetamaskTabsIds;
    this.#markNotificationPopupAsAutomaticallyClosed =
      markNotificationPopupAsAutomaticallyClosed;
    this.#requestSafeReload = requestSafeReload;
    this.#sendUpdate = sendUpdate;
    // Temporarily get the mutex from `MetamaskController` until
    // changePasswordWithPasskeyVerification is migrated here (the only remaining
    // MetamaskController user of this mutex).
    // TODO: Remove this injection once that migration is complete.
    this.#seedlessOperationMutex = seedlessOperationMutex;
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
   */
  async applyTransactionContainersExisting(
    transactionId: string,
    containerTypes: TransactionContainerType[],
  ): Promise<void> {
    const { transactions } = await this.#messenger.call(
      'TransactionController:getState',
    );

    const transactionMeta = transactions.find((tx) => tx.id === transactionId);

    if (!transactionMeta) {
      throw new Error(`Transaction with ID ${transactionId} not found.`);
    }

    const { updateTransaction } = await applyTransactionContainers({
      isApproved: false,
      messenger:
        this.#messenger as unknown as TransactionControllerInitMessenger,
      transactionMeta,
      types: containerTypes,
    });

    const newTransactionMeta = cloneDeep(transactionMeta);

    updateTransaction(newTransactionMeta);

    this.#messenger.call(
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
}
