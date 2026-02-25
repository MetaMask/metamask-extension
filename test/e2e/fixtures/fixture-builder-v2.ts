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
import type {
  Preferences,
  PreferencesControllerState,
} from '../../../app/scripts/controllers/preferences-controller';
import {
  DAPP_URL,
  DAPP_URL_LOCALHOST,
  DEFAULT_FIXTURE_ACCOUNT,
  DEFAULT_FIXTURE_ACCOUNT_LOWERCASE,
  DEFAULT_FIXTURE_SOLANA_ACCOUNT,
  LEDGER_FIXTURE_VAULT,
  SOLANA_MAINNET_SCOPE,
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

  withCurrencyController(data: Partial<CurrencyRateState>): this {
    merge(this.fixture.data.CurrencyController, data);
    return this;
  }

  withKeyringController(data: Partial<KeyringControllerState>): this {
    merge(this.fixture.data.KeyringController, data);
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
    const ledgerAddress = KNOWN_PUBLIC_KEY_ADDRESSES[0].address;
    const ledgerAddressLower = ledgerAddress.toLowerCase();

    return this.withKeyringController({
      vault: LEDGER_FIXTURE_VAULT,
    })
      .withAccountsController({
        internalAccounts: {
          accounts: {
            'd5e45e4a-3b04-4a09-a5e1-39762e5c6be4': {
              id: 'd5e45e4a-3b04-4a09-a5e1-39762e5c6be4',
              address: DEFAULT_FIXTURE_ACCOUNT,
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
              address: ledgerAddress,
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
  }

  withMetaMetricsDisabled(): this {
    if (this.fixture.data.MetaMetricsController) {
      merge(this.fixture.data.MetaMetricsController, {
        participateInMetaMetrics: false,
        dataCollectionForMarketing: false,
      });
    }
    return this;
  }

  withPermissionControllerConnectedToTestDapp({
    account = '',
    useLocalhostHostname = false,
  }: {
    account?: string;
    useLocalhostHostname?: boolean;
  } = {}): this {
    const selectedAccount = account
      ? account.toLowerCase()
      : DEFAULT_FIXTURE_ACCOUNT_LOWERCASE;
    const dappUrl = useLocalhostHostname ? DAPP_URL_LOCALHOST : DAPP_URL;

    // Derive optionalScopes from the EVM networks in state
    const optionalScopes: Record<string, { accounts: string[] }> = {};

    const networkConfigs =
      this.fixture.data.NetworkController?.networkConfigurationsByChainId || {};
    Object.entries(networkConfigs).forEach(([chainIdHex]) => {
      // Convert hex chainId (0x1) to decimal for CAIP-2 format (eip155:1)
      const chainId = parseInt(chainIdHex, 16);
      const scopeKey = `eip155:${chainId}`;
      optionalScopes[scopeKey] = {
        accounts: [`${scopeKey}:${selectedAccount}`],
      };
    });

    // Add Solana Mainnet scope
    optionalScopes[SOLANA_MAINNET_SCOPE] = {
      accounts: [`${SOLANA_MAINNET_SCOPE}:${DEFAULT_FIXTURE_SOLANA_ACCOUNT}`],
    };

    // Add wallet:eip155 scope
    optionalScopes['wallet:eip155'] = {
      accounts: [],
    };

    return this.withPermissionController({
      subjects: {
        [dappUrl]: {
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
              id: 'SFqk8nFLekiqC5O1cYCjT',
              invoker: dappUrl,
              parentCapability: 'endowment:caip25',
            },
          },
        },
      },
    });
  }

  withPreferencesControllerShowNativeTokenAsMainBalanceDisabled(): this {
    return this.withPreferencesController({
      preferences: {
        showNativeTokenAsMainBalance: false,
      },
    });
  }

  build() {
    return this.fixture;
  }
}

export default FixtureBuilderV2;
