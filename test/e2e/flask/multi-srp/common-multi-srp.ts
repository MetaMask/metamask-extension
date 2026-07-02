import { Mockttp } from 'mockttp';
import { DEFAULT_FIXTURE_ACCOUNT_ID } from '../../constants';
import FixtureBuilderV2 from '../../fixtures/fixture-builder-v2';
import { MockedEndpoint } from '../../mock-e2e';
import {
  LOCALHOST_NATIVE_ASSET_ID,
  MAINNET_NATIVE_ASSET_ID,
} from '../../tests/tokens/utils/mocks';

export const ZERO_UNIFIED_EVM_BALANCES = {
  mainnetNativeEthHuman: '0',
  localhostNativeEthHuman: '0',
  nativeBalance: '0',
} as const;

export function buildZeroBalanceMultiSrpFixture() {
  return new FixtureBuilderV2()
    .withAssetsController(
      {
        assetsBalance: {
          [DEFAULT_FIXTURE_ACCOUNT_ID]: {
            [MAINNET_NATIVE_ASSET_ID]: { amount: '0' },
            [LOCALHOST_NATIVE_ASSET_ID]: { amount: '0' },
          },
        },
      },
      { overwrite: true },
    )
    .build();
}

export async function mockActiveNetworks(
  mockServer: Mockttp,
): Promise<MockedEndpoint> {
  return await mockServer
    .forGet('https://accounts.api.cx.metamask.io/v2/activeNetworks')
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: {
          activeNetworks: [],
        },
      };
    });
}
