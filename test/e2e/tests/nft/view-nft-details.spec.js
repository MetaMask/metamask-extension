const { strict: assert } = require('assert');
const {
  convertToHexValue,
  withFixtures,
  unlockWallet,
} = require('../../helpers');
const { SMART_CONTRACTS } = require('../../seeder/smart-contracts');
const FixtureBuilder = require('../../fixture-builder');

describe('View NFT details', function () {
  const smartContract = SMART_CONTRACTS.NFTS;
  const ganacheOptions = {
    accounts: [
      {
        secretKey:
          '0x7C9529A67102755B7E6102D6D950AC5D5863C98713805CEC576B945B15B71EAC',
        balance: convertToHexValue(25000000000000000000),
      },
    ],
  };

  it('user should be able to view ERC721 NFT details', async function () {
    await withFixtures(
      {
        dapp: true,
        fixtures: new FixtureBuilder().withNftControllerERC721().build(),
        ganacheOptions,
        smartContract,
        title: this.test.fullTitle(),
      },
      async ({ driver }) => {
        await unlockWallet(driver);

        // Click to open the NFT details page and check title
        await driver.clickElement('[data-testid="home__nfts-tab"]');
        await driver.clickElement('.nft-item__container');

        const detailsPageTitle = await driver.findElement('.asset-breadcrumb');
        assert.equal(
          await detailsPageTitle.getText(),
          'Account 1 / TestDappNFTs',
        );

        // Check the displayed NFT details
        const nftName = await driver.findElement('.nft-details__info h4');
        assert.equal(await nftName.getText(), 'Test Dapp NFTs #1');

        const nftDescription = await driver.findElement(
          '.nft-details__info h6:nth-of-type(2)',
        );
        assert.equal(
          await nftDescription.getText(),
          'Test Dapp NFTs for testing.',
        );

        const nftImage = await driver.findElement('.nft-item__container');
        assert.equal(await nftImage.isDisplayed(), true);

        const nftContract = await driver.findElement(
          '.nft-details__contract-wrapper',
        );
        assert.equal(await nftContract.getText(), '0x581c3...45947');
      },
    );
  });
});
