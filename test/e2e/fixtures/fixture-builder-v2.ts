import { merge, cloneDeep } from 'lodash';
import type { AccountsControllerState } from '@metamask/accounts-controller';
import type { AddressBookControllerState } from '@metamask/address-book-controller';
import type { CurrencyRateState } from '@metamask/assets-controllers';
import type { KeyringControllerState } from '@metamask/keyring-controller';
import type { NetworkEnablementControllerState } from '@metamask/network-enablement-controller';
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
  LEDGER_FIXTURE_VAULT,
  LOCALHOST_NETWORK_CLIENT_ID,
  NETWORK_CLIENT_ID,
  SOLANA_MAINNET_SCOPE,
  TREZOR_ACCOUNT_ID,
  TREZOR_ADDRESS,
  TREZOR_VAULT,
  DEFAULT_FIXTURE_SOLANA_ACCOUNT,
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
  withAddressBookController(data: Partial<AddressBookControllerState>): this {
    if (!this.fixture.data.AddressBookController) {
      (this.fixture.data as Record<string, unknown>).AddressBookController = {
        addressBook: {},
      };
    }
    merge(this.fixture.data.AddressBookController, data);
    return this;
  }

  withAccountsController(data: Partial<AccountsControllerState>): this {
    merge(this.fixture.data.AccountsController, data);
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

  withNetworkController(data: Partial<NetworkState>): this {
    merge(this.fixture.data.NetworkController, data);
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
    })
      .withAccountsController({
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
            '221ecb67-0d29-4c04-83b2-dff07c263634': {
              id: '221ecb67-0d29-4c04-83b2-dff07c263634',
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
          selectedAccount: '221ecb67-0d29-4c04-83b2-dff07c263634',
        },
      })
      .withPreferencesController({
        identities: {
          [DEFAULT_FIXTURE_ACCOUNT_LOWERCASE]: {
            address: DEFAULT_FIXTURE_ACCOUNT_LOWERCASE,
            lastSelected: 1665507600000,
            name: 'Account 1',
          },
          [ledgerAddressLower]: {
            address: ledgerAddressLower,
            lastSelected: 1665507800000,
            name: 'Ledger 1',
          },
        } as unknown as PreferencesControllerState['identities'],
        selectedAddress: ledgerAddressLower,
      });
    return this;
  }

  withNetworkControllerDoubleNode(): this {
    const secondNodeChainId = '0x53a';
    const secondNodeClientId = '76e9cd59-d8e2-47e7-b369-9c205ccb602c';

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
    const thirdNodeClientId = 'a3460c52-12ee-4267-9be6-1503095a587e';

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

  withPermissionControllerConnectedToTestDapp({
    account = '',
    useLocalhostHostname = false,
    numberOfDapps = 1,
    chainIds = [1337],
  }: {
    account?: string;
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

    const selectedAccount = account
      ? account.toLowerCase()
      : DEFAULT_FIXTURE_ACCOUNT_LOWERCASE;

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
        accounts: [`${scopeKey}:${selectedAccount}`],
      };
    }
    // Add Solana Mainnet scope
    optionalScopes[SOLANA_MAINNET_SCOPE] = {
      accounts: [`${SOLANA_MAINNET_SCOPE}:${DEFAULT_FIXTURE_SOLANA_ACCOUNT}`],
    };
    optionalScopes['wallet:eip155'] = {
      accounts: [`wallet:eip155:${selectedAccount}`],
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
          [TREZOR_ACCOUNT_ID]: {
            id: TREZOR_ACCOUNT_ID,
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
        selectedAccount: TREZOR_ACCOUNT_ID,
      },
    })
      .withKeyringController({ vault: TREZOR_VAULT })
      .withPreferencesController({
        identities: {
          [DEFAULT_FIXTURE_ACCOUNT_LOWERCASE]: {
            address: DEFAULT_FIXTURE_ACCOUNT_LOWERCASE,
            lastSelected: 1665507600000,
            name: 'Account 1',
          },
          [TREZOR_ADDRESS]: {
            address: TREZOR_ADDRESS,
            lastSelected: 1665507800000,
            name: 'Trezor 1',
          },
        } as unknown as PreferencesControllerState['identities'],
        selectedAddress: TREZOR_ADDRESS,
      });
  }

  withShowNativeTokenAsMainBalanceEnabled(): this {
    return this.withPreferencesController({
      preferences: {
        showNativeTokenAsMainBalance: true,
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
