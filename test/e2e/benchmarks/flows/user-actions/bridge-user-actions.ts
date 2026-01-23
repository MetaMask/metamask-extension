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
import type { BenchmarkRunResult } from '../../utils/types';

export const testTitle = 'benchmark-userActions-bridgeUserActions';
export const persona = 'standard';

async function mockTokensEthereum(mockServer: Mockttp) {
  return await mockServer
    .forGet(`https://token.api.cx.metamask.io/tokens/1`)
    .thenCallback(() => {
      return {
        statusCode: 200,
        json: MOCK_TOKENS_ETHEREUM,
      };
    });
}

export async function run(): Promise<BenchmarkRunResult> {
  let loadPage: number = 0;
  let loadAssetPicker: number = 0;
  let searchToken: number = 0;

  const fixtureBuilder = new FixtureBuilder()
    .withNetworkControllerOnMainnet()
    .withEnabledNetworks({ eip155: { '0x1': true } });

  try {
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
        const timestampAferTokenSearch = new Date();

        searchToken =
          timestampAferTokenSearch.getTime() -
          timestampBeforeTokenSearch.getTime();
      },
    );

    return {
      timers: [
        { id: 'bridge_load_page', duration: loadPage },
        { id: 'bridge_load_asset_picker', duration: loadAssetPicker },
        { id: 'bridge_search_token', duration: searchToken },
      ],
      success: true,
    };
  } catch (error) {
    return {
      timers: [
        { id: 'bridge_load_page', duration: loadPage },
        { id: 'bridge_load_asset_picker', duration: loadAssetPicker },
        { id: 'bridge_search_token', duration: searchToken },
      ],
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
