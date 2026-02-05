import { merge, cloneDeep } from 'lodash';
import type {
  PermissionConstraint,
  PermissionControllerState,
} from '@metamask/permission-controller';
import {
  DAPP_URL,
  DAPP_URL_LOCALHOST,
  DEFAULT_FIXTURE_ACCOUNT,
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
    const selectedAccount = account || DEFAULT_FIXTURE_ACCOUNT;
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
                  value: {
                    isMultichainOrigin: true,
                    optionalScopes: {
                      'eip155:1': {
                        accounts: [`eip155:1:${selectedAccount}`],
                      },
                      'eip155:10': {
                        accounts: [`eip155:10:${selectedAccount}`],
                      },
                      'eip155:1337': {
                        accounts: [`eip155:1337:${selectedAccount}`],
                      },
                      'eip155:137': {
                        accounts: [`eip155:137:${selectedAccount}`],
                      },
                      'eip155:42161': {
                        accounts: [`eip155:42161:${selectedAccount}`],
                      },
                      'eip155:56': {
                        accounts: [`eip155:56:${selectedAccount}`],
                      },
                      'eip155:59144': {
                        accounts: [`eip155:59144:${selectedAccount}`],
                      },
                      'eip155:8453': {
                        accounts: [`eip155:8453:${selectedAccount}`],
                      },
                      'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp': {
                        accounts: [
                          `solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp:${selectedAccount}`,
                        ],
                      },
                      'wallet:eip155': {
                        accounts: [],
                      },
                    },
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
