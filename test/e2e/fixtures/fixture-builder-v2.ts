import { merge, cloneDeep } from 'lodash';
import { toHex } from '@metamask/controller-utils';
import type { Hex, Json } from '@metamask/utils';
import type { AccountsControllerState } from '@metamask/accounts-controller';
import type { AddressBookControllerState } from '@metamask/address-book-controller';
import type {
  CurrencyRateState,
  MultichainAssetsRatesControllerState,
  NftControllerState,
  RatesControllerState,
  TokenBalancesControllerState,
  TokenListMap,
  TokenListState,
  TokensControllerState,
} from '@metamask/assets-controllers';
import type { KeyringControllerState } from '@metamask/keyring-controller';
import { type NameControllerState, NameType } from '@metamask/name-controller';
import type { PersistedSnapControllerState } from '@metamask/snaps-controllers';
import type { NetworkEnablementControllerState } from '@metamask/network-enablement-controller';
import type { SelectedNetworkControllerState } from '@metamask/selected-network-controller';
import type {
  PermissionConstraint,
  PermissionControllerState,
} from '@metamask/permission-controller';
import {
  type NetworkMetadata,
  type NetworkState,
  NetworkStatus,
  RpcEndpointType,
} from '@metamask/network-controller';
import {
  type TransactionControllerState,
  type TransactionMeta,
  TransactionStatus,
  TransactionType,
} from '@metamask/transaction-controller';
import type { AppStateControllerState } from '../../../app/scripts/controllers/app-state-controller';
import type { MetaMetricsControllerState } from '../../../app/scripts/controllers/metametrics-controller';
import type { OnboardingControllerState } from '../../../app/scripts/controllers/onboarding';
import type {
  Preferences,
  PreferencesControllerState,
} from '../../../app/scripts/controllers/preferences-controller';
import { CHAIN_IDS } from '../../../shared/constants/network';
import {
  ACCOUNT_2,
  ADDITIONAL_ACCOUNT_FIXTURE_VAULT,
  DAPP_ONE_URL,
  DAPP_TWO_URL,
  DAPP_URL,
  DAPP_URL_LOCALHOST,
  DEFAULT_FIXTURE_ACCOUNT_LOWERCASE,
  HARDWARE_WALLET_ACCOUNT_ID,
  IMPORTED_ACCOUNT_FIXTURE_VAULT,
  LEDGER_FIXTURE_VAULT,
  LOCALHOST_NETWORK_CLIENT_ID,
  MULTI_SRP_FIXTURE_VAULT,
  NETWORK_CLIENT_ID,
  OLD_FIXTURE_VAULT,
  SECOND_NODE_NETWORK_CLIENT_ID,
  THIRD_NODE_NETWORK_CLIENT_ID,
  TREZOR_ADDRESS,
  TREZOR_VAULT,
} from '../constants';
import { KNOWN_PUBLIC_KEY_ADDRESSES } from '../../stub/keyring-bridge';
import { SMART_CONTRACTS } from '../seeder/smart-contracts';
import defaultFixtureJson from './default-fixture.json';
import onboardingFixtureJson from './onboarding-fixture.json';

const STORAGE_SERVICE_NAMESPACE = Object.freeze({
  SNAP_CONTROLLER: 'SnapController',
  TOKEN_LIST_CONTROLLER: 'TokenListController',
} as const);

const LIFECYCLE_HOOKS_EXAMPLE_SNAP_ID =
  'npm:@metamask/lifecycle-hooks-example-snap';

/** `methods` for HD / imported EOA rows in AccountsController fixtures. */
const FIXTURE_HD_EOA_ACCOUNT_METHODS = [
  'personal_sign',
  'eth_signTransaction',
  'eth_signTypedData_v1',
  'eth_signTypedData_v3',
  'eth_signTypedData_v4',
] as const;

/** `methods` for hardware wallet rows (and paired HD row) where `eth_sign` is supported. */
const FIXTURE_HARDWARE_EOA_ACCOUNT_METHODS = [
  'personal_sign',
  'eth_sign',
  'eth_signTransaction',
  'eth_signTypedData_v1',
  'eth_signTypedData_v3',
  'eth_signTypedData_v4',
] as const;

/* eslint-disable no-template-curly-in-string -- minified bundle embeds template-like `${` sequences */
const LIFECYCLE_HOOKS_EXAMPLE_SNAP_SOURCE_CODE =
  '(()=>{var e={d:(n,t)=>{for(var a in t)e.o(t,a)&&!e.o(n,a)&&Object.defineProperty(n,a,{enumerable:!0,get:t[a]})},o:(e,n)=>Object.prototype.hasOwnProperty.call(e,n),r:e=>{"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})}},n={};(()=>{"use strict";function t(e,n,t){if("string"==typeof e)throw new Error(`An HTML element ("${String(e)}") was used in a Snap component, which is not supported by Snaps UI. Please use one of the supported Snap components.`);if(!e)throw new Error("A JSX fragment was used in a Snap component, which is not supported by Snaps UI. Please use one of the supported Snap components.");return e({...n,key:t})}function a(e){return Object.fromEntries(Object.entries(e).filter((([,e])=>void 0!==e)))}function r(e){return n=>{const{key:t=null,...r}=n;return{type:e,props:a(r),key:t}}}e.r(n),e.d(n,{onInstall:()=>p,onStart:()=>l,onUpdate:()=>d});const o=r("Box"),s=r("Text"),l=async()=>await snap.request({method:"snap_dialog",params:{type:"alert",content:t(o,{children:t(s,{children:\'The client was started successfully, and the "onStart" handler was called.\'})})}}),p=async()=>await snap.request({method:"snap_dialog",params:{type:"alert",content:t(o,{children:t(s,{children:\'The Snap was installed successfully, and the "onInstall" handler was called.\'})})}}),d=async()=>await snap.request({method:"snap_dialog",params:{type:"alert",content:t(o,{children:t(s,{children:\'The Snap was updated successfully, and the "onUpdate" handler was called.\'})})}})})(),module.exports=n})();';
/* eslint-enable no-template-curly-in-string */

function defaultFixture() {
  return cloneDeep(defaultFixtureJson);
}

function onboardingFixture() {
  return cloneDeep(onboardingFixtureJson);
}

type FixtureType = typeof defaultFixtureJson | typeof onboardingFixtureJson;

type NetworkClientIdValue =
  (typeof NETWORK_CLIENT_ID)[keyof typeof NETWORK_CLIENT_ID];

type TransactionControllerFixtureInput = Partial<
  Omit<TransactionControllerState, 'transactions'>
> & {
  transactions?: TransactionMeta[];
};

type StorageServiceNamespaceMap = {
  [STORAGE_SERVICE_NAMESPACE.SNAP_CONTROLLER]: {
    key: string;
    value: { sourceCode: string };
  };
  [STORAGE_SERVICE_NAMESPACE.TOKEN_LIST_CONTROLLER]: {
    key: `tokensChainsCache:${Hex}`;
    value: { timestamp: number; data: TokenListMap };
  };
};

type StorageServiceNamespace = keyof StorageServiceNamespaceMap;

type FixtureBuildResult = FixtureType & {
  storageServiceData?: Record<string, unknown>;
};

/**
 * Like `Partial<MultichainAssetsRatesControllerState>`, but `conversionRates` may be a
 * partial map (lodash `merge` fills the rest).
 */
type MultichainAssetsRatesControllerFixturePatch = Partial<
  Omit<MultichainAssetsRatesControllerState, 'conversionRates'>
> & {
  conversionRates?: Partial<
    MultichainAssetsRatesControllerState['conversionRates']
  >;
};

class FixtureBuilderV2 {
  fixture: FixtureType;

  storageServiceData: Record<string, unknown> = {};

  /**
   * Constructs a new instance of the FixtureBuilder class.
   *
   * @param options - The options for the constructor.
   * @param options.onboarding - Indicates if onboarding is enabled.
   */
  constructor({ onboarding = false }: { onboarding?: boolean } = {}) {
    this.fixture = onboarding === true ? onboardingFixture() : defaultFixture();
  }

  /* ==================================================================
                          GENERIC  CONTROLLER METHODS
     ==================================================================
  */
  withAccountsController(data: Partial<AccountsControllerState>): this {
    merge(this.fixture.data.AccountsController, data);
    return this;
  }

  withAddressBookController(data: Partial<AddressBookControllerState>): this {
    if (!this.fixture.data.AddressBookController) {
      (this.fixture.data as Record<string, unknown>).AddressBookController = {
        addressBook: {},
      };
    }
    merge(this.fixture.data.AddressBookController, data);
    return this;
  }

  withAppStateController(data: Partial<AppStateControllerState>): this {
    merge(this.fixture.data.AppStateController, data);
    return this;
  }

  withCurrencyController(data: Partial<CurrencyRateState>): this {
    merge(this.fixture.data.CurrencyController, data);
    return this;
  }

  withKeyringController(data: Partial<KeyringControllerState>): this {
    merge(this.fixture.data.KeyringController, data);
    return this;
  }

  withMetaMetricsController(data: Partial<MetaMetricsControllerState>): this {
    merge(this.fixture.data.MetaMetricsController, data);
    return this;
  }

  withMultichainAssetsRatesController(
    data: MultichainAssetsRatesControllerFixturePatch,
  ): this {
    merge(this.fixture.data.MultichainAssetsRatesController, data);
    return this;
  }

  withMultichainRatesController(data: Partial<RatesControllerState>): this {
    merge(this.fixture.data.MultichainRatesController, data);
    return this;
  }

  withNameController(data: Partial<NameControllerState>): this {
    merge(this.fixture.data.NameController, data);
    return this;
  }

  withNetworkController(data: Partial<NetworkState>): this {
    merge(this.fixture.data.NetworkController, data);
    return this;
  }

  withNetworkEnablementController(
    data: Partial<NetworkEnablementControllerState>,
  ): this {
    merge(this.fixture.data.NetworkEnablementController, data);
    return this;
  }

  withNftController(data: Partial<NftControllerState>): this {
    merge(this.fixture.data.NftController, data);
    return this;
  }

  withOnboardingController(data: Partial<OnboardingControllerState>): this {
    merge(this.fixture.data.OnboardingController, data);
    return this;
  }

  withPermissionController(
    data: Partial<PermissionControllerState<PermissionConstraint>>,
  ): this {
    merge(this.fixture.data.PermissionController, data);
    return this;
  }

  withPreferencesController(
    data: Omit<Partial<PreferencesControllerState>, 'preferences'> & {
      preferences?: Partial<Preferences>;
    },
  ): this {
    merge(this.fixture.data.PreferencesController, data);
    return this;
  }

  withSelectedNetworkController(
    data: Partial<SelectedNetworkControllerState>,
  ): this {
    merge(this.fixture.data.SelectedNetworkController, data);
    return this;
  }

  withSnapController(data: Partial<PersistedSnapControllerState>): this {
    (this.fixture.data as Record<string, unknown>).SnapController ??= {};
    merge(this.fixture.data.SnapController, data);
    return this;
  }

  withTokenBalancesController(
    data: Partial<TokenBalancesControllerState>,
  ): this {
    merge(this.fixture.data.TokenBalancesController, data);
    return this;
  }

  withTokenListController(data: Partial<TokenListState>): this {
    (this.fixture.data as Record<string, unknown>).TokenListController ??= {};
    merge(
      (this.fixture.data as Record<string, unknown>).TokenListController,
      data,
    );
    return this;
  }

  withTokensController(data: Partial<TokensControllerState>): this {
    merge(this.fixture.data.TokensController, data);
    return this;
  }

  withTransactionController(data: TransactionControllerFixtureInput): this {
    const transactionController = this.fixture.data.TransactionController ?? {};
    merge(this.fixture.data, { TransactionController: transactionController });
    const target = this.fixture.data
      .TransactionController as Partial<TransactionControllerState>;

    const { transactions, ...rest } = data;
    // Always merge non-transaction state first (lastFetchedBlockNumbers, methodData, etc.)
    merge(target, rest);
    if (transactions !== undefined) {
      const existing = Array.isArray(target.transactions)
        ? target.transactions
        : [];
      const combined: TransactionMeta[] = [...existing, ...transactions].sort(
        (a, b) => (b.time ?? 0) - (a.time ?? 0),
      );
      target.transactions = combined;
    }
    return this;
  }

  /* ==================================================================
                              CUSTOM METHODS
     ==================================================================
  */
  withAccountsControllerAdditionalAccountVault(): this {
    return this.withAccountsController({
      internalAccounts: {
        selectedAccount: 'd5e45e4a-3b04-4a09-a5e1-39762e5c6be4',
        accounts: {
          'd5e45e4a-3b04-4a09-a5e1-39762e5c6be4': {
            id: 'd5e45e4a-3b04-4a09-a5e1-39762e5c6be4',
            address: DEFAULT_FIXTURE_ACCOUNT_LOWERCASE,
            options: {
              entropySource: '01KGHBJCECE5PTNHY84ZAE2V9Y',
              derivationPath: "m/44'/60'/0'/0/0",
              groupIndex: 0,
              entropy: {
                type: 'mnemonic',
                id: '01KGHBJCECE5PTNHY84ZAE2V9Y',
                derivationPath: "m/44'/60'/0'/0/0",
                groupIndex: 0,
              },
            },
            methods: [...FIXTURE_HD_EOA_ACCOUNT_METHODS],
            type: 'eip155:eoa',
            scopes: ['eip155:0'],
            metadata: {
              name: 'Account 1',
              importTime: 1724486724986,
              lastSelected: 1665507600000,
              keyring: {
                type: 'HD Key Tree',
              },
            },
          },
          'e9976a84-110e-46c3-9811-e2da7b5528d3': {
            id: 'e9976a84-110e-46c3-9811-e2da7b5528d3',
            address: ACCOUNT_2,
            options: {
              entropySource: '01KGHBJCECE5PTNHY84ZAE2V9Y',
              derivationPath: "m/44'/60'/0'/0/1",
              groupIndex: 1,
              entropy: {
                type: 'mnemonic',
                id: '01KGHBJCECE5PTNHY84ZAE2V9Y',
                derivationPath: "m/44'/60'/0'/0/1",
                groupIndex: 1,
              },
            },
            methods: [...FIXTURE_HD_EOA_ACCOUNT_METHODS],
            type: 'eip155:eoa',
            scopes: ['eip155:0'],
            metadata: {
              name: 'Account 2',
              importTime: 1724486724986,
              lastSelected: 1665507800000,
              keyring: {
                type: 'HD Key Tree',
              },
            },
          },
        },
      },
    });
  }

  withAccountsControllerImportedAccount(): this {
    return this.withAccountsController({
      internalAccounts: {
        selectedAccount: '2fdb2de6-80c7-4d2f-9f95-cb6895389843',
        accounts: {
          '2fdb2de6-80c7-4d2f-9f95-cb6895389843': {
            id: '2fdb2de6-80c7-4d2f-9f95-cb6895389843',
            address: '0x0cc5261ab8ce458dc977078a3623e2badd27afd3',
            options: {
              entropySource: '01KGHBX70TS965MXN93GBPKD6Z',
              derivationPath: "m/44'/60'/0'/0/0",
              groupIndex: 0,
              entropy: {
                type: 'mnemonic',
                id: '01KGHBX70TS965MXN93GBPKD6Z',
                derivationPath: "m/44'/60'/0'/0/0",
                groupIndex: 0,
              },
            },
            methods: [...FIXTURE_HD_EOA_ACCOUNT_METHODS],
            type: 'eip155:eoa',
            scopes: ['eip155:0'],
            metadata: {
              name: 'Account 1',
              importTime: 1724486724986,
              lastSelected: 1665507600000,
              keyring: {
                type: 'HD Key Tree',
              },
            },
          },
          '58093703-57e9-4ea9-8545-49e8a75cb084': {
            id: '58093703-57e9-4ea9-8545-49e8a75cb084',
            address: '0x3ed0ee22e0685ebbf07b2360a8331693c413cc59',
            options: {
              entropySource: '01KGHBX70TS965MXN93GBPKD6Z',
              derivationPath: "m/44'/60'/0'/0/1",
              groupIndex: 1,
              entropy: {
                type: 'mnemonic',
                id: '01KGHBX70TS965MXN93GBPKD6Z',
                derivationPath: "m/44'/60'/0'/0/1",
                groupIndex: 1,
              },
            },
            methods: [...FIXTURE_HD_EOA_ACCOUNT_METHODS],
            type: 'eip155:eoa',
            scopes: ['eip155:0'],
            metadata: {
              name: 'Account 2',
              importTime: 1724486724986,
              keyring: {
                type: 'HD Key Tree',
              },
            },
          },
          'dd658aab-abf2-4f53-b735-c8a57151d447': {
            id: 'dd658aab-abf2-4f53-b735-c8a57151d447',
            address: '0xd38d853771fb546bd8b18b2f3638491bc0b0e906',
            options: {
              entropySource: '01KGHBX70TS965MXN93GBPKD6Z',
              derivationPath: "m/44'/60'/0'/0/2",
              groupIndex: 2,
              entropy: {
                type: 'mnemonic',
                id: '01KGHBX70TS965MXN93GBPKD6Z',
                derivationPath: "m/44'/60'/0'/0/2",
                groupIndex: 2,
              },
            },
            methods: [...FIXTURE_HD_EOA_ACCOUNT_METHODS],
            type: 'eip155:eoa',
            scopes: ['eip155:0'],
            metadata: {
              name: 'Account 3',
              importTime: 1724486724986,
              keyring: {
                type: 'HD Key Tree',
              },
            },
          },
        },
      },
    });
  }

  withBadPreferencesControllerState(): this {
    (this.fixture.data as Record<string, unknown>).PreferencesController = 5;
    return this;
  }

  withConversionRateDisabled(): this {
    return this.withPreferencesController({
      useCurrencyRateCheck: false,
    });
  }

  withConversionRates(
    conversionRates: Partial<
      MultichainAssetsRatesControllerState['conversionRates']
    > = {},
  ): this {
    return this.withMultichainAssetsRatesController({ conversionRates });
  }

  withCurrencyRates(
    currencyRates: CurrencyRateState['currencyRates'] = {},
  ): this {
    return this.withCurrencyController({
      currencyRates: { ...currencyRates },
    });
  }

  // NOTE: consider this when using this fixture:
  //   - Multiple chains enabled → homepage shows "Popular networks" filter.
  //   - Single chain enabled → homepage shows "Current network" single-chain filter.
  // This is a full assignment, not a merge — only the networks listed here will be enabled.
  // The reason for not using a merge is because if we do, then localhost will also be enabled (default) and we end up mixing Custom networks with Popular networks, a Frankenstein state not possible in production.
  withEnabledNetworks(
    data: NetworkEnablementControllerState['enabledNetworkMap'],
  ): this {
    this.fixture.data.NetworkEnablementController.enabledNetworkMap =
      data as FixtureType['data']['NetworkEnablementController']['enabledNetworkMap'];
    return this;
  }

  withKeyringControllerAdditionalAccountVault(): this {
    return this.withKeyringController({
      vault: ADDITIONAL_ACCOUNT_FIXTURE_VAULT,
    });
  }

  withKeyringControllerImportedAccountVault(): this {
    return this.withKeyringController({
      vault: IMPORTED_ACCOUNT_FIXTURE_VAULT,
    });
  }

  withKeyringControllerMultiSRP(): this {
    return this.withKeyringController({
      vault: MULTI_SRP_FIXTURE_VAULT,
    });
  }

  withKeyringControllerOldVault(): this {
    return this.withKeyringController({
      vault: OLD_FIXTURE_VAULT,
    });
  }

  withLedgerAccount(): this {
    const ledgerAddressLower =
      KNOWN_PUBLIC_KEY_ADDRESSES[0].address.toLowerCase();

    this.withKeyringController({
      vault: LEDGER_FIXTURE_VAULT,
    }).withAccountsController({
      internalAccounts: {
        accounts: {
          'd5e45e4a-3b04-4a09-a5e1-39762e5c6be4': {
            id: 'd5e45e4a-3b04-4a09-a5e1-39762e5c6be4',
            address: DEFAULT_FIXTURE_ACCOUNT_LOWERCASE,
            options: {
              entropySource: '01JWZDDDB45SRHTRE5KYWZJK9W',
              derivationPath: "m/44'/60'/0'/0/0",
              groupIndex: 0,
              entropy: {
                type: 'mnemonic',
                id: '01JWZDDDB45SRHTRE5KYWZJK9W',
                derivationPath: "m/44'/60'/0'/0/0",
                groupIndex: 0,
              },
            },
            methods: [...FIXTURE_HARDWARE_EOA_ACCOUNT_METHODS],
            type: 'eip155:eoa',
            scopes: ['eip155:0'],
            metadata: {
              name: 'Account 1',
              importTime: 1724486724986,
              lastSelected: 1665507600000,
              keyring: {
                type: 'HD Key Tree',
              },
            },
          },
          [HARDWARE_WALLET_ACCOUNT_ID]: {
            id: HARDWARE_WALLET_ACCOUNT_ID,
            address: ledgerAddressLower,
            options: {},
            methods: [...FIXTURE_HARDWARE_EOA_ACCOUNT_METHODS],
            type: 'eip155:eoa',
            scopes: ['eip155:0'],
            metadata: {
              name: 'Ledger 1',
              importTime: 1724486729079,
              keyring: {
                type: 'Ledger Hardware',
              },
              lastSelected: 1724486729083,
            },
          },
        },
        selectedAccount: HARDWARE_WALLET_ACCOUNT_ID,
      },
    });
    return this;
  }

  withNetworkControllerDoubleNode(): this {
    const secondNodeChainId = '0x53a';
    const secondNodeClientId = SECOND_NODE_NETWORK_CLIENT_ID;

    return this.withNetworkController({
      networkConfigurationsByChainId: {
        [secondNodeChainId]: {
          blockExplorerUrls: [],
          chainId: secondNodeChainId,
          defaultRpcEndpointIndex: 0,
          name: 'Localhost 8546',
          nativeCurrency: 'ETH',
          rpcEndpoints: [
            {
              networkClientId: secondNodeClientId,
              type: RpcEndpointType.Custom,
              url: 'http://localhost:8546',
            },
          ],
        },
      },
      networksMetadata: {
        [secondNodeClientId]: {
          EIPS: {},
          status: NetworkStatus.Available,
        },
      },
    });
  }

  withNetworkRpcUrlOnLocalhost(chainId: Hex): this {
    const networkController = this.fixture.data.NetworkController as {
      selectedNetworkClientId: string;
      networkConfigurationsByChainId: Record<
        string,
        {
          defaultRpcEndpointIndex: number;
          rpcEndpoints: {
            networkClientId: string;
            url: string;
            type: string;
          }[];
        }
      >;
      networksMetadata: Record<string, NetworkMetadata>;
    };
    const chainConfig =
      networkController.networkConfigurationsByChainId[chainId];
    if (!chainConfig) {
      throw new Error(
        `withNetworkRpcUrlOnLocalhost: no network configuration found for chain ${chainId}`,
      );
    }
    {
      const localClientId = `${chainId}-local`;
      chainConfig.rpcEndpoints.push({
        networkClientId: localClientId,
        url: 'http://localhost:8545',
        type: RpcEndpointType.Custom,
      });
      chainConfig.defaultRpcEndpointIndex = chainConfig.rpcEndpoints.length - 1;
      networkController.selectedNetworkClientId = localClientId;
      networkController.networksMetadata[localClientId] = {
        EIPS: {},
        status: NetworkStatus.Available,
      };
    }
    return this;
  }

  // We cannot simply use withSelectedNetwork because Sei is not enabled by default
  withNetworkControllerOnSei(): this {
    const seiChainId = '0x531';
    const seiClientId = 'sei';

    return this.withNetworkController({
      selectedNetworkClientId: seiClientId,
      networkConfigurationsByChainId: {
        [seiChainId]: {
          blockExplorerUrls: ['https://seitrace.com'],
          chainId: seiChainId,
          defaultBlockExplorerUrlIndex: 0,
          defaultRpcEndpointIndex: 0,
          name: 'Sei',
          nativeCurrency: 'SEI',
          rpcEndpoints: [
            {
              networkClientId: seiClientId,
              type: RpcEndpointType.Custom,
              url: 'https://sei-mainnet.infura.io/v3/',
            },
          ],
        },
      },
      networksMetadata: {
        [seiClientId]: {
          EIPS: {},
          status: NetworkStatus.Available,
        },
      },
    });
  }

  withNetworkControllerTripleNode(): this {
    const thirdNodeChainId = '0x3e8';
    const thirdNodeClientId = THIRD_NODE_NETWORK_CLIENT_ID;

    return this.withNetworkControllerDoubleNode().withNetworkController({
      networkConfigurationsByChainId: {
        [thirdNodeChainId]: {
          blockExplorerUrls: [],
          chainId: thirdNodeChainId,
          defaultRpcEndpointIndex: 0,
          name: 'Localhost 7777',
          nativeCurrency: 'ETH',
          rpcEndpoints: [
            {
              networkClientId: thirdNodeClientId,
              type: RpcEndpointType.Custom,
              url: 'http://localhost:7777',
            },
          ],
        },
      },
      networksMetadata: {
        [thirdNodeClientId]: {
          EIPS: {},
          status: NetworkStatus.Available,
        },
      },
    });
  }

  withNftControllerERC1155(): this {
    return this.withNftController({
      allNftContracts: {
        [DEFAULT_FIXTURE_ACCOUNT_LOWERCASE]: {
          [toHex(1337)]: [
            {
              address: `__FIXTURE_SUBSTITUTION__CONTRACT${SMART_CONTRACTS.ERC1155}`,
            },
          ],
        },
      },
      allNfts: {
        [DEFAULT_FIXTURE_ACCOUNT_LOWERCASE]: {
          [toHex(1337)]: [
            {
              address: `__FIXTURE_SUBSTITUTION__CONTRACT${SMART_CONTRACTS.ERC1155}`,
              tokenId: '1',
              favorite: false,
              isCurrentlyOwned: true,
              name: 'Rocks',
              description: 'This is a collection of Rock NFTs.',
              image:
                'ipfs://bafkreifvhjdf6ve4jfv6qytqtux5nd4nwnelioeiqx5x2ez5yrgrzk7ypi',
              standard: 'ERC1155',
              chainId: 1337,
            },
          ],
        },
      },
      ignoredNfts: [],
    });
  }

  withNftControllerERC721(): this {
    return this.withNftController({
      allNftContracts: {
        [DEFAULT_FIXTURE_ACCOUNT_LOWERCASE]: {
          [toHex(1337)]: [
            {
              address: `__FIXTURE_SUBSTITUTION__CONTRACT${SMART_CONTRACTS.NFTS}`,
              name: 'TestDappNFTs',
              symbol: 'TDC',
            },
          ],
        },
      },
      allNfts: {
        [DEFAULT_FIXTURE_ACCOUNT_LOWERCASE]: {
          [toHex(1337)]: [
            {
              address: `__FIXTURE_SUBSTITUTION__CONTRACT${SMART_CONTRACTS.NFTS}`,
              description: 'Test Dapp NFTs for testing.',
              favorite: false,
              image:
                'data:image/svg+xml;base64,PHN2ZyBoZWlnaHQ9IjM1MCIgd2lkdGg9IjM1MCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdGggaWQ9Ik15UGF0aCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJyZWQiIGQ9Ik0xMCw5MCBROTAsOTAgOTAsNDUgUTkwLDEwIDUwLDEwIFExMCwxMCAxMCw0MCBRMTAsNzAgNDUsNzAgUTcwLDcwIDc1LDUwIiAvPjwvZGVmcz48dGV4dD48dGV4dFBhdGggaHJlZj0iI015UGF0aCI+UXVpY2sgYnJvd24gZm94IGp1bXBzIG92ZXIgdGhlIGxhenkgZG9nLjwvdGV4dFBhdGg+PC90ZXh0Pjwvc3ZnPg==',
              isCurrentlyOwned: true,
              name: 'Test Dapp NFTs #1',
              standard: 'ERC721',
              tokenId: '1',
              chainId: 1337,
            },
          ],
        },
      },
      ignoredNfts: [],
    });
  }

  withNoNames(): this {
    // Direct assignment instead of merge so existing petname entries are cleared if any
    this.fixture.data.NameController.names = {
      [NameType.ETHEREUM_ADDRESS]: {},
    };
    return this;
  }

  withPermissionControllerConnectedToTestDapp({
    account = DEFAULT_FIXTURE_ACCOUNT_LOWERCASE,
    useLocalhostHostname = false,
    numberOfDapps = 1,
    chainIds = [1337],
    scopes,
  }: {
    account?: string | string[];
    useLocalhostHostname?: boolean;
    numberOfDapps?: number;
    chainIds?: number[];
    scopes?: Record<string, Json>;
  } = {}): this {
    const MAX_DAPPS = 3;
    if (numberOfDapps < 1 || numberOfDapps > MAX_DAPPS) {
      throw new Error(
        `numberOfDapps must be between 1 and ${MAX_DAPPS}, got ${numberOfDapps}`,
      );
    }

    const resolvedAccounts = (Array.isArray(account) ? account : [account]).map(
      (a) => a.toLowerCase(),
    );

    const dappUrls = [
      useLocalhostHostname ? DAPP_URL_LOCALHOST : DAPP_URL,
      DAPP_ONE_URL,
      DAPP_TWO_URL,
    ].slice(0, numberOfDapps);

    // Use custom scopes if provided, otherwise build EVM scopes from chainIds
    let scopeValue: Record<string, Json>;
    if (scopes) {
      scopeValue = scopes;
    } else {
      const optionalScopes: Record<string, { accounts: string[] }> = {};
      for (const chainId of chainIds) {
        const scopeKey = `eip155:${chainId}`;
        optionalScopes[scopeKey] = {
          accounts: resolvedAccounts.map((a) => `${scopeKey}:${a}`),
        };
      }
      optionalScopes['wallet:eip155'] = {
        accounts: resolvedAccounts.map((a) => `wallet:eip155:${a}`),
      };
      scopeValue = {
        isMultichainOrigin: true,
        optionalScopes,
        requiredScopes: {},
        sessionProperties: {},
      };
    }

    // Unique random IDs for each dapp subject's permission
    const permissionIds = [
      'SFqk8nFLekiqC5O1cYCjT',
      'Aqk7nGLdkiqC5O1cYCjU',
      'Brl8oHMeliqC5O1cYCjV',
    ];
    const subjects: PermissionControllerState<PermissionConstraint>['subjects'] =
      {};
    for (let i = 0; i < dappUrls.length; i++) {
      const dappUrl = dappUrls[i];
      subjects[dappUrl] = {
        origin: dappUrl,
        permissions: {
          'endowment:caip25': {
            caveats: [
              {
                type: 'authorizedScopes',
                value: scopeValue,
              },
            ],
            date: 1770296204693,
            id: permissionIds[i],
            invoker: dappUrl,
            parentCapability: 'endowment:caip25',
          },
        },
      };
    }

    return this.withPermissionController({ subjects });
  }

  withPermissionControllerConnectedToMultichainTestDapp({
    account = DEFAULT_FIXTURE_ACCOUNT_LOWERCASE,
    useLocalhostHostname = false,
    chainIds = [1337],
    scopes,
  }: {
    account?: string | string[];
    useLocalhostHostname?: boolean;
    chainIds?: number[];
    scopes?: Record<string, Json>;
  } = {}): this {
    const resolvedAccounts = (Array.isArray(account) ? account : [account]).map(
      (a) => a.toLowerCase(),
    );

    let scopeValue: Record<string, Json>;
    if (scopes) {
      scopeValue = scopes;
    } else {
      const optionalScopes: Record<string, { accounts: string[] }> = {};
      for (const chainId of chainIds) {
        const scopeKey = `eip155:${chainId}`;
        optionalScopes[scopeKey] = {
          accounts: resolvedAccounts.map((a) => `${scopeKey}:${a}`),
        };
      }
      optionalScopes['wallet:eip155'] = {
        accounts: resolvedAccounts.map((a) => `wallet:eip155:${a}`),
      };
      optionalScopes.wallet = { accounts: [] };
      scopeValue = {
        isMultichainOrigin: true,
        optionalScopes,
        requiredScopes: {},
        sessionProperties: {},
      };
    }

    const dappUrl = useLocalhostHostname ? DAPP_URL_LOCALHOST : DAPP_URL;
    return this.withPermissionController({
      subjects: {
        [dappUrl]: {
          origin: dappUrl,
          permissions: {
            'endowment:caip25': {
              caveats: [
                {
                  type: 'authorizedScopes',
                  value: scopeValue,
                },
              ],
              date: 1770296204693,
              id: 'SFqk8nFLekiqC5O1cYCjT',
              invoker: dappUrl,
              parentCapability: 'endowment:caip25',
            },
          },
        },
      },
    });
  }

  withPreferencesControllerTxSimulationsDisabled(): this {
    return this.withPreferencesController({
      useTransactionSimulations: false,
    });
  }

  // NOTE: This method should only be used with EVM networks. Non-EVM networks (Bitcoin, Tron...) rely on Snaps that may not be ready at startup;
  // Selecting one of them via fixtures may cause the extension to switch back to default network.
  // For non-EVM networks, switch manually in the test after the Snap is ready.
  withSelectedNetwork(
    networkClientId: NetworkClientIdValue = NETWORK_CLIENT_ID.MAINNET,
  ): this {
    return this.withNetworkController({
      selectedNetworkClientId: networkClientId,
    });
  }

  withSelectedNetworkControllerPerDomain(): this {
    return this.withSelectedNetworkController({
      domains: {
        [DAPP_URL]: LOCALHOST_NETWORK_CLIENT_ID,
        [DAPP_ONE_URL]: SECOND_NODE_NETWORK_CLIENT_ID,
      },
    });
  }

  withShowNativeTokenAsMainBalanceDisabled(): this {
    return this.withPreferencesController({
      preferences: {
        showNativeTokenAsMainBalance: false,
      },
    });
  }

  withShowNativeTokenAsMainBalanceEnabled(): this {
    return this.withPreferencesController({
      preferences: {
        showNativeTokenAsMainBalance: true,
      },
    });
  }

  withSnapsPrivacyWarningAlreadyShown(): this {
    return this.withAppStateController({
      snapsInstallPrivacyWarningShown: true,
    });
  }

  withSnapControllerOnStartLifecycleSnap(): this {
    /* eslint-disable @typescript-eslint/naming-convention -- MetaMask Snap / RPC permission keys */
    const result = this.withPermissionController({
      subjects: {
        [LIFECYCLE_HOOKS_EXAMPLE_SNAP_ID]: {
          origin: LIFECYCLE_HOOKS_EXAMPLE_SNAP_ID,
          permissions: {
            'endowment:lifecycle-hooks': {
              caveats: null,
              date: 1750244440562,
              id: '0eKn8SjGEH6o_6Mhcq3Lw',
              invoker: LIFECYCLE_HOOKS_EXAMPLE_SNAP_ID,
              parentCapability: 'endowment:lifecycle-hooks',
            },
            snap_dialog: {
              caveats: null,
              date: 1750244440562,
              id: 'Fbme_UWcuSK92JqfrT4G2',
              invoker: LIFECYCLE_HOOKS_EXAMPLE_SNAP_ID,
              parentCapability: 'snap_dialog',
            },
          },
        },
      },
    })
      .withSnapController({
        snaps: {
          [LIFECYCLE_HOOKS_EXAMPLE_SNAP_ID]: {
            auxiliaryFiles: [],
            blocked: false,
            enabled: true,
            id: LIFECYCLE_HOOKS_EXAMPLE_SNAP_ID,
            initialPermissions: {
              'endowment:lifecycle-hooks': {},
              snap_dialog: {},
            },
            localizationFiles: [],
            manifest: {
              description:
                'MetaMask example snap demonstrating the use of the `onStart`, `onInstall`, and `onUpdate` lifecycle hooks.',
              initialPermissions: {
                'endowment:lifecycle-hooks': {},
                snap_dialog: {},
              },
              manifestVersion: '0.1',
              platformVersion: '8.1.0',
              proposedName: 'Lifecycle Hooks Example Snap',
              repository: {
                type: 'git',
                url: 'https://github.com/MetaMask/snaps.git',
              },
              source: {
                location: {
                  npm: {
                    filePath: 'dist/bundle.js',
                    packageName: '@metamask/lifecycle-hooks-example-snap',
                    registry: 'https://registry.npmjs.org',
                  },
                },
                shasum: '5tlM5E71Fbeid7I3F0oQURWL7/+0620wplybtklBCHQ=',
              },
              version: '2.2.0',
            },
            sourceCode: LIFECYCLE_HOOKS_EXAMPLE_SNAP_SOURCE_CODE,
            status: 'stopped',
            version: '2.2.0',
            versionHistory: [
              {
                date: 1750244439310,
                origin: 'https://metamask.github.io',
                version: '2.2.0',
              },
            ],
          },
        },
      } as Partial<PersistedSnapControllerState>)
      .withSnapControllerStorageServiceSourceCode(
        LIFECYCLE_HOOKS_EXAMPLE_SNAP_ID,
        LIFECYCLE_HOOKS_EXAMPLE_SNAP_SOURCE_CODE,
      );
    /* eslint-enable @typescript-eslint/naming-convention */
    return result;
  }

  withSmartTransactionsOptedOut(): this {
    return this.withPreferencesController({
      preferences: {
        smartTransactionsOptInStatus: false,
      },
    });
  }

  withTokensControllerERC20({ chainId = 1337 } = {}): this {
    return this.withTokensController({
      allTokens: {
        [toHex(chainId)]: {
          '0x5cfe73b6021e818b776b421b1c4db2474086a7e1': [
            {
              address: `__FIXTURE_SUBSTITUTION__CONTRACT${SMART_CONTRACTS.HST}`,
              symbol: 'TST',
              image: `https://static.cx.metamask.io/api/v1/tokenIcons/${chainId}/0x581c3c1a2a4ebde2a0df29b5cf4c116e42945947.png`,
              isERC721: false,
              decimals: 4,
              aggregators: ['Metamask', 'Aave'],
              name: 'test',
            },
          ],
        },
      },
      allIgnoredTokens: {},
    });
  }

  withTrezorAccount(): this {
    return this.withAccountsController({
      internalAccounts: {
        accounts: {
          'd5e45e4a-3b04-4a09-a5e1-39762e5c6be4': {
            id: 'd5e45e4a-3b04-4a09-a5e1-39762e5c6be4',
            address: DEFAULT_FIXTURE_ACCOUNT_LOWERCASE,
            options: {
              entropySource: '01KGHAX3WXGMX9H76THHSSV553',
              derivationPath: "m/44'/60'/0'/0/0",
              groupIndex: 0,
              entropy: {
                type: 'mnemonic',
                id: '01KGHAX3WXGMX9H76THHSSV553',
                derivationPath: "m/44'/60'/0'/0/0",
                groupIndex: 0,
              },
            },
            methods: [...FIXTURE_HARDWARE_EOA_ACCOUNT_METHODS],
            type: 'eip155:eoa',
            scopes: ['eip155:0'],
            metadata: {
              name: 'Account 1',
              importTime: 1724486724986,
              lastSelected: 1665507600000,
              keyring: {
                type: 'HD Key Tree',
              },
            },
          },
          [HARDWARE_WALLET_ACCOUNT_ID]: {
            id: HARDWARE_WALLET_ACCOUNT_ID,
            address: TREZOR_ADDRESS,
            options: {},
            methods: [...FIXTURE_HARDWARE_EOA_ACCOUNT_METHODS],
            type: 'eip155:eoa',
            scopes: ['eip155:0'],
            metadata: {
              name: 'Trezor 1',
              importTime: 1724486729079,
              keyring: {
                type: 'Trezor Hardware',
              },
              lastSelected: 1724486729083,
            },
          },
        },
        selectedAccount: HARDWARE_WALLET_ACCOUNT_ID,
      },
    }).withKeyringController({ vault: TREZOR_VAULT });
  }

  withTransactionControllerApprovedTransaction(): this {
    const txId = '13a01e77-a368-4bb9-aba9-e7435580e3b9';
    const approvedTx: TransactionMeta = {
      chainId: CHAIN_IDS.LOCALHOST,
      networkClientId: LOCALHOST_NETWORK_CLIENT_ID,
      id: txId,
      origin: 'metamask',
      status: TransactionStatus.approved,
      time: 1617228030067,
      txParams: {
        from: '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
        gas: '0x61a8',
        maxFeePerGas: '0x59682f0c',
        maxPriorityFeePerGas: '0x59682f00',
        to: '0x2f318C334780961FB129D2a6c30D0763d9a5C970',
        type: '0x2',
        value: '0xde0b6b3a7640000',
      },
      type: TransactionType.simpleSend,
    };
    return this.withTransactionController({ transactions: [approvedTx] });
  }

  withTransactionControllerCompletedTransaction(): this {
    const txId = '0c9342ce-ef3f-4cab-9425-8e57144256a6';
    const completedTx: TransactionMeta = {
      chainId: CHAIN_IDS.LOCALHOST,
      networkClientId: LOCALHOST_NETWORK_CLIENT_ID,
      id: txId,
      origin: 'metamask',
      status: TransactionStatus.confirmed,
      submittedTime: 1671635510753,
      time: 1671635506502,
      txParams: {
        from: '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
        gas: '0x5208',
        maxFeePerGas: '0x4d7fc07fb',
        maxPriorityFeePerGas: '0x59682f00',
        to: '0x2f318C334780961FB129D2a6c30D0763d9a5C970',
        type: '0x2',
        value: '0xde0b6b3a7640000',
      },
      hash: '0xe5e7b95690f584b8f66b33e31acc6184fea553fa6722d42486a59990d13d5fa2',
      blockNumber: '0x7cbf95',
      blockTimestamp: '63a32240',
      txReceipt: {
        blockNumber: '0x7cbf95',
        gasUsed: '0x1458', // 5208 decimal, valid hex for code paths that parse as hex
        effectiveGasPrice: '0x4d7fc07fb',
        status: '0x1',
      },
      type: TransactionType.simpleSend,
    };
    return this.withTransactionController({ transactions: [completedTx] });
  }

  withTransactionControllerIncomingTransaction(): this {
    const incomingTx: TransactionMeta = {
      blockNumber: '1',
      chainId: CHAIN_IDS.LOCALHOST,
      networkClientId: LOCALHOST_NETWORK_CLIENT_ID,
      hash: '0xf1af8286e4fa47578c2aec5f08c108290643df978ebc766d72d88476eee90bab',
      id: '8a13fd36-fdad-48ae-8b6a-c8991026d550',
      status: TransactionStatus.confirmed,
      time: 1671635520000,
      txParams: {
        from: '0xc87261ba337be737fa744f50e7aaf4a920bdfcd6',
        gas: '0x5208',
        gasPrice: '0x329af9707',
        to: '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
        value: '0xDE0B6B3A7640000',
      },
      type: TransactionType.incoming,
    };
    return this.withTransactionController({ transactions: [incomingTx] });
  }

  withUseBasicFunctionalityDisabled(): this {
    return this.withPreferencesController({
      useExternalServices: false,
    });
  }

  /* ==================================================================
                        STORAGE SERVICE DATA
     ==================================================================
  */

  withStorageServiceData<Namespace extends StorageServiceNamespace>({
    namespace,
    key,
    value,
  }: {
    namespace: Namespace;
    key: StorageServiceNamespaceMap[Namespace]['key'];
    value: StorageServiceNamespaceMap[Namespace]['value'];
  }): this {
    this.storageServiceData[`storageService:${namespace}:${key}`] = value;
    return this;
  }

  withSnapControllerStorageServiceSourceCode(
    snapId: string,
    sourceCode: string,
  ): this {
    return this.withStorageServiceData({
      namespace: STORAGE_SERVICE_NAMESPACE.SNAP_CONTROLLER,
      key: snapId,
      value: { sourceCode },
    });
  }

  withTokenListControllerStorageServiceData(
    entries: { chainId: Hex; data: TokenListMap }[],
  ): this {
    for (const { chainId, data } of entries) {
      this.withStorageServiceData({
        namespace: STORAGE_SERVICE_NAMESPACE.TOKEN_LIST_CONTROLLER,
        key: `tokensChainsCache:${chainId}`,
        value: { timestamp: Date.now(), data },
      });
    }
    return this;
  }

  build(): FixtureBuildResult {
    return {
      ...this.fixture,
      storageServiceData: this.storageServiceData,
    };
  }
}

export default FixtureBuilderV2;
