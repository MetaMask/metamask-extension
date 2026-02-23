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
  DEFAULT_FIXTURE_ACCOUNT_LOWERCASE,
  DEFAULT_FIXTURE_SOLANA_ACCOUNT,
  SOLANA_MAINNET_SCOPE,
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

  withAccountsController(
    data: Partial<FixtureType['data']['AccountsController']>,
  ): this {
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

  withConversionRateDisabled(): this {
    return this.withPreferencesController({
      useCurrencyRateCheck: false,
    });
  }

  withCurrencyController(data: Partial<CurrencyRateState>): this {
    merge(this.fixture.data.CurrencyController, data);
    return this;
  }

  withEnabledNetworks(
    data: NetworkEnablementControllerState['enabledNetworkMap'],
  ): this {
    this.fixture.data.NetworkEnablementController.enabledNetworkMap =
      data as FixtureType['data']['NetworkEnablementController']['enabledNetworkMap'];
    return this;
  }

  withKeyringController(data: { vault?: string }): this {
    merge(this.fixture.data.KeyringController, data);
    return this;
  }

  withLedgerAccount(): this {
    return this.withKeyringController({
      vault:
        '{"data":"dwEWCLyS14yChQuzUYsiVhfaSZ7pzwjnhUhmTlz/5Nmxn3aTN/tIicWEMGjQ3+GgJw7E1fkn2OLfA4U9iw5eV5ZVozHLJC+4K3YihNJGcLaxQQj9hb8fnxWhRR2NWgKlThkGiGBF+66qE5rCgmGijYy3WA19OrpgTANYRE9IZifS46MokrWxHlZNY90PQWl+6ROc6XtfbdetpslQkOBCGDTp49FZz0E2M62crLMAU+cSLHuMIkwq7WfbJwy5ybMe085Bo3ghzrwwpysu39vUozGbaQN4EUhNgE7vzxPcasQWwqi/3aLKTm2JATs3sia0jIp5OSdaZkcTX4pcvqgXxGUrxsqK56FtFzAg4TE7qjl2smX3ScW1xJopYHvI8Uv6eEH6kLcnZbV7MJw+Dasu/ROrsynrbywevY3LQ62g07t2ZPz/82VfcEOGcdBmhsVoFGpNYoaESGQIKV2yXLU+0erOzAmYz4bSI+66i+a1woLaQveko/7nm38ILojedM9+Zqfcgh+PjCYyfjRxTc+5BhS+AjHHQgWAD/sqvaMTLQiH7dP4rYHYeZQi9WL9nfvv/orxVJFCEpMAb13BbJefvCKTKxiOg/F+4RPPB46gAAXMrMGtin/P8wxlFcOR0Drfg0COa5hMvSM2hOhV6LUfx3gL5ilAjuFAL3iANh5qJSECg8m46BU6maVQoGQCiaGSfSerEvnbXftXNCK1SfpkSpV7k/hFAVQyv5tN+4yi4CYqLq+43roSNxlaEVSz8MDJr+SNIJQFD8aqT4RiHMQqOPpYrmSvWeZDELs0TQU4XEVKIU/7naocQfdncUfsExXKdJGvIvnISZpNGcr9/DU2V6a3ZmF3pvQ2HPnZgYSsYBXK7mxJSpgTNCwvV1HBSl93SHs59Zn2aWW0qvaS0IpTHklMWC+8YF3FQAikgaEnVnTwGJL/4gg02MMHOKbazr7Cv/z9Vfj8sSU3enuiK4fCRqlFbwKHtQwqry6or6p+NiXFZ40EuMy0NYPkDy/h5Srk0Y1JMRJJp6bcTIu1f90+fVziqQ==","iv":"2gvqZ+DkKASrRK8iCXALPQ==","keyMetadata":{"algorithm":"PBKDF2","params":{"iterations":600000}},"salt":"PwqqENo0YiZXcRrMzg+ujLG2VtyTNkKBCvFMsnzFefk="}',
    })
      .withAccountsController({
        internalAccounts: {
          accounts: {
            'd5e45e4a-3b04-4a09-a5e1-39762e5c6be4': {
              id: 'd5e45e4a-3b04-4a09-a5e1-39762e5c6be4',
              address: '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
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
              address: '0xf68464152d7289d7ea9a2bec2e0035c45188223c',
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
          '0x5cfe73b6021e818b776b421b1c4db2474086a7e1': {
            address: '0x5cfe73b6021e818b776b421b1c4db2474086a7e1',
            lastSelected: 1665507600000,
            name: 'Account 1',
          },
          '0xf68464152d7289d7ea9a2bec2e0035c45188223c': {
            address: '0xf68464152d7289d7ea9a2bec2e0035c45188223c',
            lastSelected: 1725507800000,
            name: 'Ledger 1',
          },
        } as PreferencesControllerState['identities'],
        selectedAddress: '0xf68464152d7289d7ea9a2bec2e0035c45188223c',
      })
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

  withPermissionController(
    data: Partial<PermissionControllerState<PermissionConstraint>>,
  ): this {
    merge(this.fixture.data.PermissionController, data);
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

  withPreferencesController(
    data: Omit<Partial<PreferencesControllerState>, 'preferences'> & {
      preferences?: Partial<Preferences>;
    },
  ): this {
    merge(this.fixture.data.PreferencesController, data);
    return this;
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
