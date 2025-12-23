import { Context } from 'mocha';
import { MockttpServer } from 'mockttp';
import { CHAIN_IDS } from '../../../../shared/constants/network';
import FixtureBuilder from '../../fixtures/fixture-builder';
import { unlockWallet, withFixtures } from '../../helpers';
import { Driver } from '../../webdriver/driver';
import { RECIPIENT_ADDRESS_MOCK } from '../simulation-details/types';
import SettingsPage from '../../page-objects/pages/settings/settings-page';
import PrivacySettingsPage from '../../page-objects/pages/settings/privacy-settings';
import HomePage from '../../page-objects/pages/home/homepage';
import SendTokenPage from '../../page-objects/pages/send/send-token-page';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import TokenList from '../../page-objects/pages/token-list';
import AssetPicker from '../../page-objects/pages/asset-picker';
import { mockSpotPrices } from '../tokens/utils/mocks';

describe('AssetPickerSendFlow', function () {
  const chainId = CHAIN_IDS.MAINNET;

  const fixtures = {
    fixtures: new FixtureBuilder({ inputChainId: chainId }).build(),
    localNodeOptions: {
      chainId: parseInt(chainId, 16),
    },
  };

  it('should send token using asset picker modal', async function () {
    const ethConversionInUsd = 10000;

    await withFixtures(
      {
        ...fixtures,
        title: (this as Context).test?.fullTitle(),
        ethConversionInUsd,
        testSpecificMock: async (mockServer: MockttpServer) => {
          await mockSpotPrices(mockServer, {
            'eip155:1/slip44:60': {
              price: 10000,
              marketCap: 382623505141,
              pricePercentChange1d: 0,
            },
          });
        },
      },
      async ({ driver }: { driver: Driver }) => {
        await unlockWallet(driver);

        // Disable token auto detection
        const settingsPage = new SettingsPage(driver);
        const homePage = new HomePage(driver);
        await new HeaderNavbar(driver).openSettingsPage();
        await settingsPage.checkPageIsLoaded();
        await settingsPage.goToPrivacySettings();
        await new PrivacySettingsPage(driver).toggleAutoDetectTokens();
        await settingsPage.closeSettingsPage();

        await homePage.checkPageIsLoaded();

        await homePage.startSendFlow();
        const sendToPage = new SendTokenPage(driver);
        await sendToPage.checkPageIsLoaded();
        await sendToPage.fillRecipient(RECIPIENT_ADDRESS_MOCK);
        await sendToPage.fillAmount('2');
        const tokenDetailsList = new TokenList(driver);

        await sendToPage.clickOnAssetPicker(driver, 'dest');

        await tokenDetailsList.checkTokenName('Ether');
        await tokenDetailsList.checkTokenBalanceWithName('$250,000.00');
        await tokenDetailsList.checkTokenMarketValue('25 ETH');

        // Search for CHZ and check that CHZ is disabled
        const assetPicker = new AssetPicker(driver);
        await assetPicker.searchAssetAndVerifyCount('CHZ', 1);
        await assetPicker.checkTokenIsDisabled();
      },
    );
  });
});
