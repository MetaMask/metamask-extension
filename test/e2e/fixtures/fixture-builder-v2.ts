import { merge, cloneDeep } from 'lodash';
import type { AccountsControllerState } from '@metamask/accounts-controller';
import type { AddressBookControllerState } from '@metamask/address-book-controller';
import type { CurrencyRateState } from '@metamask/assets-controllers';
import type { KeyringControllerState } from '@metamask/keyring-controller';
import { type NameControllerState, NameType } from '@metamask/name-controller';
import type { NetworkEnablementControllerState } from '@metamask/network-enablement-controller';
import type { SelectedNetworkControllerState } from '@metamask/selected-network-controller';
import type {
  PermissionConstraint,
  PermissionControllerState,
} from '@metamask/permission-controller';
import {
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
  DAPP_ONE_URL,
  DAPP_TWO_URL,
  DAPP_URL,
  DAPP_URL_LOCALHOST,
  DEFAULT_FIXTURE_ACCOUNT_LOWERCASE,
  HARDWARE_WALLET_ACCOUNT_ID,
  LEDGER_FIXTURE_VAULT,
  LOCALHOST_NETWORK_CLIENT_ID,
  MULTI_SRP_FIXTURE_VAULT,
  NETWORK_CLIENT_ID,
  SECOND_NODE_NETWORK_CLIENT_ID,
  THIRD_NODE_NETWORK_CLIENT_ID,
  TREZOR_ADDRESS,
  TREZOR_VAULT,
} from '../constants';
import { KNOWN_PUBLIC_KEY_ADDRESSES } from '../../stub/keyring-bridge';
import defaultFixtureJson from './default-fixture.json';
import onboardingFixtureJson from './onboarding-fixture.json';

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

class FixtureBuilderV2 {
  fixture: FixtureType;

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

  /**
   * Marks the Snaps install privacy warning as already shown so the UI does
   * not display it. Use for flows that only test update/reconnect and do not
   * need the first-time install privacy step.
   */
  withSnapsPrivacyWarningAlreadyShown(): this {
    return this.withAppStateController({
      snapsInstallPrivacyWarningShown: true,
    });
  }

  withMetaVersion(version: number): this {
    this.fixture.meta.version = version;
    return this;
  }

  withCurrencyController(data: Partial<CurrencyRateState>): this {
    merge(this.fixture.data.CurrencyController, data);
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

  withNameController(data: Partial<NameControllerState>): this {
    merge(this.fixture.data.NameController, data);
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
  withConversionRateDisabled(): this {
    return this.withPreferencesController({
      useCurrencyRateCheck: false,
    });
  }

  withEnabledNetworks(
    data: NetworkEnablementControllerState['enabledNetworkMap'],
  ): this {
    this.fixture.data.NetworkEnablementController.enabledNetworkMap =
      data as FixtureType['data']['NetworkEnablementController']['enabledNetworkMap'];
    return this;
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
            methods: [
              'personal_sign',
              'eth_sign',
              'eth_signTransaction',
              'eth_signTypedData_v1',
              'eth_signTypedData_v3',
              'eth_signTypedData_v4',
            ],
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
            methods: [
              'personal_sign',
              'eth_sign',
              'eth_signTransaction',
              'eth_signTypedData_v1',
              'eth_signTypedData_v3',
              'eth_signTypedData_v4',
            ],
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
  }: {
    account?: string | string[];
    useLocalhostHostname?: boolean;
    numberOfDapps?: number;
    chainIds?: number[];
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

    // Build optionalScopes from the provided chainIds (default: localhost 1337)
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
                value: {
                  isMultichainOrigin: true,
                  optionalScopes,
                  requiredScopes: {},
                  sessionProperties: {},
                },
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
            methods: [
              'personal_sign',
              'eth_sign',
              'eth_signTransaction',
              'eth_signTypedData_v1',
              'eth_signTypedData_v3',
              'eth_signTypedData_v4',
            ],
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
            methods: [
              'personal_sign',
              'eth_sign',
              'eth_signTransaction',
              'eth_signTypedData_v1',
              'eth_signTypedData_v3',
              'eth_signTypedData_v4',
            ],
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

  withShowNativeTokenAsMainBalanceEnabled(): this {
    return this.withPreferencesController({
      preferences: {
        showNativeTokenAsMainBalance: true,
      },
    });
  }

  withKeyringController(
    data: Partial<FixtureType['data']['KeyringController']>,
  ): this {
    merge(this.fixture.data.KeyringController, data);
    return this;
  }

  withKeyringControllerMultiSRP(): this {
    return this.withKeyringController({
      vault: MULTI_SRP_FIXTURE_VAULT,
    });
  }

  withMetaMetricsController(data: Partial<MetaMetricsControllerState>): this {
    merge(this.fixture.data.MetaMetricsController, data);
    return this;
  }

  withSnapController(
    data: Partial<FixtureType['data']['SnapController']>,
  ): this {
    (this.fixture.data as Record<string, unknown>).SnapController ??= {};
    merge(this.fixture.data.SnapController, data);
    return this;
  }

  withSnapControllerOnStartLifecycleSnap(): this {
    return this.withPermissionController({
      subjects: {
        'npm:@metamask/lifecycle-hooks-example-snap': {
          origin: 'npm:@metamask/lifecycle-hooks-example-snap',
          permissions: {
            'endowment:lifecycle-hooks': {
              caveats: null,
              date: 1750244440562,
              id: '0eKn8SjGEH6o_6Mhcq3Lw',
              invoker: 'npm:@metamask/lifecycle-hooks-example-snap',
              parentCapability: 'endowment:lifecycle-hooks',
            },
            // eslint-disable-next-line @typescript-eslint/naming-convention -- snap_dialog is Snaps API permission name
            snap_dialog: {
              caveats: null,
              date: 1750244440562,
              id: 'Fbme_UWcuSK92JqfrT4G2',
              invoker: 'npm:@metamask/lifecycle-hooks-example-snap',
              parentCapability: 'snap_dialog',
            },
          },
        },
      },
    }).withSnapController({
      isReady: true,
      snapStates: {},
      unencryptedSnapStates: {},
      snaps: {
        'npm:@metamask/lifecycle-hooks-example-snap': {
          auxiliaryFiles: [],
          blocked: false,
          enabled: true,
          id: 'npm:@metamask/lifecycle-hooks-example-snap',
          initialPermissions: {
            'endowment:lifecycle-hooks': {},
            // eslint-disable-next-line @typescript-eslint/naming-convention -- snap_dialog is Snaps API permission name
            snap_dialog: {},
          },
          localizationFiles: [],
          manifest: {
            description:
              'MetaMask example snap demonstrating the use of the `onStart`, `onInstall`, and `onUpdate` lifecycle hooks.',
            initialPermissions: {
              'endowment:lifecycle-hooks': {},
              // eslint-disable-next-line @typescript-eslint/naming-convention -- snap_dialog is Snaps API permission name
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
          /* Minified snap source - contains literal "${String(e)}" from bundled code */
          /* eslint-disable no-template-curly-in-string */
          sourceCode:
            '(()=>{var e={d:(n,t)=>{for(var a in t)e.o(t,a)&&!e.o(n,a)&&Object.defineProperty(n,a,{enumerable:!0,get:t[a]})},o:(e,n)=>Object.prototype.hasOwnProperty.call(e,n),r:e=>{"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})}},n={};(()=>{"use strict";function t(e,n,t){if("string"==typeof e)throw new Error(`An HTML element ("${String(e)}") was used in a Snap component, which is not supported by Snaps UI. Please use one of the supported Snap components.`);if(!e)throw new Error("A JSX fragment was used in a Snap component, which is not supported by Snaps UI. Please use one of the supported Snap components.");return e({...n,key:t})}function a(e){return Object.fromEntries(Object.entries(e).filter((([,e])=>void 0!==e)))}function r(e){return n=>{const{key:t=null,...r}=n;return{type:e,props:a(r),key:t}}}e.r(n),e.d(n,{onInstall:()=>p,onStart:()=>l,onUpdate:()=>d});const o=r("Box"),s=r("Text"),l=async()=>await snap.request({method:"snap_dialog",params:{type:"alert",content:t(o,{children:t(s,{children:\'The client was started successfully, and the "onStart" handler was called.\'})})}}),p=async()=>await snap.request({method:"snap_dialog",params:{type:"alert",content:t(o,{children:t(s,{children:\'The Snap was installed successfully, and the "onInstall" handler was called.\'})})}}),d=async()=>await snap.request({method:"snap_dialog",params:{type:"alert",content:t(o,{children:t(s,{children:\'The Snap was updated successfully, and the "onUpdate" handler was called.\'})})}})})(),module.exports=n})();',
          /* eslint-enable no-template-curly-in-string */
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
    });
  }

  withSmartTransactionsOptedOut(): this {
    return this.withPreferencesController({
      preferences: {
        smartTransactionsOptInStatus: false,
      },
    });
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

  withTransactionControllerCompletedAndIncomingTransaction(): this {
    return this.withTransactionControllerCompletedTransaction().withTransactionControllerIncomingTransaction();
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

  build() {
    return this.fixture;
  }
}

export default FixtureBuilderV2;
