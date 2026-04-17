import { cloneDeep } from 'lodash';
import defaultFixtureJson from '../../fixtures/default-fixture.json';
import { FIXTURE_STATE_METADATA_VERSION } from '../../constants';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import type { FixtureData } from './launcher-types';

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

export function buildDefaultFixture(): FixtureData {
  return cloneDeep(defaultFixtureJson) as FixtureData;
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
