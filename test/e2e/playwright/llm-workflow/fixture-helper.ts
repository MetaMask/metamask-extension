import type { FixtureData } from './types';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const FixtureBuilderClass = require('../../fixtures/fixture-builder');
// eslint-disable-next-line @typescript-eslint/no-require-imports
const {
  defaultFixture,
  FIXTURE_STATE_METADATA_VERSION,
} = require('../../fixtures/default-fixture');

export type FixtureBuilderOptions = {
  onboarding?: boolean;
  inputChainId?: string;
};

export interface IFixtureBuilder {
  withAccountTracker(data: Record<string, unknown>): IFixtureBuilder;
  withAddressBookController(data: Record<string, unknown>): IFixtureBuilder;
  withPreferencesController(data: Record<string, unknown>): IFixtureBuilder;
  withNetworkController(data: Record<string, unknown>): IFixtureBuilder;
  withNetworkControllerOnMainnet(): IFixtureBuilder;
  withTokensController(data: Record<string, unknown>): IFixtureBuilder;
  withTokensControllerERC20(options?: { chainId?: number }): IFixtureBuilder;
  withTransactionController(data: Record<string, unknown>): IFixtureBuilder;
  withPermissionController(data: Record<string, unknown>): IFixtureBuilder;
  withPermissionControllerConnectedToTestDapp(options?: {
    restrictReturnedAccounts?: boolean;
    account?: string;
  }): IFixtureBuilder;
  withKeyringController(data: Record<string, unknown>): IFixtureBuilder;
  withKeyringControllerAdditionalAccountVault(): IFixtureBuilder;
  withAccountsController(data: Record<string, unknown>): IFixtureBuilder;
  withAccountsControllerAdditionalAccountIdentities(): IFixtureBuilder;
  withConversionRateDisabled(): IFixtureBuilder;
  withShowFiatTestnetEnabled(): IFixtureBuilder;
  withPopularNetworks(): IFixtureBuilder;
  withNftController(data: Record<string, unknown>): IFixtureBuilder;
  withNftControllerERC721(): IFixtureBuilder;
  withNftControllerERC1155(): IFixtureBuilder;
  build(): FixtureData;
}

export function createFixtureBuilder(
  options: FixtureBuilderOptions = {},
): IFixtureBuilder {
  return new FixtureBuilderClass(options) as IFixtureBuilder;
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
};

export { FIXTURE_STATE_METADATA_VERSION };
