import type { FixtureData } from './types';

// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires
const FixtureBuilderClass = require('../../fixtures/fixture-builder');
/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires */
const {
  defaultFixture,
  FIXTURE_STATE_METADATA_VERSION,
} = require('../../fixtures/default-fixture');
/* eslint-enable @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires */

export type FixtureBuilderOptions = {
  onboarding?: boolean;
  inputChainId?: string;
};

export type FixtureBuilder = {
  withAccountTracker(data: Record<string, unknown>): FixtureBuilder;
  withAddressBookController(data: Record<string, unknown>): FixtureBuilder;
  withPreferencesController(data: Record<string, unknown>): FixtureBuilder;
  withNetworkController(data: Record<string, unknown>): FixtureBuilder;
  withNetworkControllerOnMainnet(): FixtureBuilder;
  withTokensController(data: Record<string, unknown>): FixtureBuilder;
  withTokensControllerERC20(options?: { chainId?: number }): FixtureBuilder;
  withTransactionController(data: Record<string, unknown>): FixtureBuilder;
  withPermissionController(data: Record<string, unknown>): FixtureBuilder;
  withPermissionControllerConnectedToTestDapp(options?: {
    restrictReturnedAccounts?: boolean;
    account?: string;
  }): FixtureBuilder;
  withKeyringController(data: Record<string, unknown>): FixtureBuilder;
  withKeyringControllerAdditionalAccountVault(): FixtureBuilder;
  withAccountsController(data: Record<string, unknown>): FixtureBuilder;
  withAccountsControllerAdditionalAccountIdentities(): FixtureBuilder;
  withConversionRateDisabled(): FixtureBuilder;
  withShowFiatTestnetEnabled(): FixtureBuilder;
  withPopularNetworks(): FixtureBuilder;
  withNftController(data: Record<string, unknown>): FixtureBuilder;
  withNftControllerERC721(): FixtureBuilder;
  withNftControllerERC1155(): FixtureBuilder;
  build(): FixtureData;
};

export function createFixtureBuilder(
  options: FixtureBuilderOptions = {},
): FixtureBuilder {
  return new FixtureBuilderClass(options) as FixtureBuilder;
}

export function buildDefaultFixture(chainId?: string): FixtureData {
  const fixture = defaultFixture(chainId);
  fixture.meta = { version: FIXTURE_STATE_METADATA_VERSION };
  return fixture as FixtureData;
}

export function buildOnboardingFixture(): FixtureData {
  const builder = createFixtureBuilder({ onboarding: true });
  return builder.build();
}

export const FixturePresets = {
  default: (): FixtureData => buildDefaultFixture(),

  onboarding: (): FixtureData => buildOnboardingFixture(),

  withMultipleAccounts: (): FixtureData => {
    const builder = createFixtureBuilder();
    return builder
      .withKeyringControllerAdditionalAccountVault()
      .withAccountsControllerAdditionalAccountIdentities()
      .build();
  },

  withERC20Tokens: (chainId = 1337): FixtureData => {
    const builder = createFixtureBuilder();
    return builder.withTokensControllerERC20({ chainId }).build();
  },

  withConnectedDapp: (): FixtureData => {
    const builder = createFixtureBuilder();
    return builder.withPermissionControllerConnectedToTestDapp().build();
  },

  withPopularNetworks: (): FixtureData => {
    const builder = createFixtureBuilder();
    return builder.withPopularNetworks().build();
  },

  withMainnet: (): FixtureData => {
    const builder = createFixtureBuilder();
    return builder.withNetworkControllerOnMainnet().build();
  },

  withNFTs: (): FixtureData => {
    const builder = createFixtureBuilder();
    return builder.withNftControllerERC721().build();
  },

  withFiatDisabled: (): FixtureData => {
    const builder = createFixtureBuilder();
    return builder.withConversionRateDisabled().build();
  },

  withHSTToken: (): FixtureData => {
    const builder = createFixtureBuilder();
    return builder.withTokensControllerERC20({ chainId: 1337 }).build();
  },
};

export { FIXTURE_STATE_METADATA_VERSION };
