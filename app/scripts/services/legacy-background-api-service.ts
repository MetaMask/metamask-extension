import log from 'loglevel';
import { Messenger } from '@metamask/messenger';
import {
  NetworkControllerGetNetworkClientByIdAction,
  NetworkControllerGetSelectedNetworkClientAction,
  NetworkControllerGetStateAction,
  NetworkControllerResetConnectionAction,
} from '@metamask/network-controller';
import { add0x, Hex, hexToBytes, Json, NonEmptyArray } from '@metamask/utils';
import { Mutex } from 'async-mutex';
import {
  AccountImportStrategy,
  KeyringControllerAddNewKeyringAction,
  KeyringControllerChangePasswordAction,
  KeyringControllerExportAccountAction,
  KeyringControllerExportEncryptionKeyAction,
  KeyringControllerExportSeedPhraseAction,
  KeyringControllerGetKeyringsByTypeAction,
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
  SecretType,
  SeedlessOnboardingControllerAddNewSecretDataAction,
  SeedlessOnboardingControllerChangePasswordAction,
  SeedlessOnboardingControllerCheckIsPasswordOutdatedAction,
  SeedlessOnboardingControllerGetStateAction,
  SeedlessOnboardingControllerRunMigrationsAction,
  RecoveryError,
  SeedlessOnboardingControllerErrorMessage,
  SeedlessOnboardingControllerLoadKeyringEncryptionKeyAction,
  SeedlessOnboardingControllerRevokePendingRefreshTokensAction,
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
import { SnapInterfaceControllerDeleteInterfaceAction } from '@metamask/snaps-controllers';
import { DIALOG_APPROVAL_TYPES } from '@metamask/snaps-rpc-methods';
import { ApprovalType } from '@metamask/controller-utils';
import {
  MultichainAccountServiceResyncAccountsAction,
  MultichainAccountServiceAlignWalletsAction,
  MultichainAccountServiceInitAction,
} from '@metamask/multichain-account-service';
import {
  AccountTreeControllerGetSelectedAccountGroupAction,
  AccountTreeControllerInitAction,
} from '@metamask/account-tree-controller';
import { JsonRpcError, providerErrors } from '@metamask/rpc-errors';
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
import { getIsAssetsUnifiedStateIncludedInBuild } from '../../../shared/lib/environment';
import { getIsShieldSubscriptionActive } from '../../../shared/lib/shield/subscription-utils';
import { DecodedTransactionDataResponse } from '../../../shared/types/transaction-decode';
import { captureException } from '../../../shared/lib/sentry';
import {
  ASSETS_UNIFY_STATE_VERSION_1,
  AssetsUnifyStateFeatureFlag,
  isAssetsUnifyStateFeatureEnabled as getIsAssetsUnifyStateFeatureEnabled,
} from '../../../shared/lib/assets-unify-state/remote-feature-flag';
import { SNAP_MANAGE_ACCOUNTS_CONFIRMATION_TYPES } from '../../../shared/constants/app';
import {
  MetaMetricsEventCategory,
  MetaMetricsEventFragment,
} from '../../../shared/constants/metametrics';
import { OnboardingControllerGetIsSocialLoginFlowAction } from '../controllers/onboarding-method-action-types';
import { getAccountsBySnapId } from '../lib/snap-keyring';
import { isSendBundleSupported } from '../lib/transaction/sentinel-api';
import { applyTransactionContainers } from '../lib/transaction/containers/util';
import { isRelaySupported } from '../lib/transaction/transaction-relay';
import { decodeTransactionData } from '../lib/transaction/decode/util';
import { TransactionControllerInitMessenger } from '../wallet-init/messengers/transaction-controller-messenger';
import {
  PreferencesControllerSetPasswordForgottenAction,
  PreferencesControllerToggleExternalServicesAction,
} from '../controllers/preferences-controller-method-action-types';
import { OnboardingControllerGetStateAction } from '../controllers/onboarding';
import {
  MetaMetricsControllerCreateEventFragmentAction,
  MetaMetricsControllerGetEventFragmentByIdAction,
  MetaMetricsControllerTrackEventAction,
  MetaMetricsControllerUpdateEventFragmentAction,
  MetaMetricsControllerBufferedEndTraceAction,
  MetaMetricsControllerBufferedTraceAction,
} from '../controllers/metametrics-controller-method-action-types';
import { runSeedlessOnboardingMigrations } from '../lib/seedless-onboarding/run-migrations';
import { createSentryError } from '../../../shared/lib/error';
import {
  encodeDisabledDelegationsCheck,
  decodeDisabledDelegationsResult,
} from '../../../shared/lib/delegation/delegation';
import { TraceName, TraceOperation } from '../../../shared/lib/trace';
import { AppStateControllerSetPasskeyAutoUnlockSuppressedAction } from '../controllers/app-state-controller-method-action-types';
import { PASSKEY_AUTO_UNLOCK_SUPPRESSION_DURATION_MS } from '../../../shared/constants/passkey';
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
  'decodeTransactionData',
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
  'importAccountWithStrategy',
  'isAssetsUnifyStateEnabled',
  'isPublicEndpointUrl',
  'isRelaySupported',
  'isSendBundleSupported',
  'markPasswordForgotten',
  'onAccountRemoved',
  'rejectAllPendingApprovals',
  'rejectPendingApproval',
  'rejectPermissionsRequest',
  'removeAccount',
  'removePermissionsFor',
  'resetAccount',
  'setAccountLabel',
  'setCurrentCurrency',
  'setLocked',
  'setSelectedInternalAccount',
  'submitPasswordOrEncryptionKey',
  'syncPasswordAndUnlockWallet',
  'syncKeyringEncryptionKey',
  'throwTestError',
  'toggleExternalServices',
  'unMarkPasswordForgotten',
  'upsertTransactionUIMetricsFragment',
] as const;

/**
 * The actions that the {@link LegacyBackgroundApiService} can handle.
 */
export type LegacyBackgroundApiServiceActions =
  LegacyBackgroundApiServiceMethodActions;

type AllowedActions =
  | AccountTreeControllerGetSelectedAccountGroupAction
  | AccountTreeControllerInitAction
  | AccountsControllerGetAccountAction
  | AccountsControllerGetAccountByAddressAction
  | AccountsControllerGetSelectedAccountAction
  | AccountsControllerSetAccountNameAction
  | AccountsControllerSetSelectedAccountAction
  | AccountsControllerUpdateAccountsAction
  | ApprovalControllerAcceptRequestAction
  | ApprovalControllerGetStateAction
  | ApprovalControllerRejectRequestAction
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
  | KeyringControllerImportAccountWithStrategyAction
  | KeyringControllerRemoveAccountAction
  | KeyringControllerWithKeyringV2Action
  | MetaMetricsControllerCreateEventFragmentAction
  | MetaMetricsControllerGetEventFragmentByIdAction
  | MetaMetricsControllerTrackEventAction
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
  | MultichainAccountServiceInitAction
  | MultichainAccountServiceResyncAccountsAction
  | NetworkControllerGetNetworkClientByIdAction
  | NetworkControllerGetSelectedNetworkClientAction
  | NetworkControllerGetStateAction
  | NetworkControllerResetConnectionAction
  | OnboardingControllerGetIsSocialLoginFlowAction
  | OnboardingControllerGetStateAction
  | PermissionControllerAcceptPermissionsRequestAction
  | PermissionControllerRejectPermissionsRequestAction
  | PermissionControllerRevokePermissionsAction
  | PermissionControllerUpdatePermissionsByCaveatAction
  | PhishingControllerMaybeUpdateStateAction
  | PhishingControllerTestOriginAction
  | PreferencesControllerSetPasswordForgottenAction
  | PreferencesControllerToggleExternalServicesAction
  | RemoteFeatureFlagControllerGetStateAction
  | SeedlessOnboardingControllerAddNewSecretDataAction
  | SeedlessOnboardingControllerChangePasswordAction
  | SeedlessOnboardingControllerCheckIsPasswordOutdatedAction
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
  | SnapInterfaceControllerDeleteInterfaceAction
  | SubscriptionControllerGetStateAction
  | SubscriptionControllerStopAllPollingAction
  | TokenDetectionControllerDisableAction
  | TokenDetectionControllerEnableAction
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
  createVaultMutex: Mutex;
  getRequestAccountTabIds: () => Record<string, number>;
  getOpenMetamaskTabsIds: () => Record<string, number>;
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
   * @param options.sendUpdate - A function that triggers an update to the UI.
   * @param options.seedlessOperationMutex - A mutex to use for seedless operations.
   * @param options.createVaultMutex - A mutex to serialize vault creation/export with locking.
   * @param options.offscreenPromise - A promise that resolves when the offscreen document is ready.
   */
  constructor({
    messenger,
    infuraProjectId,
    getRequestAccountTabIds,
    getOpenMetamaskTabsIds,
    sendUpdate,
    seedlessOperationMutex,
    createVaultMutex,
    offscreenPromise,
  }: LegacyBackgroundApiServiceOptions) {
    this.#messenger = messenger;

    this.#infuraProjectId = infuraProjectId;
    this.#getRequestAccountTabIds = getRequestAccountTabIds;
    this.#getOpenMetamaskTabsIds = getOpenMetamaskTabsIds;
    this.#sendUpdate = sendUpdate;
    // Temporarily get the mutex from `MetamaskController` until we can
    // migrate the seedless onboarding functionality to this service.
    // TODO: Remove this once the migration is complete.
    this.#seedlessOperationMutex = seedlessOperationMutex;
    this.#createVaultMutex = createVaultMutex;
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
  async isRelaySupported(chainId: Hex): Promise<boolean> {
    return isRelaySupported(chainId);
  }
}
