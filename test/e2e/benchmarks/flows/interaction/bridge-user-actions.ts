/**
 * Benchmark: Bridge User Actions
 * Measures bridge page load, asset picker load, and token search time
 */

import { Mockttp } from 'mockttp';
import FixtureBuilder from '../../../fixtures/fixture-builder';
import { withFixtures } from '../../../helpers';
import { loginWithBalanceValidation } from '../../../page-objects/flows/login.flow';
import BridgeQuotePage from '../../../page-objects/pages/bridge/quote-page';
import HomePage from '../../../page-objects/pages/home/homepage';
import {
  DEFAULT_BRIDGE_FEATURE_FLAGS,
  MOCK_TOKENS_ETHEREUM,
} from '../../../tests/bridge/constants';
import { Driver } from '../../../webdriver/driver';
import { BENCHMARK_PERSONA, BENCHMARK_TYPE } from '../../utils/constants';
import type { BenchmarkRunResult } from '../../utils/types';
import { runUserActionBenchmark } from '../../utils/runner';

export const testTitle = 'benchmark-user-actions-bridge-user-actions';
export const persona = BENCHMARK_PERSONA.STANDARD;

async function mockTokensEthereum(mockServer: Mockttp) {
  return await mockServer.forPost(/getTokens\/search/u).thenCallback(() => {
    return {
      statusCode: 200,
      json: {
        data: MOCK_TOKENS_ETHEREUM.map((token) => ({
          ...token,
          assetId: `eip155:1/erc20:${token.address.toLowerCase()}`,
          chainId: 'eip155:1',
        })),
        pageInfo: {
          hasNextPage: false,
          endCursor: null,
        },
      },
    };
  });
}

export async function run(): Promise<BenchmarkRunResult> {
  return runUserActionBenchmark(async () => {
    let loadPage: number = 0;
    let loadAssetPicker: number = 0;
    let searchToken: number = 0;

    const fixtureBuilder = new FixtureBuilder()
      .withNetworkControllerOnMainnet()
      .withEnabledNetworks({ eip155: { '0x1': true } });

    await withFixtures(
      {
        fixtures: fixtureBuilder.build(),
        disableServerMochaToBackground: true,
        testSpecificMock: mockTokensEthereum,
        title: testTitle,
        manifestFlags: {
          remoteFeatureFlags: {
            bridgeConfig: DEFAULT_BRIDGE_FEATURE_FLAGS,
          },
        },
      },
      async ({ driver }: { driver: Driver }) => {
        await loginWithBalanceValidation(driver);
        const homePage = new HomePage(driver);
        const quotePage = new BridgeQuotePage(driver);

        const timestampBeforeLoadPage = new Date();
        await homePage.startSwapFlow();
        const timestampAfterLoadPage = new Date();

        loadPage =
          timestampAfterLoadPage.getTime() - timestampBeforeLoadPage.getTime();

        const timestampBeforeClickAssetPicker = new Date();
        await driver.clickElement(quotePage.sourceAssetPickerButton);
        const timestampAfterClickAssetPicker = new Date();

        loadAssetPicker =
          timestampAfterClickAssetPicker.getTime() -
          timestampBeforeClickAssetPicker.getTime();

        const tokenToSearch = 'FXS';
        const timestampBeforeTokenSearch = new Date();
        await driver.fill(quotePage.assetPrickerSearchInput, tokenToSearch);
        await driver.waitForSelector({
          text: tokenToSearch,
          css: quotePage.tokenButton,
        });
        const timestampAfterTokenSearch = new Date();

        searchToken =
          timestampAfterTokenSearch.getTime() -
          timestampBeforeTokenSearch.getTime();
      },
    );

    return [
      { id: 'bridge_load_page', duration: loadPage },
      { id: 'bridge_load_asset_picker', duration: loadAssetPicker },
      { id: 'bridge_search_token', duration: searchToken },
    ];
  }, BENCHMARK_TYPE.USER_ACTION);
}
