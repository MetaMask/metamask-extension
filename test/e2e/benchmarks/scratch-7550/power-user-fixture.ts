import type { Mockttp } from 'mockttp';
import { generateWalletState } from '../../../../app/scripts/fixtures/generate-wallet-state';
import { mockNotificationServices } from '../../tests/notifications/mocks';
import { getTestSpecificMock } from '../utils/mock-config';
import { WITH_STATE_POWER_USER } from '../utils/constants';
import { WITH_STATE_POWER_USER_MANY_TOKENS } from './constants';

type PowerUserFixtureOptions = {
  manyTokens?: boolean;
};

export async function buildPowerUserFixture(
  options: PowerUserFixtureOptions = {},
) {
  const state = options.manyTokens
    ? WITH_STATE_POWER_USER_MANY_TOKENS
    : WITH_STATE_POWER_USER;
  return (await generateWalletState(state, true)).build();
}

export async function setupPowerUserBenchmarkMocks(
  mockServer: Mockttp,
): Promise<void> {
  // The live registry now serves non-EVM chains. This build converts every
  // entry to hex and captures an exception on `solana:`, which both fails the
  // iteration on an unexpected error and can stall the controllers on boot.
  await mockServer
    .forGet(
      /^https:\/\/client-config\.[a-z-]*api\.cx\.metamask\.io\/v1\/config\/networks/u,
    )
    .always()
    .thenCallback(() => ({
      statusCode: 200,
      json: { data: { version: '0.0.0', timestamp: 0, chains: [] } },
    }));

  await mockNotificationServices(mockServer);
  await getTestSpecificMock()(mockServer);
}

export const powerUserManifestFlags = {
  manifestFlags: {
    testing: {
      infuraProjectId: process.env.INFURA_PROJECT_ID,
    },
  },
  useMockingPassThrough: true,
  disableServerMochaToBackground: true,
  // Booting the 1000-token state can take longer than the 60s that a
  // multiplier of 6 gives `.controller-loaded`, which fails every iteration
  // during login before the measured interaction starts.
  extendedTimeoutMultiplier: 12,
} as const;
