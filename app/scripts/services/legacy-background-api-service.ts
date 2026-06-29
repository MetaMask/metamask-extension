import log from 'loglevel';
import { Messenger } from '@metamask/messenger';
import {
  NetworkControllerGetNetworkClientByIdAction,
  NetworkControllerGetStateAction,
  NetworkControllerResetConnectionAction,
} from '@metamask/network-controller';
import { add0x, Hex, hexToBytes, Json } from '@metamask/utils';
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
  KeyringControllerSubmitEncryptionKeyAction,
  KeyringControllerSubmitPasswordAction,
  KeyringControllerVerifyPasswordAction,
  KeyringControllerWithKeyringAction,
} from '@metamask/keyring-controller';
import {
  AccountsControllerGetAccountByAddressAction,
  AccountsControllerGetSelectedAccountAction,
  AccountsControllerSetSelectedAccountAction,
  AccountsControllerUpdateAccountsAction,
} from '@metamask/accounts-controller';
import {
  TransactionControllerGetNonceLockAction,
  TransactionControllerGetStateAction,
  TransactionControllerWipeTransactionsAction,
} from '@metamask/transaction-controller';
import { CurrencyRateControllerSetCurrentCurrencyAction } from '@metamask/assets-controllers';
import { AssetsControllerSetSelectedCurrencyAction } from '@metamask/assets-controller';
import { SupportedCurrency } from '@metamask/core-backend';
import { RemoteFeatureFlagControllerGetStateAction } from '@metamask/remote-feature-flag-controller';
import {
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
import { PermissionControllerUpdatePermissionsByCaveatAction } from '@metamask/permission-controller';
import {
  Caip25CaveatMutators,
  Caip25CaveatType,
  Caip25CaveatValue,
} from '@metamask/chain-agnostic-permission';
import { SnapId } from '@metamask/snaps-sdk';
import {
  MultichainAccountServiceResyncAccountsAction,
  MultichainAccountServiceAlignWalletsAction,
  MultichainAccountServiceInitAction,
} from '@metamask/multichain-account-service';
import {
  AccountTreeControllerGetSelectedAccountGroupAction,
  AccountTreeControllerInitAction,
} from '@metamask/account-tree-controller';
import { JsonRpcError } from '@metamask/rpc-errors';
import {
  AuthenticationControllerGetStateAction,
  AuthenticationControllerPerformSignOutAction,
} from '@metamask/profile-sync-controller/auth';
import { SubscriptionControllerStopAllPollingAction } from '@metamask/subscription-controller';
import {
  convertEnglishWordlistIndicesToCodepoints,
  isPublicEndpointUrl,
} from '../lib/util';
import { getIsAssetsUnifiedStateIncludedInBuild } from '../../../shared/lib/environment';
import {
  ASSETS_UNIFY_STATE_VERSION_1,
  AssetsUnifyStateFeatureFlag,
  isAssetsUnifyStateFeatureEnabled as getIsAssetsUnifyStateFeatureEnabled,
} from '../../../shared/lib/assets-unify-state/remote-feature-flag';
import { SMART_TRANSACTION_CONFIRMATION_TYPES } from '../../../shared/constants/app';
import { isEqualCaseInsensitive } from '../../../shared/lib/string-utils';
import { OnboardingControllerGetIsSocialLoginFlowAction } from '../controllers/onboarding-method-action-types';
import { getAccountsBySnapId } from '../lib/snap-keyring';
import { PreferencesControllerSetPasswordForgottenAction } from '../controllers/preferences-controller-method-action-types';
import { OnboardingControllerGetStateAction } from '../controllers/onboarding';
import {
  MetaMetricsControllerTrackEventAction,
  MetaMetricsControllerBufferedEndTraceAction,
  MetaMetricsControllerBufferedTraceAction,
} from '../controllers/metametrics-controller-method-action-types';
import { runSeedlessOnboardingMigrations } from '../lib/seedless-onboarding/run-migrations';
import { createSentryError } from '../../../shared/lib/error';
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
  'changePassword',
  'checkIsSeedlessPasswordOutdated',
  'exportAccount',
  'getAccountsBySnapId',
  'getCode',
  'getGlobalChainId',
  'getNextNonce',
  'getOpenMetamaskTabsIds',
  'getRequestAccountTabIds',
  'getSeedPhrase',
  'importAccountWithStrategy',
  'isAssetsUnifyStateEnabled',
  'isPublicEndpointUrl',
  'markPasswordForgotten',
  'onAccountRemoved',
  'removeAccount',
  'resetAccount',
  'setCurrentCurrency',
  'setLocked',
  'submitPasswordOrEncryptionKey',
  'syncPasswordAndUnlockWallet',
  'syncKeyringEncryptionKey',
  'unMarkPasswordForgotten',
] as const;

/**
 * The actions that the {@link LegacyBackgroundApiService} can handle.
 */
export type LegacyBackgroundApiServiceActions =
  LegacyBackgroundApiServiceMethodActions;

type AllowedActions =
  | AccountTreeControllerGetSelectedAccountGroupAction
  | AccountTreeControllerInitAction
  | AccountsControllerGetAccountByAddressAction
  | AccountsControllerGetSelectedAccountAction
  | AccountsControllerSetSelectedAccountAction
  | AccountsControllerUpdateAccountsAction
  | ApprovalControllerGetStateAction
  | ApprovalControllerRejectRequestAction
  | AppStateControllerSetPasskeyAutoUnlockSuppressedAction
  | AssetsControllerSetSelectedCurrencyAction
  | AuthenticationControllerGetStateAction
  | AuthenticationControllerPerformSignOutAction
  | BridgeStatusControllerWipeBridgeStatusAction
  | CurrencyRateControllerSetCurrentCurrencyAction
  | KeyringControllerAddNewKeyringAction
  | KeyringControllerChangePasswordAction
  | KeyringControllerExportAccountAction
  | KeyringControllerExportEncryptionKeyAction
  | KeyringControllerExportSeedPhraseAction
  | KeyringControllerGetKeyringsByTypeAction
  | KeyringControllerImportAccountWithStrategyAction
  | KeyringControllerRemoveAccountAction
  | KeyringControllerWithKeyringV2Action
  | MetaMetricsControllerTrackEventAction
  | KeyringControllerSetLockedAction
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
  | NetworkControllerGetStateAction
  | NetworkControllerResetConnectionAction
  | OnboardingControllerGetIsSocialLoginFlowAction
  | OnboardingControllerGetStateAction
  | PermissionControllerUpdatePermissionsByCaveatAction
  | PreferencesControllerSetPasswordForgottenAction
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
  | SmartTransactionsControllerWipeSmartTransactionsAction
  | SubscriptionControllerStopAllPollingAction
  | TransactionControllerGetNonceLockAction
  | TransactionControllerGetStateAction
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
   * @param options.offscreenPromise - A promise that resolves when the offscreen document is ready.
   */
  constructor({
    messenger,
    infuraProjectId,
    getRequestAccountTabIds,
    getOpenMetamaskTabsIds,
    sendUpdate,
    seedlessOperationMutex,
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
   * Determines if the given endpoint URL is a public endpoint URL.
   *
   * @param endpointUrl - The endpoint URL to check.
   * @returns `true` if the endpoint URL is a public endpoint URL, `false` otherwise.
   */
  isPublicEndpointUrl(endpointUrl: string): boolean {
    return isPublicEndpointUrl(endpointUrl, this.#infuraProjectId);
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

    const { pendingApprovals } = this.#messenger.call(
      'ApprovalController:getState',
    );

    const { transactions } = this.#messenger.call(
      'TransactionController:getState',
    );

    const matchingSmartTransactionApprovals = Object.values(
      pendingApprovals ?? {},
    ).filter((approval) => {
      if (
        approval.type !==
        SMART_TRANSACTION_CONFIRMATION_TYPES.showSmartTransactionStatusPage
      ) {
        return false;
      }

      const txId = approval.requestState?.txId;

      if (typeof txId !== 'string') {
        return false;
      }

      const transaction = transactions.find(({ id }) => id === txId);

      return (
        transaction &&
        transaction?.chainId === globalChainId &&
        isEqualCaseInsensitive(transaction.txParams?.from, selectedAddress)
      );
    });

    for (const approval of matchingSmartTransactionApprovals) {
      try {
        this.#messenger.call(
          'ApprovalController:rejectRequest',
          approval.id,
          new Error('Transaction activity reset'),
        );
      } catch (error) {
        if (!(error instanceof ApprovalRequestNotFoundError)) {
          throw error;
        }
      }
    }

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
}
