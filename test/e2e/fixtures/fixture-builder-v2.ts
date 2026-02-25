import { merge, cloneDeep } from 'lodash';
import type { AddressBookControllerState } from '@metamask/address-book-controller';
import type { CurrencyRateState } from '@metamask/assets-controllers';
import type {
  PermissionConstraint,
  PermissionControllerState,
} from '@metamask/permission-controller';
import type { NetworkEnablementControllerState } from '@metamask/network-enablement-controller';
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
  SOLANA_MAINNET_SCOPE,
  TREZOR_ACCOUNT_ID,
  TREZOR_ADDRESS,
  TREZOR_ADDRESS_CHECKSUM,
  TREZOR_VAULT,
} from '../constants';
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

  withCurrencyController(data: Partial<CurrencyRateState>): this {
    merge(this.fixture.data.CurrencyController, data);
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

  withAccountTracker(data: Record<string, unknown>): this {
    merge(this.fixture.data.AccountTracker, data);
    return this;
  }

  withAccountsController(data: Record<string, unknown>): this {
    merge(this.fixture.data.AccountsController, data);
    return this;
  }

  withKeyringController(data: Record<string, unknown>): this {
    merge(this.fixture.data.KeyringController, data);
    return this;
  }

  withNameController(data: Record<string, unknown>): this {
    merge(this.fixture.data.NameController, data);
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

  withTrezorAccount(): this {
    return this.withAccountTracker({
      accountsByChainId: {
        '0x539': {
          [DEFAULT_FIXTURE_ACCOUNT]: {
            balance: '0x15af1d78b58c40000',
          },
          [TREZOR_ADDRESS_CHECKSUM]: {
            balance: '0x100000000000000000000',
          },
        },
      },
    })
      .withAccountsController({
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
      .withNameController({
        names: {
          ethereumAddress: {
            [DEFAULT_FIXTURE_ACCOUNT_LOWERCASE]: {
              '*': {
                name: 'Account 1',
                sourceId: null,
                proposedNames: {},
                origin: 'account-identity',
              },
            },
            [TREZOR_ADDRESS]: {
              '*': {
                proposedNames: {},
                name: 'Trezor 1',
                sourceId: null,
                origin: 'account-identity',
              },
            },
          },
        },
      })
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
        },
        lostIdentities: {
          [DEFAULT_FIXTURE_ACCOUNT_LOWERCASE]: {
            address: DEFAULT_FIXTURE_ACCOUNT_LOWERCASE,
            name: 'Account 1',
            lastSelected: 1665507600000,
          },
          [TREZOR_ADDRESS]: {
            address: TREZOR_ADDRESS,
            name: 'Trezor 1',
            lastSelected: 1665507800000,
          },
        },
        selectedAddress: TREZOR_ADDRESS,
      } as unknown as Parameters<
        FixtureBuilderV2['withPreferencesController']
      >[0])
      .withMetaMetricsDisabled();
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

  build() {
    return this.fixture;
  }
}

export default FixtureBuilderV2;
