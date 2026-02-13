import { merge, cloneDeep } from 'lodash';
import type {
  PermissionConstraint,
  PermissionControllerState,
} from '@metamask/permission-controller';
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

  /* ==================================================================
                          GENERIC  CONTROLLER METHODS
     ==================================================================
  */
  withPermissionController(
    data: Partial<PermissionControllerState<PermissionConstraint>>,
  ): this {
    merge(this.fixture.data.PermissionController, data);
    return this;
  }

  /* ==================================================================
                              CUSTOM METHODS
     ==================================================================
  */
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
