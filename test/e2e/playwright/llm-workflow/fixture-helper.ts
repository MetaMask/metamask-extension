import { FIXTURE_STATE_METADATA_VERSION } from '../../constants';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import type { FixtureData } from './launcher-types';

export type FixtureBuilderOptions = {
  onboarding?: boolean;
  inputChainId?: string;
};

/**
 * Options accepted by fixture-building helpers that need to inject dynamic
 * runtime values (e.g. the port Anvil is listening on).
 */
export type FixtureBuildOptions = {
  /** When provided, the localhost network RPC URL is rewritten to use this port. */
  anvilPort?: number;
};

export function createFixtureBuilder(
  options: FixtureBuilderOptions = {},
): FixtureBuilderV2 {
  return new FixtureBuilderV2({
    onboarding: options.onboarding === true,
  });
}

/**
 * Applies the dynamic anvil port override to a {@link FixtureBuilderV2}.
 *
 * Patches the localhost network (`0x539`) RPC endpoint URL so the wallet
 * connects to the actual Anvil instance rather than the hardcoded port in the
 * static JSON fixture.
 * @param builder
 * @param anvilPort
 */
function applyAnvilPort(
  builder: FixtureBuilderV2,
  anvilPort: number,
): FixtureBuilderV2 {
  return builder.withNetworkController({
    networkConfigurationsByChainId: {
      '0x539': {
        name: `Localhost ${anvilPort}`,
        rpcEndpoints: [
          {
            url: `http://localhost:${anvilPort}`,
          },
        ],
      },
    },
  } as unknown as Parameters<FixtureBuilderV2['withNetworkController']>[0]);
}

export function buildDefaultFixture(
  options: FixtureBuildOptions = {},
): FixtureData {
  const builder = createFixtureBuilder();
  if (options.anvilPort) {
    applyAnvilPort(builder, options.anvilPort);
  }
  return builder.build();
}

export function buildOnboardingFixture(
  options: FixtureBuildOptions = {},
): FixtureData {
  const builder = createFixtureBuilder({ onboarding: true });
  if (options.anvilPort) {
    applyAnvilPort(builder, options.anvilPort);
  }
  return builder.build();
}

/**
 * Creates fixture presets. When `anvilPort` is provided the localhost network
 * RPC URL is rewritten in every preset that includes it.
 * @param options
 */
export function createFixturePresets(options: FixtureBuildOptions = {}) {
  return {
    default: (): FixtureData => buildDefaultFixture(options),

    onboarding: (): FixtureData => buildOnboardingFixture(options),

    withMultipleAccounts: (): FixtureData => {
      const builder = createFixtureBuilder();
      if (options.anvilPort) {
        applyAnvilPort(builder, options.anvilPort);
      }
      return builder
        .withKeyringControllerAdditionalAccountVault()
        .withAccountsControllerAdditionalAccountVault()
        .build();
    },

    withERC20Tokens: (chainId = 1337): FixtureData => {
      const builder = createFixtureBuilder();
      if (options.anvilPort) {
        applyAnvilPort(builder, options.anvilPort);
      }
      return builder.withTokensControllerERC20({ chainId }).build();
    },

    withConnectedDapp: (): FixtureData => {
      const builder = createFixtureBuilder();
      if (options.anvilPort) {
        applyAnvilPort(builder, options.anvilPort);
      }
      return builder.withPermissionControllerConnectedToTestDapp().build();
    },

    withMainnet: (): FixtureData => {
      const builder = createFixtureBuilder();
      // Mainnet preset doesn't use localhost — no anvil port override needed.
      return builder
        .withEnabledNetworks({ eip155: { '0x1': true } })
        .withSelectedNetwork()
        .build();
    },

    withNFTs: (): FixtureData => {
      const builder = createFixtureBuilder();
      if (options.anvilPort) {
        applyAnvilPort(builder, options.anvilPort);
      }
      return builder.withNftControllerERC721().build();
    },

    withFiatDisabled: (): FixtureData => {
      const builder = createFixtureBuilder();
      if (options.anvilPort) {
        applyAnvilPort(builder, options.anvilPort);
      }
      return builder.withConversionRateDisabled().build();
    },

    withHSTToken: (): FixtureData => {
      const builder = createFixtureBuilder();
      if (options.anvilPort) {
        applyAnvilPort(builder, options.anvilPort);
      }
      return builder.withTokensControllerERC20({ chainId: 1337 }).build();
    },
  };
}

export const FixturePresets = createFixturePresets();

export { FIXTURE_STATE_METADATA_VERSION };
