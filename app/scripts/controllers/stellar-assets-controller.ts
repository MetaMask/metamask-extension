import type {
  AccountsControllerAccountRemovedEvent,
  AccountsControllerAccountAssetListUpdatedEvent,
  AccountsControllerListMultichainAccountsAction,
} from '@metamask/accounts-controller';
import { BaseController } from '@metamask/base-controller';
import type {
  ControllerGetStateAction,
  ControllerStateChangeEvent,
  StateMetadata,
} from '@metamask/base-controller';
import type { AccountAssetListUpdatedEventPayload } from '@metamask/keyring-api';
import type { KeyringControllerGetStateAction } from '@metamask/keyring-controller';
import type { InternalAccount } from '@metamask/keyring-internal-api';
import { KeyringClient } from '@metamask/keyring-snap-client';
import type { Messenger } from '@metamask/messenger';
import type { SnapControllerHandleRequestAction } from '@metamask/snaps-controllers';
import type { SnapId } from '@metamask/snaps-sdk';
import { HandlerType } from '@metamask/snaps-utils';
import type {
  CaipAssetType,
  CaipChainId,
  Json,
  JsonRpcRequest,
} from '@metamask/utils';
import { XlmAccountType, XlmScope } from '@metamask/keyring-api';
import {
  type,
  string,
  pattern,
  is,
  record,
  union,
  type Infer,
} from '@metamask/superstruct';
import { Mutex } from 'async-mutex';

/** Stellar pubnet native XLM CAIP-19 asset id. */
export const StellarNativeAssetIdStruct = pattern(
  string(),
  /^stellar:pubnet\/slip44:148$/u,
);

/** Stellar pubnet classic asset CAIP-19 asset id. */
export const StellarClassicAssetIdStruct = pattern(
  string(),
  /^stellar:pubnet\/asset:[A-Za-z0-9]{1,12}-G[A-Z2-7]{55}$/u,
);

/** Optional per-asset fields returned by snap account-asset enrichment. */
export const TrustlineAssetInfoStruct = type({
  limit: string(),
});

export const NativeAssetInfoStruct = type({
  baseReserve: string(),
});

export const EnrichedAssetInfoStuct = union([
  record(StellarNativeAssetIdStruct, NativeAssetInfoStruct),
  record(StellarClassicAssetIdStruct, TrustlineAssetInfoStruct),
]);

export type StellarNativeAssetId = Infer<typeof StellarNativeAssetIdStruct>;
export type StellarClassicAssetId = Infer<typeof StellarClassicAssetIdStruct>;
export type NativeAssetInfo = Infer<typeof NativeAssetInfoStruct>;
export type TrustlineAssetInfo = Infer<typeof TrustlineAssetInfoStruct>;
export type EnrichedAssetInfo = Infer<typeof EnrichedAssetInfoStuct>;

/**
 * Returns whether a CAIP-19 asset id is eligible for Stellar enrichment.
 *
 * @param assetId - CAIP-19 asset id.
 * @returns True when the asset id is a supported pubnet native or classic asset.
 */
export function isStellarEnrichmentEligibleAssetId(
  assetId: string,
): assetId is StellarNativeAssetId | StellarClassicAssetId {
  return (
    is(assetId, StellarNativeAssetIdStruct) ||
    is(assetId, StellarClassicAssetIdStruct)
  );
}

/**
 * Returns validated native asset enrichment for a CAIP-19 asset id.
 *
 * @param assetId - CAIP-19 asset id.
 * @param info - Cached enrichment entry.
 * @returns Native asset enrichment when valid, otherwise `undefined`.
 */
export function getNativeAssetInfoForAsset(
  assetId: string,
  info: unknown,
): NativeAssetInfo | undefined {
  if (!is(assetId, StellarNativeAssetIdStruct)) {
    return undefined;
  }

  return is(info, NativeAssetInfoStruct) ? info : undefined;
}

/**
 * Returns validated trustline asset enrichment for a CAIP-19 asset id.
 *
 * @param assetId - CAIP-19 asset id.
 * @param info - Cached enrichment entry.
 * @returns Trustline asset enrichment when valid, otherwise `undefined`.
 */
export function getTrustlineAssetInfoForAsset(
  assetId: string,
  info: unknown,
): TrustlineAssetInfo | undefined {
  if (!is(assetId, StellarClassicAssetIdStruct)) {
    return undefined;
  }
  return is(info, TrustlineAssetInfoStruct) ? info : undefined;
}

export type StellarAssetsControllerState = {
  accountAssets: {
    [accountId: string]: EnrichedAssetInfo;
  };
};

const CONTROLLER = 'StellarAssetsController' as const;

export const STELLAR_CHAIN_ID = XlmScope.Pubnet;

export const GET_ACCOUNT_ASSET_INFO_CLIENT_METHOD =
  'getAccountAssetInfo' as const;

export type StellarAssetsControllerGetStateAction = ControllerGetStateAction<
  typeof CONTROLLER,
  StellarAssetsControllerState
>;

export type StellarAssetsControllerActions =
  StellarAssetsControllerGetStateAction;

export type StellarAssetsControllerStateChangeEvent =
  ControllerStateChangeEvent<typeof CONTROLLER, StellarAssetsControllerState>;

export type StellarAssetsControllerEvents =
  StellarAssetsControllerStateChangeEvent;

type AllowedActions =
  | SnapControllerHandleRequestAction
  | AccountsControllerListMultichainAccountsAction
  | KeyringControllerGetStateAction;

type AllowedEvents =
  | AccountsControllerAccountRemovedEvent
  | AccountsControllerAccountAssetListUpdatedEvent;

export type StellarAssetsControllerMessenger = Messenger<
  typeof CONTROLLER,
  StellarAssetsControllerActions | AllowedActions,
  StellarAssetsControllerEvents | AllowedEvents
>;

export type StellarAssetsControllerOptions = {
  messenger: StellarAssetsControllerMessenger;
  state?: Partial<StellarAssetsControllerState>;
  isEnabled: () => boolean;
};

/**
 * Constructs the default {@link StellarAssetsController} state.
 *
 * @returns The default state object.
 */
export function getDefaultStellarAssetsControllerState(): StellarAssetsControllerState {
  return { accountAssets: {} };
}

const stellarAssetsControllerMetadata: StateMetadata<StellarAssetsControllerState> =
  {
    accountAssets: {
      includeInDebugSnapshot: true,
      includeInStateLogs: false,
      persist: true,
      usedInUi: true,
    },
  };

/**
 * Transitional controller that caches per-account Stellar asset enrichment from
 * the wallet snap. It bridges Stellar snap asset data until Stellar snap support
 * is integrated with the Accounts API in the unified assets controller.
 */
export class StellarAssetsController extends BaseController<
  typeof CONTROLLER,
  StellarAssetsControllerState,
  StellarAssetsControllerMessenger
> {
  readonly #isEnabled: () => boolean;

  readonly #controllerOperationMutex = new Mutex();

  constructor({
    messenger,
    state = {},
    isEnabled = () => false,
  }: StellarAssetsControllerOptions) {
    super({
      name: CONTROLLER,
      messenger,
      metadata: stellarAssetsControllerMetadata,
      state: {
        ...getDefaultStellarAssetsControllerState(),
        ...state,
      },
    });

    this.#isEnabled = isEnabled;

    this.messenger.subscribe('AccountsController:accountRemoved', (accountId) =>
      this.#handleOnAccountRemoved(accountId),
    );

    this.messenger.subscribe(
      'AccountsController:accountAssetListUpdated',
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      async (event) => this.#handleOnAccountAssetListUpdated(event),
    );
  }

  /**
   * Handles asset-list updates from AccountsController.
   *
   * @param event - Per-account added and removed asset deltas.
   */
  async #handleOnAccountAssetListUpdated(
    event: AccountAssetListUpdatedEventPayload,
  ): Promise<void> {
    if (!this.#isEnabled() || !this.#isKeyringUnlocked()) {
      return;
    }

    for (const [accountId, { added, removed }] of Object.entries(
      event.assets,
    )) {
      const isStellar = [...added, ...removed].some((assetId) =>
        isStellarEnrichmentEligibleAssetId(assetId),
      );

      if (!isStellar) {
        continue;
      }

      if (removed.length > 0) {
        this.update((state: StellarAssetsControllerState) => {
          const accountAssets = state.accountAssets[accountId];
          if (!accountAssets) {
            return;
          }
          for (const assetId of removed) {
            delete accountAssets[assetId];
          }
          if (Object.keys(accountAssets).length === 0) {
            delete state.accountAssets[accountId];
          }
        });
      }

      // Like other non-EVM snaps, the Stellar snap emits accountAssetListUpdated for
      // the native asset even when no assets actually changed. Rather than trying to
      // detect no-op updates, refetch enrichment for every asset on the account.
      // This is cheap: SNAP API `getAccountAssetInfo` already batches assets and reads
      // from the snap state store, so fetching 1 vs 100 assets costs about the same.
      // Most accounts have fewer than 100 trustlines; imported accounts with more are rare.
      await this.#controllerOperationMutex
        .runExclusive(async () => {
          await this.#fetchAndStoreAccountAssetInfo(accountId);
        })
        .catch((error) => {
          console.error(
            `[StellarAssetsController] Failed to fetch asset info for account ${accountId}:`,
            error,
          );
        });
    }
  }

  /**
   * Removes cached asset info for a removed account.
   *
   * @param accountId - The removed account id.
   */
  #handleOnAccountRemoved(accountId: string): void {
    if (!(accountId in this.state.accountAssets)) {
      return;
    }

    this.update((state: StellarAssetsControllerState) => {
      delete state.accountAssets[accountId];
    });
  }

  /**
   * Fetches enrichment from the snap and stores results.
   *
   * @param account - Stellar account or account id.
   */
  async #fetchAndStoreAccountAssetInfo(
    account: InternalAccount | string,
  ): Promise<void> {
    const internalAccount =
      typeof account === 'string' ? this.#getStellarAccount(account) : account;
    if (!internalAccount) {
      return;
    }

    const snapId = internalAccount.metadata.snap?.id;
    const chainId = this.#getStellarChainId(internalAccount);
    if (!snapId || !chainId) {
      return;
    }
    try {
      const assets = await this.#listAccountAssets(internalAccount.id, snapId);
      const assetsToFetch = this.#filterTrustlineEnrichmentEligibleAssets(
        assets as CaipAssetType[],
      );
      const enrichment = await this.#fetchAccountAssetInfoFromSnap({
        accountId: internalAccount.id,
        snapId: snapId as SnapId,
        chainId,
        assets: assetsToFetch,
      });

      if (enrichment) {
        this.update((state: StellarAssetsControllerState) => {
          state.accountAssets[internalAccount.id] ??= {};
          for (const assetId of assetsToFetch) {
            // SNAP should guarantee that the asset info is not empty.
            const info = enrichment?.[assetId];
            state.accountAssets[internalAccount.id][assetId] = info;
          }
        });
      }
    } catch (error) {
      console.error(
        `[StellarAssetsController] Failed to fetch asset info for account ${internalAccount.id}:`,
        error,
      );
    }
  }

  /**
   * Calls the snap `getAccountAssetInfo` client request handler.
   *
   * @param params - Request parameters.
   * @param params.accountId - Account id.
   * @param params.snapId - Wallet snap id.
   * @param params.chainId - CAIP-2 chain id.
   * @param params.assets - CAIP-19 assets to resolve.
   * @returns Per-asset enrichment fields.
   */
  async #fetchAccountAssetInfoFromSnap({
    accountId,
    snapId,
    chainId,
    assets,
  }: {
    accountId: string;
    snapId: SnapId;
    chainId: CaipChainId;
    assets: CaipAssetType[];
  }): Promise<EnrichedAssetInfo | undefined> {
    return (await this.messenger.call('SnapController:handleRequest', {
      snapId,
      origin: 'metamask',
      handler: HandlerType.OnClientRequest,
      request: {
        jsonrpc: '2.0',
        method: GET_ACCOUNT_ASSET_INFO_CLIENT_METHOD,
        params: {
          accountId,
          scope: chainId,
          assets,
        },
      },
    })) as EnrichedAssetInfo;
  }

  /**
   * Lists assets for an account via the wallet snap keyring client.
   *
   * @param accountId - Account id.
   * @param snapId - Wallet snap id.
   * @returns Asset ids for the account.
   */
  async #listAccountAssets(
    accountId: string,
    snapId: string,
  ): Promise<string[]> {
    return await this.#getKeyringClient(snapId).listAccountAssets(accountId);
  }

  /**
   * Gets a `KeyringClient` for a snap.
   *
   * @param snapId - Snap id.
   * @returns Keyring client for the snap.
   */
  #getKeyringClient(snapId: string): KeyringClient {
    return new KeyringClient({
      send: async (request: JsonRpcRequest) =>
        (await this.messenger.call('SnapController:handleRequest', {
          snapId: snapId as SnapId,
          origin: 'metamask',
          handler: HandlerType.OnKeyringRequest,
          request,
        })) as Promise<Json>,
    });
  }

  /**
   * Lists Stellar accounts from AccountsController.
   *
   * @returns Stellar accounts backed by a snap.
   */
  #listStellarAccounts(): InternalAccount[] {
    return this.messenger
      .call('AccountsController:listMultichainAccounts')
      .filter((account) => this.#isStellarAccount(account));
  }

  /**
   * Returns a Stellar account by id when present.
   *
   * @param accountId - Account id.
   * @returns The Stellar account, or undefined.
   */
  #getStellarAccount(accountId: string): InternalAccount | undefined {
    return this.#listStellarAccounts().find(
      (account) => account.id === accountId,
    );
  }

  /**
   * Returns whether the account is a Stellar snap account.
   *
   * @param account - Account to check.
   * @returns True for Stellar snap accounts.
   */
  #isStellarAccount(account: InternalAccount): boolean {
    return (
      account.type === XlmAccountType.Account &&
      account.metadata.snap !== undefined
    );
  }

  /**
   * Returns the Stellar chain id for an account.
   *
   * @param account - Stellar account.
   * @returns Supported Stellar CAIP-2 chain id, or undefined.
   */
  #getStellarChainId(account: InternalAccount): CaipChainId | undefined {
    const scope = account.scopes.find(
      (chainId) => chainId === XlmScope.Pubnet || chainId === XlmScope.Testnet,
    );
    return scope as CaipChainId | undefined;
  }

  /**
   * Returns whether the keyring is unlocked.
   *
   * @returns True when the keyring is unlocked.
   */
  #isKeyringUnlocked(): boolean {
    const { isUnlocked } = this.messenger.call('KeyringController:getState');
    return isUnlocked;
  }

  /**
   * Filters asset ids to those eligible for trustline snap enrichment.
   *
   * @param assetIds - CAIP-19 asset ids to filter.
   * @returns Eligible trustline asset ids.
   */
  #filterTrustlineEnrichmentEligibleAssets(
    assetIds: CaipAssetType[],
  ): CaipAssetType[] {
    return assetIds.filter(isStellarEnrichmentEligibleAssetId);
  }
}
