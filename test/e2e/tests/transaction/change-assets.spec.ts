import assert from 'assert/strict';
import { withFixtures } from '../../helpers';
import FixtureBuilder from '../../fixture-builder';
import { SMART_CONTRACTS } from '../../seeder/smart-contracts';
import { loginWithBalanceValidation } from '../../page-objects/flows/login.flow';
import HomePage from '../../page-objects/pages/home/homepage';
import AccountListPage from '../../page-objects/pages/account-list-page';
import SendTokenPage from '../../page-objects/pages/send/send-token-page';
import SendTokenConfirmPage from '../../page-objects/pages/send/send-token-confirmation-page';
import ActivityListPage from '../../page-objects/pages/home/activity-list';
import AssetListPage from '../../page-objects/pages/home/asset-list';
import NFTDetailsPage from '../../page-objects/pages/nft-details-page';
import HeaderNavbar from '../../page-objects/pages/header-navbar';
import { ACCOUNT_TYPE } from '../../constants';
import NftListPage from '../../page-objects/pages/home/nft-list';

describe('Change assets', function () {
  it('sends the correct asset when switching from native currency to NFT', async function () {
    const smartContract = SMART_CONTRACTS.NFTS;
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder().withNftControllerERC721().build(),
        smartContract,
        title: this.test?.fullTitle(),
      },
      async ({ driver, localNodes }) => {
        await loginWithBalanceValidation(driver, localNodes[0]);

        const homePage = new HomePage(driver);
        const accountListPage = new AccountListPage(driver);
        const sendTokenPage = new SendTokenPage(driver);
        const sendTokenConfirmationPage = new SendTokenConfirmPage(driver);
        const activityListPage = new ActivityListPage(driver);

        await homePage.checkPageIsLoaded();
        await homePage.startSendFlow();

        await sendTokenPage.checkPageIsLoaded();
        await accountListPage.selectAccount('Account 1');

        await sendTokenPage.fillAmount('2');
        await sendTokenPage.clickContinueButton();
        await sendTokenPage.goToPreviousScreen();
        await sendTokenPage.clickAssetPickerButton();
        await sendTokenPage.chooseAssetTypeToSend('nft');
        await sendTokenPage.chooseNFTToSend();
        await sendTokenPage.checkTokenSymbolInAssetPicker('TDN', '1');
        await sendTokenPage.clickContinueButton();

        await sendTokenConfirmationPage.checkPageIsLoaded();
        await sendTokenConfirmationPage.checkNftTransfer({
          sender: 'Account 1',
          recipient: 'Account 1',
          nftName: 'Test Dapp NFTs #1',
        });
        await sendTokenConfirmationPage.clickOnConfirm();

        await activityListPage.checkTransactionActivityByText(
          'Sent Test Dapp NFTs #1',
        );
      },
    );
  });

  it('sends the correct asset when switching from ERC20 to NFT', async function () {
    const smartContract = SMART_CONTRACTS.NFTS;
    const tokenContract = SMART_CONTRACTS.HST;
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withTokensControllerERC20()
          .withNftControllerERC721()
          .build(),
        smartContract: [smartContract, tokenContract],
        title: this.test?.fullTitle(),
      },
      async ({ driver, localNodes }) => {
        await loginWithBalanceValidation(driver, localNodes[0]);

        const homePage = new HomePage(driver);
        const accountListPage = new AccountListPage(driver);
        const sendTokenPage = new SendTokenPage(driver);
        const sendTokenConfirmationPage = new SendTokenConfirmPage(driver);
        const activityListPage = new ActivityListPage(driver);
        const assetListPage = new AssetListPage(driver);

        await homePage.checkPageIsLoaded();
        await assetListPage.clickOnAsset('TST');
        await homePage.startSendFlow();

        await sendTokenPage.checkPageIsLoaded();
        await accountListPage.selectAccount('Account 1');
        await sendTokenPage.fillAmount('2');
        await sendTokenPage.clickContinueButton();
        await sendTokenPage.goToPreviousScreen();
        await sendTokenPage.clickAssetPickerButton();
        await sendTokenPage.chooseAssetTypeToSend('nft');
        await sendTokenPage.chooseNFTToSend();
        await sendTokenPage.checkTokenSymbolInAssetPicker('TDN', '1');
        await sendTokenPage.clickContinueButton();

        await sendTokenConfirmationPage.checkPageIsLoaded();
        await sendTokenConfirmationPage.checkNftTransfer({
          sender: 'Account 1',
          recipient: 'Account 1',
          nftName: 'Test Dapp NFTs #1',
        });
        await sendTokenConfirmationPage.clickOnConfirm();

        await activityListPage.checkTransactionActivityByText(
          'Sent Test Dapp NFTs #1',
        );
      },
    );
  });

  it('sends the correct asset when switching from NFT to native currency', async function () {
    const smartContract = SMART_CONTRACTS.NFTS;
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder().withNftControllerERC721().build(),
        smartContract,
        title: this.test?.fullTitle(),
      },
      async ({ driver, localNodes }) => {
        await loginWithBalanceValidation(driver, localNodes[0]);

        const homePage = new HomePage(driver);
        const nftDetailsPage = new NFTDetailsPage(driver);
        const accountListPage = new AccountListPage(driver);
        const sendTokenPage = new SendTokenPage(driver);
        const sendTokenConfirmationPage = new SendTokenConfirmPage(driver);
        const activityListPage = new ActivityListPage(driver);
        const nftListPage = new NftListPage(driver);

        await homePage.checkPageIsLoaded();
        await homePage.goToNftTab();
        await nftListPage.clickNFTFromList();
        await nftDetailsPage.checkPageIsLoaded();
        await nftDetailsPage.clickNFTSendButton();
        await sendTokenPage.checkPageIsLoaded();
        await accountListPage.selectAccount('Account 1');
        await sendTokenPage.checkTokenSymbolInAssetPicker('TDN', '1');
        await sendTokenPage.clickContinueButton();
        await sendTokenPage.goToPreviousScreen();
        await sendTokenPage.clickAssetPickerButton();
        await sendTokenPage.chooseAssetTypeToSend('token');
        await sendTokenPage.chooseTokenToSend('ETH');
        await sendTokenPage.checkTokenSymbolInAssetPicker('ETH');
        await sendTokenPage.fillAmount('2');
        await sendTokenPage.clickContinueButton();

        await sendTokenConfirmationPage.checkPageIsLoaded();
        await sendTokenConfirmationPage.checkTokenTransfer({
          sender: 'Account 1',
          recipient: 'Account 1',
          tokenName: 'ETH',
          amount: '2',
        });
        await sendTokenConfirmationPage.clickOnConfirm();

        await activityListPage.checkTransactionActivityByText('Sent');
        await activityListPage.checkTxAmountInActivity('-2 ETH');
      },
    );
  });

  it('changes to native currency when switching accounts during a NFT send', async function () {
    const smartContract = SMART_CONTRACTS.NFTS;
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder()
          .withNftControllerERC721()
          .withPreferencesController({
            featureFlags: {
              sendHexData: true,
            },
          })
          .build(),
        smartContract,
        title: this.test?.fullTitle(),
      },
      async ({ driver, localNodes }) => {
        await loginWithBalanceValidation(driver, localNodes[0]);

        const homePage = new HomePage(driver);
        const headerNavbar = new HeaderNavbar(driver);
        const nftDetailsPage = new NFTDetailsPage(driver);
        const accountListPage = new AccountListPage(driver);
        const sendTokenPage = new SendTokenPage(driver);
        const sendTokenConfirmationPage = new SendTokenConfirmPage(driver);
        const activityListPage = new ActivityListPage(driver);
        const nftListPage = new NftListPage(driver);

        await homePage.checkPageIsLoaded();
        await headerNavbar.openAccountMenu();

        // Create new account with default name `newAccountName`
        const newAccountName = 'Account 2';
        await accountListPage.checkPageIsLoaded();
        await accountListPage.addAccount({
          accountType: ACCOUNT_TYPE.Ethereum,
        });
        await headerNavbar.checkAccountLabel(newAccountName);

        // Switch back to the first account
        await headerNavbar.openAccountMenu();
        await accountListPage.checkPageIsLoaded();
        await accountListPage.switchToAccount('Account 1');
        await headerNavbar.checkAccountLabel('Account 1');

        // Choose the nft
        await homePage.goToNftTab();
        await nftListPage.clickNFTFromList();
        await nftDetailsPage.checkPageIsLoaded();
        await nftDetailsPage.clickNFTSendButton();

        // Switch accounts during send flow and check that native currency is selected
        await sendTokenPage.checkPageIsLoaded();
        await accountListPage.selectAccount('Account 1');
        await sendTokenPage.checkTokenSymbolInAssetPicker('TDN', '1');
        await sendTokenPage.clickAccountPickerButton();
        await accountListPage.selectAccount('Account 2');
        await sendTokenPage.checkTokenSymbolInAssetPicker('ETH');
        await sendTokenPage.clickAccountPickerButton();
        await accountListPage.selectAccount('Account 1');
        await sendTokenPage.checkTokenSymbolInAssetPicker('ETH');
        await sendTokenPage.fillAmount('2');

        // Make sure hex data is cleared after switching assets
        const hexDataValue = await sendTokenPage.getHexInputValue();
        assert.equal(
          hexDataValue,
          '',
          'Hex data has not been cleared after switching assets.',
        );

        // Make sure gas is updated by resetting amount and hex data
        // Note: this is needed until the race condition is fixed on the wallet level (issue #25243)
        await sendTokenPage.fillHexInput('0x');
        await sendTokenPage.clickContinueButton();

        await sendTokenConfirmationPage.checkPageIsLoaded();
        await sendTokenConfirmationPage.checkTokenTransfer({
          sender: 'Account 1',
          recipient: 'Account 1',
          tokenName: 'ETH',
          amount: '2',
        });
        await sendTokenConfirmationPage.clickOnConfirm();

        await activityListPage.checkTransactionActivityByText('Sent');
        await activityListPage.checkTxAmountInActivity('-2 ETH');
      },
    );
  });
});
