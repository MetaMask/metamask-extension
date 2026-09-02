import { isEqual, memoize, pickBy, size, sum } from 'lodash';
import { NameType } from '@metamask/name-controller';
import type { Nft } from '@metamask/assets-controllers';
import type { InternalAccount } from '@metamask/keyring-internal-api';
import type {
  SeedlessOnboardingControllerGetStateAction,
  SeedlessOnboardingControllerState,
} from '@metamask/seedless-onboarding-controller';
import type { Messenger } from '@metamask/messenger';
import {
  MetaMetricsEventAccountType,
  MetaMetricsUserTrait,
} from '../../../shared/constants/metametrics';
import type { MetaMetricsUserTraits } from '../../../shared/constants/metametrics';
import { FirstTimeFlowType } from '../../../shared/constants/onboarding';
import { KeyringType } from '../../../shared/constants/keyring';
import { getTokensControllerAllTokens } from '../../../shared/lib/selectors/assets-migration';
import type { FlattenedBackgroundStateProxy } from '../../../shared/types';
import { getDeviceType, getInstallType, getOs, getPlatform } from '../lib/util';
import * as analytics from '../controllers/analytics/analytics';
import type { MetaMetricsControllerGetStateAction } from '../controllers/metametrics-controller';

export const SERVICE_NAME = 'UserTraitsService';

type ServiceName = typeof SERVICE_NAME;

/**
 * The subset of the flattened background state that is needed to derive the
 * MetaMetrics user traits object.
 */
export type MetaMaskState = Pick<
  FlattenedBackgroundStateProxy,
  | 'ledgerTransportType'
  | 'networkConfigurationsByChainId'
  | 'internalAccounts'
  | 'allNfts'
  | 'allTokens'
  | 'theme'
  | 'dataCollectionForMarketing'
  | 'useNftDetection'
  | 'openSeaEnabled'
  | 'securityAlertsEnabled'
  | 'useTokenDetection'
  | 'names'
  | 'addressBook'
  | 'currentCurrency'
  | 'srpSessionData'
  | 'keyrings'
  | 'multichainNetworkConfigurationsByChainId'
  | 'firstTimeFlowType'
  | 'analyticsId'
  | 'optedIn'
  | 'consentDecisionMade'
  // TODO: Remove as this is no longer a top-level property of the flattened background state object.
  // | 'security_providers'
> & {
  preferences: Pick<
    FlattenedBackgroundStateProxy['preferences'],
    | 'privacyMode'
    | 'tokenNetworkFilter'
    | 'showNativeTokenAsMainBalance'
    | 'tokenSortConfig'
  >;
};

/**
 * Actions that this service is allowed to call.
 */
type AllowedActions =
  | MetaMetricsControllerGetStateAction
  | SeedlessOnboardingControllerGetStateAction;

/**
 * Events that this service is allowed to subscribe to.
 */
type AllowedEvents = never;

/**
 * The messenger for the {@link UserTraitsService}.
 */
export type UserTraitsServiceMessenger = Messenger<
  ServiceName,
  AllowedActions,
  AllowedEvents
>;

/**
 * Options for the {@link UserTraitsService}.
 */
export type UserTraitsServiceOptions = {
  /**
   * Messenger used to read the state the user traits are derived from.
   */
  messenger: UserTraitsServiceMessenger;
};

/**
 * Derives the MetaMetrics user traits object from the full MetaMask state,
 * diffs it against the previously identified traits, and forwards any changes to
 * the analytics pipeline via `identify`. Also refreshes the cached profile
 * identity from SRP session data on every state update.
 *
 * This logic previously lived on `MetaMetricsController`. It is orchestration on
 * top of state, not controller state itself, so it lives in a service that the
 * background wiring drives from the `MetamaskController` `update` event.
 */
export class UserTraitsService {
  name: ServiceName = SERVICE_NAME;

  #messenger: UserTraitsServiceMessenger;

  previousUserTraits?: MetaMetricsUserTraits;

  /**
   * @param options - The service options.
   * @param options.messenger - Messenger used to read state via the messenger.
   */
  constructor({ messenger }: UserTraitsServiceOptions) {
    this.#messenger = messenger;
  }

  /**
   * Returns the seed traits that are not derived from other state keys (e.g.
   * `install_date_ext`, `storage_kind`, `cookie_id`, `ga_client_id`). These are
   * still owned by MetaMetricsController's `traits` state for now.
   */
  #getSeedTraits(): MetaMetricsUserTraits {
    return this.#messenger.call('MetaMetricsController:getState').traits;
  }

  /**
   * Returns the SeedlessOnboardingController state, or `undefined` when it is
   * unavailable (e.g. the controller has not been registered yet).
   */
  #getSeedlessOnboardingState():
    | Partial<SeedlessOnboardingControllerState>
    | undefined {
    try {
      return this.#messenger.call('SeedlessOnboardingController:getState');
    } catch {
      return undefined;
    }
  }

  /**
   * Handles a full MetaMask state update by refreshing the cached profile
   * identity and identifying the user when their traits have changed.
   *
   * @param newState - The full (flattened) MetaMask state.
   */
  handleMetaMaskStateUpdate(newState: MetaMaskState): void {
    analytics.updateProfileSessionData(newState.srpSessionData);
    const userTraits = this._buildUserTraitsObject(newState);
    if (userTraits) {
      analytics.identify(userTraits);
    }
  }

  /**
   * This method generates the MetaMetrics user traits object, omitting any
   * traits that have not changed since the last invocation of this method.
   *
   * @param metamaskState - Full metamask state object.
   * @returns traits that have changed since last update
   */
  _buildUserTraitsObject(
    metamaskState: MetaMaskState,
  ): Partial<MetaMetricsUserTraits> | null {
    const traits = this.#getSeedTraits();
    const storageKindTrait = traits[MetaMetricsUserTrait.StorageKind];
    const cookieIdTrait = traits[MetaMetricsUserTrait.CookieId];
    const gaClientIdTrait = traits[MetaMetricsUserTrait.GaClientId];

    const currentTraits: MetaMetricsUserTraits = {
      [MetaMetricsUserTrait.AddressBookEntries]: sum(
        Object.values(metamaskState.addressBook).map(size),
      ),
      [MetaMetricsUserTrait.InstallDateExt]:
        traits[MetaMetricsUserTrait.InstallDateExt] || '',
      ...(storageKindTrait
        ? { [MetaMetricsUserTrait.StorageKind]: storageKindTrait }
        : {}),
      [MetaMetricsUserTrait.LedgerConnectionType]:
        metamaskState.ledgerTransportType,
      [MetaMetricsUserTrait.NetworksAdded]: Object.values(
        metamaskState.networkConfigurationsByChainId,
      ).map((networkConfiguration) => networkConfiguration.chainId),
      [MetaMetricsUserTrait.NetworksWithoutTicker]: Object.values(
        metamaskState.networkConfigurationsByChainId,
      )
        .filter(({ nativeCurrency }) => !nativeCurrency)
        .map(({ chainId }) => chainId),
      // caip-2 formatted
      [MetaMetricsUserTrait.ChainIdList]: [
        ...Object.keys(metamaskState.networkConfigurationsByChainId).map(
          (hexChainId) => `eip155:${parseInt(hexChainId, 16)}`,
        ),
        ...Object.keys(
          metamaskState?.multichainNetworkConfigurationsByChainId || {},
        ), // the state here is already caip-2 formatted
      ],
      [MetaMetricsUserTrait.NftAutodetectionEnabled]:
        metamaskState.useNftDetection,
      [MetaMetricsUserTrait.NumberOfAccounts]: Object.values(
        metamaskState.internalAccounts.accounts,
      ).length,
      [MetaMetricsUserTrait.NumberOfNftCollections]:
        this.#getAllUniqueNFTAddressesLength(metamaskState.allNfts),
      [MetaMetricsUserTrait.NumberOfNfts]: this.#getAllNFTsFlattened(
        metamaskState.allNfts,
      ).length,
      [MetaMetricsUserTrait.NumberOfTokens]: this.#getNumberOfTokens(
        getTokensControllerAllTokens({ metamask: metamaskState }),
      ),
      [MetaMetricsUserTrait.OpenSeaApiEnabled]: metamaskState.openSeaEnabled,
      [MetaMetricsUserTrait.ThreeBoxEnabled]: false, // deprecated, hard-coded as false
      [MetaMetricsUserTrait.Theme]: metamaskState.theme || 'default',
      [MetaMetricsUserTrait.TokenDetectionEnabled]:
        metamaskState.useTokenDetection,
      [MetaMetricsUserTrait.ShowNativeTokenAsMainBalance]:
        metamaskState.preferences?.showNativeTokenAsMainBalance ?? false,
      [MetaMetricsUserTrait.CurrentCurrency]: metamaskState.currentCurrency,
      [MetaMetricsUserTrait.SecurityProviders]:
        metamaskState.securityAlertsEnabled ? ['blockaid'] : [],
      [MetaMetricsUserTrait.PetnameAddressCount]:
        this.#getPetnameAddressCount(metamaskState),
      [MetaMetricsUserTrait.IsMetricsOptedIn]:
        metamaskState.consentDecisionMade === true
          ? metamaskState.optedIn === true
          : null,
      [MetaMetricsUserTrait.HasMarketingConsent]:
        metamaskState.dataCollectionForMarketing,
      [MetaMetricsUserTrait.TokenSortPreference]:
        metamaskState.preferences?.tokenSortConfig?.key || '',
      [MetaMetricsUserTrait.PrivacyModeEnabled]:
        metamaskState.preferences?.privacyMode ?? false,
      [MetaMetricsUserTrait.NetworkFilterPreference]: Object.keys(
        metamaskState.preferences?.tokenNetworkFilter || {},
      ),
      [MetaMetricsUserTrait.CanonicalProfileId]: Object.entries(
        metamaskState.srpSessionData || {},
      )?.[0]?.[1]?.profile?.canonicalProfileId,
      [MetaMetricsUserTrait.AccountType]: this.#getAccountTypeTrait(
        metamaskState.firstTimeFlowType,
      ),
      [MetaMetricsUserTrait.Platform]: getPlatform(),
      [MetaMetricsUserTrait.InstallType]: getInstallType(),
      [MetaMetricsUserTrait.DeviceType]: getDeviceType(),
      [MetaMetricsUserTrait.Os]: getOs(),
      ...this.#getAccountCompositionTraits(metamaskState),
    };

    if (cookieIdTrait !== undefined) {
      currentTraits[MetaMetricsUserTrait.CookieId] = cookieIdTrait;
    }

    if (gaClientIdTrait !== undefined) {
      currentTraits[MetaMetricsUserTrait.GaClientId] = gaClientIdTrait;
    }

    if (
      !this.previousUserTraits &&
      metamaskState.consentDecisionMade === true &&
      metamaskState.optedIn === true
    ) {
      this.previousUserTraits = currentTraits;
      return currentTraits;
    }

    if (
      this.previousUserTraits &&
      !isEqual(this.previousUserTraits, currentTraits)
    ) {
      const updates = pickBy(currentTraits, (v, k) => {
        // @ts-expect-error It's okay that `k` may not be a key of `this.previousUserTraits`, because we assume `isEqual` can handle it
        const previous = this.previousUserTraits[k];
        return !isEqual(previous, v);
      });

      if (
        metamaskState.consentDecisionMade === true &&
        metamaskState.optedIn === true
      ) {
        this.previousUserTraits = currentTraits;
      }

      return updates;
    }

    return null;
  }

  #getAccountTypeTrait(
    firstTimeFlowType: MetaMaskState['firstTimeFlowType'],
  ): NonNullable<MetaMetricsUserTraits[MetaMetricsUserTrait.AccountType]> {
    switch (firstTimeFlowType) {
      case FirstTimeFlowType.import:
      case FirstTimeFlowType.restore:
        return MetaMetricsEventAccountType.Imported;
      case FirstTimeFlowType.socialImport:
        return this.#getSocialAccountType(MetaMetricsEventAccountType.Imported);
      case FirstTimeFlowType.socialCreate:
        return this.#getSocialAccountType(MetaMetricsEventAccountType.Default);
      case FirstTimeFlowType.create:
      default:
        return MetaMetricsEventAccountType.Default;
    }
  }

  #getSocialAccountType(
    baseType:
      | MetaMetricsEventAccountType.Default
      | MetaMetricsEventAccountType.Imported,
  ): NonNullable<MetaMetricsUserTraits[MetaMetricsUserTrait.AccountType]> {
    const authConnection = this.#getSeedlessOnboardingState()?.authConnection;
    return authConnection ? `${baseType}_${authConnection}` : baseType;
  }

  /**
   * Returns an array of all of the NFTs the user
   * possesses across all networks and accounts.
   *
   * @param allNfts
   */
  #getAllNFTsFlattened = memoize((allNfts: MetaMaskState['allNfts'] = {}) => {
    return Object.values(allNfts).reduce((result: Nft[], chainNFTs) => {
      return result.concat(...Object.values(chainNFTs));
    }, []);
  });

  /**
   * Returns the number of unique NFT addresses the user
   * possesses across all networks and accounts.
   *
   * @param allNfts
   */
  #getAllUniqueNFTAddressesLength(
    allNfts: MetaMaskState['allNfts'] = {},
  ): number {
    const allNFTAddresses = this.#getAllNFTsFlattened(allNfts).map(
      (nft) => nft.address,
    );
    const uniqueAddresses = new Set(allNFTAddresses);
    return uniqueAddresses.size;
  }

  /**
   * @param allTokens
   * @returns number of unique token addresses
   */
  #getNumberOfTokens(allTokens: MetaMaskState['allTokens']): number {
    return Object.values(allTokens).reduce((result, accountsByChain) => {
      return result + sum(Object.values(accountsByChain).map(size));
    }, 0);
  }

  /**
   * Computes wallet composition traits from internalAccounts, which is always
   * available regardless of lock state (unlike keyrings).
   *
   * number_of_account_groups deduplicates BIP44 multichain accounts by their
   * entropy source and group index so that EVM + BTC + SOL addresses derived
   * from the same SRP slot count as one account group, matching what users see
   * in the Account Management UI.
   *
   * @param metamaskState
   */
  #getAccountCompositionTraits(
    metamaskState: MetaMaskState,
  ): Partial<MetaMetricsUserTraits> {
    const accountGroupKeys = new Set<string>();
    const hdEntropyIds = new Set<string>();
    let numberOfImportedAccounts = 0;
    let numberOfLedgerAccounts = 0;
    let numberOfTrezorAccounts = 0;
    let numberOfLatticeAccounts = 0;
    let numberOfQrHardwareAccounts = 0;

    for (const [accountId, account] of Object.entries(
      metamaskState.internalAccounts.accounts,
    )) {
      const keyringType = account.metadata?.keyring?.type;

      switch (keyringType) {
        case KeyringType.imported:
          numberOfImportedAccounts += 1;
          break;
        case KeyringType.ledger:
          numberOfLedgerAccounts += 1;
          break;
        case KeyringType.trezor:
          numberOfTrezorAccounts += 1;
          break;
        case KeyringType.lattice:
          numberOfLatticeAccounts += 1;
          break;
        case KeyringType.qr:
        case KeyringType.oneKey:
          numberOfQrHardwareAccounts += 1;
          break;
        default:
          break;
      }

      // BIP44 multichain accounts share an entropy source id and group index
      // across all chains (EVM, BTC, SOL, …). Deduplicating on that key gives
      // the count of account groups rather than individual chain addresses.
      const entropy: InternalAccount['options']['entropy'] =
        account.options?.entropy;

      if (
        entropy?.type === 'mnemonic' &&
        'id' in entropy &&
        'groupIndex' in entropy
      ) {
        accountGroupKeys.add(`${entropy.id}:${entropy.groupIndex}`);
        hdEntropyIds.add(entropy.id);
      } else {
        accountGroupKeys.add(accountId);
      }
    }

    return {
      [MetaMetricsUserTrait.NumberOfHDEntropies]: hdEntropyIds.size,
      [MetaMetricsUserTrait.NumberOfAccountGroups]: accountGroupKeys.size,
      [MetaMetricsUserTrait.NumberOfImportedAccounts]: numberOfImportedAccounts,
      [MetaMetricsUserTrait.NumberOfLedgerAccounts]: numberOfLedgerAccounts,
      [MetaMetricsUserTrait.NumberOfTrezorAccounts]: numberOfTrezorAccounts,
      [MetaMetricsUserTrait.NumberOfLatticeAccounts]: numberOfLatticeAccounts,
      [MetaMetricsUserTrait.NumberOfQrHardwareAccounts]:
        numberOfQrHardwareAccounts,
      // MetaMask enforces one paired device per hardware wallet type, so
      // "types in use" equals "distinct devices".
      [MetaMetricsUserTrait.NumberOfHardwareWallets]:
        (numberOfLedgerAccounts > 0 ? 1 : 0) +
        (numberOfTrezorAccounts > 0 ? 1 : 0) +
        (numberOfLatticeAccounts > 0 ? 1 : 0) +
        (numberOfQrHardwareAccounts > 0 ? 1 : 0),
    };
  }

  /**
   * Returns the total number of Ethereum addresses with saved petnames,
   * including all chain ID variations.
   *
   * @param metamaskState
   */
  #getPetnameAddressCount(metamaskState: MetaMaskState): number {
    const addressNames = metamaskState.names?.[NameType.ETHEREUM_ADDRESS] ?? {};

    return Object.keys(addressNames).reduce((totalCount, address) => {
      const addressEntry = addressNames[address];

      const addressNameCount = Object.keys(addressEntry).reduce(
        (count, chainId) => {
          const hasName = Boolean(addressEntry[chainId].name?.length);
          return count + (hasName ? 1 : 0);
        },
        0,
      );

      return totalCount + addressNameCount;
    }, 0);
  }
}
