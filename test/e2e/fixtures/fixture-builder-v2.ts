import { toHex } from '@metamask/controller-utils';
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
import { SMART_CONTRACTS } from '../seeder/smart-contracts';
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

  /* ==================================================================
                              CUSTOM METHODS
     ==================================================================
  */
  withConversionRateDisabled(): this {
    return this.withPreferencesController({
      useCurrencyRateCheck: false,
    });
  }

  withConversionRateEnabled(): this {
    return this.withPreferencesController({
      useCurrencyRateCheck: true,
    });
  }

  withShowFiatTestnetEnabled(): this {
    return this.withPreferencesController({
      preferences: {
        showFiatInTestnets: true,
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

  withEnabledNetworks(
    data: NetworkEnablementControllerState['enabledNetworkMap'],
  ): this {
    this.fixture.data.NetworkEnablementController.enabledNetworkMap =
      data as FixtureType['data']['NetworkEnablementController']['enabledNetworkMap'];
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

  withAppStateController(
    data: Partial<FixtureType['data']['AppStateController']>,
  ): this {
    merge(this.fixture.data.AppStateController, data);
    return this;
  }

  withNetworkController(
    data: Partial<FixtureType['data']['NetworkController']>,
  ): this {
    merge(this.fixture.data.NetworkController, data);
    return this;
  }

  withNetworkControllerOnMainnet(): this {
    return this.withNetworkController({
      selectedNetworkClientId: 'mainnet',
    } as Partial<FixtureType['data']['NetworkController']>);
  }

  withTokenBalancesController(
    data: Partial<FixtureType['data']['TokenBalancesController']>,
  ): this {
    merge(this.fixture.data.TokenBalancesController, data);
    return this;
  }

  withNftController(data: Partial<FixtureType['data']['NftController']>): this {
    merge(this.fixture.data.NftController, data);
    return this;
  }

  withNftControllerERC1155(): this {
    const contractAddress = `__FIXTURE_SUBSTITUTION__CONTRACT${SMART_CONTRACTS.ERC1155}`;
    return this.withNftController({
      allNftContracts: {
        [DEFAULT_FIXTURE_ACCOUNT_LOWERCASE]: {
          [toHex(1337)]: [
            {
              address: contractAddress,
            },
          ],
        },
      },
      allNfts: {
        [DEFAULT_FIXTURE_ACCOUNT_LOWERCASE]: {
          [toHex(1337)]: [
            {
              address: contractAddress,
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
    } as Partial<FixtureType['data']['NftController']>);
  }

  build() {
    return this.fixture;
  }
}

export default FixtureBuilderV2;
