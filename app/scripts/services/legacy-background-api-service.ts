import log from 'loglevel';
import { Messenger } from '@metamask/messenger';
import {
  NetworkControllerGetNetworkClientByIdAction,
  NetworkControllerGetStateAction,
  NetworkControllerResetConnectionAction,
} from '@metamask/network-controller';
import { add0x, Hex, hexToBytes, Json } from '@metamask/utils';
import { Mutex, MutexInterface } from 'async-mutex';
import {
  AccountImportStrategy,
  KeyringControllerAddNewKeyringAction,
  KeyringControllerExportSeedPhraseAction,
  KeyringControllerGetAccountsAction,
  KeyringControllerGetKeyringsByTypeAction,
  KeyringControllerImportAccountWithStrategyAction,
  KeyringControllerRemoveAccountAction,
  KeyringControllerWithKeyringAction,
  KeyringTypes,
} from '@metamask/keyring-controller';
import { Buffer } from 'buffer';
import {
  AccountsControllerGetAccountByAddressAction,
  AccountsControllerGetSelectedAccountAction,
  AccountsControllerSetSelectedAccountAction,
} from '@metamask/accounts-controller';
import {
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
  SecretType,
  SeedlessOnboardingController,
  SeedlessOnboardingControllerAddNewSecretDataAction,
  SeedlessOnboardingControllerCheckIsPasswordOutdatedAction,
  SeedlessOnboardingControllerUpdateBackupMetadataStateAction,
} from '@metamask/seedless-onboarding-controller';
import { PermissionControllerUpdatePermissionsByCaveatAction } from '@metamask/permission-controller';
import {
  Caip25CaveatMutators,
  Caip25CaveatType,
} from '@metamask/chain-agnostic-permission';
import { SnapId } from '@metamask/snaps-sdk';
import { SnapKeyring } from '@metamask/eth-snap-keyring';
import { PreferencesControllerSetPreferenceAction } from '../controllers/preferences-controller-method-action-types';
import type { Preferences } from '../../../shared/types/preferences';
import { getProviderConfig } from '../../../shared/lib/selectors/networks';
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
import { OnboardingControllerGetStateAction } from '../controllers/onboarding';
import { createSentryError } from '../../../shared/lib/error';
import { LegacyBackgroundApiServiceMethodActions } from './legacy-background-api-service-method-action-types';

/**
 * A function executed within a mutually exclusive lock, with
 * a mutex releaser in its option bag.
 *
 * @param releaseLock - A function to release the lock.
 */
type MutuallyExclusiveCallback<Result> = ({
  releaseLock,
}: {
  releaseLock: MutexInterface.Releaser;
}) => Promise<Result>;

const serviceName = 'LegacyBackgroundApiService';

/**
 * The methods that the {@link LegacyBackgroundApiService} exposes to the messenger.
 * This is currently empty, but it can be extended in the future to replace `MetaMaskController.getApi()`.
 */
const MESSENGER_EXPOSED_METHODS = [
  'setAvatarType',
  'getProviderConfig',
  'isPublicEndpointUrl',
  'getRequestAccountTabIds',
  'getOpenMetamaskTabsIds',
  'markPasswordForgotten',
  'unMarkPasswordForgotten',
  'getCode',
  'isAssetsUnifyStateEnabled',
  'setCurrentCurrency',
  'getSeedPhrase',
  'resetAccount',
  'getGlobalChainId',
  'removeAccount',
  'importAccountWithStrategy',
  'getSnapKeyring',
  'getAccountsBySnapId',
  'onAccountRemoved',
] as const;

/**
 * The actions that the {@link LegacyBackgroundApiService} can handle.
 * This type is currently empty, but it can be extended in the future to replace `MetaMaskController.getApi()`.
 */
export type LegacyBackgroundApiServiceActions =
  LegacyBackgroundApiServiceMethodActions;

type AllowedActions =
  | PreferencesControllerSetPreferenceAction
  | NetworkControllerGetStateAction
  | NetworkControllerGetNetworkClientByIdAction
  | KeyringControllerGetAccountsAction
  | AccountsControllerGetSelectedAccountAction
  | TransactionControllerWipeTransactionsAction
  | CurrencyRateControllerSetCurrentCurrencyAction
  | AssetsControllerSetSelectedCurrencyAction
  | RemoteFeatureFlagControllerGetStateAction
  | KeyringControllerExportSeedPhraseAction
  | AccountsControllerGetSelectedAccountAction
  | ApprovalControllerGetStateAction
  | ApprovalControllerRejectRequestAction
  | TransactionControllerGetStateAction
  | TransactionControllerWipeTransactionsAction
  | SmartTransactionsControllerWipeSmartTransactionsAction
  | BridgeStatusControllerWipeBridgeStatusAction
  | NetworkControllerResetConnectionAction
  | KeyringControllerImportAccountWithStrategyAction
  | OnboardingControllerGetIsSocialLoginFlowAction
  | KeyringControllerWithKeyringAction
  | KeyringControllerRemoveAccountAction
  | AccountsControllerGetAccountByAddressAction
  | AccountsControllerSetSelectedAccountAction
  | SeedlessOnboardingControllerAddNewSecretDataAction
  | SeedlessOnboardingControllerUpdateBackupMetadataStateAction
  | PermissionControllerUpdatePermissionsByCaveatAction
  | KeyringControllerGetKeyringsByTypeAction
  | KeyringControllerAddNewKeyringAction;

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
  markPasswordForgotten: () => void;
  unMarkPasswordForgotten: () => void;
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

  readonly #markPasswordForgotten: () => void;

  readonly #unMarkPasswordForgotten: () => void;

  #seedlessOperationMutex: Mutex;

  /**
   * Creates a new instance of the LegacyBackgroundApiService.
   * @param options - The options required to initialize the LegacyBackgroundApiService.
   * @param options.messenger - The messenger instance used for communication.
   * @param options.infuraProjectId - The Infura project ID.
   * @param options.getRequestAccountTabIds - A function that returns a record of account tab IDs.
   * @param options.getOpenMetamaskTabsIds - A function that returns a record of open MetaMask tab IDs.
   * @param options.markPasswordForgotten - A function that marks the password as forgotten.
   * @param options.unMarkPasswordForgotten - A function that un-marks the password as forgotten.
   */
  constructor({
    messenger,
    infuraProjectId,
    getRequestAccountTabIds,
    getOpenMetamaskTabsIds,
    markPasswordForgotten,
    unMarkPasswordForgotten,
    seedlessOperationMutex,
  }: LegacyBackgroundApiServiceOptions) {
    this.#messenger = messenger;

    this.#infuraProjectId = infuraProjectId;
    this.#getRequestAccountTabIds = getRequestAccountTabIds;
    this.#getOpenMetamaskTabsIds = getOpenMetamaskTabsIds;
    this.#markPasswordForgotten = markPasswordForgotten;
    this.#unMarkPasswordForgotten = unMarkPasswordForgotten;
    // Temporarily get the mutex from `MetamaskController` until we can
    // migrate the seedless onboarding functionality to this service.
    // TODO: Remove this once the migration is complete.
    this.#seedlessOperationMutex = seedlessOperationMutex;

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
   * Sets the avatar type preference.
   *
   * @param avatarType - The avatar type.
   */
  setAvatarType(avatarType: Preferences['avatarType']): void {
    this.#messenger.call(
      'PreferencesController:setPreference',
      'avatarType',
      avatarType,
    );
  }

  /**
   * Gets the provider configuration based on the current network state.
   *
   * @returns The provider configuration.
   */
  getProviderConfig(): {
    id?: string;
    nickname?: string;
    rpcUrl?: string;
    chainId: `0x${string}`;
    ticker: string;
    rpcPrefs: {
      blockExplorerUrl?: string;
    };
    type: string;
  } {
    const networkControllerState = this.#messenger.call(
      'NetworkController:getState',
    );

    return getProviderConfig({ metamask: networkControllerState });
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
    this.#markPasswordForgotten();
  }

  /**
   * Un-marks the password as forgotten.
   */
  unMarkPasswordForgotten(): void {
    this.#unMarkPasswordForgotten();
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
  async getSeedPhrase(
    password: string,
    keyringId?: string,
  ): Promise<Buffer<ArrayBuffer>> {
    const seedPhrase = await this.#messenger.call(
      'KeyringController:exportSeedPhrase',
      password,
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
    )?.address;

    const globalChainId = this.getGlobalChainId();

    const { pendingApprovals } = this.#messenger.call(
      'ApprovalController:getState',
    );

    const { transactions } = this.#messenger.call(
      'TransactionController:getState',
    );

    const matchingSmartTransactionApprovals = Object.values(
      pendingApprovals,
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
   * @param address - A hex address
   */
  async removeAccount(address: Hex): Promise<Hex> {
    this.onAccountRemoved(address);
    await this.#messenger.call('KeyringController:removeAccount', address);

    return address;
  }

  /**
   * Execute side effects of a removed account.
   *
   * @param address - The address of the account to remove.
   */
  onAccountRemoved(address: Hex): void {
    this.#messenger.call(
      'PermissionController:updatePermissionsByCaveat',
      Caip25CaveatType,
      (scopes) =>
        // @ts-expect-error - Type mismatch
        Caip25CaveatMutators[Caip25CaveatType].removeAccount(scopes, address),
    );
  }

  async importAccountWithStrategy(
    strategy: AccountImportStrategy,
    args: unknown[],
    options = {
      shouldCreateSocialBackup: true,
      shouldSelectAccount: true,
    },
  ): Promise<void> {
    const { shouldCreateSocialBackup, shouldSelectAccount } = options;

    const importedAccountAddress = (await this.#messenger.call(
      'KeyringController:importAccountWithStrategy',
      strategy,
      args,
    )) as Hex;

    const isSocialLoginFlow = this.#messenger.call(
      'OnboardingController:getIsSocialLoginFlow',
    );

    if (isSocialLoginFlow) {
      // Use withKeyring to get keyring metadata for an address
      const { id: keyringId, privateKey: privateKeyFromKeyring } =
        (await this.#messenger.call(
          'KeyringController:withKeyring',
          { address: importedAccountAddress },
          async ({ keyring, metadata }) => {
            const privateKey = await keyring.exportAccount?.(
              importedAccountAddress,
            );
            return { id: metadata.id, privateKey };
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
    const bufferedPrivateKey = hexToBytes(add0x(privateKey));

    if (syncWithSocial) {
      await withLock(this.#seedlessOperationMutex, async () => {
        try {
          await this.#messenger.call(
            'SeedlessOnboardingController:addNewSecretData',
            bufferedPrivateKey,
            SecretType.PrivateKey,
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
          data: bufferedPrivateKey,
          type: SecretType.PrivateKey,
        },
      );
    }
  }

  /**
   * Initialize the snap keyring if it is not present.
   *
   * @returns The snap keyring instance.
   */
  async getSnapKeyring(): Promise<SnapKeyring> {
    // TODO: Use `withKeyring` instead
    let [snapKeyring] = this.#messenger.call(
      'KeyringController:getKeyringsByType',
      KeyringTypes.snap,
    );

    if (!snapKeyring) {
      await this.#messenger.call(
        'KeyringController:addNewKeyring',
        KeyringTypes.snap,
      );

      // TODO: Use `withKeyring` instead
      [snapKeyring] = this.#messenger.call(
        'KeyringController:getKeyringsByType',
        KeyringTypes.snap,
      );
    }

    return snapKeyring as SnapKeyring;
  }

  /**
   * Gets the accounts of a given snap ID from the snap keyring.
   *
   * @param snapId - The snap ID to get accounts for.
   * @returns The addresses of the accounts managed by the snap.
   */
  async getAccountsBySnapId(snapId: SnapId): Promise<string[]> {
    return getAccountsBySnapId(this.getSnapKeyring.bind(this), snapId);
  }
}

/**
 * Lock the given mutex before executing the given function,
 * and release it after the function is resolved or after an
 * error is thrown.
 *
 * @param mutex - The mutex to lock.
 * @param callback - The function to execute while the mutex is locked.
 * @returns The result of the function.
 */
async function withLock<Result>(
  mutex: Mutex,
  callback: MutuallyExclusiveCallback<Result>,
): Promise<Result> {
  const releaseLock = await mutex.acquire();

  try {
    return await callback({ releaseLock });
  } finally {
    releaseLock();
  }
}
