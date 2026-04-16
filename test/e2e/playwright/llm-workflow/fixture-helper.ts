import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import type { FixtureData } from './launcher-types';

/* eslint-disable @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires, n/global-require */
const {
  defaultFixture,
  FIXTURE_STATE_METADATA_VERSION,
} = require('../../fixtures/default-fixture');
/* eslint-enable @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires, n/global-require */

export type FixtureBuilderOptions = {
  onboarding?: boolean;
};

export function createFixtureBuilder(
  options: FixtureBuilderOptions = {},
): FixtureBuilderV2 {
  return new FixtureBuilderV2({
    onboarding: options.onboarding === true,
  });
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
      .withAccountsControllerAdditionalAccountVault()
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

  withMainnet: (): FixtureData => {
    const builder = createFixtureBuilder();
    return builder
      .withEnabledNetworks({ eip155: { '0x1': true } })
      .withSelectedNetwork()
      .build();
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
