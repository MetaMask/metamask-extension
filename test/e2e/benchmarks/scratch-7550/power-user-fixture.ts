import type { Mockttp } from 'mockttp';
import { generateWalletState } from '../../../../app/scripts/fixtures/generate-wallet-state';
import { mockNotificationServices } from '../../tests/notifications/mocks';
import {
  getTestSpecificMock,
  userStorageHostMock,
} from '../mocks/performance-mocks';
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
  await mockNotificationServices(mockServer);
  await userStorageHostMock(mockServer);
  const testSpecificMock = getTestSpecificMock();
  if (testSpecificMock) {
    await testSpecificMock(mockServer);
  }
}

export const powerUserManifestFlags = {
  manifestFlags: {
    testing: {
      infuraProjectId: process.env.INFURA_PROJECT_ID,
    },
  },
  useMockingPassThrough: true,
  disableServerMochaToBackground: true,
  extendedTimeoutMultiplier: 3,
} as const;
